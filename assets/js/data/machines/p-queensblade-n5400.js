// 第81号機: P クイーンズブレイド奈落5400（2025年 TAKAO（高尾） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_queensblade_n5400/）。大当り振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（図柄揃い時・QUEEN'S BLADE中）から
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の当選は、図柄揃い（大当り確率1/199.8）と聖乳チャージ
// （約1/533.9、当選時は約300個の出玉獲得のみでQUEEN'S BLADEへは進まない）の
// 2種類がある。両者を合算した確率は 1/199.8+1/533.9 ≈ 1/145.4 となり、そのうち
// 図柄揃いが約72.8%、聖乳チャージが約27.2%を占める。
// 図柄揃い時（円グラフ「図柄揃い時」）の振り分け:
//   ・9R大当り(約1350個/実獲得1260個)→通常（時短なし）：49.5%
//   ・9R大当り(約1350個)→QUEEN'S BLADE(時短1回)へ：50.5%
// QUEEN'S BLADE中（「時短1回」の即時解決する演出、円グラフ「QUEEN'S BLADE中」）の振り分け:
//   ・9R大当り(約1350個)→通常（時短なし）：49.5%
//   ・9R×4大当り(約5400個/実獲得5040個)→QUEEN'S BLADE継続：50.5%
// （QUEEN'S BLADEは「1回の時短状態」であり、抽選回数のcountDownではなく、
// e-accelerator-saikyo.jsのsaikyoJudgmentと同じ「probability:1、mode:countUp」の
// 即時解決する状態として実装した。「小当たり時、V入賞しなかった場合大当たりが
// 発生せず、電サポが終了する可能性あり」という記載があるが、V入賞の成功率が
// 1geki.jp上に具体的な数値で記載されていないため、この失敗パターンは実装せず、
// 円グラフの49.5%/50.5%（＝V入賞成功が前提の内訳）をそのまま採用した）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（9R: 約1350個/実獲得1260個、
// 2R: 約300個/実獲得280個、いずれも比率14/15）。9R×4も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-queensblade-n5400",
  slug: "p-queensblade-n5400",
  name: "P クイーンズブレイド奈落5400",
  nameKana: "ぴーくいーんずぶれいどならくごせんよんひゃく",
  aliases: ["クイーンズブレイド奈落", "クイーンズブレイドパチンコ", "QUEEN'S BLADE", "クイブレ奈落5400"],
  manufacturer: { id: "takao", name: "TAKAO（高尾）" },
  releaseYear: 2025,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時当選確率：約1/145.4（図柄揃い1/199.8と聖乳チャージ約1/533.9の合算値）",
    "QUEEN'S BLADE：時短1回の即時解決演出、継続率50.5%",
    "図柄揃い時の振り分け：9R・実獲得約1260個で通常のままが49.5%、9R・実獲得約1260個でQUEEN'S BLADEへが50.5%",
    "聖乳チャージ当選時：2R・実獲得約280個（QUEEN'S BLADEへは進まない）",
    "QUEEN'S BLADE中の振り分け：9R・実獲得約1260個で通常へが49.5%、9R×4・実獲得約5040個で継続が50.5%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 145.4,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3602, rounds: 9, balls: 1260, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.3675,
            rounds: 9,
            balls: 1260,
            nextState: "queensBlade",
            tag: "toQueensBlade",
            resultNote: "QUEEN'S BLADE",
          },
          {
            weight: 0.2723,
            rounds: 2,
            balls: 280,
            nextState: "normal",
            tag: "seinyuuCharge",
            resultNote: "聖乳チャージ",
          },
        ],
      },
      onExhausted: null,
    },

    queensBlade: {
      id: "queensBlade",
      label: "QUEEN'S BLADE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.495,
            rounds: 9,
            balls: 1260,
            nextState: "normal",
            tag: "end",
            resultNote: "通常へ",
          },
          {
            weight: 0.505,
            rounds: 9,
            displayRounds: 36,
            balls: 5040,
            nextState: "queensBlade",
            tag: "continue",
            resultNote: "QUEEN'S BLADE継続",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 9: 1260, 2: 280 },
});
