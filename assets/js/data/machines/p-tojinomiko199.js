// 第104号機: P刀使ノ巫女（2022年 NISHIJIN（西陣） ライトミドル/一種二種混合機/遊タイム）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_tojinomiko199/）。「当選時の振り分け」は
// 円グラフではなく通常の表組みで、ヘソ入賞時（通常時・絶対領域）と電チュー入賞時
// （快刀乱麻・最後の一太刀）それぞれについて条件付き内訳が数値で記載されている。
//
// ヘソ入賞時・通常時（特図1、大当り確率1/199.8）の振り分け:
//   ・3R大当り(実獲得300個)→快刀乱麻(電サポ250回)へ：52.0%
//   ・3R大当り(実獲得300個)→絶対領域30回へ：16.0%
//   ・3R大当り(実獲得300個)→絶対領域15回へ：32.0%
// 絶対領域（特図1、大当り確率は通常時と同じ1/199.8だが、ここでは「大当りと併行して
// 突然時短の発動抽選」が別途行われ、快刀乱麻への突入期待度が通常時の2倍になる
// という独自演出がある。1geki.jpにはその「突然時短抽選」自体の単独確率の記載が無く、
// 表に載っているのは大当り発生を前提とした条件付き内訳のみのため、本実装ではこの
// 「快刀乱麻図柄」による直接変換も含めて、絶対領域状態のonHit（確率は通常時と同じ
// 1/199.8のまま）の振り分けとして扱う簡略化を行った（e-accel-world.jsのOVER HEAVEN
// 前半を簡略化した独自ルールと同種の扱い）:
//   ・快刀乱麻図柄(出玉なし)→快刀乱麻(電サポ250回)へ：50.0%
//   ・3R大当り(実獲得300個)→快刀乱麻(電サポ250回)へ：26.0%
//   ・3R大当り(実獲得300個)→絶対領域30回へ：24.0%
// 快刀乱麻中（特図2・電チュー入賞時、当選確率1/12.5、電サポ250回）の振り分け:
//   ・10R大当り(実獲得1000個)→継続：55.0%
//   ・3R大当り(実獲得300個)→継続：26.25%
//   ・3R大当り(実獲得300個)→最後の一太刀(残保留最大1個)へ：18.75%
// 最後の一太刀（残保留1回、確率は快刀乱麻と同じ1/12.5）の振り分け:
//   ・10R大当り(実獲得1000個)→快刀乱麻へ：55.0%
//   ・3R大当り(実獲得300個)→快刀乱麻へ：45.0%
// （公表の「大荒魂討伐モード継続率約83%」は、快刀乱麻の直接継続55.0%+26.25%＝81.25%と、
// 最後の一太刀を経由する分18.75%×(1/12.5)≈1.5%を合わせた約82.75%とほぼ一致する。
// 電サポ250回は確率1/12.5に対して十分大きく、素の1-(1-1/12.5)^250はほぼ100%に
// 達するため、countDownのonExhaustedは実質発生しない設計になっている）
//
// 【「遊タイム250回（大当り後599回消化で発動）」は未実装】
// はまり回数のカウントという別軸の状態管理が必要になるため、通常のゲーム性のみを
// 実装した（p-kkclub-fsakamoto199.jsの遊タイム省略と同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1100個/実獲得1000個、
// 3R: 約330個/実獲得300個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-tojinomiko199",
  slug: "p-tojinomiko199",
  name: "P刀使ノ巫女",
  nameKana: "ぴーとうじのみこ",
  aliases: ["刀使ノ巫女パチンコ", "トウジノミコパチンコ", "快刀乱麻", "大荒魂討伐モード"],
  manufacturer: { id: "nishijin", name: "NISHIJIN（西陣）" },
  releaseYear: 2022,
  category: "パチンコ（ライトミドル・一種二種混合機・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.8",
    "快刀乱麻・最後の一太刀中の当選確率：1/12.5",
    "大荒魂討伐モード「快刀乱麻」：電サポ250回、継続率約83%（最後の一太刀を含む）",
    "大荒魂討伐モード突入率：約55%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約300個で快刀乱麻へが52.0%、3R・実獲得約300個で絶対領域30回へが16.0%、3R・実獲得約300個で絶対領域15回へが32.0%",
    "絶対領域中の振り分け：快刀乱麻図柄（出玉無し）で快刀乱麻へが50.0%、3R・実獲得約300個で快刀乱麻へが26.0%、3R・実獲得約300個で絶対領域30回へが24.0%",
    "快刀乱麻中の当選振り分け：10R・実獲得約1000個で継続が55.0%、3R・実獲得約300個で継続が26.25%、3R・実獲得約300個で最後の一太刀へが18.75%",
    "最後の一太刀の振り分け：10R・実獲得約1000個で快刀乱麻へが55.0%、3R・実獲得約300個で快刀乱麻へが45.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.52, rounds: 3, balls: 300, nextState: "kaitouranma", tag: "toRush", resultNote: "快刀乱麻" },
          {
            weight: 0.16,
            rounds: 3,
            balls: 300,
            nextState: "zettairyoiki30",
            tag: "toZettai30",
            resultNote: "絶対領域",
          },
          {
            weight: 0.32,
            rounds: 3,
            balls: 300,
            nextState: "zettairyoiki15",
            tag: "toZettai15",
            resultNote: "絶対領域",
          },
        ],
      },
      onExhausted: null,
    },

    zettairyoiki15: {
      id: "zettairyoiki15",
      label: "絶対領域（15回）",
      mode: "countDown",
      maxAttempts: 15,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: true,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 0, nextState: "kaitouranma", tag: "toRushDirect", resultNote: "快刀乱麻" },
          { weight: 0.26, rounds: 3, balls: 300, nextState: "kaitouranma", tag: "toRush", resultNote: "快刀乱麻" },
          {
            weight: 0.24,
            rounds: 3,
            balls: 300,
            nextState: "zettairyoiki30",
            tag: "toZettai30",
            resultNote: "絶対領域",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "zettaiFail", resultLabel: "絶対領域終了" },
    },

    zettairyoiki30: {
      id: "zettairyoiki30",
      label: "絶対領域（30回）",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: true,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 0, nextState: "kaitouranma", tag: "toRushDirect", resultNote: "快刀乱麻" },
          { weight: 0.26, rounds: 3, balls: 300, nextState: "kaitouranma", tag: "toRush", resultNote: "快刀乱麻" },
          {
            weight: 0.24,
            rounds: 3,
            balls: 300,
            nextState: "zettairyoiki30",
            tag: "toZettai30Again",
            resultNote: "絶対領域",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "zettaiFail", resultLabel: "絶対領域終了" },
    },

    kaitouranma: {
      id: "kaitouranma",
      label: "快刀乱麻",
      mode: "countDown",
      maxAttempts: 250,
      probability: 1 / 12.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.55, rounds: 10, balls: 1000, nextState: "kaitouranma", tag: "continue10r" },
          { weight: 0.2625, rounds: 3, balls: 300, nextState: "kaitouranma", tag: "continue3r" },
          {
            weight: 0.1875,
            rounds: 3,
            balls: 300,
            nextState: "saigonoHitotachi",
            tag: "toLastBlade",
            resultNote: "最後の一太刀",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "快刀乱麻終了" },
    },

    saigonoHitotachi: {
      id: "saigonoHitotachi",
      label: "最後の一太刀",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 12.5,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.55, rounds: 10, balls: 1000, nextState: "kaitouranma", tag: "backToRush10r", resultNote: "快刀乱麻" },
          { weight: 0.45, rounds: 3, balls: 300, nextState: "kaitouranma", tag: "backToRush3r", resultNote: "快刀乱麻" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "lastBladeFail", resultLabel: "最後の一太刀ならず" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1000, 3: 300 },
});
