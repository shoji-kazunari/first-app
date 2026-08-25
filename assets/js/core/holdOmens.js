// 保留の色変化予告演出。
// 機種やスペックに関係なく、全機種共通で発生する純粋な演出。
// 実際の抽選結果には一切影響しない（結果が確定した後に、見た目の色だけを
// 別の抽選で決めている）。
//
// 1つの保留につき「保留4(一番奥)→保留3→保留2→保留1(先頭)→大台(消化直前)」という
// 5段階の色の推移を1パターンとして持ち、パターンごと重み付き抽選で選ぶ
// （単に「今何色か」ではなく、保留が進むにつれて色が変化するパターンそのものを選ぶ）。
// 割合は万分率（当たり用・ハズレ用それぞれ合計10000）。
window.PachiSim = window.PachiSim || {};

PachiSim.holdOmens = (function () {
  function c(v4, v3, v2, v1, big) {
    return { 4: v4, 3: v3, 2: v2, 1: v1, big: big };
  }

  const HIT_PATTERNS = [
    { weight: 1000, colors: c("red", "red", "red", "red", "red") },
    { weight: 1000, colors: c(null, null, "red", "red", "red") },
    { weight: 1000, colors: c(null, null, null, "red", "red") },
    { weight: 1000, colors: c("green", "green", "green", "red", "red") },
    { weight: 1000, colors: c("blue", "blue", "green", "red", "red") },
    { weight: 1000, colors: c("green", "green", "green", "green", "green") },
    { weight: 1000, colors: c(null, null, "green", "green", "green") },
    { weight: 500, colors: c(null, null, null, "green", "green") },
    { weight: 500, colors: c("blue", "blue", "blue", "green", "green") },
    { weight: 500, colors: c(null, null, "blue", "green", "green") },
    { weight: 500, colors: c("blue", "blue", "blue", "blue", "blue") },
    { weight: 500, colors: c(null, null, "blue", "blue", "blue") },
    { weight: 500, colors: c(null, null, null, null, null) },
  ];

  const MISS_PATTERNS = [
    { weight: 400, colors: c("green", "green", "green", "green", "green") },
    { weight: 100, colors: c(null, null, "green", "green", "green") },
    { weight: 100, colors: c(null, null, null, "green", "green") },
    { weight: 300, colors: c("blue", "blue", "blue", "green", "green") },
    { weight: 100, colors: c(null, null, "blue", "green", "green") },
    { weight: 9000, colors: c(null, null, null, null, null) },
  ];

  // isHit: その保留が最終的に当たりかどうか（抽選結果自体は変えない）
  // rng: 0以上1未満の乱数を返す関数（省略時はMath.random）
  // 戻り値: { 4, 3, 2, 1, big } 各キーに "red"|"green"|"blue"|null が入った色推移パターン
  function pickPattern(isHit, rng) {
    const table = isHit ? HIT_PATTERNS : MISS_PATTERNS;
    const picked = PachiSim.rng.weightedPick(rng || Math.random, table);
    return picked.colors;
  }

  return { pickPattern };
})();
