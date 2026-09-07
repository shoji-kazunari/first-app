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
  // isStreakBoundary: その状態が「一撃/連チャンの区切り」として振る舞うか。
  // 通常はisBaseState（baseStateIdの1状態のみ）で判定するが、machineValidatorが
  // isBaseStateを1機種につき1つしか許さないため、「隠しカウンター保持のために
  // 通常と同じ役割の状態を複数チェーンさせる」機種（例: pa-ainofujichaku-sweet.jsの
  // normal→normal2→normal3、いずれもRUSH非突入時の左打ち状態）では、2つ目以降の
  // 状態にisBaseStateを付けられない。そのため、状態側で任意にresetsStreak:trueを
  // 立てられるようにし、「isBaseStateではないが、一撃の区切りとしてはisBaseStateと
  // 同じに扱ってほしい」状態を表現できるようにしてある。
  function isStreakBoundary(state) {
    return !!(state.isBaseState || state.resetsStreak);
  }

  function applyResult(streak, fromState, toState, outcome) {
    if (outcome.type === "hit") {
      // streak/outcomeを書き換えず、常に新しいオブジェクトを返す（呼び出し側が
      // 更新前の値と比較できるようにするため。ここをミューテーションにすると、
      // 呼び出し側が同じ参照を「更新前の値」として保持しているつもりでも
      // 実際には書き換わってしまい、before/after比較が壊れる）
      const base = isStreakBoundary(fromState) ? createEmptyStreak() : streak || createEmptyStreak();
      const current = {
        hits: base.hits.concat([
          { rounds: outcome.rounds, balls: outcome.balls, fromStateId: fromState.id },
        ]),
        totalBalls: base.totalBalls + outcome.balls,
        rushEntered: base.rushEntered || !!toState.isRushEntry,
      };

      if (isStreakBoundary(toState)) {
        // 当選と同時に基点状態（またはそれに準じる状態）へ戻る構成の機種向け。
        // RUSH非突入のままresetsStreak状態へ戻る当たりも、実機と同じくその場で
        // 完結する別の一撃として扱う（次の当たりまで合算しない）。
        return { streak: null, finished: true, finishedStreak: current };
      }
      return { streak: current, finished: false, finishedStreak: null };
    }

    // exhausted（規定回数を外れで消化）
    if (isStreakBoundary(toState) && streak) {
      return { streak: null, finished: true, finishedStreak: streak };
    }
    return { streak, finished: false, finishedStreak: null };
  }

  function renchanCount(finishedStreak) {
    return finishedStreak ? finishedStreak.hits.length : 0;
  }

  return { createEmptyStreak, applyResult, renchanCount };
})();
