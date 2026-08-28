// Google Analytics 4（GA4）の読み込み。
//
// 測定IDは config.analyticsMeasurementId の1箇所だけに書く。各ページにIDを
// 直接埋め込むと、機種が増えるたびに埋め込み先が増えて外し忘れの元になるため。
// IDが空のあいだはタグ自体を読み込まないので、
// - まだGA4の準備ができていない状態でも、そのまま置いておける
// - 計測を止めたくなったらconfigを空に戻すだけで、外部への送信が完全に止まる
//
// 計測しているのはGA4の標準的な項目（閲覧ページ・参照元・端末・おおよその地域など）
// だけで、こちらから個人を特定する情報を送ることはしていない。
// 何を集めているかはプライバシーポリシー(/privacy/)に書いてあるので、
// 送る項目を増やすときは必ずあちらも直すこと。
//
// 機種ページはそれぞれ別のURL（/machines/<slug>/）なので、標準のページビューだけで
// 「どの機種が見られているか」は分かる。そのための追加設定は要らない。
window.PachiSim = window.PachiSim || {};

PachiSim.analytics = (function () {
  "use strict";

  // 実際に読み込んだらtrueを返す（読み込み済みかどうかの判定と、テストに使う）。
  //
  // measurementId / doc は通常は省略する（configのIDを、このページに入れる）。
  // テストからは、偽のIDと切り離した文書を渡して呼ぶ。実際のページへ偽のIDで
  // タグを差し込むと、存在しない測定IDへ本当にリクエストが飛んでしまうため。
  function load(measurementId, doc) {
    const id = measurementId || (PachiSim.config && PachiSim.config.analyticsMeasurementId);
    if (!id) return false;

    const targetDoc = doc || window.document;
    if (targetDoc.getElementById("ga4-tag")) return false; // 二重読み込みを防ぐ

    // gtag()は「dataLayerへ引数をそのまま積む」だけの関数。GA4のタグが後から
    // 読み込まれてこの配列を処理するので、タグの到着を待たずに呼んでよい。
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id);

    const script = targetDoc.createElement("script");
    script.id = "ga4-tag";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    targetDoc.head.appendChild(script);
    return true;
  }

  load();

  return { load: load };
})();
