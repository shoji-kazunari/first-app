// 第82号機: Pクイーンズブレイド4 ナナエルver.（2025年 TAKAO（高尾） 甘デジ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_queensblade4_99/）。大当り振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（通常時・RUSH中）をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/99.9）の振り分け:
//   ・4R大当り(約360個/実獲得320個)→通常（時短なし）：49.5%
//   ・4R大当り(約360個)→RUSH(ST60回+残存保留4個)へ：45.5%
//   ・10R大当り(約900個/実獲得800個)→RUSH(ST60回+残存保留4個)へ：5.0%
// （45.5%+5.0%＝50.5%が「RUSH突入率50.5%」と一致する）
// RUSH中（特図2・電チュー入賞時、当選確率約1/39.6＝大当り+小当り合算）の振り分け:
//   ・3R大当り(約270個/実獲得240個)→継続：49.5%
//   ・10R大当り(約900個)→継続：50.5%
// （継続率約81%は、素の1-(1-1/39.6)^60≈78.4%に残存保留4個込みの
// 1-(1-1/39.6)^64≈80.5%を加えるとほぼ一致するため、「規定回数+残存保留4個」を
// maxAttemptsに直接足し込むだけのシンプルなcountDownで再現できる（60+4=64）。
// 「初当り含む3連達成で消化速度がアップ」は演出面の変化のみで出玉には影響しない
// ため実装していない）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約900個/実獲得800個、
// 4R: 約360個/実獲得320個、3R: 約270個/実獲得240個。いずれも比率8/9）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-queensblade4-99",
  slug: "p-queensblade4-99",
  name: "Pクイーンズブレイド4 ナナエルver.",
  nameKana: "ぴーくいーんずぶれいどふぉーななえるばー",
  aliases: ["クイーンズブレイド4", "クイブレ4ナナエル", "Pクイーンズブレイド4", "クイーンズブレイドナナエル"],
  manufacturer: { id: "takao", name: "TAKAO（高尾）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "RUSH中の当選確率：約1/39.6（大当り+小当り合算）",
    "RUSH：ST60回+残存保留4個、継続率約81%",
    "RUSH突入率：50.5%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約320個で通常のままが49.5%、4R・実獲得約320個でRUSHへが45.5%、10R・実獲得約800個でRUSHへが5.0%",
    "RUSH中の当選振り分け：3R・実獲得約240個で継続が49.5%、10R・実獲得約800個で継続が50.5%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.495, rounds: 4, balls: 320, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.455,
            rounds: 4,
            balls: 320,
            nextState: "rush",
            tag: "toRush4r",
            resultNote: "RUSH",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 800,
            nextState: "rush",
            tag: "toRush10r",
            resultNote: "RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 64,
      probability: 1 / 39.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.495, rounds: 3, balls: 240, nextState: "rush", tag: "continue3r" },
          { weight: 0.505, rounds: 10, balls: 800, nextState: "rush", tag: "continue10r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 800, 4: 320, 3: 240 },
});
