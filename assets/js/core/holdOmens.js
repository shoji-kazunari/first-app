// 保留の色予告演出。
// 機種やスペックに関係なく、全機種共通で発生する純粋な演出。
// 実際の抽選結果には一切影響しない（結果が確定した後に、見た目の色だけを
// 別の抽選で決めている）。
window.PachiSim = window.PachiSim || {};

PachiSim.holdOmens = (function () {
  // 当たり保留 / ハズレ保留それぞれの色分け確率。残りは通常色（無色）のまま。
  const HIT_TABLE = [
    { color: "red", weight: 0.5 },
    { color: "green", weight: 0.15 },
  ];
  const MISS_TABLE = [
    { color: "blue", weight: 0.05 },
    { color: "green", weight: 0.03 },
  ];

  // isHit: その保留が最終的に当たりかどうか（抽選結果自体は変えない）
  // rng: 0以上1未満の乱数を返す関数（省略時はMath.random）
  function pickColor(isHit, rng) {
    const table = isHit ? HIT_TABLE : MISS_TABLE;
    const roll = (rng || Math.random)();
    let acc = 0;
    for (const entry of table) {
      acc += entry.weight;
      if (roll < acc) return entry.color;
    }
    return null;
  }

  return { pickColor };
})();
