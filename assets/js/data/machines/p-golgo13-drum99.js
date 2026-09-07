// 第101号機: Pドラムゴルゴ13sY（2019年 SANKYO（三共） ライトミドル/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_golgo13_drum99/）。スペック表・
// 「大当り時の振り分け」表（円グラフではなく通常の表組み）に記載の実数値をそのまま使用。
//
// 通常時（特図1・ヘソ入賞時、大当り確率1/99.9）の大当り振り分け:
//   ・10R確変(約678個/実獲得587個)→時短1回+残保留4個の抽選へ：75.8%
//   ・4R確変(約246個/実獲得209個)→時短1回+残保留4個の抽選へ：24.2%
// （この「時短1回+残保留4個」の5回抽選＝確率1/10.6での判定を経て
// スナイパーRUSHへ突入するかが決まる。公表の「スナイパーRUSH突入率約39.1%」は、
// 素の1-(1-1/10.6)^5≈39.0%とほぼ完全に一致するため、maxAttempts:5の
// countDown状態として再現した）
// スナイパーRUSH確定後（特図2・電チュー入賞時、確率1/10.6）の当選振り分けも
// ヘソ入賞時と同じ75.8%/24.2%の内訳で、当選のたび「時短10回+残保留4個」の
// 14回抽選に更新される。公表の「スナイパーRUSH継続率約75.0%」は、
// 素の1-(1-1/10.6)^14≈75.0%とほぼ完全に一致するため、maxAttempts:14の
// countDown状態として再現した
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約678個/実獲得587個、
// 4R: 約246個/実獲得209個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-golgo13-drum99",
  slug: "p-golgo13-drum99",
  name: "Pドラムゴルゴ13sY",
  nameKana: "ぴーどらむごるごじゅうさんえすわい",
  aliases: ["ドラムゴルゴ13パチンコ", "ゴルゴ13パチンコ", "スナイパーRUSH"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2019,
  category: "パチンコ（ライトミドル・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "スナイパーRUSH確定後の当選確率：1/10.6",
    "スナイパーRUSH突入判定：時短1回+残保留4個（計5回）、突入率約39.1%",
    "スナイパーRUSH：時短10回+残保留4個（計14回）、継続率約75.0%",
    "大当り振り分け（ヘソ入賞時・電チュー入賞時で共通）：10R・実獲得約587個が75.8%、4R・実獲得約209個が24.2%",
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
          { weight: 0.758, rounds: 10, balls: 587, nextState: "sniperChance", tag: "toChance10r", resultNote: "スナイパーRUSH突入判定" },
          { weight: 0.242, rounds: 4, balls: 209, nextState: "sniperChance", tag: "toChance4r", resultNote: "スナイパーRUSH突入判定" },
        ],
      },
      onExhausted: null,
    },

    sniperChance: {
      id: "sniperChance",
      label: "スナイパーRUSH突入判定",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 10.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.758, rounds: 10, balls: 587, nextState: "sniperRush", tag: "toRush10r", resultNote: "スナイパーRUSH" },
          { weight: 0.242, rounds: 4, balls: 209, nextState: "sniperRush", tag: "toRush4r", resultNote: "スナイパーRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceFail", resultLabel: "スナイパーRUSH突入ならず" },
    },

    sniperRush: {
      id: "sniperRush",
      label: "スナイパーRUSH",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 10.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.758, rounds: 10, balls: 587, nextState: "sniperRush", tag: "continue10r" },
          { weight: 0.242, rounds: 4, balls: 209, nextState: "sniperRush", tag: "continue4r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "スナイパーRUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 587, 4: 209 },
});
