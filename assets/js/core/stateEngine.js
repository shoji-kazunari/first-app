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
//       maxAttempts: number|null,      // countDownの場合は最大抽選回数。countUpはnull
//       probability: number,           // 1回転あたりの当選確率
//       actionLabel: "START",          // この状態で最初に押すボタンの表示。
//                                      // 状態ごとに変えられるが、今は全状態"START"で統一している
//                                      // （通常かRUSHかをボタンの文字で当てる演出は未実装のため）
//       theme: "normal"|"chance"|"rush"|string, // 背景テーマ（自由に拡張可）
//       accruesInvestment: boolean,    // この状態の回転数を投資額に計上するか
//       isBaseState: boolean,          // 「通常」相当（一撃/連チャンの起点）か
//       isRushEntry: boolean,          // RUSH突入回数としてカウントする状態か
//       onHit: (
//         { outcomes: [{weight, rounds, nextState, tag, balls?, resultNote?}, ...] } // 当選時の振り分けを直接持つ
//         | { distributionTable: "tableId", nextState, tag }    // 別テーブル参照 + 遷移先固定
//       ),
//       // balls（任意）: 指定があればpayoutTable[rounds]の代わりにこちらを使う。
//       // 同じラウンド数でも文脈によって出玉が変わる機種（例: 通常大当たりと特別大当たりが
//       // 同じ10Rでも出玉が違う）を表現するための上書き値。
//       onExhausted: { nextState, tag } | null, // countDownで抽選回数を使い切った時の遷移（countUpはnull）
//       onFall: { probability, nextState, tag, resultLabel } | null,
//         // 「転落抽選型」のRUSH向け（任意）。回転数で終わるのではなく、大当たりとは別の
//         // 抽選（転落小当り）を引いた時点で電サポが終わる機種を表現する。
//         // 例: ユニコーン … RUSH中は「次の大当たり(約1/41.1)か転落小当り(約1/153.7)を
//         // 引くまでループ」で、規定回数という概念がない。
//         // 大当たりを外した回転でのみ抽選する（同じ回転で両方成立させない）。
//         // 引いた時のoutcomeはonExhaustedと同じ type:"exhausted" にする。
//         // 「当たらずにその状態が終わった」点は時短・ST切れと同じで、回転数の繰り越しや
//         // データランプの扱いを分ける理由がないため。
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
      streak: null, // 進行中の「一撃」集計。通常状態にいる間はnull
    };
  }

  // 1回のボタン押下（START/JUDGEMENT）に対応する抽選を、
  // 「当選」または「規定回数消化」まで一括で解決する。
  // 戻り値のrollsはUI側がアニメーション再生するための1回転ごとの結果。
  function resolveAction(session, machine, rng) {
    const state = machine.states[session.stateId];
    if (!state) {
      throw new Error(`unknown state: ${session.stateId}`);
    }

    const cap =
      state.maxAttempts == null
        ? PachiSim.config.maxSimulatedSpins
        : state.maxAttempts;

    const rolls = [];
    for (let i = 1; i <= cap; i++) {
      const hit = PachiSim.rng.bernoulli(rng, state.probability);
      if (hit) {
        rolls.push({ index: i, hit: true, fell: false });
        break;
      }
      // 転落抽選は大当たりを外した回転でのみ行う。実機は1回の抽選で
      // 大当たり・転落・ハズレのいずれかに決まるので、両方成立させない。
      const fell = !!state.onFall && PachiSim.rng.bernoulli(rng, state.onFall.probability);
      rolls.push({ index: i, hit: false, fell });
      if (fell) break;
    }

    const lastRoll = rolls[rolls.length - 1];
    const attempts = lastRoll.index;

    let outcome;
    if (lastRoll.hit) {
      let rounds, nextStateId, tag, ballsOverride;
      let resultNote;
      if (state.onHit.outcomes) {
        const picked = PachiSim.rng.weightedPick(rng, state.onHit.outcomes);
        rounds = picked.rounds;
        nextStateId = picked.nextState;
        tag = picked.tag || null;
        resultNote = picked.resultNote || null;
        ballsOverride = picked.balls;
      } else {
        const table = machine.distributionTables[state.onHit.distributionTable];
        const picked = PachiSim.rng.weightedPick(rng, table);
        rounds = picked.rounds;
        nextStateId = state.onHit.nextState;
        tag = state.onHit.tag || null;
        resultNote = state.onHit.resultNote || null;
        ballsOverride = picked.balls;
      }
      const balls = ballsOverride != null ? ballsOverride : machine.payoutTable[rounds] || 0;
      outcome = {
        type: "hit",
        attempts,
        rounds,
        balls,
        nextStateId,
        tag,
        resultNote,
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
    const newSession = {
      stateId: outcome.nextStateId,
      remaining: nextState.maxAttempts,
      streak: session.streak,
    };

    return {
      fromStateId: session.stateId,
      rolls,
      outcome,
      newSession,
    };
  }

  return { createSession, resolveAction };
})();
