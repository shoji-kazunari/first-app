// 共通シミュレーターエンジン。
//
// 「通常→初当たり→RUSH」のような機種固有ロジックはここには書かない。
// 各機種は Machine データとして states（状態）と状態遷移をデータで持ち、
// このエンジンはそのデータを解釈して抽選・状態遷移を行うだけにする。
//
// Machine データの想定形（詳細は data/machines/*.js を参照）:
// {
//   id, slug, name, nameKana, aliases, manufacturer, spinsPer1000Yen,
//   baseStateId,                 // 「通常」に相当する起点状態のid
//   rules: [ "説明文", ... ],     // スペック・ルール説明欄に出す短文
//   states: {
//     [stateId]: {
//       id, label,                     // 状態名（表示用）
//       mode: "countUp" | "countDown", // 回転数表示の方式
//       maxAttempts: number|null,      // countDownの場合は最大抽選回数。countUpはnull。
//                                      // stockMode:trueの状態では使わない（null推奨。実際の
//                                      // 上限は毎回session.stockから決まるため固定値を持たない）
//       stockMode: boolean,            // true固定回数ではなく「毎回変動するストック」を
//                                      // 消化するcountDown状態か（例: 当たるたびに増減する
//                                      // 「お願い玉」のような残機制RUSH）。省略時false。
//       judgmentGate: { probability } | null, // stockMode専用（任意）。「1回転＝1回の当落判定」
//                                      // ではなく、まずjudgmentGate.probabilityで「そもそも
//                                      // 当落判定（リーチ）が発生するか」を抽選し、発生した
//                                      // 回だけ以下のprobabilityで当たり/ハズレを判定する2段階
//                                      // 抽選（例:「1/11.6でリーチ発生、発生時のみ25%で当たり・
//                                      // 75%でお願い玉を1個消費」）。判定が発生しなかった回転は
//                                      // ストックを一切消費しない「素通り」のハズレ回転として
//                                      // rollsに積まれるだけ（回転数の見た目には反映されるが、
//                                      // 残りストックは減らない）。省略時は毎回転が必ず判定される
//                                      // （＝旧来の「1回転＝1ストック消費」と同じ）。
//       probability: number,           // 1回転あたりの当選確率（judgmentGate指定時は
//                                      // 「判定が発生した回」に限った当選確率）
//       remainingLabel: string,        // （任意）「残り」の直後に挟む名称（例:「残り
//                                      // お願い玉4個」にしたい場合は"お願い玉"）
//       remainingUnit: string,         // （任意）「回」以外の単位にしたい場合（例:"個"）
//       actionLabel: "START",          // この状態で最初に押すボタンの表示。
//                                      // 状態ごとに変えられるが、今は全状態"START"で統一している
//                                      // （通常かRUSHかをボタンの文字で当てる演出は未実装のため）
//       theme: "normal"|"chance"|"rush"|string, // 背景テーマ（自由に拡張可）
//       accruesInvestment: boolean,    // この状態の回転数を投資額に計上するか
//       isBaseState: boolean,          // 「通常」相当（一撃/連チャンの起点）か
//       isRushEntry: boolean,          // RUSH突入回数としてカウントする状態か
//       onHit: (
//         { outcomes: [{weight, rounds, nextState, tag, balls?, displayRounds?, resultNote?, stockAdd?, stockSet?, bonusLoop?}, ...] }
//         | { distributionTable: "tableId", nextState, tag }    // 別テーブル参照 + 遷移先固定
//         | { stockOutcomes: [{minStock?, maxStock?, whenUnlimited?, outcomes: [...同上の形]}, ...] } // stockMode状態専用。
//           // 当たった瞬間の残りストック数（今回消化した分は含まず、それより前の外れで
//           // 減った分だけを反映した値）がminStock/maxStockの範囲に収まる最初のバケットの
//           // outcomesを使う。範囲が重ならないよう機種データ側で気を付けること。
//       ),
//       // balls（任意）: 指定があればpayoutTable[rounds]の代わりにこちらを使う。
//       // 同じラウンド数でも文脈によって出玉が変わる機種（例: 通常大当たりと特別大当たりが
//       // 同じ10Rでも出玉が違う）を表現するための上書き値。
//       //
//       // displayRounds（任意）: データランプ・演出欄の「○R獲得」表示にだけ使う値。
//       // 省略時はroundsをそのまま使う。roundsは7が出せる最大R（reelOmens.decideの
//       // maxRounds判定）とpayoutTable参照の両方に使われる内部値なので、「10R×3」の
//       // ように複数ブロックを連続消化する当たりでも、roundsはブロック単位(10)の
//       // ままにして7の出し分けロジックへの影響を避け、実際にプレイヤーが目にする
//       // 合計R数（30）だけをdisplayRoundsで別に持たせる。
//       //
//       // stockAdd/stockSet（任意、遷移先がstockMode:trueの状態のときだけ意味を持つ）:
//       // 当たった瞬間に残っていたストック（今回消化した分を差し引いた残り）を
//       // どう次のストックに変換するかを指定する。どちらか一方だけを指定する。
//       //   stockAdd: N   → 次のストック = 残りストック + N（同じRUSH内で「持ち越し+付与」）
//       //   stockUnlimited: true → 次のストック = 無制限。次の当たりを引くまで減らない。
      //                   これを配る表と、無制限中に使う表(whenUnlimited)は必ず分けること。
      //                   同じ表を使い回すと、無制限中の当たりがまた無制限を配って終わらなくなる
      //                   （machineValidatorが読み込み時に弾く）。
      //   stockSet: N   → 次のストック = N（残りを引き継がず固定値で始める。他の状態/
