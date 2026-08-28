// リーチ演出（3つの数字リール）の判定ロジック。機種・スペックに関係なく共通の演出で、
// 実際の抽選結果（isHit）には一切影響しない。数字はあくまで見た目の表現。
//
// ルール:
//   ・数字は1〜9。偶数=青、奇数=緑、「7」だけは金（別格）。
//   ・大当たり時は必ずリーチ（左=右）になり、中央がゆっくり近づいて一致して止まる。
//     「7」はその機種の最大ラウンドを獲得した大当たりのときだけ出せる。
//   ・ハズレ時、色保留（保留色予告つき）は必ず「特殊なハズレ演出」＝一旦リーチにはなるが
//     中央がリーチの数字の次の数字で外れて止まる。色保留以外は3%だけこの特殊演出になり、
//     残りは左右含め毎回バラバラに止まる「基本のハズレ演出」。
//   ・リーチの数字が奇数のときは、大当たりに繋がりやすい（大当たりリーチの数字選択で
//     奇数を偶数の2倍の重みにすることで表現している）。
//
// 【例外: 転落式（options.noReach）】
// 転落抽選型のRUSHは超短縮変動で、リーチになった時点で当たりか転落かが決まる。
// 「リーチがかかって、ドキドキしながら中央が近づく」という時間そのものが無い。
// そこでこの状態ではリーチ演出を作らず、3つとも短く止める。
// 大当たりのときだけ3つ揃い（リーチの間を挟まずに揃う）、それ以外はバラけて終わる。
window.PachiSim = window.PachiSim || {};

PachiSim.reelOmens = (function () {
  const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const NON_SEVEN = [1, 2, 3, 4, 5, 6, 8, 9];

  function isOdd(d) {
    return d % 2 === 1;
  }

  function weightedDigit(rng, candidates, oddWeight, evenWeight) {
    const weighted = candidates.map((d) => ({ d, w: isOdd(d) ? oddWeight : evenWeight }));
    const total = weighted.reduce((sum, x) => sum + x.w, 0);
    let r = rng() * total;
    for (const x of weighted) {
      if (r < x.w) return x.d;
      r -= x.w;
    }
    return weighted[weighted.length - 1].d;
  }

  function randomFrom(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  // dからsteps個前の数字（1の前は9に戻る）
  function prevDigit(d, steps) {
    let v = d;
    for (let i = 0; i < steps; i++) {
      v = v > 1 ? v - 1 : 9;
    }
    return v;
  }

  // dの次の数字（9の次は1）。ただし7は絶対に返さない（7はハズレに出さないため）
  function nextNonSeven(d) {
    let v = d >= 9 ? 1 : d + 1;
    if (v === 7) v = v >= 9 ? 1 : v + 1;
    return v;
  }

  function buildApproachSequence(targetForApproach, finalDigit) {
    return [
      prevDigit(targetForApproach, 3),
      prevDigit(targetForApproach, 2),
      prevDigit(targetForApproach, 1),
      finalDigit,
    ];
  }

  // isHit: このホールドの実際の抽選結果
  // isColored: このホールドが保留色予告で色付きだったか
  // rounds / maxRounds: 大当たり時、7を出してよいか判定するための獲得R数と機種の最大R数
  // rng: 0以上1未満の乱数を返す関数
  // options.noReach: 転落式の状態で立てる。リーチを一切作らない（上のコメント参照）
  function decide(isHit, isColored, rounds, maxRounds, rng, options) {
    const noReach = !!(options && options.noReach);

    if (isHit && noReach) {
      // リーチの間を挟まずに3つ揃える。中央も同じ数字を短く止めるだけ
      const candidates = rounds != null && rounds === maxRounds ? ALL_DIGITS : NON_SEVEN;
      const digit = weightedDigit(rng, candidates, 2, 1);
      return {
        reach: false,
        match: true,
        leftDigit: digit,
        rightDigit: digit,
        middleDigit: digit,
      };
    }

    if (isHit) {
      const candidates = rounds != null && rounds === maxRounds ? ALL_DIGITS : NON_SEVEN;
      const digit = weightedDigit(rng, candidates, 2, 1);
      return {
        reach: true,
        match: true,
        leftDigit: digit,
        rightDigit: digit,
        middleSequence: buildApproachSequence(digit, digit),
        finalMiddleDigit: digit,
      };
    }

    // 転落式では、色保留による特殊リーチも作らない（そもそも色保留を出さないが、
    // 出したとしてもリーチにはしない）
    const forcedReach = !noReach && (isColored || rng() < 0.03);
    if (forcedReach) {
      const digit = weightedDigit(rng, NON_SEVEN, 1, 1);
      // 行き過ぎて止まる場合は、必ずリーチ数字の「次の数字」で止める（7はスキップ）
      const missDigit = nextNonSeven(digit);
      return {
        reach: true,
        match: false,
        leftDigit: digit,
        rightDigit: digit,
        middleSequence: buildApproachSequence(digit, missDigit),
        finalMiddleDigit: missDigit,
      };
    }

    let left = randomFrom(rng, NON_SEVEN);
    let right = randomFrom(rng, NON_SEVEN);
    while (right === left) {
      right = randomFrom(rng, NON_SEVEN);
    }
    const middle = randomFrom(rng, NON_SEVEN);
    return {
      reach: false,
      match: false,
      leftDigit: left,
      rightDigit: right,
      middleDigit: middle,
    };
  }

  return { decide, prevDigit, nextNonSeven };
})();
