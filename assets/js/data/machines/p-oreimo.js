// 第85号機: P俺の妹がこんなに可愛いわけがない。（2025年 KYORAKU（京楽） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_oreimo/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・運命の審判／RUSH中・上位RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/199.9）の振り分け:
//   ・2R大当り(約300個/実獲得280個)→運命の審判(ST41回+残保留4個)へ：100%
// 運命の審判・RUSH中で共通の振り分け（円グラフ「運命の審判／RUSH中」、特図2・
// 電チュー入賞時、当選確率1/66.1）:
//   ・2R大当り(約300個)：25.0%　・4R大当り(約600個/実獲得560個)：25.0%
//   ・6R大当り(約900個/実獲得840個)：25.0%　・8R大当り(約1200個/実獲得1120個)：15.0%
//   ・8R大当り(約1200個)→上位RUSHへ：10.0%
// （運命の審判からのヒットは初回RUSH(ST100回+残保留4個)へ、RUSH自身のヒットは
// RUSH継続へ、それぞれ90%側の4パターンが対応し、残り10%は上位RUSHへ格上げされる）
// 上位RUSH中（円グラフ「上位RUSH中」、特図2・電チュー入賞時、当選確率1/66.1）の振り分け:
//   ・2R/4R/6R/8R(15%)大当り→上位RUSH(ST151回+残保留4個)継続：90.0%
//   ・8R大当り(約1200個)→上位RUSH(次回まで、無期限)へ：10.0%
// （運命の審判突破率約50%は、素の1-(1-1/66.1)^45≈49.6%とほぼ完全に一致し、
// RUSH継続率約80%も、素の1-(1-1/66.1)^104≈79.5%とほぼ完全に一致し、上位RUSH
// 継続率約92%も、素の1-(1-1/66.1)^155≈90.4%とほぼ一致するため、いずれも
// 「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけのシンプルなcountDownで
// 再現できる（41+4=45、100+4=104、151+4=155）。上位RUSHの「次回まで」到達後は
// mode:countUp・maxAttempts:nullの無期限状態として実装した）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（8R: 約1200個/実獲得1120個、
// 6R: 約900個/実獲得840個、4R: 約600個/実獲得560個、2R: 約300個/実獲得280個。
// いずれも比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-oreimo",
  slug: "p-oreimo",
  name: "P俺の妹がこんなに可愛いわけがない。",
  nameKana: "ぴーおれのいもうとがこんなにかわいいわけがない",
  aliases: ["俺妹", "おれいも", "俺の妹がこんなに可愛いわけがないパチンコ", "運命の審判"],
  manufacturer: { id: "kyoraku", name: "KYORAKU（京楽）" },
  releaseYear: 2025,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.9",
    "運命の審判・RUSH・上位RUSH中の当選確率：1/66.1",
    "運命の審判：ST41回+残保留4個、突破率約50%",
    "RUSH：ST100回+残保留4個、継続率約80%",
    "上位RUSH：ST151回+残保留4個 or 次回まで、継続率約92%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で運命の審判へが100%",
    "運命の審判・RUSH中の当選振り分け：2R・実獲得約280個が25.0%、4R・実獲得約560個が25.0%、6R・実獲得約840個が25.0%、8R・実獲得約1120個が15.0%、8R・実獲得約1120個で上位RUSHへが10.0%",
    "上位RUSH中の当選振り分け：2R/4R/6R/8R(15%)で継続が90.0%、8R・実獲得約1120個で次回まで（無期限）へが10.0%",
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
          {
            weight: 1,
            rounds: 2,
            balls: 280,
            nextState: "unmeiShinpan",
            tag: "toShinpan",
            resultNote: "運命の審判",
          },
        ],
      },
      onExhausted: null,
    },

    unmeiShinpan: {
      id: "unmeiShinpan",
      label: "運命の審判",
      mode: "countDown",
      maxAttempts: 45,
      probability: 1 / 66.1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 2, balls: 280, nextState: "rush", tag: "toRush2r", resultNote: "RUSH" },
          { weight: 0.25, rounds: 4, balls: 560, nextState: "rush", tag: "toRush4r", resultNote: "RUSH" },
          { weight: 0.25, rounds: 6, balls: 840, nextState: "rush", tag: "toRush6r", resultNote: "RUSH" },
          {
            weight: 0.15,
            rounds: 8,
            balls: 1120,
            nextState: "rush",
            tag: "toRush8r",
            resultNote: "RUSH",
          },
          {
            weight: 0.1,
            rounds: 8,
            balls: 1120,
            nextState: "jouiRush",
            tag: "toJoui",
            resultNote: "上位RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "shinpanEnd", resultLabel: "運命の審判終了" },
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 104,
      probability: 1 / 66.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 2, balls: 280, nextState: "rush", tag: "continue2r" },
          { weight: 0.25, rounds: 4, balls: 560, nextState: "rush", tag: "continue4r" },
          { weight: 0.25, rounds: 6, balls: 840, nextState: "rush", tag: "continue6r" },
          { weight: 0.15, rounds: 8, balls: 1120, nextState: "rush", tag: "continue8r" },
          {
            weight: 0.1,
            rounds: 8,
            balls: 1120,
            nextState: "jouiRush",
            tag: "toJoui",
            resultNote: "上位RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },

    jouiRush: {
      id: "jouiRush",
      label: "上位RUSH",
      mode: "countDown",
      maxAttempts: 155,
      probability: 1 / 66.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 2, balls: 280, nextState: "jouiRush", tag: "continue2r" },
          { weight: 0.25, rounds: 4, balls: 560, nextState: "jouiRush", tag: "continue4r" },
          { weight: 0.25, rounds: 6, balls: 840, nextState: "jouiRush", tag: "continue6r" },
          { weight: 0.15, rounds: 8, balls: 1120, nextState: "jouiRush", tag: "continue8r" },
          {
            weight: 0.1,
            rounds: 8,
            balls: 1120,
            nextState: "jouiRushInfinite",
            tag: "toInfinite",
            resultNote: "上位RUSH（次回まで）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jouiEnd", resultLabel: "上位RUSH終了" },
    },

    jouiRushInfinite: {
      id: "jouiRushInfinite",
      label: "上位RUSH（次回まで）",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 66.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 2, balls: 280, nextState: "jouiRushInfinite", tag: "continue2r" },
          { weight: 0.25, rounds: 4, balls: 560, nextState: "jouiRushInfinite", tag: "continue4r" },
          { weight: 0.25, rounds: 6, balls: 840, nextState: "jouiRushInfinite", tag: "continue6r" },
          { weight: 0.25, rounds: 8, balls: 1120, nextState: "jouiRushInfinite", tag: "continue8r" },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 8: 1120, 6: 840, 4: 560, 2: 280 },
});
