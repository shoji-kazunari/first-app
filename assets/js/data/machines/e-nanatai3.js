// 第12号機: e 七つの大罪3（2026年 GINZA スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_nanatai3/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・3R大当り(約450個)→SEVEN RUSHチャレンジ(時短100回)：100%
// 電チュー入賞時（特図2・SEVEN RUSHチャレンジ中/SEVEN RUSH中）の振り分け
// （円グラフは「右打ち中」1枚のみで、チャレンジ中・RUSH中で共通の表として実装）:
//   ・10R大当り(約1500個)→通常（時短なし）：25.0%
//   ・10R大当り(約1500個)→SEVEN RUSH継続：2.2%
//   ・PERFECT BONUS(約2700〜7500個)→SEVEN RUSH継続：72.8%
//     （内訳は3枚目の円グラフより 2700個55.5%・3900個33.1%・5100個9.8%・
//     6300個1.5%・7500個0.1%）
//
// 【チャレンジとRUSHで同じ振り分け表を使った理由】
// 1geki.jpはヘソ入賞時（通常）・電チュー入賞時（右打ち中）の2種類の円グラフしか
// 公開しておらず、「SEVEN RUSHチャレンジ中」専用の振り分け表は存在しない。
// スペック表の「SEVEN RUSH突入率約40%」は、チャレンジ（時短100回・大当たり確率
// 約1/196.2）の間に一度でも当選する確率 1-(1-1/196.2)^100≈39.4% とほぼ一致し、
// 「SEVEN RUSH継続率約75%」は「右打ち中」円グラフの継続側（2.2%+72.8%=75.0%）と
// 完全一致する。この2つの数値がそれぞれ独立に裏取りできることから、チャレンジ中の
// 当選も右打ち中と同じ振り分け表を共有していると判断して実装した
// （チャレンジの「突入率」は、チャレンジ窓の間に当選できたかどうかだけを指し、
// その当選が振り分け表のどの枝に転んだかは別、という理解）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の比率（10R: 約1500個/実獲得1400個、3R: 約450個/実獲得420個、
// 比率14/15）を、明記の無いPERFECT BONUS各段にもそのまま適用した
// （2700→2520、3900→3640、5100→4760、6300→5880、7500→7000）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-nanatai3",
  slug: "e-nanatai3",
  name: "e 七つの大罪3",
  nameKana: "いーななつのたいざいすりー",
  aliases: ["七つの大罪", "ななつのたいざい", "七つの大罪3", "七つの大罪パチンコ"],
  manufacturer: { id: "ginza", name: "GINZA" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/319.7",
    "SEVEN RUSHチャレンジ中の当選確率：約1/196.2（時短100回）",
    "SEVEN RUSH中の当選確率：約1/1（実質毎回当選）",
    "SEVEN RUSH突入率：約40%（チャレンジ100回の間に当選できる確率）",
    "SEVEN RUSH継続率：約75%",
    "通常時の大当たり振り分け（ヘソ入賞時）：3R・実獲得約420個で必ずSEVEN RUSHチャレンジ(時短100回)へ",
    "SEVEN RUSHチャレンジ中・SEVEN RUSH中の当選振り分け（電チュー入賞時、共通）：10R・実獲得約1400個で通常へ戻るが25.0%、10R・実獲得約1400個で継続が2.2%、PERFECT BONUS（実獲得約2520〜7000個）で継続が72.8%",
    "SEVEN RUSHチャレンジは規定回数（100回）を全弾外すと通常へ",
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
        outcomes: [{ weight: 1, rounds: 3, balls: 420, nextState: "challenge", tag: "toChallenge" }],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "SEVEN RUSHチャレンジ",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 196.2,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 10, balls: 1400, nextState: "normal", tag: "challengeBust" },
          { weight: 0.022, rounds: 10, balls: 1400, nextState: "rush", tag: "challengeToRush" },
          {
            weight: 0.40404,
            rounds: 10,
            balls: 2520,
            nextState: "rush",
            tag: "perfectBonus2700",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.240968,
            rounds: 10,
            balls: 3640,
            nextState: "rush",
            tag: "perfectBonus3900",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.071344,
            rounds: 10,
            balls: 4760,
            nextState: "rush",
            tag: "perfectBonus5100",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.01092,
            rounds: 10,
            balls: 5880,
            nextState: "rush",
            tag: "perfectBonus6300",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.000728,
            rounds: 10,
            balls: 7000,
            nextState: "rush",
            tag: "perfectBonus7500",
            resultNote: "PERFECT BONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "SEVEN RUSHチャレンジ終了" },
    },

    rush: {
      id: "rush",
      label: "SEVEN RUSH",
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
          { weight: 0.25, rounds: 10, balls: 1400, nextState: "normal", tag: "rushEnd" },
          { weight: 0.022, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinuePlain" },
          {
            weight: 0.40404,
            rounds: 10,
            balls: 2520,
            nextState: "rush",
            tag: "rushPerfectBonus2700",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.240968,
            rounds: 10,
            balls: 3640,
            nextState: "rush",
            tag: "rushPerfectBonus3900",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.071344,
            rounds: 10,
            balls: 4760,
            nextState: "rush",
            tag: "rushPerfectBonus5100",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.01092,
            rounds: 10,
            balls: 5880,
            nextState: "rush",
            tag: "rushPerfectBonus6300",
            resultNote: "PERFECT BONUS",
          },
          {
            weight: 0.000728,
            rounds: 10,
            balls: 7000,
            nextState: "rush",
            tag: "rushPerfectBonus7500",
            resultNote: "PERFECT BONUS",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  // 3R=420個、10R=1400個が代表値。PERFECT BONUS各段は各onHit.outcomesのballsで上書きする。
  payoutTable: { 3: 420, 10: 1400 },
});
