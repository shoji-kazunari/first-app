// 第100号機: Pとある魔術の禁書目録2（2024年 JFJ ミドル/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_toaruindex2/）。当選時の振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（特図1振り分け・特図2振り分け）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.6）の振り分け:
//   ・10R大当り約1500個→通常のまま：30.0%
//   ・10R大当り約1500個→RUSHへ：55.0%
//   ・10R大当り×2(約3000個、V入賞が条件)→RUSHへ：15.0%
// （RUSHへ行く合計55.0%+15.0%=70.0%が、スペック表の「RUSH突入率70%」と完全に一致）
// RUSH中（特図2・電チュー入賞時、当選確率1/99.9）の振り分け:
//   ・ST回数リセット（出玉無し）：20.0%
//   ・10R大当り約1500個→継続：55.0%
//   ・10R大当り×2(約3000個、V入賞が条件)→継続：25.0%
// （「ST回数リセット」はnextStateを自身に戻すだけで、エンジンの仕様により
// remainingがmaxAttemptsへ再セットされるため、実機のST回数リセットをそのまま
// 再現できる。継続率約77%はSTリセットを含む値とされており、素の
// 1-(1-1/99.9)^144≈76.5%とほぼ一致するため、追加の補正なしで再現できる）
//
// 【出玉は「実獲得個数」の記載が無いため払い出し個数をそのまま採用】
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-toaruindex2",
  slug: "p-toaruindex2",
  name: "Pとある魔術の禁書目録2",
  nameKana: "ぴーとあるまじゅつのきんしょもくろくに",
  aliases: ["とある魔術の禁書目録2パチンコ", "とあるパチンコ", "レールガン", "アクセラレータ"],
  manufacturer: { id: "jfj", name: "JFJ" },
  releaseYear: 2024,
  category: "パチンコ（ミドル・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.6",
    "RUSH中の当選確率：1/99.9",
    "RUSH：144回、継続率約77%（ST回数リセットを含む）",
    "RUSH突入率：70%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・約1500個で通常のままが30.0%、10R・約1500個でRUSHへが55.0%、10R×2・約3000個でRUSHへが15.0%",
    "RUSH中の当選振り分け：ST回数リセット（出玉無し）が20.0%、10R・約1500個で継続が55.0%、10R×2・約3000個で継続が25.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 10, balls: 1500, nextState: "normal", tag: "toNormal" },
          { weight: 0.55, rounds: 10, balls: 1500, nextState: "rush", tag: "toRush", resultNote: "RUSH" },
          {
            weight: 0.15,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "rush",
            tag: "toRushBig",
            resultNote: "RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
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
          { weight: 0.2, rounds: 1, balls: 0, nextState: "rush", tag: "stReset" },
          { weight: 0.55, rounds: 10, balls: 1500, nextState: "rush", tag: "continue" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "rush",
            tag: "continueBig",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500 },
});
