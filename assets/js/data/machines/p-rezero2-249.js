// 第74号機: P Re:ゼロから始める異世界生活 season2 249ver.（2026年 Daito（大都技研） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_re0season2_249/）。p-rezero2-129.js
// （129ver.）とは型式・大当り確率が異なる別機種。大当り振り分けは、同ページに掲載
// されている2枚の円グラフ画像（通常時・強欲RUSH中）をダウンロードしてReadツールで
// 直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/249.9）の振り分け:
//   ・5R大当り(約600個/実獲得550個)→通常（時短なし）：40.0%
//   ・5R大当り(約600個)→強欲RUSH(163回)へ：60.0%
// 強欲RUSH中（特図2・電チュー入賞時、当選確率1/99.9）の振り分け:
//   ・2R大当り(約240個/実獲得220個)→継続：20.0%
//   ・10R大当り(約1200個/実獲得1100個)→継続：55.0%
//   ・超強欲2400BONUS(約2400個+α＝10R(約1200個)+5R(約600個)×2/実獲得約2200個)→継続：25.0%
// （継続率約81%は、素の1-(1-1/99.9)^163≈80.6%とほぼ完全に一致するため、残保留等の
// 引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【「超強欲2400BONUS」中の「強欲フリーズ」（+約1200個）は未実装】
// 発生確率が1geki.jp上に記載されておらず、フリーズ無しの実獲得約2200個を基本値
// として採用した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1200個/実獲得1100個、
// 5R: 約600個/実獲得550個、2R: 約240個/実獲得220個。いずれも比率11/12）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-rezero2-249",
  slug: "p-rezero2-249",
  name: "P Re:ゼロから始める異世界生活 season2 249ver.",
  nameKana: "ぴーりーぜろからはじめるいせかいせいかつしーずんつーにひゃくよんじゅうきゅうばー",
  aliases: ["リゼロ249", "Pリゼロ2 249", "リゼロ2 249ver.", "Pリゼロseason2 249"],
  manufacturer: { id: "daito", name: "Daito（大都技研）" },
  releaseYear: 2026,
  category: "パチンコ（ライトミドル・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/249.9",
    "強欲RUSH中の当選確率：1/99.9",
    "強欲RUSH：163回、継続率約81%",
    "RUSH突入率：60%",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約550個で通常のままが40.0%、5R・実獲得約550個で強欲RUSHへが60.0%",
    "強欲RUSH中の当選振り分け：2R・実獲得約220個で継続が20.0%、10R・実獲得約1100個で継続が55.0%、超強欲2400BONUS・実獲得約2200個で継続が25.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 249.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.4, rounds: 5, balls: 550, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.6,
            rounds: 5,
            balls: 550,
            nextState: "gouyokuRush",
            tag: "toRush",
            resultNote: "強欲RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    gouyokuRush: {
      id: "gouyokuRush",
      label: "強欲RUSH",
      mode: "countDown",
      maxAttempts: 163,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 2, balls: 220, nextState: "gouyokuRush", tag: "continue2r" },
          { weight: 0.55, rounds: 10, balls: 1100, nextState: "gouyokuRush", tag: "continue10r" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 20,
            balls: 2200,
            nextState: "gouyokuRush",
            tag: "superGouyokuBonus",
            resultNote: "超強欲2400BONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "強欲RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1100, 5: 550, 2: 220 },
});