//       //                    他のストックプールへ乗り換わる場合など）
//       //
//       // bonusLoop（任意）: {probability, balls}。当選確定後、成功する限り繰り返し
//       // ballsを上乗せするループボーナス（例:「13%で+1500個」を外すまで繰り返す）。
//       // 安全上限として最大200回で打ち切る。
//       onExhausted: { nextState, tag } | null, // countDownで抽選回数を使い切った時の遷移（countUpはnull）
//       onFall: { probability, nextState, tag, resultLabel, residualAttempts? } | null,
//         // 「転落抽選型」のRUSH向け（任意）。回転数で終わるのではなく、大当たりとは別の
//         // 抽選（転落小当り）を引いた時点で電サポが終わる機種を表現する。
//         // 例: ユニコーン … RUSH中は「次の大当たり(約1/41.1)か転落小当り(約1/153.7)を
//         // 引くまでループ」で、規定回数という概念がない。
//         // 大当たりを外した回転でのみ抽選する（同じ回転で両方成立させない）。
//         // 引いた時のoutcomeはonExhaustedと同じ type:"exhausted" にする。
//         // 「当たらずにその状態が終わった」点は時短・ST切れと同じで、回転数の繰り越しや
//         // データランプの扱いを分ける理由がないため。
//         //
//         // residualAttempts（任意、正の整数）: 転落を引いた瞬間に始動口へ既に入って
//         // いた分（残保留）として、転落を確定させる前に追加でN回だけ「当たりかどうか」を
//         // 見る（転落の再抽選はしない）。1回でも当たれば引き戻されてRUSH継続、全部外れて
//         // 初めて転落が確定する。公表の継続率が単純な「大当り/(大当り+転落)」の比率だけでは
//         // 説明できず、残保留の引き戻し分だけ上乗せされている機種で使う。省略時は0
//         // （転落＝即座に確定、残保留による引き戻しなし）。
//     }
//   },
//   distributionTables: { [tableId]: [{rounds, weight}, ...] },
//   payoutTable: { [rounds]: balls },
// }
window.PachiSim = window.PachiSim || {};

