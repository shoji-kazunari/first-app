// 第43号機: eぱちんこ押忍！番長 漢の頂 ９９ver.（2026年 Daito スマパチ/甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_osubancyo_99/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・頂RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// 既存のe-osubancyo.js（eぱちんこ押忍！番長 漢の頂、無印）とは型式名・検定番号とも
// 別の甘デジ版（「９９ver.」）。1geki.jpでもURL・ページとも別立てになっている
// 独立した機種のため、別ファイルとして追加した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/99.9）の振り分け:
//   ・大当り(約300個)→通常（時短なし）：67.0%
//   ・大当り(約300個)→頂RUSH(ST144回)：33.0%
// 電チュー入賞時（特図2・頂RUSH中、大当り確率1/99.9）の振り分け:
//   ・大当り(約300個)→頂RUSH継続：50.0%
//   ・大当り(約2100個＝1500個+300個×2)→頂RUSH継続：50.0%
// （頂RUSHは規定回数（144回）を全弾外すと通常へ。継続率約77%は、素の
// 1-(1-1/99.9)^144≈76.4%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【ラウンド数（rounds）について】
// このページはスペック表に「ラウンド数」の記載が無く（払い出し個数と実獲得個数のみ）、
// 甘デジらしく賞球数の内訳（1&4&15）で個数が決まる構成と見られる。実際のラウンド数が
// 不明なため、rounds値は出玉に影響しないダミー値として1を使い、実際の出玉は
// 各onHit.outcomesのballsで明示した（e-majotoyajuu.jsの1R扱いの当りと同じ考え方）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（約300個/実獲得280個、約2100個/実獲得1960個、
// 比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-osubancyo-99",
  slug: "e-osubancyo-99",
  name: "eぱちんこ押忍！番長 漢の頂 ９９ver.",
  nameKana: "いーぱちんこおすばんちょうおとこのいただき99ばー",
  aliases: ["押忍番長99", "番長99", "押忍番長漢の頂99ver", "eぱちんこ押忍番長99"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2026,
  category: "スマパチ（甘デジ・一種二種混合機）",

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
