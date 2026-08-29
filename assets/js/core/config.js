// サイト全体の共通設定。
// サイトタイトルを変更したい場合はここ(siteTitle)だけを書き換えれば
// ブラウザタブ・ホーム画面追加時の名前に反映される
// （見た目のロゴ画像は assets/img/logo-gijipachi.jpg を直接差し替える）。
window.PachiSim = window.PachiSim || {};

PachiSim.config = {
  siteTitle: "ギジパチ！",

  // 公開先のURL（末尾のスラッシュは付けない）。
  // 各ページのcanonical（検索エンジンに伝える正式なURL）をここから組み立てる。
  // 独自ドメインに移すときは、この1行を書き換えて
  // `node tools/build-machine-pages.js` を実行すれば全ページに反映される。
  //
  // このドメインは、リポジトリ直下の CNAME ファイルと必ず同じにすること。
  // CNAMEはGitHub Pagesが「どのドメインで配信するか」を決めるファイル、
  // ここは「検索エンジンにどのURLだと伝えるか」の設定で、別々に効く。
  // 食い違うと、配信は新ドメインなのにcanonicalだけ旧URLを指す状態になり、
  // 検索結果が旧URLのまま据え置かれる（表示は正常なので気づけない）。
  siteBaseUrl: "https://gijipachi.jp",

  // Google Analytics 4 の測定ID（G-から始まる文字列）。
  // 空のままなら計測は一切行われない（タグも読み込まれない）ので、
  // 準備ができたらここにIDを1行入れるだけで全ページで有効になる。
  // 計測を止めたくなったら、ここを空文字に戻せば止まる。
  analyticsMeasurementId: "G-QGS0BQJY5N",

  // 等価交換の仮レート。将来機種ごとに上書きできるよう、
  // 参照側は必ず machine.yenPerBall ?? config.yenPerBall のように使うこと。
  yenPerBall: 4,

  // 投資額表示の丸め単位（円）
  investmentRoundingYen: 1000,

  // 無限（countUp）状態の暴走防止用の安全上限回転数。
  // 1/199.8の抽選でここまで外れ続ける確率は天文学的に低く、統計結果には影響しない。
  maxSimulatedSpins: 100000,

  // 抽選速度モード。ボタンを押すたびにこの配列を順番に切り替える。
  // tickMs は1回転（1保留消化）ごとのアニメーション間隔。
  speedModes: [
    { id: "normal", label: "普通", tickMs: 990 }, // 元の550msの0.56倍速。790msをさらに0.8倍速(=790/0.8)にしたもの
    { id: "fast", label: "速い", tickMs: 160 },
    { id: "instant", label: "当たりまで", tickMs: 35 },
  ],
};
