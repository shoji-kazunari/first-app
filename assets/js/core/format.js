// 表示用フォーマットユーティリティ
window.PachiSim = window.PachiSim || {};

PachiSim.format = (function () {
  function yen(n) {
    return `${Math.round(n).toLocaleString("ja-JP")}円`;
  }

  function ball(n) {
    return `${Math.round(n).toLocaleString("ja-JP")}玉`;
  }

  function number(n) {
    return Math.round(n).toLocaleString("ja-JP");
  }

  function roundUpTo(n, unit) {
    if (unit <= 0) return n;
    return Math.ceil(n / unit) * unit;
  }

  function percent(p, digits = 1) {
    return `${(p * 100).toFixed(digits)}%`;
  }

  // 確率pを「1/199.8」のような分数表記にする。小数第1位までで、
  // ちょうど整数（例: 1/319.0）なら末尾の".0"は省く。
  function probabilityFraction(p) {
    const denom = 1 / p;
    const rounded = denom.toFixed(1);
    const trimmed = rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded;
    return `1/${trimmed}`;
  }

  return { yen, ball, number, roundUpTo, percent, probabilityFraction };
})();
