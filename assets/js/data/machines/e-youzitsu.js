// 第68号機: eようこそ実力至上主義の教室へ（2026年 SanseiR&D（サンセイR&D） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_youzitsu/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・TREASURE HUNT中・TREASURE HUNT EXTRA中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/349.9）の振り分け:
//   ・3R大当り(約450個/実獲得420個)→通常（時短なし）：約50%
//   ・3R大当り(約450個)→TREASURE HUNT(ST65回)へ：約50%
// TREASURE HUNT中（特図2・電チュー入賞時、当選確率1/94.1）の振り分け:
//   ・10R大当り×2(約3000個/実獲得2800個)→通常（時短なし）：約27%
//   ・10R大当り×2(約3000個)→TREASURE HUNT EXTRA(ST145回)へ：約73%
// TREASURE HUNT EXTRA中（特図2・電チュー入賞時、当選確率1/71.6）の振り分け:
//   ・10R大当り×2(約3000個)→通常（時短なし）：約13%
//   ・10R大当り×2(約3000個)→TREASURE HUNT EXTRA継続：約87%
// （「TREASURE HUNT ST継続率:ST中50%」は、素の1-(1-1/94.1)^65≈50.1%と完全に一致し、
// 「TREASURE HUNT EXTRA ST継続率:ST中87%」も、素の1-(1-1/71.6)^145≈87.0%と完全に
// 一致するため、いずれも残保留等の引き戻しが無いシンプルな規定回数countDownで
// 再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R×2: 約3000個/実獲得2800個、
// 3R: 約450個/実獲得420個、比率いずれも14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-youzitsu",
  slug: "e-youzitsu",
  name: "eようこそ実力至上主義の教室へ",
  nameKana: "いーようこそじつりょくしじょうしゅぎのきょうしつへ",
  aliases: ["よう実", "ようこそ実力至上主義の教室へ", "よう実パチンコ", "eよう実"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D（サンセイR&D）" },
  releaseYear: 2026,
  category: "パチンコ（スマパチ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/349.9",
    "TREASURE HUNT中の当選確率：1/94.1",
    "TREASURE HUNT EXTRA中の当選確率：1/71.6",
    "TREASURE HUNT：ST65回",
    "TREASURE HUNT EXTRA：ST145回",
    "TREASURE HUNT突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約420個で通常のままが約50%、3R・実獲得約420個でTREASURE HUNTへが約50%",
    "TREASURE HUNT中の当選振り分け：10R×2・実獲得約2800個で通常のままが約27%、10R×2・実獲得約2800個でTREASURE HUNT EXTRAへが約73%",
    "TREASURE HUNT EXTRA中の当選振り分け：10R×2・実獲得約2800個で通常のままが約13%、10R×2・実獲得約2800個で継続が約87%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 349.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 420, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 3,
            balls: 420,
            nextState: "treasureHunt",
            tag: "toTreasureHunt",
            resultNote: "TREASURE HUNT",
          },
        ],
      },
      onExhausted: null,
    },

    treasureHunt: {
      id: "treasureHunt",
      label: "TREASURE HUNT",
      mode: "countDown",
      maxAttempts: 65,
      probability: 1 / 94.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.27,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "normal",
            tag: "toNormalFromHunt",
          },
          {
            weight: 0.73,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "treasureHuntExtra",
            tag: "toExtra",
            resultNote: "TREASURE HUNT EXTRA",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "huntEnd", resultLabel: "TREASURE HUNT終了" },
    },

    treasureHuntExtra: {
      id: "treasureHuntExtra",
      label: "TREASURE HUNT EXTRA",
      mode: "countDown",
      maxAttempts: 145,
      probability: 1 / 71.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.13,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "normal",
            tag: "toNormalFromExtra",
          },
          {
            weight: 0.87,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "treasureHuntExtra",
            tag: "continue",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "extraEnd", resultLabel: "TREASURE HUNT EXTRA終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 2800, 3: 420 },
});
