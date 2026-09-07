// 第95号機: P 百花繚乱 ご奉仕129ver.（2024年 D-light（ディ・ライト） ライト/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_hyakkaryouran129/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・ST中（図柄揃い時）・忠chu乱舞
// BONUS期待値）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/129.8）の振り分け:
//   ・3R大当り(約300個/実獲得270個)→通常（0回）：約24.5%
//   ・3R大当り(約300個)→ST(初回、70回)へ：約75.5%
// ST中（特図2・電チュー入賞時、円グラフ「ST中（図柄揃い時）」）の振り分け（ST初回・
// ST上位で共通の比率だが、当選確率自体は初回1/101.1、上位1/50.8と異なる）:
//   ・実質10R大当り(約1000個/実獲得900個)→継続：約46.4%
//   ・忠chu乱舞BONUS(実質10R×2回、約2000個/実獲得1800個)→ST(上位)へ：約53.6%
// 忠chu乱舞BONUS期待値（円グラフ「忠chu乱舞BONUS期待値」）:
//   ・実質10R×2回(約2000個)：約46.4%　・×3回(約3000個)：約24.9%
//   ・×4回(約4000個)：約13.3%　・×5回以上(約5000個OVER)：約15.4%
// （この4区分は、基本の×2回に加えて確率pでループする幾何分布と完全に一致する
// （p=0.536として、P(=2)=1-p≈46.4%、P(=3)=p(1-p)≈24.9%、P(=4)=p²(1-p)≈13.3%、
// P(≥5)=p³≈15.4%）。そのためbonusLoop（probability:0.536, balls:900）で
// 実装した。ST(初回)継続率約50.1%は、素の1-(1-1/101.1)^70≈50.1%と完全に一致し、
// ST(上位)継続率約75.1%も、素の1-(1-1/50.8)^70≈75.1%と完全に一致するため、
// 「ST回数リセットを含む」というST70回のシンプルなcountDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（実質10R: 約1000個/実獲得900個、
// 3R: 約300個/実獲得270個、いずれも比率9/10）。忠chu乱舞BONUSも同じ比率で
// 換算した（2000個→1800個、以降+1000個ごとに+900個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-hyakkaryouran129",
  slug: "p-hyakkaryouran129",
  name: "P 百花繚乱 ご奉仕129ver.",
  nameKana: "ぴーひゃっかりょうらんごほうしひゃくにじゅうきゅうばー",
  aliases: ["百花繚乱パチンコ", "百花繚乱ご奉仕", "忠chu乱舞BONUS", "P百花繚乱129"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2024,
  category: "パチンコ（ライト・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/129.8",
    "ST（初回）中の当選確率：約1/101.1",
    "ST（上位）中の当選確率：約1/50.8",
    "ST：70回、初回継続率約50.1%、上位継続率約75.1%",
    "ST突入率：約75.5%",
    "忠chu乱舞BONUS突入率：約53.6%（実質10R×2回以上、以降約53.6%でループ加算）",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約270個で通常のままが約24.5%、3R・実獲得約270個でSTへが約75.5%",
    "ST中の当選振り分け：実質10R・実獲得約900個で継続が約46.4%、忠chu乱舞BONUS・実獲得約1800個でST上位へが約53.6%",
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
          { weight: 0.245, rounds: 3, balls: 270, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.755,
            rounds: 3,
            balls: 270,
            nextState: "stInitial",
            tag: "toSt",
            resultNote: "ST",
          },
        ],
      },
      onExhausted: null,
    },

    stInitial: {
      id: "stInitial",
      label: "ST（初回）",
      mode: "countDown",
      maxAttempts: 70,
      probability: 1 / 101.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.464, rounds: 10, balls: 900, nextState: "stInitial", tag: "continue" },
          {
            weight: 0.536,
            rounds: 10,
            displayRounds: 20,
            balls: 1800,
            nextState: "stUpper",
            tag: "toBonus",
            resultNote: "忠chu乱舞BONUS、ST（上位）",
            bonusLoop: { probability: 0.536, balls: 900 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stInitialEnd", resultLabel: "ST終了" },
    },

    stUpper: {
      id: "stUpper",
      label: "ST（上位）",
      mode: "countDown",
      maxAttempts: 70,
      probability: 1 / 50.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.464, rounds: 10, balls: 900, nextState: "stUpper", tag: "continue" },
          {
            weight: 0.536,
            rounds: 10,
            displayRounds: 20,
            balls: 1800,
            nextState: "stUpper",
            tag: "continueBonus",
            resultNote: "忠chu乱舞BONUS",
            bonusLoop: { probability: 0.536, balls: 900 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stUpperEnd", resultLabel: "ST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 3: 270 },
});
