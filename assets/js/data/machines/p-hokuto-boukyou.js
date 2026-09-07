// 第76号機: P北斗の拳 暴凶星（2023年 Sammy（サミー） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_hokuto_boukyou/）。既存のe-hokuto11-boukyou.js
// （e北斗の拳11 暴凶星、後継機）とは型式・確率とも異なる別機種。大当り振り分けは、
// 同ページに掲載されている「当選時の振り分け」のテキスト表（円グラフではなく数値表）
// から直接読み取った。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.7）の振り分け:
//   ・10R大当り×2回以上(約3000個以上/実獲得2800個)→拳王RUSH(時短10回+残保留4個)へ：5.0%
//   ・10R大当り(約1500個/実獲得1400個)→拳王RUSH(時短10回+残保留4個)へ：55.0%
//   ・10R大当り(約1500個)→通常時：40.0%
// （5.0%+55.0%＝60.0%が「RUSH突入率60%」と一致する）
// 拳王RUSH中（特図2・電チュー入賞時、当選確率1/10.7＝大当り+小当り合算）の振り分け:
//   ・10R大当り×2回以上(約3000個以上/実獲得2800個)→拳王RUSH継続：約50.1%
//   ・10R大当り(約1500個)→拳王RUSH継続：約30.6%
//   ・2R大当り(約200個/実獲得186個、2R目はショート開放)→拳王RUSH継続：約19.3%
// （継続率約75%は、素の1-(1-1/10.7)^14≈74.7%とほぼ完全に一致するため、「時短10回+
// 残保留4個」をそのままmaxAttempts=14としたシンプルな規定回数countDownで再現できる）
//
// 【「特闘」（黒王号カットイン経由、最大約9000個）は未実装】
// 発生条件・発生率が1geki.jp上に具体的な数値で記載されておらず、この上振れ演出は
// 実装せず、通常の10R大当り(約1500個)を基本値として採用した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約200個/実獲得186個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-hokuto-boukyou",
  slug: "p-hokuto-boukyou",
  name: "P北斗の拳 暴凶星",
  nameKana: "ぴーほくとのけんぼうきょうせい",
  aliases: ["北斗の拳暴凶星", "拳王RUSH", "P北斗の拳", "北斗の拳パチンコ暴凶星"],
  manufacturer: { id: "sammy", name: "Sammy（サミー）" },
  releaseYear: 2023,
  category: "パチンコ（ミドル・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.7",
    "拳王RUSH中の当選確率：1/10.7（大当り+小当り合算）",
    "拳王RUSH：時短10回+残保留4個、継続率約75%",
    "RUSH突入率：60%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R×2以上・実獲得約2800個で拳王RUSHへが5.0%、10R・実獲得約1400個で拳王RUSHへが55.0%、10R・実獲得約1400個で通常のままが40.0%",
    "拳王RUSH中の当選振り分け：10R×2以上・実獲得約2800個で継続が約50.1%、10R・実獲得約1400個で継続が約30.6%、2R・実獲得約186個で継続が約19.3%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.05,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kenoRush",
            tag: "toRushBig",
            resultNote: "拳王RUSH",
          },
          {
            weight: 0.55,
            rounds: 10,
            balls: 1400,
            nextState: "kenoRush",
            tag: "toRush",
            resultNote: "拳王RUSH",
          },
          { weight: 0.4, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
        ],
      },
      onExhausted: null,
    },

    kenoRush: {
      id: "kenoRush",
      label: "拳王RUSH",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 10.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.501,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kenoRush",
            tag: "continueBig",
          },
          { weight: 0.306, rounds: 10, balls: 1400, nextState: "kenoRush", tag: "continue10r" },
          { weight: 0.193, rounds: 2, balls: 186, nextState: "kenoRush", tag: "continue2r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "拳王RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 186 },
});
