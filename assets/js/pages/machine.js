// 機種ページのコントローラ。
// 状態遷移ロジック（core/stateEngine.js）とUI描画をここで橋渡しする。
// このファイル自体はシンフォギア専用ではなく、machine.states/onHit/onExhaustedの
// データ形式に従うMachineであればどれでも動く想定。
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    const slug = document.body.dataset.machineSlug;
    const machine = PachiSim.machineRegistry.getBySlug(slug);

    const els = {
      siteTitle: $("siteTitle"),
      machineName: $("machineName"),
      manufacturerName: $("manufacturerName"),
      rulesList: $("rulesList"),
      dataLamp: $("dataLamp"),
      statsGrid: $("statsGrid"),
      resetButton: $("resetButton"),
      currentStateLabel: $("currentStateLabel"),
      spinCounter: $("spinCounter"),
      investmentDisplay: $("investmentDisplay"),
      simulationArea: $("simulationArea"),
      holdQueueEl: $("holdQueue"),
      reelDisplayEl: $("reelDisplay"),
      resultPanel: $("resultPanel"),
      resultRenchan: $("resultRenchan"),
      resultBalls: $("resultBalls"),
      effectArea: $("effectArea"),
      actionButton: $("actionButton"),
      speedToggleButtons: Array.from(document.querySelectorAll(".speed-toggle__btn")),
      soundToggle: $("soundToggle"),
      soundHint: $("soundHint"),
      adSlot: $("adSlot"),
      affiliateSection: $("affiliateSection"),
      machineRanking: $("machineRanking"),
      machineRankingHeading: $("machineRankingHeading"),
      adminAuthBar: $("adminAuthBar"),
      errorBox: $("machineError"),
    };

    els.siteTitle.textContent = PachiSim.config.siteTitle;

    if (!machine) {
      els.errorBox.hidden = false;
      els.errorBox.textContent = "この機種のデータが見つかりませんでした。";
      const main = document.querySelector("main");
      if (main) main.hidden = true;
      return;
    }

    const baseProbability = machine.states[machine.baseStateId].probability;
    const probabilityLabel = PachiSim.format.probabilityFraction(baseProbability);

    document.title = `${machine.name}（${machine.manufacturer.name}） | ${PachiSim.config.siteTitle}`;
    els.machineName.textContent = `${machine.name}（${probabilityLabel}）`;
    els.manufacturerName.textContent = machine.manufacturer.name;
    els.machineRankingHeading.textContent = machine.name;
    els.rulesList.innerHTML = machine.rules.map((r) => `<li>${r}</li>`).join("");

    const dateKey = PachiSim.statsStore.todayKey();
    let stats = PachiSim.statsStore.load(slug);
    let historyEntries = PachiSim.historyStore.load(slug, dateKey);
    let session = PachiSim.engine.createSession(machine);
    let speedModeIndex = 0;
    let isAnimating = false;
    let isPaused = false; // STOPでその場停止中かどうか
    let liveCount = 0; // 前回の大当たりからの通算回転数（countUp表示・データランプの「現在」列）
    let liveRemaining = null; // countDown表示中の一時カウント
    // 当たらずに終わったST・時短で消化した回転数の繰り越し。
    // 実機のデータカウンタと同じく、回転数は「前回の大当たりから次の大当たりまで」を
    // 通しで数える。157回転のSTが当たらずに終わったら、その後の通常は158回転目から
    // 始まる（0に戻らない）。大当たりを引いた時点で0へ戻す。
    let spinsCarriedOver = 0;
    // 直前の大当たりの履歴を、データランプ上でまだ「1回前」へ送っていない状態かどうか。
    // 次の1回転が始まるときにfalseへ戻し、そこで初めてスライドしたように見せる。
    let historyRevealPending = false;
    // 今回のアクションで貯まった保留の数。玉の消費は「保留が貯まった時点」で
    // 反映したいので、持ち玉表示はこの数を使う（消化した回転数ではない）。
    // アクションが終わったらstats.totalNormalSpinsへ実回転数が加算されるので0へ戻す。
    let chargedThisAction = 0;
    let activePlayback = null; // 実行中のplayback制御（pause/resumeで使用）
    let pendingStart = null; // 保留チャージ中にSTOPされた場合、再開時に実行する消化開始処理
    let currentStreakId = null; // 進行中の「一撃」を識別するID（データランプの連チャンまとめ用）
    let streakSeq = 0;
    // Date.now()だけだと同一ミリ秒内の連続実行でID衝突する可能性があるため、
    // ページ読み込みごとに変わるタグ＋連番でstreakIdを一意にする
    const sessionTag = Math.random().toString(36).slice(2, 8);

    const holdQueue = new PachiSim.ui.HoldQueue(els.holdQueueEl);
    // 保留が1つ貯まるたびに玉を1回転分消費する。実機と同じく始動口へ入れた時点で
    // 減らしたいので、消化（大台へ進む）時ではなくここで引く。
    // 電サポ中（accruesInvestment:false）の保留は玉が戻ってくるので消費しない。
    holdQueue.onCharge = () => {
      playSound("charge"); // 音は玉の増減と関係なく、保留が貯まったこと自体に付ける
      const state = machine.states[session.stateId];
      if (!state || !state.accruesInvestment) return;
      chargedThisAction += 1;
      els.investmentDisplay.innerHTML = investmentDisplayText(chargedThisAction);
    };
    const reelDisplay = new PachiSim.ui.ReelDisplay(els.reelDisplayEl);
    const maxRounds = Math.max(...Object.keys(machine.payoutTable).map(Number));

    // 1回転の中で何度も鳴る音は、テンポが速いと潰れて雑音にしかならない。
    // 「早い」(1回転160ms)では回転開始・リール停止・保留のスライドを落とし、
    // 「当たりまで」(1回転35ms＝1秒に28回転)では1回転ごとの音を全部落として、
    // 大当たり・終了・RESULTだけを鳴らす。
    const PER_REEL_SOUNDS = ["reelStart", "reelStop", "slide"];
    const PER_SPIN_SOUNDS = PER_REEL_SOUNDS.concat(["charge", "reach", "miss"]);

    // exhaustedの音の長さ。RESULTのチャイムをこの分だけ後ろへずらして重なりを避ける。
    const EXHAUSTED_SOUND_SEC = 0.56;

    function playSound(name) {
      const speedId = currentSpeedMode().id;
      if (speedId === "instant" && PER_SPIN_SOUNDS.indexOf(name) >= 0) return;
      if (speedId === "fast" && PER_REEL_SOUNDS.indexOf(name) >= 0) return;
      PachiSim.soundPlayer.play(name);
    }

    // リール演出の節目に音を付ける。鳴らすかどうかだけをここで決め、
    // タイミングはreelDisplay側の実際の進行に任せる（時間を二重に持たない）。
    reelDisplay.onEvent = (name, matched) => {
      if (name === "spin") playSound("reelStart");
      else if (name === "stop") playSound("reelStop");
      else if (name === "reach") playSound("reach");
      else if (name === "settle") playSound(matched ? "hit" : "miss");
    };

    PachiSim.ui.renderAdSlot(els.adSlot, machine.name);
    PachiSim.ui.renderAffiliateSection(els.affiliateSection, machine.relatedProducts || []);

    function currentSpeedMode() {
      return PachiSim.config.speedModes[speedModeIndex];
    }

    // 「拡大」フェーズがひと目で分かるよう、1回転の大半をこのフェーズに割り当てる
    // （バースト/シフト自体は一瞬でよい）。playback()とリーチ演出の時間配分の両方で使う。
    function computeTickSplit(speedMode) {
      const emphasizeMs = Math.max(70, Math.round(speedMode.tickMs * 0.72));
      const resolveMs = Math.max(20, speedMode.tickMs - emphasizeMs);
      return { emphasizeMs, resolveMs };
    }

    // 保留がスライド（＋先頭は拡大）する時間。
    // 実機は約280msかけてなめらかに減速しながら動くので、普通ではそこに合わせる。
    // テンポの速い速度では短くするが、下限は「滑って動いた」と分かる長さを残す
    // （短すぎると瞬間移動に見え、長すぎると動きっぱなしのまま消化されてしまう）。
    function computeHoldMoveMs(speedMode) {
      return Math.max(110, Math.min(280, Math.round(speedMode.tickMs * 0.3)));
    }

    // STARTで保留4個が貯まりきってから、消化を始めるまでの間。
    // 貯まった瞬間に動き出すと詰まって見えるので、ワンテンポ置く。
    // テンポの速い速度では短くするが、どの速度でも「一拍おいた」と分かる長さを残す。
    function computeHoldSettleMs(speedMode) {
      return Math.max(240, Math.min(700, Math.round(speedMode.tickMs * 0.55)));
    }

    function investmentYen() {
      const raw = (stats.totalNormalSpins / machine.spinsPer1000Yen) * 1000;
      return PachiSim.format.roundUpTo(raw, PachiSim.config.investmentRoundingYen);
    }

    function balanceYen() {
      const yenPerBall = machine.yenPerBall || PachiSim.config.yenPerBall;
      return stats.totalBalls * yenPerBall - investmentYen();
    }

    // 1回転（1保留）あたりの消費玉数。総投資（stats.totalNormalSpins由来、1000円単位に
    // 丸めた「目安」）とは別に、持ち玉表示は保留が1つ貯まるたびに実際に細かく
    // 減っていくよう、丸めない厳密な値をここで使う。
    function ballsPerSpin() {
      const yenPerBall = machine.yenPerBall || PachiSim.config.yenPerBall;
      return 1000 / machine.spinsPer1000Yen / yenPerBall;
    }

    // extraNormalSpins: ティック中に「まだstats.totalNormalSpinsへ加算されていない
    // 今回分」を仮に上乗せして計算したいときに渡す。
    // 持ち玉＝獲得出玉から、使った玉数（回転数×1回転あたりの消費玉数）を差し引いた値。
    // 収支目安は持ち玉を等価交換レートで円換算しただけなので、常に一致する。
    function mochidamaAndBalance(extraNormalSpins) {
      const yenPerBall = machine.yenPerBall || PachiSim.config.yenPerBall;
      const spins = stats.totalNormalSpins + (extraNormalSpins || 0);
      const mochidama = Math.round(stats.totalBalls - spins * ballsPerSpin());
      return { mochidama, balance: mochidama * yenPerBall };
    }

    // 持ち玉・収支目安はプラスなら緑、マイナスなら赤で表示する（HTML断片を返すため、
    // 呼び出し側はtextContentではなくinnerHTMLへ代入すること）。
    function investmentDisplayText(extraNormalSpins) {
      const { mochidama, balance } = mochidamaAndBalance(extraNormalSpins);
      const cls = balance >= 0 ? "is-plus" : "is-minus";
      const sign = balance >= 0 ? "+" : "";
      return `持ち玉 <span class="${cls}">${PachiSim.format.ball(
        mochidama
      )}</span> / 収支目安 <span class="${cls}">${sign}${PachiSim.format.yen(balance)}</span>`;
    }

    function renderStats() {
      const yenPerBall = machine.yenPerBall || PachiSim.config.yenPerBall;
      const balance = balanceYen();
      els.statsGrid.innerHTML = `
        <div class="stat-tile"><span class="stat-tile__label">総通常回転数</span><span class="stat-tile__value">${PachiSim.format.number(stats.totalNormalSpins)}回転</span></div>
        <div class="stat-tile"><span class="stat-tile__label">初当たり回数</span><span class="stat-tile__value">${stats.initialHitCount}回</span></div>
        <div class="stat-tile"><span class="stat-tile__label">総大当たり回数</span><span class="stat-tile__value">${stats.totalHitCount}回</span></div>
        <div class="stat-tile"><span class="stat-tile__label">RUSH突入回数</span><span class="stat-tile__value">${stats.rushEntryCount}回</span></div>
        <div class="stat-tile"><span class="stat-tile__label">最大連チャン</span><span class="stat-tile__value">${stats.maxRenchan}連</span></div>
        <div class="stat-tile"><span class="stat-tile__label">総投資</span><span class="stat-tile__value">${PachiSim.format.yen(investmentYen())}</span></div>
        <div class="stat-tile"><span class="stat-tile__label">総獲得出玉</span><span class="stat-tile__value">${PachiSim.format.ball(stats.totalBalls)}</span></div>
        <div class="stat-tile"><span class="stat-tile__label">最大一撃出玉</span><span class="stat-tile__value">${PachiSim.format.ball(stats.maxIkkiBalls)}</span></div>
        <div class="stat-tile stat-tile--balance"><span class="stat-tile__label">簡易収支（等価${yenPerBall}円換算）</span><span class="stat-tile__value ${balance >= 0 ? "is-plus" : "is-minus"}">${balance >= 0 ? "+" : ""}${PachiSim.format.yen(balance)}</span></div>
      `;
    }

    // この機種の出玉ランキング（全期間・上位10件）。記録が増減するたびに呼び直す。
    // 削除ボタン（onDelete/onClearAll）は運営ログイン中のみ表示する。実際の削除権限は
    // Firestore側のセキュリティルールで強制されるので、これはあくまで見た目の制御。
    async function renderMachineRanking() {
      if (window.PachiSim.fb) await PachiSim.fb.ready;
      const isAdmin = window.PachiSim.fb && PachiSim.fb.isAdmin();
      const result = await PachiSim.rankingService.fetchRanking("allTime", slug);
      PachiSim.ui.renderRankingList(els.machineRanking, result.entries, {
        showMachine: false,
        emptyText: "まだ記録がありません。",
        onDelete: isAdmin
          ? async (id) => {
              await PachiSim.rankingService.removeEntry(id);
              renderMachineRanking();
            }
          : null,
        onClearAll: isAdmin
          ? async () => {
              await PachiSim.rankingService.clearScope("allTime", slug);
              renderMachineRanking();
            }
          : null,
      });
    }

    function spinCounterText(state) {
      if (state.mode === "countUp") {
        return `${PachiSim.format.number(liveCount)}回転`;
      }
      const remaining = liveRemaining == null ? state.maxAttempts : liveRemaining;
      return `残り${remaining}回`;
    }

    // 抽選が実際に進行中（ポーズしていない）の間だけ、速度・リセットボタンをロックする。
    // 待機中・一時停止中はいつでも操作できる。
    function syncSpeedButtonLock() {
      const locked = isAnimating && !isPaused;
      els.speedToggleButtons.forEach((btn) => {
        btn.disabled = locked;
      });
      els.resetButton.disabled = locked;
    }

    // 現在選択中の速度ボタンだけにis-activeを付け、選択状態がひと目でわかるようにする。
    function syncSpeedButtonsActive() {
      const activeId = currentSpeedMode().id;
      els.speedToggleButtons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.speedId === activeId);
      });
    }

    // freezeStateDisplay: trueの間は「現在の状態」表示（状態名・背景テーマ・回転数）を
    // 更新しない。大当たり直後、session.stateIdは既に次の状態へ切り替わっているが、
    // 上部表示は「今までいた状態で何回転で当たったか」がわかるようそのまま残す
    // （次回：〜は演出欄で案内するので、ここで次の状態名を先出しすると紛らわしい）。
    // 次のアクション開始時にresetLiveCountersForState経由であらためて更新される。
    function renderCurrentState(options) {
      const freezeStateDisplay = !!(options && options.freezeStateDisplay);
      const state = machine.states[session.stateId];
      if (!freezeStateDisplay) {
        els.currentStateLabel.textContent = state.label;
        els.simulationArea.dataset.theme = state.theme;
        els.spinCounter.textContent = spinCounterText(state);
      }
      // アクション中は、貯まった保留の分だけ差し引いた値のままにする
      els.investmentDisplay.innerHTML = investmentDisplayText(chargedThisAction);
      if (!isAnimating) {
        els.actionButton.textContent = state.actionLabel;
        els.actionButton.dataset.mode = "action";
      }
      syncSpeedButtonsActive();
      syncSpeedButtonLock();
    }

    // データランプの「現在」列はライブ進行中の回転数(liveCount)に連動するため、
    // ティックのたびにも呼び出せるよう単独の関数にしてある。
    //
    // 当たった直後は、上部の回転数表示と同じく「現在」列も当たった回転数のまま止める。
    // このとき履歴へも積んでしまうと、同じ回転数が「現在」と「1回前」に並んで見える。
    // 実機と同じく、次の1回転が始まった瞬間に「1回前」へスライドさせたいので、
    // それまでは積んだばかりの1件を表示から伏せておく（保存自体は済ませてある）。
    function renderDataLampLive() {
      const shown = historyRevealPending ? historyEntries.slice(0, -1) : historyEntries;
      PachiSim.ui.renderDataLamp(els.dataLamp, shown, liveCount);
    }

    function renderAll(options) {
      renderCurrentState(options);
      renderStats();
      renderDataLampLive();
    }

    // 状態が変わった（＝次のアクションを始める）ときの表示初期値。
    // 回転数は0ではなく繰り越し分から始める。残り回数はその状態の規定回数から。
    function resetLiveCountersForState(state) {
      liveCount = spinsCarriedOver;
      liveRemaining = state.maxAttempts;
    }

    // 一撃（連チャン）が終わって通常へ戻る瞬間だけ、リール/保留の代わりに
    // 連チャン数・獲得出玉をまとめたRESULT表示を出す。次のアクション開始時に隠す。
    function showResultPanel(renchan, balls) {
      // 一撃の締めくくりなので速度に関係なく鳴らす。
      // ST・時短が当たらずに終わった瞬間は「終了」の音と必ず同時になるので、
      // その分だけ後ろへずらして、重ならずに続けて聞こえるようにする。
      PachiSim.soundPlayer.play("result", EXHAUSTED_SOUND_SEC);
      els.resultRenchan.textContent = PachiSim.format.number(renchan);
      els.resultBalls.textContent = PachiSim.format.number(balls);
      els.resultPanel.hidden = false;
      els.reelDisplayEl.hidden = true;
      els.holdQueueEl.hidden = true;
    }

    function hideResultPanel() {
      els.resultPanel.hidden = true;
      els.reelDisplayEl.hidden = false;
      els.holdQueueEl.hidden = false;
    }

    // 一度もSTART/JUDGEMENTを押していない・押し直せる状態（何も表示しない）
    function showIdleEffect() {
      els.effectArea.dataset.kind = "idle";
      els.effectArea.innerHTML = "";
    }

    // 抽選が実際に進行中（ティック中）であることを示す下部帯の表示
    function showSpinningEffect() {
      els.effectArea.dataset.kind = "spinning";
      els.effectArea.innerHTML = `<p class="effect-area__idle">抽選中</p>`;
    }

    // 一時停止中のアクションを破棄して、まっさらな待機状態へ戻す。
    // handleAction()はsession/statsをまだ書き換えていない段階でしかSTOPできない
    // （それらはfinishAction完了時にしか更新されない）ので、ここで安全に破棄できる。
    function cancelPausedAction() {
      if (!isAnimating) return;
      if (activePlayback) {
        activePlayback.pause();
        activePlayback = null;
      }
      pendingStart = null;
      isAnimating = false;
      isPaused = false;
      showIdleEffect();
      hideResultPanel();
      holdQueue.reset();
      reelDisplay.reset();
      resetLiveCountersForState(machine.states[session.stateId]);
      renderCurrentState();
      renderDataLampLive();
    }

    // 「次回：〜」を目立たせるかどうか。通常・時短へ戻るときはただの案内だが、
    // RUSH・STへ行くときはこれから期待できる場所なので強調する。
    // 状態名は機種ごとにまちまち（「ST（インパクトモード）」「シンフォギアチャンス」）
    // なので、名前ではなく状態データのthemeで判定する。
    const CALM_NEXT_THEMES = ["normal", "chance"];
    function shouldEmphasizeNext(state) {
      return CALM_NEXT_THEMES.indexOf(state.theme) < 0;
    }

    // line1: 「大当たり＜4R獲得＞」のようなメイン結果、line2: 「次回：最終決戦」のような行き先
    function showResultEffect({ line1, line2, kind, nextEmphasis }) {
      els.effectArea.dataset.kind = kind;
      els.effectArea.dataset.nextEmphasis = nextEmphasis ? "on" : "off";
      els.effectArea.innerHTML = `
        <p class="effect-area__title">${line1}</p>
        ${line2 ? `<p class="effect-area__sub">${line2}</p>` : ""}
      `;
    }

    // 1ロールを「強調（これから消化される）」→「消化（バースト/回転数更新）」の
    // 2段階アニメーションとして再生する。speedMode.tickMsをこの2段階に配分する。
    // STOPはその場で一時停止するだけで、抽選結果を先読みしたりスキップしたりはしない。
    // もう一度ボタン（この時はSTARTに戻る）を押すと、止まった続きから再開する。
    //
    // 一時停止中に速度を変えた場合(setSpeed)は、それまでの回転数・保留の状態は
    // 一切リセットせず、そこから先のテンポだけを新しい速度に切り替える。
    // 「当たりまで」に切り替えた場合（通常時／時短RUSH中を問わず）だけは特別に、
    // そこから先を一気にジャンプさせる。
    function playback(rolls, state, initialSpeedMode, handlers, onDone) {
      let currentSpeedMode = initialSpeedMode;
      let stopped = false;
      let paused = false;
      let pendingJumpToEnd = false;
      let timer = null;
      let i = 0;
      let phase = "emphasize"; // "emphasize" | "resolve" - 一時停止からの再開先の判定に使う

      function tickSplit() {
        return computeTickSplit(currentSpeedMode);
      }

      function isInstant() {
        return currentSpeedMode.id === "instant";
      }

      // viaSkip: 「当たりまで」の一発ジャンプで終わった場合はtrue。
      // 通常の1回転ずつの消化で終わった場合はfalse（保留・リールの見た目をどう
      // 後始末するかの判断にhandleAction側で使う）。
      function finish(viaSkip) {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        onDone(!!viaSkip);
      }

      function stepEmphasize() {
        if (stopped || paused) return;
        // onEmphasizeは通常undefinedを返すが、{durationMs}を返した場合は
        // そのロールの拡大フェーズの長さをそちらで上書きする
        // （リーチ演出のように、通常のテンポより長く見せたい場合に使う）
        const override = handlers.onEmphasize(rolls[i]);
        phase = "resolve";
        const duration = (override && override.durationMs) || tickSplit().emphasizeMs;
        timer = setTimeout(stepResolve, duration);
      }

      function stepResolve() {
        if (stopped || paused) return;
        handlers.onResolve(rolls[i]);
        i++;
        if (i >= rolls.length) {
          finish();
          return;
        }
        phase = "emphasize";
        timer = setTimeout(stepEmphasize, tickSplit().resolveMs);
      }

      if (isInstant()) {
        timer = setTimeout(() => finish(true), 420);
      } else {
        stepEmphasize();
      }

      return {
        pause: () => {
          if (stopped || paused) return;
          paused = true;
          clearTimeout(timer);
        },
        resume: () => {
          if (stopped || !paused) return;
          paused = false;
          if (pendingJumpToEnd) {
            pendingJumpToEnd = false;
            timer = setTimeout(() => finish(true), 420);
            return;
          }
          const split = tickSplit();
          if (phase === "emphasize") {
            timer = setTimeout(stepEmphasize, split.emphasizeMs);
          } else {
            timer = setTimeout(stepResolve, split.resolveMs);
          }
        },
        setSpeed: (newSpeedMode) => {
          if (stopped) return;
          currentSpeedMode = newSpeedMode;
          if (isInstant()) {
            // 「当たりまで」へ切り替えた場合は、そこから先を一気にジャンプする
            if (paused) {
              pendingJumpToEnd = true;
            } else {
              clearTimeout(timer);
              timer = setTimeout(() => finish(true), 420);
            }
          }
          // それ以外の速度切り替えは、次にスケジュールされるタイマーから
          // tickSplit()経由で自動的に新しいテンポが反映される
        },
      };
    }

    function handleAction() {
      isAnimating = true;
      els.actionButton.textContent = "STOP";
      els.actionButton.dataset.mode = "stop";
      showSpinningEffect();
      hideResultPanel();
      reelDisplay.reset();
      // ここで前回の大当たりがデータランプの「1回前」へスライドする
      historyRevealPending = false;
      chargedThisAction = 0;

      const state = machine.states[session.stateId];
      resetLiveCountersForState(state);

      const rng = PachiSim.rng.createDefaultRng();
      const result = PachiSim.engine.resolveAction(session, machine, rng);
      const speedMode = currentSpeedMode();

      renderCurrentState();
      renderDataLampLive();

      let nextUpcomingIndex = 4;

      function updateLiveDisplay(roll) {
        // 回転数は繰り越し分から続けて数える。残り回数はこの状態の中だけの数なので繰り越さない。
        liveCount = spinsCarriedOver + roll.index;
        liveRemaining = state.maxAttempts == null ? null : state.maxAttempts - roll.index;
        els.spinCounter.textContent = spinCounterText(state);
        // 玉の消費は保留が貯まった時点でholdQueue.onChargeが反映済み。
        // ここでは消化した回転数ではなく、その貯まった数をそのまま使う。
        els.investmentDisplay.innerHTML = investmentDisplayText(chargedThisAction);
        renderDataLampLive();
      }

      // リーチ演出（数字リール）: 保留拡大と並行して再生する、機種共通の演出。
      // 実際の抽選結果には一切影響しない。「当たりまで」は既存どおり演出なしで飛ぶ。
      //
      // 「1保留の消化＝1つの演出が完結する」感覚を出すため、数字が止まりきった後に
      // SETTLE_MS分だけ結果を見せる間を必ず取ってから、次の保留の消化（バースト/シフト）へ進む。
      function playReelFor(roll) {
        if (speedMode.id === "instant") return undefined;

        const SETTLE_MS = 250;
        const isColored = holdQueue.isFirstColored();
        const rounds = roll.hit ? result.outcome.rounds : null;
        const plan = PachiSim.reelOmens.decide(
          roll.hit,
          isColored,
          rounds,
          maxRounds,
          PachiSim.rng.createDefaultRng()
        );

        let timing;
        let reelResolveMs;
        if (plan.reach) {
          const reachStepDelays = [200, 350, 600];
          const leftDelay = 250;
          const rightDelay = 250;
          timing = { leftDelay, rightDelay, reachStepDelays };
          reelResolveMs = leftDelay + rightDelay + reachStepDelays.reduce((a, b) => a + b, 0);
        } else {
          const base = computeTickSplit(speedMode).emphasizeMs;
          timing = {
            leftDelay: Math.round(base * 0.35),
            rightDelay: Math.round(base * 0.35),
            middleDelay: Math.round(base * 0.3),
          };
          reelResolveMs = base;
        }

        reelDisplay.play(plan, timing);
        return { durationMs: reelResolveMs + SETTLE_MS };
      }

      function start() {
        activePlayback = playback(
          result.rolls,
          state,
          currentSpeedMode(), // チャージ中に速度が変わっていた場合、開始時点の速度を使う
          {
            onEmphasize: (roll) => {
              // 補充される保留の色変化予告は、実際にスライド一式が終わった瞬間に
              // holdQueue側で自動的に反映される（固定の待ち時間で見計らうのではなく、
              // 「スライドが終わったらすぐ」を実際の完了検知で実現するため）。
              // 色保留が同時に複数出ると、どれが何を示しているのか分かりづらいので、
              // 既に色保留（途中から色が付くものも含む）が残っている間は、
              // 補充する保留に色を割り当てない。演出だけの話なので抽選結果は変わらない。
              const upcomingRoll = result.rolls[nextUpcomingIndex];
              const refillPattern =
                upcomingRoll && !holdQueue.hasColoredPattern()
                  ? PachiSim.holdOmens.pickPattern(upcomingRoll.hit)
                  : null;
              nextUpcomingIndex += 1;
              playSound("slide");
              holdQueue.emphasizeFirst(
                !roll.hit,
                refillPattern,
                computeHoldMoveMs(currentSpeedMode())
              );
              return playReelFor(roll);
            },
            onResolve: (roll) => {
              holdQueue.resolveFirst(roll.hit);
              updateLiveDisplay(roll);
            },
          },
          (viaSkip) => {
            activePlayback = null;
            finishAction(result, state, viaSkip);
          }
        );
      }

      // チャージ（または「当たりまで」時はスキップ）完了時点で既にSTOPされていた
      // 場合は、再開操作を待ってから始める。
      function beginConsumption() {
        if (isPaused) {
          pendingStart = start;
        } else {
          start();
        }
      }

      if (currentSpeedMode().id === "instant") {
        // 「当たりまで」を選んだ状態でSTARTした場合、結果への一発ジャンプしか
        // 見せないので、保留が1個ずつチャージされる演出自体が不要
        // （見えている暇もなく終わってしまう）。
        beginConsumption();
      } else {
        // 保留0個→4個まで「1個ずつ順番に」チャージし終えるまでは消化を始めない。
        // 初期4個は次々に貯まって流れていくテンポが速く、色変化が付いても
        // 目で追いきれないため、初期チャージ分には色変化パターンを割り当てない
        // （2周目以降、スライドで補充される保留からは通常どおり色が付く）。
        holdQueue.fillInitial(
          [null, null, null, null],
          beginConsumption,
          computeHoldSettleMs(currentSpeedMode())
        );
      }
    }

    function finishAction(result, fromState, viaSkip) {
      const outcome = result.outcome;
      const toState = machine.states[outcome.nextStateId];
      // 前回の大当たりからの通算回転数。当たればこの数がその大当たりの回転数になり、
      // 当たらずに終わればそのまま次の状態へ繰り越す。
      const spinsSinceLastHit = spinsCarriedOver + outcome.attempts;

      // 「当たりまで」の一発ジャンプで終わった場合、1回転ずつのupdateLiveDisplayを
      // 経由していないので、回転数表示が初期値のまま(0回転など)取り残されてしまう。
      // ここで実際の消化回数(outcome.attempts)をもとに直接反映してから凍結する。
      if (viaSkip) {
        liveCount = spinsSinceLastHit;
        liveRemaining = fromState.maxAttempts == null ? null : fromState.maxAttempts - outcome.attempts;
        els.spinCounter.textContent = spinCounterText(fromState);
        holdQueue.reset();
        if (outcome.type === "hit") {
          const plan = PachiSim.reelOmens.decide(
            true,
            false,
            outcome.rounds,
            maxRounds,
            PachiSim.rng.createDefaultRng()
          );
          reelDisplay.showResult(plan.leftDigit, plan.rightDigit, plan.finalMiddleDigit);
        } else {
          reelDisplay.reset();
        }
      }

      if (fromState.accruesInvestment) {
        stats.totalNormalSpins += outcome.attempts;
      }
      // 集計は実際に回した回転数で行うので、貯まった保留の仮の数はここで手放す。
      // 消化されずに残った保留（当たった時点の待機列）の分だけ表示が先行していたのが、
      // ここで実回転数ベースへ揃う。差は最大でも保留3個分で、大当たり出玉の加算と
      // 同じ描画で吸収されるため目には見えない。
      chargedThisAction = 0;

      if (fromState.isBaseState) {
        streakSeq += 1;
        currentStreakId = `${sessionTag}-${streakSeq}`;
      }

      const wasRushEntered = !!(session.streak && session.streak.rushEntered);
      const streakResult = PachiSim.streakTracker.applyResult(
        session.streak,
        fromState,
        toState,
        outcome
      );
      const nowRushEntered = !!(streakResult.streak && streakResult.streak.rushEntered);
      if (!wasRushEntered && nowRushEntered) {
        stats.rushEntryCount += 1;
      }

      session = result.newSession;
      session.streak = streakResult.streak;

      const line2 = `次回：${toState.label}`;
      const nextEmphasis = shouldEmphasizeNext(toState);

      // 当たったらそこで回転数は仕切り直し。当たらずに終わった分は次の状態へ繰り越す。
      spinsCarriedOver = outcome.type === "hit" ? 0 : spinsSinceLastHit;

      if (outcome.type === "hit") {
        stats.totalHitCount += 1;
        stats.totalBalls += outcome.balls;
        if (fromState.isBaseState) stats.initialHitCount += 1;

        // 保存はここで済ませるが、データランプ上で「1回前」へ送るのは
        // 次の1回転が始まってから（renderDataLampLiveのコメント参照）
        historyRevealPending = true;
        historyEntries = PachiSim.historyStore.append(slug, dateKey, historyEntries, {
          // データランプに残す回転数も、ST・時短の分を含めた通算にする
          spins: spinsSinceLastHit,
          rounds: outcome.rounds,
          context: fromState.isBaseState ? "normal" : "rush",
          streakId: currentStreakId,
        });

        // 通常の消化では、リールが揃った瞬間（reelDisplayのsettle）に既に鳴らしている。
        // 「当たりまで」はリール演出を通らないので、ここで鳴らす。
        if (viaSkip) PachiSim.soundPlayer.play("hit");
        showResultEffect({
          line1: `大当たり＜${outcome.rounds}R獲得＞${outcome.resultNote ? `（${outcome.resultNote}）` : ""}`,
          line2,
          kind: "hit",
          nextEmphasis,
        });
      } else {
        PachiSim.soundPlayer.play("exhausted"); // 滅多に鳴らないので速度に関係なく鳴らす
        showResultEffect({
          line1: outcome.resultLabel || `${fromState.label}終了`,
          line2,
          kind: "exhausted",
          nextEmphasis,
        });
      }

      if (streakResult.finished && streakResult.finishedStreak) {
        const balls = streakResult.finishedStreak.totalBalls;
        const renchan = PachiSim.streakTracker.renchanCount(streakResult.finishedStreak);
        stats.maxIkkiBalls = Math.max(stats.maxIkkiBalls, balls);
        stats.maxRenchan = Math.max(stats.maxRenchan, renchan);
        currentStreakId = null;
        showResultPanel(renchan, balls);
        // Firestoreへの書き込みが実際に終わってから再取得したいので、
        // 再描画は完了後に行う（失敗してもプレイ自体は止めない）。
        PachiSim.rankingService
          .submitResult({
            machineSlug: slug,
            machineName: machine.name,
            manufacturerName: machine.manufacturer.name,
            balls,
            renchan,
            achievedAt: new Date().toISOString(),
          })
          .then(() => renderMachineRanking())
          .catch(() => {});
      }

      PachiSim.statsStore.save(slug, stats);

      isAnimating = false;
      isPaused = false;
      activePlayback = null;
      // 上部の状態名・回転数表示は「どの状態で何回転当たったか」がわかるように
      // あえてリセットせずそのまま残す。実際のリセットは次のhandleAction()の
      // 冒頭で行われる。
      renderAll({ freezeStateDisplay: true });
    }

    els.actionButton.addEventListener("click", () => {
      // ブラウザは「ユーザー操作の中でしか音を出せない」制限を持つ。
      // このサイトはSTARTを押して遊ぶので、その最初のタップで解錠する。
      PachiSim.soundPlayer.unlock();
      if (isAnimating && !isPaused) {
        // 抽選中 -> その場で一時停止する（結果を先読み・スキップしない）
        if (activePlayback) activePlayback.pause();
        isPaused = true;
        els.actionButton.textContent = machine.states[session.stateId].actionLabel;
        els.actionButton.dataset.mode = "action";
        syncSpeedButtonLock();
        return;
      }
      if (isAnimating && isPaused) {
        // 一時停止中 -> 続きから再開する
        isPaused = false;
        els.actionButton.textContent = "STOP";
        els.actionButton.dataset.mode = "stop";
        syncSpeedButtonLock();
        if (pendingStart) {
          // 保留チャージ中にSTOPされていた場合、チャージ完了時点で消化を始める
          const fn = pendingStart;
          pendingStart = null;
          fn();
        } else if (activePlayback) {
          activePlayback.resume();
        }
        return;
      }
      handleAction();
    });

    els.speedToggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const newIndex = PachiSim.config.speedModes.findIndex((m) => m.id === btn.dataset.speedId);
        if (newIndex < 0 || newIndex === speedModeIndex) return;
        speedModeIndex = newIndex;
        syncSpeedButtonsActive();
        // 一時停止中に速度を変えても、それまでの回転数・保留はそのまま維持し、
        // 再開後のテンポだけを新しい速度に切り替える
        if (activePlayback) activePlayback.setSpeed(currentSpeedMode());
      });
    });

    PachiSim.ui.soundToggle.init(els.soundToggle, els.soundHint);

    els.resetButton.addEventListener("click", () => {
      if (isAnimating && !isPaused) return; // 実際にティック中は誤操作防止のためブロック
      if (isPaused) cancelPausedAction();
      const ok = window.confirm("本日の成績と履歴をリセットします。よろしいですか？");
      if (!ok) return;
      stats = PachiSim.statsStore.reset(slug);
      historyEntries = PachiSim.historyStore.reset(slug, dateKey);
      session = PachiSim.engine.createSession(machine);
      currentStreakId = null;
      spinsCarriedOver = 0;
      historyRevealPending = false;
      chargedThisAction = 0;
      showIdleEffect();
      hideResultPanel();
      holdQueue.reset();
      reelDisplay.reset();
      resetLiveCountersForState(machine.states[session.stateId]);
      renderAll();
    });

    resetLiveCountersForState(machine.states[session.stateId]);
    showIdleEffect();
    renderAll();
    renderMachineRanking();

    if (window.PachiSim.ui.renderAdminAuthBar) {
      PachiSim.ui.renderAdminAuthBar(els.adminAuthBar, () => renderMachineRanking());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
