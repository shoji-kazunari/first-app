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

  // ISO文字列(Date.toISOString()等)を「2026.08.26.23:59」の形式にする。
  // 不正な日時が渡された場合は空文字を返す。
  function dateTimeLabel(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  // 「YYYY-MM-DD」形式の導入日を「2026年3月2日 導入」の表記にする。
  // 不正な形式が渡された場合は空文字を返す。
  function releaseDateLabel(isoDate) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
    if (!m) return "";
    return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日 導入`;
  }

  return { yen, ball, number, percent, probabilityFraction, dateTimeLabel, releaseDateLabel };
})();
