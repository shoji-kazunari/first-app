// 第26号機: eぱちんこ押忍！番長 漢の頂（2025年 Daito スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_osubancyo/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// 頂RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/179.5）の振り分け:
//   ・大当り(約750個)→通常（時短なし）：75.0%
//   ・大当り(約750個)→頂RUSH(ST157回)：25.0%
// 電チュー入賞時（特図2・頂RUSH中、大当り確率約1/99.5）の振り分け:
//   ・大当り(約300個)→継続：30.0%
//   ・大当り(約3000個＝1500個+750個×2)→継続：70.0%
// （頂RUSHは規定回数消化型。素の計算1-(1-1/99.5)^157≈79.5%は公表の
// 「継続率約80%」とほぼ一致しており、大きな引き戻しギャップは無い）
//
// 【ラウンド数について】
// このページにはラウンド数（○R）の表記が無く、払い出し個数のみ公開されている。
// 唯一disclosedな「300個(実獲得280個)」は他機種と同じ2R基準（150個/R）と
// 一致するため、同じ150個/Rの換算で750個→5R、3000個(=1500個+750個×2)→
// 10R+5R×2=20Rとして`rounds`を設定した（出玉自体はいずれも公開値そのまま）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（750個: 実獲得700個、300個: 実獲得
// 280個、3000個: 実獲得2800個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-osubancyo",
  slug: "e-osubancyo",
  name: "eぱちんこ押忍！番長 漢の頂",
  nameKana: "いーぱちんこおすばんちょうおとこのいただき",
  aliases: ["番長", "押忍番長", "押忍!番長", "番長漢の頂", "e番長"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2025,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/179.5",
    "頂RUSH中の大当り確率：約1/99.5",
    "頂RUSH：ST157回、継続率約80%",
    "RUSH突入率：25%",
    "通常時の大当り振り分け（ヘソ入賞時）：実獲得約700個で通常のままが75.0%、実獲得約700個で頂RUSHが25.0%",
    "頂RUSH中の当選振り分け（電チュー入賞時）：実獲得約280個で継続が30.0%、実獲得約2800個で継続が70.0%",
    "頂RUSHは規定回数（157回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 179.5,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 5, balls: 700, nextState: "normal", tag: "toNormal" },
          { weight: 0.25, rounds: 5, balls: 700, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "頂RUSH",
      mode: "countDown",
      maxAttempts: 157,
      probability: 1 / 99.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 280, nextState: "rush", tag: "rushContinue300" },
          {
            weight: 0.7,
            rounds: 20,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue3000",
            resultNote: "10R+5R×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "頂RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 5: 700 },
});
