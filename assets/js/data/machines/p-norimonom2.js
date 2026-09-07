// 第86号機: P乗物娘with CYBER JAPAN DANCERS 2nd season（2025年 newgin（ニューギン） ST機/ライトミドル）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_norimonom2/）。大当り振り分けは、同ページに
// 掲載されている2枚の円グラフ画像（通常時・右打ち中）をダウンロードしてReadツールで
// 直接読み取った実数値。
//
// ヘソ入賞時（特図1・2合算、通常時、大当り確率1/199.8）の振り分け:
//   ・4R大当り(約440個/実獲得400個)→乗物RUSH(ST100回)へ：72.5%
//   ・10R大当り(約1100個/実獲得1000個)→乗物RUSH(ST100回)へ：27.5%
// （72.5%+27.5%＝100%が「RUSH突入率100%」と一致する）
// 乗物RUSH中（特図2・電チュー入賞時、当選確率1/69.4）の振り分け:
//   ・4R大当り(約440個)→継続：50.0%
//   ・10R大当り(約1100個)→継続：50.0%
// （継続率約77%は、素の1-(1-1/69.4)^100≈76.6%とほぼ完全に一致するため、残保留等の
// 引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1100個/実獲得1000個、
// 4R: 約440個/実獲得400個、いずれも比率10/11）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-norimonom2",
  slug: "p-norimonom2",
  name: "P乗物娘with CYBER JAPAN DANCERS 2nd season",
  nameKana: "ぴーのりものむすめうぃずさいばーじゃぱんだんさーずせかんどしーずん",
  aliases: ["乗物娘2", "乗物娘パチンコ", "P乗物娘2", "乗物RUSH"],
  manufacturer: { id: "newgin", name: "newgin（ニューギン）" },
  releaseYear: 2025,
  category: "パチンコ（ST機・ライトミドル）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.8",
    "乗物RUSH中の当選確率：1/69.4",
    "乗物RUSH：ST100回、継続率約77%",
    "RUSH突入率：100%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約400個で乗物RUSHへが72.5%、10R・実獲得約1000個で乗物RUSHへが27.5%",
    "乗物RUSH中の当選振り分け：4R・実獲得約400個で継続が50.0%、10R・実獲得約1000個で継続が50.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.725,
            rounds: 4,
            balls: 400,
            nextState: "norimonoRush",
            tag: "toRush4r",
            resultNote: "乗物RUSH",
          },
          {
            weight: 0.275,
            rounds: 10,
            balls: 1000,
            nextState: "norimonoRush",
            tag: "toRush10r",
            resultNote: "乗物RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    norimonoRush: {
      id: "norimonoRush",
      label: "乗物RUSH",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 69.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, balls: 400, nextState: "norimonoRush", tag: "continue4r" },
          { weight: 0.5, rounds: 10, balls: 1000, nextState: "norimonoRush", tag: "continue10r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "乗物RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1000, 4: 400 },
});
