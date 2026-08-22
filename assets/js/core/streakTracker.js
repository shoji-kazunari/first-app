// 「一撃」（通常時初当たり〜通常復帰までの合算出玉）と連チャン数の集計ロジック。
// DOMに依存しない純粋関数群にして、machine.jsからもテストからも同じ挙動で使えるようにする。
window.PachiSim = window.PachiSim || {};

PachiSim.streakTracker = (function () {
  function createEmptyStreak() {
    return { hits: [], totalBalls: 0, rushEntered: false };
  }

  // resolveActionの結果を1件、進行中の一撃(streakかnull)に反映する。
  // fromState: このactionを実行した時点の状態定義（machine.states[fromStateId]）
  // 戻り値: { streak: 更新後の一撃(終了していればnull), finished: 直前で一撃が確定したか, finishedStreak: 確定した一撃データ }
  function applyResult(streak, fromState, toState, outcome) {
    if (outcome.type === "hit") {
      // streak/outcomeを書き換えず、常に新しいオブジェクトを返す（呼び出し側が
      // 更新前の値と比較できるようにするため。ここをミューテーションにすると、
      // 呼び出し側が同じ参照を「更新前の値」として保持しているつもりでも
      // 実際には書き換わってしまい、before/after比較が壊れる）
      const base = fromState.isBaseState ? createEmptyStreak() : streak || createEmptyStreak();
      const current = {
        hits: base.hits.concat([
          { rounds: outcome.rounds, balls: outcome.balls, fromStateId: fromState.id },
        ]),
        totalBalls: base.totalBalls + outcome.balls,
        rushEntered: base.rushEntered || !!toState.isRushEntry,
      };

      if (toState.isBaseState) {
        // 当選と同時に基点状態へ戻る構成の機種向け（通常このケースは起きないが将来のため対応）
        return { streak: null, finished: true, finishedStreak: current };
      }
      return { streak: current, finished: false, finishedStreak: null };
    }

    // exhausted（規定回数を外れで消化）
    if (toState.isBaseState && streak) {
      return { streak: null, finished: true, finishedStreak: streak };
    }
    return { streak, finished: false, finishedStreak: null };
  }

  function renchanCount(finishedStreak) {
    return finishedStreak ? finishedStreak.hits.length : 0;
  }

  return { createEmptyStreak, applyResult, renchanCount };
})();
