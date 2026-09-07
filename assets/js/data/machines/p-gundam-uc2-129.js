// 第92号機: Pフィーバー機動戦士ガンダムユニコーン再来 129ver.（2025年 SANKYO（三共） ライト/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_gundam_uc2_129/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・覚醒HYPER／ST最終回転／残保留・
// 超覚醒HYPER中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/129.8）の振り分け:
//   ・3R大当り(約300個/実獲得270個)→通常（時短なし）：約49%
//   ・3R大当り(約300個)→覚醒HYPER(ST60回+残保留4個)へ：約51%
// 覚醒HYPER中（特図2・電チュー入賞時、当選確率1/40.6）の振り分け:
//   ・7R大当り(約700個/実獲得630個)→継続：約96%
//   ・7R×2大当り(約1400個/実獲得1260個)→超覚醒HYPER(LT、ST100回+残保留4個)へ：約4%
// 超覚醒HYPER中（特図2・電チュー入賞時、当選確率1/40.6）の振り分け:
//   ・7R大当り(約700個)→継続：100%
// （覚醒HYPER継続率約80%は、素の1-(1-1/40.6)^64≈79.7%とほぼ完全に一致し、
// 超覚醒HYPER継続率約93%も、素の1-(1-1/40.6)^104≈92.5%とほぼ完全に一致する
// ため、いずれも「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけの
// シンプルな規定回数countDownで再現できる（60+4=64、100+4=104））
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（7R: 約700個/実獲得630個、
// 3R: 約300個/実獲得270個、いずれも比率9/10）。7R×2も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-gundam-uc2-129",
  slug: "p-gundam-uc2-129",
  name: "Pフィーバー機動戦士ガンダムユニコーン再来 129ver.",
  nameKana: "ぴーふぃーばーきどうせんしがんだむゆにこーんさいらいひゃくにじゅうきゅうばー",
  aliases: ["ガンダムユニコーン再来129", "ユニコーン129", "覚醒HYPER", "超覚醒HYPER"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2025,
  category: "パチンコ（ライト・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：1/129.8",
    "覚醒HYPER・超覚醒HYPER中の当選確率：1/40.6",
    "覚醒HYPER：ST60回+残保留4個、継続率約80%",
    "超覚醒HYPER（LT）：ST100回+残保留4個、継続率約93%",
    "覚醒HYPER突入率：約51%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約270個で通常のままが約49%、3R・実獲得約270個で覚醒HYPERへが約51%",
    "覚醒HYPER中の当選振り分け：7R・実獲得約630個で継続が約96%、7R×2・実獲得約1260個で超覚醒HYPERへが約4%",
    "超覚醒HYPER中の当選振り分け：7R・実獲得約630個で継続が100%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 129.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 3, balls: 270, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.51,
            rounds: 3,
            balls: 270,
            nextState: "kakuseiHyper",
            tag: "toHyper",
            resultNote: "覚醒HYPER",
          },
        ],
      },
      onExhausted: null,
    },

    kakuseiHyper: {
      id: "kakuseiHyper",
      label: "覚醒HYPER",
      mode: "countDown",
      maxAttempts: 64,
      probability: 1 / 40.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.96, rounds: 7, balls: 630, nextState: "kakuseiHyper", tag: "continue" },
          {
            weight: 0.04,
            rounds: 7,
            displayRounds: 14,
            balls: 1260,
            nextState: "choKakuseiHyper",
            tag: "toChoHyper",
            resultNote: "超覚醒HYPER",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hyperEnd", resultLabel: "覚醒HYPER終了" },
    },

    choKakuseiHyper: {
      id: "choKakuseiHyper",
      label: "超覚醒HYPER",
      mode: "countDown",
      maxAttempts: 104,
      probability: 1 / 40.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 7, balls: 630, nextState: "choKakuseiHyper", tag: "continue" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "choHyperEnd", resultLabel: "超覚醒HYPER終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 7: 630, 3: 270 },
});
