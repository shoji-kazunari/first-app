// 第44号機: Ｐぱちんこ押忍！番長 漢の頂 ９９ver.（2026年 Daito スマパチ/甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_osubancyo_99/）。
// e-osubancyo-99.js（ｅぱちんこ押忍！番長 漢の頂 ９９ver.）と同時期に導入された
// P版（型式名・検定番号が別。1geki.jp側もページが別立て）。大当り確率・ST回数・
// 突入率・継続率・出玉振り分けの円グラフ（通常時・頂RUSH中）とも、数値を比較した
// ところe版とすべて完全に同一だった（同じ「頂RUSH」という名称・仕様で、P/eの
// 違いは玉貸方式など遊技機区分のみで、ゲーム性は同じと判断できる）。そのため
// states以下はe-osubancyo-99.jsと同一の実装にしている。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-osubancyo-99",
  slug: "p-osubancyo-99",
  name: "Ｐぱちんこ押忍！番長 漢の頂 ９９ver.",
  nameKana: "ぴーぱちんこおすばんちょうおとこのいただき99ばー",
  aliases: ["P押忍番長99", "P番長99", "Pぱちんこ押忍番長99ver", "押忍番長99パチンコ版"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2026,
  category: "パチンコ（甘デジ・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "頂RUSH中の大当り確率：1/99.9",
    "頂RUSH：ST144回、継続率約77%",
    "RUSH突入率：33%",
    "通常時の大当り振り分け（ヘソ入賞時）：実獲得約280個で通常のままが67.0%、実獲得約280個で頂RUSHが33.0%",
    "頂RUSH中の当選振り分け（電チュー入賞時）：実獲得約280個で継続が50.0%、実獲得約1960個（1500個+300個×2）で継続が50.0%",
    "頂RUSHは規定回数（144回）を全弾外すと通常へ",
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
          { weight: 0.67, rounds: 1, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.33, rounds: 1, balls: 280, nextState: "rush", tag: "toRush", resultNote: "頂RUSH" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "頂RUSH",
      mode: "countDown",
      maxAttempts: 144,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 280, nextState: "rush", tag: "rushContinue300" },
          {
            weight: 0.5,
            rounds: 1,
            balls: 1960,
            nextState: "rush",
            tag: "rushContinue2100",
            resultNote: "1500個+300個×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "頂RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 1: 280 },
});
