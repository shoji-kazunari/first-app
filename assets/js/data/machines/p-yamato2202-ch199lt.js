// 第90号機: P 宇宙戦艦ヤマト 2202 超波動 森雪 199LT ver.（2025年 ビスティ ライトミドル/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_yamato2202_ch199lt/）。大当り振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（通常時・真波動RUSH中）をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/199.9）の振り分け:
//   ・10R大当り(約1500個/実獲得1400個)→通常（時短なし）：約75%
//   ・10R大当り(約1500個)→真波動RUSH(ST144回+リザルト消化4回)へ：約25%
// 真波動RUSH中（特図2・電チュー入賞時、当選確率約1/93.9）の振り分け:
//   ・STリセット(出玉無し)→継続：約13%
//   ・2R大当り(約300個/実獲得280個)→継続：約12%
//   ・10R大当り(約1500個)→継続：約40%
//   ・10R×2大当り(約3000個/実獲得2800個)→継続：約35%
// （継続率約80%は、素の1-(1-1/93.9)^148≈79.5%とほぼ完全に一致するため、
// 「規定回数（144回）+リザルト消化4回」をmaxAttempts=148としたシンプルな
// countDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、いずれも比率14/15）。10R×2も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-yamato2202-ch199lt",
  slug: "p-yamato2202-ch199lt",
  name: "P 宇宙戦艦ヤマト 2202 超波動 森雪 199LT ver.",
  nameKana: "ぴーうちゅうせんかんやまとにーにーまるにちょうはどうもりゆきひゃくきゅうじゅうきゅうえるてぃーばー",
  aliases: ["宇宙戦艦ヤマト2202パチンコ", "ヤマト2202森雪199", "真波動RUSH", "宇宙戦艦ヤマト森雪"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2025,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/199.9",
    "真波動RUSH中の当選確率：約1/93.9",
    "真波動RUSH：ST144回+リザルト消化4回、継続率約80%",
    "RUSH突入率：約25%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが約75%、10R・実獲得約1400個で真波動RUSHへが約25%",
    "真波動RUSH中の当選振り分け：STリセットで継続が約13%、2R・実獲得約280個で継続が約12%、10R・実獲得約1400個で継続が約40%、10R×2・実獲得約2800個で継続が約35%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.25,
            rounds: 10,
            balls: 1400,
            nextState: "shinhadouRush",
            tag: "toRush",
            resultNote: "真波動RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    shinhadouRush: {
      id: "shinhadouRush",
      label: "真波動RUSH",
      mode: "countDown",
      maxAttempts: 148,
      probability: 1 / 93.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.13, rounds: 1, balls: 0, nextState: "shinhadouRush", tag: "stReset" },
          { weight: 0.12, rounds: 2, balls: 280, nextState: "shinhadouRush", tag: "continue2r" },
          { weight: 0.4, rounds: 10, balls: 1400, nextState: "shinhadouRush", tag: "continue10r" },
          {
            weight: 0.35,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "shinhadouRush",
            tag: "continue20r",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "真波動RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
