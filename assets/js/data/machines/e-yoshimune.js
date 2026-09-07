// 第73号機: e吉宗 極乗3000ver.（2026年 Daito（大都技研） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_yoshimune/）。大当り振り分けは、同ページに
// 掲載されている2枚の円グラフ画像（通常時・振舞RUSH中）をダウンロードしてReadツールで
// 直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/199.9）の振り分け:
//   ・5R大当り(約750個/実獲得700個)→通常（時短なし）：70.0%
//   ・5R大当り(約750個)→振舞RUSH(ST157回)へ：30.0%
// 振舞RUSH中（特図2・電チュー入賞時、当選確率1/99.5）の振り分け:
//   ・2R大当り(約300個/実獲得280個)→継続：50.0%
//   ・5R大当り×4+α(約3000個+α/実獲得2800個+α)→継続：50.0%
// （継続率約80%は、素の1-(1-1/99.5)^157≈79.5%とほぼ完全に一致するため、残保留等の
// 引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【「5R大当り×4+α」の「+α」は未実装】
// 上振れ分の発生条件・確率が1geki.jp上に記載されておらず、実獲得2800個を基本値
// として採用した（e-berserk-muso2-dekasuta.js等と同種の簡略化）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（5R: 約750個/実獲得700個、
// 2R: 約300個/実獲得280個、比率いずれも14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-yoshimune",
  slug: "e-yoshimune",
  name: "e吉宗 極乗3000ver.",
  nameKana: "いーよしむねごくのりさんぜんばー",
  aliases: ["吉宗パチンコ", "極乗3000", "e吉宗", "吉宗極乗"],
  manufacturer: { id: "daito", name: "Daito（大都技研）" },
  releaseYear: 2026,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.9",
    "振舞RUSH中の当選確率：1/99.5",
    "振舞RUSH：ST157回、継続率約80%",
    "RUSH突入率：30%",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約700個で通常のままが70.0%、5R・実獲得約700個で振舞RUSHへが30.0%",
    "振舞RUSH中の当選振り分け：2R・実獲得約280個で継続が50.0%、5R×4・実獲得約2800個で継続が50.0%",
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
          { weight: 0.7, rounds: 5, balls: 700, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.3,
            rounds: 5,
            balls: 700,
            nextState: "furumaiRush",
            tag: "toRush",
            resultNote: "振舞RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    furumaiRush: {
      id: "furumaiRush",
      label: "振舞RUSH",
      mode: "countDown",
      maxAttempts: 157,
      probability: 1 / 99.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 280, nextState: "furumaiRush", tag: "continue2r" },
          {
            weight: 0.5,
            rounds: 5,
            displayRounds: 20,
            balls: 2800,
            nextState: "furumaiRush",
            tag: "continue20r",
            resultNote: "5R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "振舞RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 5: 700, 2: 280 },
});
