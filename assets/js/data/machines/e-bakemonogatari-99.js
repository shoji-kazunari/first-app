// 第56号機: e 化物語 鬼99ver.（2026年 GINZA スマパチ/ラッキートリガー機・甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_bakemonogatari_99/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・血闘ノ刻中・
// 特別ノ刻中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/99.9）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：49.9%
//   ・2R大当り(約300個)→血闘ノ刻(時短1回+残保留4個)：50.0%
//   ・10R大当り(約1500個)→特別ノ刻(LT、時短22回+残保留4個)：0.1%
// 電チュー入賞時（特図2・血闘ノ刻中、大当り確率約1/17.3）の振り分け:
//   ・10R大当り(約1500個)→特別ノ刻へ：100%
// （血闘ノ刻は時短1回+残保留4個＝計5回転を全弾外すと通常へ。突破率約26%は、素の
// 1-(1-1/17.3)^5≈25.8%とほぼ一致しており、残保留分もmaxAttemptsに含めるだけで
// 再現できる）
// 電チュー入賞時（特図2・特別ノ刻中、大当り確率約1/17.3）の振り分け:
//   ・10R大当り(約1500個)→特別ノ刻継続：50.0%
//   ・10R大当り+盛盛CHANCE(約1500個)→特別ノ刻継続：50.0%
// （特別ノ刻は時短22回+残保留4個＝計26回転を全弾外すと通常へ。継続率約79%は、
// 素の1-(1-1/17.3)^26≈78.7%とほぼ一致）
//
// 【「盛盛CHANCE」を実装していない理由】
// 特別ノ刻中大当たりの50%は「盛盛CHANCE」（約1500個+α、「超盛盛CHANCE BONUS」
// 当選時は上乗せ4500個以上濃厚）へ突入すると説明されているが、+αの上乗せ確率・
// 超盛盛CHANCE BONUSの当選確率とも数値の記載が無い。ベースの払い出し（約1500個/
// 実獲得約1400個）自体は「盛盛CHANCE」の枠も含めて同一のため、このシミュレーター
// では両枠を区別せず、常に約1500個（実獲得約1400個）で特別ノ刻を継続するものとして
// 実装した（+α分は反映していない）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-bakemonogatari-99",
  slug: "e-bakemonogatari-99",
  name: "e 化物語 鬼99ver.",
  nameKana: "いーばけものがたりおにきゅうじゅうきゅうばー",
  aliases: ["化物語99", "化物語鬼99", "e化物語鬼99ver", "化物語パチンコ"],
  manufacturer: { id: "ginza", name: "GINZA（銀座）" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/99.9",
    "血闘ノ刻・特別ノ刻中の大当り確率：ともに約1/17.3",
    "血闘ノ刻：時短1回+残保留4個、突破率約26%",
    "特別ノ刻（LT）：時短22回+残保留4個、継続率約79%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが49.9%、2R・実獲得約280個で血闘ノ刻が50.0%、10R・実獲得約1400個で特別ノ刻が0.1%",
    "血闘ノ刻中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で特別ノ刻へ突入が100%",
    "特別ノ刻中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が100%（「盛盛CHANCE」の+α上乗せは未実装。詳細はコメント）",
    "血闘ノ刻・特別ノ刻とも規定回数を全弾外すと通常へ",
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
          { weight: 0.499, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "kettouNoToki",
            tag: "toKettou",
            resultNote: "血闘ノ刻",
          },
          {
            weight: 0.001,
            rounds: 10,
            balls: 1400,
            nextState: "tokubetsuNoToki",
            tag: "toTokubetsuDirect",
            resultNote: "特別ノ刻",
          },
        ],
      },
      onExhausted: null,
    },

    kettouNoToki: {
      id: "kettouNoToki",
      label: "血闘ノ刻",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 17.3,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "tokubetsuNoToki",
            tag: "toTokubetsu",
            resultNote: "特別ノ刻",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kettouEnd", resultLabel: "血闘ノ刻終了" },
    },

    tokubetsuNoToki: {
      id: "tokubetsuNoToki",
      label: "特別ノ刻",
      mode: "countDown",
      maxAttempts: 26,
      probability: 1 / 17.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "tokubetsuNoToki", tag: "continue1500" }],
      },
      onExhausted: { nextState: "normal", tag: "tokubetsuEnd", resultLabel: "特別ノ刻終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
