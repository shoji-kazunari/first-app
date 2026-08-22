// 抽選ロジックから分離した乱数ユーティリティ。
// 本番ではMath.randomベースの関数を使い、テストでは固定シードの関数を注入して
// 決定的な結果を検証できるようにする。
window.PachiSim = window.PachiSim || {};

PachiSim.rng = (function () {
  // 本番用: 0以上1未満の乱数を返す関数を返す
  function createDefaultRng() {
    return Math.random;
  }

  // テスト用: シード値から決定的な乱数列を作る（mulberry32）
  function createSeededRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 常にhit/missを指定通りに返すテスト用rng（1回ごとに配列を消費する）
  function createScriptedRng(values) {
    let i = 0;
    return function () {
      const v = i < values.length ? values[i] : values[values.length - 1];
      i++;
      return v;
    };
  }

  // 実機の多くと同じ「0〜65535（65536通り）の乱数カウンタから1個取得し、
  // 当たり判定値の個数と比較する」方式で当たり/外れを決める独立試行。
  // rng()自体は0以上1未満の一様乱数のままでよく、ここでその値を
  // 0〜65535の整数（カウンタが取り得る値）に変換してから判定する。
  const LOT_RANGE = 65536;
  function bernoulli(rng, p) {
    const winningCount = Math.round(p * LOT_RANGE);
    const draw = Math.floor(rng() * LOT_RANGE); // 0〜65535
    return draw < winningCount;
  }

  // outcomes: [{weight, ...}] から重み付きで1件選ぶ
  function weightedPick(rng, outcomes) {
    const total = outcomes.reduce((sum, o) => sum + o.weight, 0);
    let r = rng() * total;
    for (const o of outcomes) {
      if (r < o.weight) return o;
      r -= o.weight;
    }
    return outcomes[outcomes.length - 1];
  }

  return {
    createDefaultRng,
    createSeededRng,
    createScriptedRng,
    bernoulli,
    weightedPick,
  };
})();