PachiSim.engine = (function () {
  function createSession(machine) {
    const state = machine.states[machine.baseStateId];
    return {
      stateId: machine.baseStateId,
      remaining: state.maxAttempts,
      // 起点状態（通常）がstockMode:trueになることは想定していない
      // （ストックはRUSH側の状態に入って初めて意味を持つため）。
      stock: null,
      streak: null, // 進行中の「一撃」集計。通常状態にいる間はnull
    };
  }

  // 1回のボタン押下（START/JUDGEMENT）に対応する抽選を、
  // 「当選」または「規定回数消化」まで一括で解決する。
  // 戻り値のrollsはUI側がアニメーション再生するための1回転ごとの結果:
  // { index, hit, judged?, remainingStock?, fell?, pendingFall?, residual? }。
  // judged/remainingStockはstockMode状態の回転にだけ付き、judgmentGateがある場合は
  // 「素通り(judged:false)」の回も含まれる（このときhitは常にfalseで、
  // remainingStockは減らない）。
  // fell/pendingFall/residualはonFall状態にだけ付く: fell:trueはその回で転落が
  // 確定したことを示す。pendingFall:trueは「転落候補は出たが残保留の判定が残っている」
  // 回（まだ確定していない）。residual:trueはその残保留判定そのものの回（当落どちらも
  // ありうる）。UI側はfell/pendingFall/residualのいずれかが立っている回をまとめて
  // 「転落が絡む緊張感のある回」として扱うとよい（machine.jsのforceReachForMiss参照）。
  function resolveAction(session, machine, rng) {
    const state = machine.states[session.stateId];
    if (!state) {
      throw new Error(`unknown state: ${session.stateId}`);
    }

    // displayCap: UI側に見せる「残り○回」の基準値（countUpはnullのまま）。
    // stockMode状態では、固定のmaxAttemptsではなくsession.stock（前回までに持ち越した
    // ストック数）を使う。
    const displayCap = state.stockMode ? session.stock : state.maxAttempts;

    const rolls = [];
    // stockRemaining: stockMode状態でのみ意味を持つ「消化中に減っていくストック」。
    // judgmentGateが無ければ「1回転＝1回の当落判定」なので毎回転1個ずつ減る（旧来どおり）。
    // judgmentGateがあれば、判定が発生しなかった回転（素通り）は減らさない。
    let stockRemaining = state.stockMode ? session.stock : null;
    let cap;
    if (state.stockMode) {
      const gateP = state.judgmentGate ? state.judgmentGate.probability : 1;
      // 素通りの回転を含みうるため、固定回数では回せない。安全上限として
      // countUpと同じmaxSimulatedSpinsを使い、実際の終了条件（当選 or ストック枯渇）で止める。
      cap = PachiSim.config.maxSimulatedSpins;
      for (let i = 1; i <= cap; i++) {
        const judged = gateP >= 1 || PachiSim.rng.bernoulli(rng, gateP);
        if (!judged) {
          rolls.push({ index: i, hit: false, judged: false, remainingStock: stockRemaining });
          continue;
        }
        const hit = PachiSim.rng.bernoulli(rng, state.probability);
        if (hit) {
          rolls.push({ index: i, hit: true, judged: true, remainingStock: stockRemaining });
          break;
        }
        stockRemaining -= 1;
        rolls.push({ index: i, hit: false, judged: true, remainingStock: stockRemaining });
        if (stockRemaining <= 0) break;
      }
    } else {
      cap = state.maxAttempts == null ? PachiSim.config.maxSimulatedSpins : state.maxAttempts;
      let i = 0;
      while (i < cap) {
        i++;
        const hit = PachiSim.rng.bernoulli(rng, state.probability);
        if (hit) {
          rolls.push({ index: i, hit: true, fell: false });
          break;
        }
        // 転落抽選は大当たりを外した回転でのみ行う。実機は1回の抽選で
        // 大当たり・転落・ハズレのいずれかに決まるので、両方成立させない。
        const fellCandidate = !!state.onFall && PachiSim.rng.bernoulli(rng, state.onFall.probability);
        if (!fellCandidate) {
          rolls.push({ index: i, hit: false, fell: false });
          continue;
        }
        // onFall.residualAttempts（任意）: 転落を引いた瞬間に始動口へ既に入っていた分
        // （残保留）として、転落を確定させる前に追加でN回だけ「当たりかどうか」を見る
        // （転落の再抽選はしない。1回でも当たれば引き戻されてRUSH継続、全部外れて
        // 初めて転落が確定する）。公表の継続率が単純な大当り/転落の比率だけでは
        // 説明できない機種（残保留の引き戻し分だけ継続率が上乗せされる）向け。
        const residualN = (state.onFall && state.onFall.residualAttempts) || 0;
        // pendingFall: 「転落候補が出た（まだ残保留の判定が残っている）」ことをUI側が
        // 見分けられるようにする印。fell:falseのままだと普通のハズレと区別が付かず、
        // 「残保留を確認している最中」であることが画面から一切伝わらないため。
        rolls.push({ index: i, hit: false, fell: residualN === 0, pendingFall: residualN > 0 });
        if (residualN === 0) break;
        for (let r = 0; r < residualN; r++) {
          i++;
          const residualHit = PachiSim.rng.bernoulli(rng, state.probability);
          if (residualHit) {
            rolls.push({ index: i, hit: true, fell: false, residual: true });
            break;
          }
          rolls.push({ index: i, hit: false, fell: r === residualN - 1, residual: true });
        }
        break;
      }
    }

    const lastRoll = rolls[rolls.length - 1];
    const attempts = lastRoll.index;

    let outcome;
    if (lastRoll.hit) {
      let rounds, displayRounds, nextStateId, tag, ballsOverride, stockAdd, stockSet, stockUnlimited, bonusLoop;
      let resultNote;
      if (state.onHit.outcomes) {
        const picked = PachiSim.rng.weightedPick(rng, state.onHit.outcomes);
        rounds = picked.rounds;
        displayRounds = picked.displayRounds != null ? picked.displayRounds : rounds;
        nextStateId = picked.nextState;
        tag = picked.tag || null;
        resultNote = picked.resultNote || null;
        ballsOverride = picked.balls;
        stockAdd = picked.stockAdd;
        stockSet = picked.stockSet;
        stockUnlimited = picked.stockUnlimited;
        bonusLoop = picked.bonusLoop;
      } else if (state.onHit.stockOutcomes) {
        // ストック制の状態で、残りストック数（今回の当たり自体は消費しない。それより前の
        // 判定済みの外れで既に減った分だけを反映した値）によって、当たり時の振り分け
        // テーブルそのものが変わる（例: 残り2個以下と3個以上で別表）。
        const stockBeforeThisAttempt = lastRoll.remainingStock;
        // 無制限（Infinity）のときは、minStock/maxStockの表ではなくwhenUnlimitedの表を使う。
        // 無制限は数として比べると常に「3個以上」に当たってしまい、そこが再び無制限を
        // 配る表だと永久に終わらなくなるため、別の表として明示的に分ける。
        const unlimited = !isFinite(stockBeforeThisAttempt);
        const bucket = state.onHit.stockOutcomes.find((b) =>
          b.whenUnlimited
            ? unlimited
            : !unlimited &&
              (b.minStock == null || stockBeforeThisAttempt >= b.minStock) &&
              (b.maxStock == null || stockBeforeThisAttempt <= b.maxStock)
        );
        if (!bucket) {
          throw new Error(
            `状態「${state.label}」で、残りストック${
              unlimited ? "無制限" : stockBeforeThisAttempt + "個"
            }に当てはまる振り分け表がありません。` +
              "stockOutcomesの範囲指定に抜けがあります。"
          );
        }
        const picked = PachiSim.rng.weightedPick(rng, bucket.outcomes);
        rounds = picked.rounds;
        displayRounds = picked.displayRounds != null ? picked.displayRounds : rounds;
        nextStateId = picked.nextState;
        tag = picked.tag || null;
        resultNote = picked.resultNote || null;
        ballsOverride = picked.balls;
        stockAdd = picked.stockAdd;
        stockSet = picked.stockSet;
        stockUnlimited = picked.stockUnlimited;
        bonusLoop = picked.bonusLoop;
      } else {
        const table = machine.distributionTables[state.onHit.distributionTable];
        const picked = PachiSim.rng.weightedPick(rng, table);
        rounds = picked.rounds;
        displayRounds = picked.displayRounds != null ? picked.displayRounds : rounds;
        nextStateId = state.onHit.nextState;
        tag = state.onHit.tag || null;
        resultNote = state.onHit.resultNote || null;
        ballsOverride = picked.balls;
        stockAdd = picked.stockAdd;
        stockSet = picked.stockSet;
        stockUnlimited = picked.stockUnlimited;
        bonusLoop = picked.bonusLoop;
      }
      let balls = ballsOverride != null ? ballsOverride : machine.payoutTable[rounds] || 0;
      // bonusLoop（任意）: 成功する限り繰り返し上乗せするボーナス（例:
      // 「13%で+1400個」を外すまで繰り返す）。安全上限として最大200回まで。
      // rng()を毎回1個消費する。
      //
      // 上乗せするたびdisplayRounds（画面の「＜NR獲得＞」表示）も伸ばす。以前は
      // ballsだけ増やしdisplayRoundsを据え置いていたため、何回ループが成功しても
      // 画面には突入時のRのまま表示され、実際に上乗せされた出玉との整合が
      // 取れていなかった（例: カバネリ2の超輪廻ループで5回成功し合計+9,800個
      // 獲得しても「20R獲得」のまま）。1回のループがR換算で何R分に当たるかは、
      // その機種のpayoutTable[rounds]（1ブロックあたりの基準出玉）に対する
      // bonusLoop.ballsの比率から逆算できる（例: kabaneri2は payoutTable[10]=1400、
      // bonusLoop.balls=1400なので比率1、1回のループ=10R。lycoris-recoilは
      // payoutTable[5]=700、bonusLoop.balls=2800なので比率4、1回のループ=20R）。
      // 新しい数値をデータ側に足す必要はなく、既存の数値だけで求まる。
      if (bonusLoop) {
        const basePerBlock = machine.payoutTable[rounds];
        const roundsPerLoop = basePerBlock ? Math.round((rounds * bonusLoop.balls) / basePerBlock) : 0;
        for (let i = 0; i < 200; i++) {
          if (!PachiSim.rng.bernoulli(rng, bonusLoop.probability)) break;
          balls += bonusLoop.balls;
          displayRounds += roundsPerLoop;
        }
      }
      outcome = {
        type: "hit",
        attempts,
        rounds,
        displayRounds,
        balls,
        nextStateId,
        tag,
        resultNote,
        stockAdd,
        stockSet,
        stockUnlimited,
      };
    } else {
      // 転落で終わった場合も「当たらずにその状態が終わった」ことに変わりはないので、
      // 遷移先の情報の出どころだけを差し替えて同じ形のoutcomeにする。
      const ex = lastRoll.fell ? state.onFall : state.onExhausted;
      if (!ex) {
        throw new Error(
          `状態「${state.label}」が当たりも転落もしないまま上限（${cap}回転）に達しました。` +
            "countUpの状態にはonFallか、上限に達したときの遷移先が必要です。"
        );
      }
      outcome = {
        type: "exhausted",
        attempts,
        nextStateId: ex.nextState,
        tag: ex.tag || null,
        resultLabel: ex.resultLabel || null,
        viaFall: !!lastRoll.fell,
      };
    }

    const nextState = machine.states[outcome.nextStateId];
    // 遷移先がstockMode状態の場合だけ、そのストックの引き継ぎ方を決める。
    // stockSet優先。どちらも無ければ0（この組み合わせはmachineValidatorで弾く想定）。
    let nextStock = null;
    if (nextState.stockMode) {
      if (outcome.stockUnlimited) {
        // 次の当たりまで減らないストック。終わりはonExhaustedではなく当選が決める。
        nextStock = Infinity;
      } else if (outcome.stockSet != null) {
        nextStock = outcome.stockSet;
      } else if (outcome.stockAdd != null) {
        nextStock = lastRoll.remainingStock + outcome.stockAdd;
      } else {
        nextStock = 0;
      }
    }
    const newSession = {
      stateId: outcome.nextStateId,
      remaining: nextState.maxAttempts,
      stock: nextStock,
      streak: session.streak,
    };

    return {
      fromStateId: session.stateId,
      rolls,
      outcome,
      newSession,
      cap: displayCap,
    };
  }

  // その状態の「1回転あたり当たる確率」。
  //
  // 多くの状態は1回転がそのまま1回の当落判定なので state.probability と同じ。
  // judgmentGateを持つ状態は2段構えで、まずリーチが発生するかを引き、発生した回だけ
  // 当否を引く。このとき state.probability は「リーチが発生した場合の」当選率なので、
  // そのまま1回転あたりの確率として扱うと、実際よりはるかに当たりやすい数字になる。
  // 画面表示や機種間の比較には、必ずこちらを使うこと。
  function effectiveHitProbability(state) {
    const gate = state.judgmentGate ? state.judgmentGate.probability : 1;
    return state.probability * gate;
  }

  return { createSession, resolveAction, effectiveHitProbability };
})();
