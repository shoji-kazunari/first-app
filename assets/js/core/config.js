// サイト全体の共通設定。
// サイトタイトルを変更したい場合はここ(siteTitle)だけを書き換えれば
// TOPページ・各機種ページの表示に反映される。
window.PachiSim = window.PachiSim || {};

PachiSim.config = {
  siteTitle: "パチンコシミュレーター",
  siteTagline: "スペックをボタンで疑似体験するシミュレーター",

  // Google Analytics 4 の測定ID（G-から始まる文字列）。
  // 空のままなら計測は一切行われない（タグも読み込まれない）ので、
  // 準備ができたらここにIDを1行入れるだけで全ページで有効になる。
  // 計測を止めたくなったら、ここを空文字に戻せば止まる。
  analyticsMeasurementId: "",

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
    { id: "fast", label: "早い", tickMs: 160 },
    { id: "instant", label: "当たりまで", tickMs: 35 },
  ],
};
