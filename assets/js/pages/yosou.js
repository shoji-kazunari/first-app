// 「どこまでいくねん予想」ページのコントローラ。
//
// 大当たり確率・現在の回転数・前回の当たりまで（または閉店時）の回転数を入れると、
// 何回転目で当たるかを乱数で「予想」する。実際の抽選ロジック（core/stateEngine.js）
// とは完全に独立した、演出目的の遊びコンテンツ。機種データにも依存しない。
(function () {
  "use strict";

  const OCCULT_COMMENTS = [
    "一度トイレ休憩をしましょう。",
    "喉が渇いていませんか？自動販売機を見に行きましょう。",
    "カスタムを全て切りましょう。切っているならカスタムしてみましょう。",
    "保留は2で止めて打ちましょう。",
    "デモ画面を表示させてみましょう。",
    "音量を変えてみましょう。",
    "目をつぶって打ちましょう。",
    "ヘソを見ながら打つのをやめましょう。",
    "カードを抜いて、また差しましょう。",
    "「絶対当たる、すぐに当たる。」と声に出しましょう。",
  ];

  function $(id) {
    return document.getElementById(id);
  }

  // "1/319.6" でも "319.6" でも、末尾の数値（＝分母）だけを取り出す。
  function parseDenominator(raw) {
    const match = String(raw).match(/([\d.]+)\s*$/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function parseNonNegativeInt(raw) {
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }

  // 確率1/denominatorの幾何分布から「今からあと何回転で当たるか」を1つ引く。
  function drawSpinsToNextHit(denominator) {
    const p = 1 / denominator;
    const u = Math.random();
    return Math.max(1, Math.ceil(Math.log(1 - u) / Math.log(1 - p)));
  }

  // 参考回転数（前回の当たりまで／閉店時）が入力されているときだけ、
  // 「そろそろ来るはず／まだ届いていない」の雰囲気を軽く足す演出。
  // 統計的な根拠は無く、あくまでオカルト要素として添えるもの。
  function applyOccultBias(spins, current, reference) {
    if (reference == null) return spins;
    const factor = current >= reference ? 0.85 : 1.1;
    return Math.max(1, Math.round(spins * factor));
  }

  function pickComment() {
    const index = Math.floor(Math.random() * OCCULT_COMMENTS.length);
    return OCCULT_COMMENTS[index];
  }

  function formatSpins(n) {
    return n.toLocaleString("ja-JP");
  }

  function init() {
    const els = {
      form: $("yosouForm"),
      probability: $("yosouProbability"),
      current: $("yosouCurrent"),
      reference: $("yosouReference"),
      error: $("yosouError"),
      result: $("yosouResult"),
      resultText: $("yosouResultText"),
      comment: $("yosouComment"),
    };

    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      els.error.hidden = true;
      els.result.hidden = true;

      const denominator = parseDenominator(els.probability.value);
      const current = parseNonNegativeInt(els.current.value);
      const referenceRaw = els.reference.value.trim();
      const reference = referenceRaw === "" ? null : parseNonNegativeInt(referenceRaw);

      if (denominator === null || current === null || (referenceRaw !== "" && reference === null)) {
        els.error.hidden = false;
        return;
      }

      const spins = applyOccultBias(drawSpinsToNextHit(denominator), current, reference);
      const predicted = current + spins;

      els.resultText.textContent = `あなたの打っている台は、${formatSpins(predicted)}回転目で大当たりするかもしれません。`;
      els.comment.textContent = pickComment();
      els.result.hidden = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
