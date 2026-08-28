// アクセス解析タグの読み込み条件のテスト。
//
// いちばん確かめたいのは「測定IDを入れていないあいだは外部へ一切送信しない」こと。
// ここが壊れると、プライバシーポリシーに書いた内容と実際の挙動が食い違ってしまう。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;

  // 実際のページへ偽のIDでタグを差し込むと、存在しない測定IDへ本当にリクエストが
  // 飛んでしまう。切り離した文書を用意して、そこへ差し込ませる。
  function sandboxDoc() {
    return document.implementation.createHTMLDocument("test");
  }

  function tagsIn(doc) {
    return Array.from(doc.querySelectorAll('script[src*="googletagmanager"]'));
  }

  test("解析: 測定IDが空なら、タグを読み込まない", () => {
    const doc = sandboxDoc();
    assertEqual(PachiSim.analytics.load("", doc), false, "空IDで読み込んでしまった");
    assertEqual(tagsIn(doc).length, 0, "タグが差し込まれている");
  });

  test("解析: configの測定IDが空のあいだは、引数なしで呼んでも読み込まない", () => {
    // 実運用でIDを入れるまでの状態。ページには置いたままでも送信は起きない。
    assertEqual(PachiSim.config.analyticsMeasurementId, "", "テスト用のconfigにIDが入っている");
    assertEqual(PachiSim.analytics.load(), false);
    assertEqual(tagsIn(document).length, 0, "実ページにタグが差し込まれている");
  });

  test("解析: 測定IDを渡すと、そのIDでタグを1つ読み込む", () => {
    const doc = sandboxDoc();
    assertEqual(PachiSim.analytics.load("G-TESTID123", doc), true, "読み込まれなかった");

    const tags = tagsIn(doc);
    assertEqual(tags.length, 1, "タグの数");
    assertTrue(tags[0].src.indexOf("G-TESTID123") >= 0, "srcに測定IDが入っていない");
    assertEqual(tags[0].async, true, "asyncでないとページの表示を待たせてしまう");
  });

  test("解析: 同じ文書へ2回呼んでも、タグは1つしか入らない", () => {
    const doc = sandboxDoc();
    PachiSim.analytics.load("G-TESTID123", doc);
    assertEqual(PachiSim.analytics.load("G-TESTID123", doc), false, "2回目も読み込んでしまった");
    assertEqual(tagsIn(doc).length, 1, "タグの数");
  });

  test("解析: gtagはdataLayerへ積むだけで、タグの到着を待たない", () => {
    // GA4のタグは非同期で後から届く。それより前に呼んだ分が捨てられないことを確かめる。
    const savedLayer = window.dataLayer;
    const savedGtag = window.gtag;
    try {
      window.dataLayer = undefined;
      PachiSim.analytics.load("G-TESTID123", sandboxDoc());
      assertTrue(Array.isArray(window.dataLayer), "dataLayerが配列で用意されていない");

      const before = window.dataLayer.length;
      window.gtag("event", "test");
      assertEqual(window.dataLayer.length, before + 1, "gtagの呼び出しが積まれていない");
    } finally {
      window.dataLayer = savedLayer;
      window.gtag = savedGtag;
    }
  });
})();

// 公開先URLの設定。canonical（検索エンジンに伝える正式なURL）をここから組み立てるので、
// 値が壊れていると全ページのcanonicalが一斉におかしくなる。
// 組み立て自体は tools/build-machine-pages.js が行い、生成漏れは --check が見張る。
(function () {
  const { test, assertTrue } = PachiSimTest;

  test("公開先URL: httpから始まる絶対URLになっている", () => {
    const base = PachiSim.config.siteBaseUrl;
    assertTrue(/^https?:\/\/[^/]+/.test(base), `絶対URLでない: ${base}`);
  });

  test("公開先URL: 末尾にスラッシュを付けない", () => {
    // 付いていると「.../first-app//privacy/」のようにスラッシュが重なる。
    // 生成側でも念のため落としているが、設定としては付けない約束にしておく。
    const base = PachiSim.config.siteBaseUrl;
    assertTrue(!base.endsWith("/"), `末尾にスラッシュが付いている: ${base}`);
  });
})();
