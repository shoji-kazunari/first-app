// 第102号機: eフィーバーダンジョンに出会いを求めるのは間違っているだろうか2（2025年
// SANKYO（三共） スマパチ/ライトミドル/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_danmachi2/）。当選時の振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（特図1振り分け・特図2振り分け）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、確率1/399.9＝1500個大当りとヘスティアチャージからの
// LT突入の合算値）の振り分け:
//   ・10R大当り約1500個(実獲得1400個)→通常のまま：約44%
//   ・10R大当り約1500個(実獲得1400個)→RUSH(ST130回)へ：約54%
//   ・2R大当り約192個(実獲得176個)→RUSH(ST130回)へ：約2%
// （RUSHへ行く合計54%+2%=56%が、スペック表の「LT突入率約56%」と一致）
// RUSH中（特図2・電チュー入賞時、確率1/99.9）の振り分け:
//   ・10R大当り+α 約1500個(実獲得1400個)+α→RUSH継続：100%
// （「神乗せループチャンス」は期待度約50%で成功時に約1500個ずつ上乗せしループする
// とあるため、bonusLoop（probability:0.5, balls:1400）で表現した。
// LT継続率約73%は、素の1-(1-1/99.9)^130≈73.0%とほぼ完全に一致するため、
// 残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約192個/実獲得176個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-danmachi2",
  slug: "e-danmachi2",
  name: "eフィーバーダンジョンに出会いを求めるのは間違っているだろうか2",
  nameKana: "いーふぃーばーだんじょんにであいをもとめるのはまちがっているだろうかに",
  aliases: ["ダンまち2パチンコ", "ダンジョンに出会いを求めるのは間違っているだろうか2", "ヘスティアチャージ"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2025,
  category: "パチンコ（スマパチ・ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/399.9（1500個大当りとヘスティアチャージからのLT突入の合算値）",
    "RUSH中の当選確率：1/99.9",
    "RUSH：ST130回、継続率約73%",
    "LT突入率：約56%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが約44%、10R・実獲得約1400個でRUSHへが約54%、2R・実獲得約176個でRUSHへが約2%",
    "RUSH中の当選振り分け：10R・実獲得約1400個で継続が100%、約50%の確率でさらに1400個ずつ上乗せしながらループ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.44, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "rush", tag: "toRush", resultNote: "RUSH" },
          { weight: 0.02, rounds: 2, balls: 176, nextState: "rush", tag: "toRushSmall", resultNote: "RUSH" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "continue",
            bonusLoop: { probability: 0.5, balls: 1400 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 176 },
});
