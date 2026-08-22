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

  function assertEqual(actual, expected, label) {
    const ok =
      typeof actual === "number" && typeof expected === "number"
        ? Math.abs(actual - expected) < 1e-9
        : actual === expected;
    if (!ok) {
      throw new Error(
        `${label ? label + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
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
