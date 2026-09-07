// 第97号機: Pルパン三世 銭形からの招待状 77Sweet Ver.（2024年 HEIWA（平和） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_lupin_zenigata77lt/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・GOLDEN TIME中・神GOLDEN TIME
// BOOST中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/77.7）の振り分け:
//   ・3R大当り(約210個/実獲得180個)→通常（時短0回）：49.0%
//   ・3R大当り(約210個)→GOLDEN TIME(ST30回)へ：51.0%
// GOLDEN TIME中（特図2・電チュー入賞時、当選確率1/37.3）の振り分け:
//   ・10R大当り(約700個/実獲得600個)→継続：85.0%
//   ・10R大当り(約700個)→神GOLDEN TIME BOOST(LT、ST84回)へ：15.0%
// 神GOLDEN TIME BOOST中（特図2・電チュー入賞時、当選確率1/37.3）の振り分け:
//   ・10R大当り(約700個)→継続：100%
// （GOLDEN TIME継続率約60%は、素の1-(1-1/37.3)^34≈60.3%とほぼ完全に一致し、
// 神GOLDEN TIME BOOST継続率約91%も、素の1-(1-1/37.3)^88≈90.8%とほぼ完全に
// 一致するため、いずれも「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけの
// シンプルな規定回数countDownで再現できる（30+4=34、84+4=88））
//
// 【「時短・電サポ：30回or84回or10000回」の10000回は未実装】
// この概要ページには10000回に相当する状態の詳細（突入条件・振り分け）の記載が
// 見当たらず、実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約700個/実獲得600個、
// 3R: 約210個/実獲得180個、いずれも比率6/7）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-lupin-zenigata77lt",
  slug: "p-lupin-zenigata77lt",
  name: "Pルパン三世 銭形からの招待状 77Sweet Ver.",
  nameKana: "ぴーるぱんさんせいぜにがたからのしょうたいじょうななじゅうななすいーとばー",
  aliases: ["ルパン三世銭形からの招待状", "ルパン銭形パチンコ", "GOLDEN TIME", "神GOLDEN TIME BOOST"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2024,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/77.7",
    "GOLDEN TIME・神GOLDEN TIME BOOST中の当選確率：1/37.3",
    "GOLDEN TIME：ST30回、継続率約60%",
    "神GOLDEN TIME BOOST（LT）：ST84回、継続率約91%",
    "ST突入率：51%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約180個で通常のままが49.0%、3R・実獲得約180個でGOLDEN TIMEへが51.0%",
    "GOLDEN TIME中の当選振り分け：10R・実獲得約600個で継続が85.0%、10R・実獲得約600個で神GOLDEN TIME BOOSTへが15.0%",
    "神GOLDEN TIME BOOST中の当選振り分け：10R・実獲得約600個で継続が100%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 77.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 3, balls: 180, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.51,
            rounds: 3,
            balls: 180,
            nextState: "goldenTime",
            tag: "toGt",
            resultNote: "GOLDEN TIME",
          },
        ],
      },
      onExhausted: null,
    },

    goldenTime: {
      id: "goldenTime",
      label: "GOLDEN TIME",
      mode: "countDown",
      maxAttempts: 34,
      probability: 1 / 37.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.85, rounds: 10, balls: 600, nextState: "goldenTime", tag: "continue" },
          {
            weight: 0.15,
            rounds: 10,
            balls: 600,
            nextState: "kamiGoldenTimeBoost",
            tag: "toBoost",
            resultNote: "神GOLDEN TIME BOOST",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "gtEnd", resultLabel: "GOLDEN TIME終了" },
    },

    kamiGoldenTimeBoost: {
      id: "kamiGoldenTimeBoost",
      label: "神GOLDEN TIME BOOST",
      mode: "countDown",
      maxAttempts: 88,
      probability: 1 / 37.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 600, nextState: "kamiGoldenTimeBoost", tag: "continue" }],
      },
      onExhausted: { nextState: "normal", tag: "boostEnd", resultLabel: "神GOLDEN TIME BOOST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 600, 3: 180 },
});
