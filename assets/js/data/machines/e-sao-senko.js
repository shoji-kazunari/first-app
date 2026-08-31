// 第18号機: eソードアート・オンライン 閃光の軌跡（2024年 KYORAKU スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_sao_lt/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// 2024年導入の旧機種で、既に追加済みのe-sao-yozora.js（ソードアート・オンライン
// アリシゼーション夜空）の前作にあたる（1geki.jp自身が「シリーズ最新機種
// （後継機）へ」と本機のページから誘導している）。ただし今週のアクセスランキング
// 15位に入っておりまだ実働しているため別機種として追加した。
//
// ヘソ入賞時（特図1・通常時）の大当り振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：30.0%
//   ・2R大当り(約300個)→SWORD RUSH(ST50回)：69.0%
//   ・10R大当り(約1500個)→LIGHTNING RUSH(実質次回まで)：1.0%
// 電チュー入賞時（特図2・SWORD RUSH中）の振り分け:
//   ・2R大当り(約300個)→SWORD RUSH継続：30.0%
//   ・10R大当り(約1500個)→SWORD RUSH継続：40.0%
//   ・10R大当り(約1500個)→LIGHTNING RUSH(ST115回)：27.0%
//   ・10R大当り(約1500個)→LIGHTNING RUSH(実質次回まで)：3.0%
// 電チュー入賞時（特図2・LIGHTNING RUSH中）の振り分け:
//   ・2R大当り(約300個)→LIGHTNING RUSH継続(ST115回)：30.0%
//   ・10R大当り(約1500個)→LIGHTNING RUSH継続(ST115回)：47.5%
//   ・10R大当り(約1500個)→LIGHTNING RUSH継続(実質次回まで)：22.5%
// （「実質次回まで」はST10000回として実装。1/59.9・10000回ならほぼ確実に
// 当選するため、体感としては「次に当たるまで終わらない」と同じになる）
//
// 【「残保留4個」の引き戻しを実装していない理由】
// スペック表には「LIGHTNING RUSH継続率約90%※1」「※1 時短10000回の継続率
// (実質次回まで)とST115回＋残保留4個の継続率(約86.5%)を合わせた合算値／
// 残保留で引き戻した場合はSWORD RUSH中の振り分けとなる」とあり、規定回数
// （115回）を消化しきった瞬間に残保留4個ぶんだけ追加で当落を見る仕組みがある。
// p-madokamagica3.jsと同じ理由（stateEngineのresidualAttemptsはonFall
// 専用で、規定回数消化型には流用できない）で、このシミュレーターでは実装して
// いない。継続率への影響は小さい（素の1-(1-1/59.9)^115≈85.3%→表記86.5%）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-sao-senko",
  slug: "e-sao-senko",
  name: "eソードアート・オンライン 閃光の軌跡",
  nameKana: "いーそーどあーとおんらいんせんこうのきせき",
  aliases: ["SAO閃光の軌跡", "閃光の軌跡", "SAO199", "ソードアートオンライン閃光の軌跡"],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2024,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/199.9",
    "RUSH中の大当り確率：約1/59.9",
    "SWORD RUSH：ST50回、継続率約60%",
    "LIGHTNING RUSH：ST115回or実質次回まで、継続率約90%（残保留込み。このシミュレーターでは残保留の引き戻しは未実装）",
    "RUSH突入率：70%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが30.0%、2R・実獲得約280個でSWORD RUSH(ST50回)が69.0%、10R・実獲得約1400個でLIGHTNING RUSH(実質次回まで)が1.0%",
    "SWORD RUSH中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続が30.0%、10R・実獲得約1400個で継続が40.0%、10R・実獲得約1400個でLIGHTNING RUSH(ST115回)が27.0%、10R・実獲得約1400個でLIGHTNING RUSH(実質次回まで)が3.0%",
    "LIGHTNING RUSH中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続(ST115回)が30.0%、10R・実獲得約1400個で継続(ST115回)が47.5%、10R・実獲得約1400個で継続(実質次回まで)が22.5%",
    "SWORD RUSH・LIGHTNING RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.69, rounds: 2, balls: 280, nextState: "swordRush", tag: "toSwordRush" },
          {
            weight: 0.01,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRushInfinite",
            tag: "toLightningInfinite",
            resultNote: "実質次回まで",
          },
        ],
      },
      onExhausted: null,
    },

    swordRush: {
      id: "swordRush",
      label: "SWORD RUSH",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 59.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 280, nextState: "swordRush", tag: "swordRushContinue2R" },
          { weight: 0.4, rounds: 10, balls: 1400, nextState: "swordRush", tag: "swordRushContinue10R" },
          {
            weight: 0.27,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRush115",
            tag: "swordRushToLightning115",
          },
          {
            weight: 0.03,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRushInfinite",
            tag: "swordRushToLightningInfinite",
            resultNote: "実質次回まで",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "swordRushEnd", resultLabel: "SWORD RUSH終了" },
    },

    lightningRush115: {
      id: "lightningRush115",
      label: "LIGHTNING RUSH",
      mode: "countDown",
      maxAttempts: 115,
      probability: 1 / 59.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.3,
            rounds: 2,
            balls: 280,
            nextState: "lightningRush115",
            tag: "lightningContinue2R",
          },
          {
            weight: 0.475,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRush115",
            tag: "lightningContinue10R",
          },
          {
            weight: 0.225,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRushInfinite",
            tag: "lightningToInfinite",
            resultNote: "実質次回まで",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "lightningEnd", resultLabel: "LIGHTNING RUSH終了" },
    },

    lightningRushInfinite: {
      id: "lightningRushInfinite",
      label: "LIGHTNING RUSH",
      mode: "countDown",
      maxAttempts: 10000,
      probability: 1 / 59.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.3,
            rounds: 2,
            balls: 280,
            nextState: "lightningRush115",
            tag: "lightningInfiniteContinue2R",
          },
          {
            weight: 0.475,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRush115",
            tag: "lightningInfiniteContinue10R",
          },
          {
            weight: 0.225,
            rounds: 10,
            balls: 1400,
            nextState: "lightningRushInfinite",
            tag: "lightningInfiniteContinueInfinite",
            resultNote: "実質次回まで",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "lightningInfiniteEnd", resultLabel: "LIGHTNING RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
