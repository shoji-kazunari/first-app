// 第54号機: ｅワールドダイスター（2026年 Daito スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_worlddaistar/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・ワールド
// ダイスターRUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/159.9）の振り分け:
//   ・大当り(約710個)→通常（時短なし）：75.0%
//   ・大当り(約710個)→ワールドダイスターRUSH(ST7回)：25.0%
// 電チュー入賞時（特図2・RUSH中、大当り確率1/3.5）の振り分け:
//   ・大当り(約300個)→RUSH継続：90.0%
//   ・大当り(約5050個＝1500個+710個×5)→RUSH継続：10.0%
// （RUSHは規定回数（7回）を全弾外すと通常へ。継続率約91%は、素の
// 1-(1-1/3.5)^7≈90.5%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【ラウンド数（rounds）について】
// メインのスペック表に「ラウンド数」の記載は無いが、個別解説の「2R大当たり」
// セクションに、RUSH中90%の約300個(実獲得280個)は明確に「ラウンド数：2ラウンド」
// と書かれている。300個÷2R＝150個/ラウンド（10カウント×賞球15）が、この台の
// アタッカー1ラウンドあたりの基準値と考えられる（依頼者の指摘の通り、1台の中で
// アタッカーの戻しが変わることは通常無い）。
// この150個/ラウンドで他の当りも検算すると:
//   ・RUSH中の5050個の内訳として明記されている「1500個」は 1500÷150＝10R と
//     割り切れる（1500個は「10R」の当りだったと考えられる）
//   ・通常時BONUSの約710個は 710÷150≈4.73 で、最も近い整数は5R
//     （5R×150＝750個。「約710個」との差は実戦でのカウント時間切れ等による
//     ばらつきの範囲と判断した）
// 以上から、通常時BONUS（約710個）は5R、RUSH中10%の超演激ワールドダイスター
// BONUS5050（約5050個＝1500個(10R)+710個×5(5R×5)＝合計35R）はrounds:35として
// 実装した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（約710個/実獲得660個、約300個/実獲得280個、
// 約5050個/実獲得4700個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-worlddaistar",
  slug: "e-worlddaistar",
  name: "ｅワールドダイスター",
  nameKana: "いーわーるどだいすたー",
  aliases: ["ワールドダイスター", "eワールドダイスター", "ワールドダイスターパチンコ"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/159.9",
    "ワールドダイスターRUSH中の当選確率：1/3.5",
    "ワールドダイスターRUSH：ST7回、継続率約91%",
    "RUSH突入率：25%",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約660個で通常のままが75.0%、5R・実獲得約660個でRUSHが25.0%",
    "RUSH中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続が90.0%、35R・実獲得約4700個（1500個+710個×5）で継続が10.0%",
    "RUSHは規定回数（7回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 159.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 5, balls: 660, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.25,
            rounds: 5,
            balls: 660,
            nextState: "rush",
            tag: "toRush",
            resultNote: "ワールドダイスターRUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "ワールドダイスターRUSH",
      mode: "countDown",
      maxAttempts: 7,
      probability: 1 / 3.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.9, rounds: 2, balls: 280, nextState: "rush", tag: "continue300" },
          {
            weight: 0.1,
            rounds: 35,
            balls: 4700,
            nextState: "rush",
            tag: "continue5050",
            resultNote: "1500個(10R)+710個×5(5R×5)",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ワールドダイスターRUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 5: 660, 35: 4700 },
});
