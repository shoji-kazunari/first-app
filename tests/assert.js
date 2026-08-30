// 依存ライブラリを増やさないための、ごく小さな自作アサーション/テストランナー。
// tests/index.html から読み込んで使う。
window.PachiSimTest = (function () {
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
    } catch (e) {
      results.push({ name, pass: false, error: e && e.message ? e.message : String(e) });
    }
  }

  // 数値は小数の誤差を許して比べる。ただしInfinity同士は引き算がNaNになり
  // どんな比較も偽になってしまうので、先に同一値かどうかを見る。
  function numbersEqual(a, b) {
    if (Object.is(a, b)) return true; // Infinity同士・-0/0の区別もここで済む
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) < 1e-9;
  }

  // JSON.stringifyはInfinityもNaNもnullにしてしまい、失敗の原因が読めなくなる。
  // 数値はそのまま文字にする。
  function show(v) {
    return typeof v === "number" ? String(v) : JSON.stringify(v);
  }

  function assertEqual(actual, expected, label) {
    const ok =
      typeof actual === "number" && typeof expected === "number"
        ? numbersEqual(actual, expected)
        : actual === expected;
    if (!ok) {
      throw new Error(`${label ? label + ": " : ""}expected ${show(expected)}, got ${show(actual)}`);
    }
  }

  function assertTrue(actual, label) {
    if (!actual) throw new Error(`${label || "assertTrue failed"}`);
  }

  function getResults() {
    return results;
  }

  return { test, assertEqual, assertTrue, getResults };
})();
