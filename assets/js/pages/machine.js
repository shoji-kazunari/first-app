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
      effectArea: $("effectArea"),
      actionButton: $("actionButton"),
      speedButton: $("speedButton"),
      adSlot: $("adSlot"),
      affiliateSection: $("affiliateSection"),
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
    els.rulesList.innerHTML = machine.rules.map((r) => `<li>${r}</li>`).join("");

    const dateKey = PachiSim.statsStore.todayKey();
    let stats = PachiSim.statsStore.load(slug);
    let historyEntries = PachiSim.historyStore.load(slug, dateKey);
    let session = PachiSim.engine.createSession(machine);
    let speedModeIndex = 0;
    let isAnimating = false;
    let isPaused = false; // STOPでその場停止中かどうか
    let liveCount = 0; // countUp表示中の一時カウント
    let liveRemaining = null; // countDown表示中の一時カウント
    let activePlayback = null; // 実行中のplayback制御（pause/resumeで使用）
    let currentStreakId = null; // 進行中の「一撃」を識別するID（データランプの連チャンまとめ用）
    let streakSeq = 0;
    // Date.now()だけだと同一ミリ秒内の連続実行でID衝突する可能性があるため、
    // ページ読み込みごとに変わるタグ＋連番でstreakIdを一意にする
    const sessionTag = Math.random().toString(36).slice(2, 8);

    const holdQueue = new PachiSim.ui.HoldQueue(els.holdQueueEl);
    const reelDisplay = new PachiSim.ui.ReelDisplay(els.reelDisplayEl);
    const maxRounds = Math.max(...Object.keys(machine.payoutTable).map(Number));

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

    function investmentYen() {
      const raw = (stats.totalNormalSpins / machine.spinsPer1000Yen) * 1000;
      return PachiSim.format.roundUpTo(raw, PachiSim.config.investmentRoundingYen);
    }

    function balanceYen() {
      const yenPerBall = machine.yenPerBall || PachiSim.config.yenPerBall;
      return stats.totalBalls * yenPerBall - investmentYen();
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
      els.speedButton.disabled = locked;
      els.resetButton.disabled = locked;
    }

    // freezeSpinCounter: trueの間は回転数表示を更新しない。
    // 大当たり直後、「当たった回転数がわかるように」上部表示をそのまま残すために使う
    // （次のアクション開始時にresetLiveCountersForState経由であらためて更新される）。
    function renderCurrentState(options) {
      const freezeSpinCounter = !!(options && options.freezeSpinCounter);
      const state = machine.states[session.stateId];
      els.currentStateLabel.textContent = state.label;
      els.simulationArea.dataset.theme = state.theme;
      if (!freezeSpinCounter) {
        els.spinCounter.textContent = spinCounterText(state);
      }
      els.investmentDisplay.textContent = `投資目安：約${PachiSim.format.yen(investmentYen())}`;
      if (!isAnimating) {
        els.actionButton.textContent = state.actionLabel;
        els.actionButton.dataset.mode = "action";
      }
      els.speedButton.textContent = `抽選速度：${currentSpeedMode().label}`;
      syncSpeedButtonLock();
    }

    // データランプの「現在」列はライブ進行中の回転数(liveCount)に連動するため、
    // ティックのたびにも呼び出せるよう単独の関数にしてある。
    function renderDataLampLive() {
      PachiSim.ui.renderDataLamp(els.dataLamp, historyEntries, liveCount);
    }

    function renderAll(options) {
      renderCurrentState(options);
      renderStats();
      renderDataLampLive();
    }

    function resetLiveCountersForState(state) {
      liveCount = 0;
      liveRemaining = state.maxAttempts;
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
      isAnimating = false;
      isPaused = false;
      showIdleEffect();
      holdQueue.reset();
      reelDisplay.reset();
      resetLiveCountersForState(machine.states[session.stateId]);
      renderCurrentState();
      renderDataLampLive();
    }

    // line1: 「大当たり＜4R獲得＞」のようなメイン結果、line2: 「次回：最終決戦」のような行き先
    function showResultEffect({ line1, line2, kind }) {
      els.effectArea.dataset.kind = kind;
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
      reelDisplay.reset();

      const state = machine.states[session.stateId];
      resetLiveCountersForState(state);

      const rng = PachiSim.rng.createDefaultRng();
      const result = PachiSim.engine.resolveAction(session, machine, rng);
      const speedMode = currentSpeedMode();

      // 保留の色予告（機種共通演出）はSTART時にチャージされる初期4個には付けない。
      // 消化が進んで新しく補充される保留からだけ色が付く可能性がある。
      holdQueue.fillInitial();
      renderCurrentState();
      renderDataLampLive();

      let nextUpcomingIndex = 4;

      function updateLiveDisplay(roll) {
        liveCount = roll.index;
        liveRemaining = state.maxAttempts == null ? null : state.maxAttempts - roll.index;
        els.spinCounter.textContent = spinCounterText(state);
        els.investmentDisplay.textContent = `投資目安：約${PachiSim.format.yen(
          state.accruesInvestment
            ? PachiSim.format.roundUpTo(
                ((stats.totalNormalSpins + roll.index) / machine.spinsPer1000Yen) * 1000,
                PachiSim.config.investmentRoundingYen
              )
            : investmentYen()
        )}`;
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

      activePlayback = playback(
        result.rolls,
        state,
        speedMode,
        {
          onEmphasize: (roll) => {
            holdQueue.emphasizeFirst();
            return playReelFor(roll);
          },
          onResolve: (roll) => {
            const upcomingRoll = result.rolls[nextUpcomingIndex];
            const refillColor = upcomingRoll ? PachiSim.holdOmens.pickColor(upcomingRoll.hit) : null;
            nextUpcomingIndex += 1;
            holdQueue.resolveFirst(roll.hit, refillColor);
            updateLiveDisplay(roll);
          },
        },
        (viaSkip) => {
          activePlayback = null;
          finishAction(result, state, viaSkip);
        }
      );
    }

    function finishAction(result, fromState, viaSkip) {
      const outcome = result.outcome;
      const toState = machine.states[outcome.nextStateId];

      // 「当たりまで」の一発ジャンプで終わった場合、演出を1回転ずつ見せていないので
      // 保留は非表示にし、リールは結果に応じた見た目（当たりなら揃った状態、
      // ハズレならアイドル状態）に揃えておく。
      if (viaSkip) {
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

      if (outcome.type === "hit") {
        stats.totalHitCount += 1;
        stats.totalBalls += outcome.balls;
        if (fromState.isBaseState) stats.initialHitCount += 1;

        historyEntries = PachiSim.historyStore.append(slug, dateKey, historyEntries, {
          spins: outcome.attempts,
          rounds: outcome.rounds,
          context: fromState.isBaseState ? "normal" : "rush",
          streakId: currentStreakId,
        });

        showResultEffect({
          line1: `大当たり＜${outcome.rounds}R獲得＞${outcome.resultNote ? `（${outcome.resultNote}）` : ""}`,
          line2: `次回：${toState.label}`,
          kind: "hit",
        });
      } else {
        showResultEffect({
          line1: outcome.resultLabel || `${fromState.label}終了`,
          line2: `次回：${toState.label}`,
          kind: "exhausted",
        });
      }

      if (streakResult.finished && streakResult.finishedStreak) {
        const balls = streakResult.finishedStreak.totalBalls;
        const renchan = PachiSim.streakTracker.renchanCount(streakResult.finishedStreak);
        stats.maxIkkiBalls = Math.max(stats.maxIkkiBalls, balls);
        stats.maxRenchan = Math.max(stats.maxRenchan, renchan);
        currentStreakId = null;
        PachiSim.rankingService.submitResult({
          machineSlug: slug,
          machineName: machine.name,
          manufacturerName: machine.manufacturer.name,
          balls,
          renchan,
          achievedAt: new Date().toISOString(),
        });
      }

      PachiSim.statsStore.save(slug, stats);

      isAnimating = false;
      isPaused = false;
      activePlayback = null;
      // 上部の回転数表示は「当たった回転数がわかるように」あえてリセットせずそのまま残す。
      // 実際のリセットは次のhandleAction()の冒頭で行われる。
      renderAll({ freezeSpinCounter: true });
    }

    els.actionButton.addEventListener("click", () => {
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
        if (activePlayback) activePlayback.resume();
        return;
      }
      handleAction();
    });

    els.speedButton.addEventListener("click", () => {
      speedModeIndex = (speedModeIndex + 1) % PachiSim.config.speedModes.length;
      els.speedButton.textContent = `抽選速度：${currentSpeedMode().label}`;
      // 一時停止中に速度を変えても、それまでの回転数・保留はそのまま維持し、
      // 再開後のテンポだけを新しい速度に切り替える
      if (activePlayback) activePlayback.setSpeed(currentSpeedMode());
    });

    els.resetButton.addEventListener("click", () => {
      if (isAnimating && !isPaused) return; // 実際にティック中は誤操作防止のためブロック
      if (isPaused) cancelPausedAction();
      const ok = window.confirm("本日の成績と履歴をリセットします。よろしいですか？");
      if (!ok) return;
      stats = PachiSim.statsStore.reset(slug);
      historyEntries = PachiSim.historyStore.reset(slug, dateKey);
      session = PachiSim.engine.createSession(machine);
      currentStreakId = null;
      showIdleEffect();
      holdQueue.reset();
      reelDisplay.reset();
      resetLiveCountersForState(machine.states[session.stateId]);
      renderAll();
    });

    resetLiveCountersForState(machine.states[session.stateId]);
    showIdleEffect();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
