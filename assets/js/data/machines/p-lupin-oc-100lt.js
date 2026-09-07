// 第89号機: Pルパン三世 ONE COLLECTION 100ver.（2025年 HEIWA（平和） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_lupin_oc_100lt/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・GOLDEN TIME65中・GOLDEN TIME105中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/100.1）の振り分け:
//   ・4R大当り(約400個/実獲得360個)→通常（時短なし）：50.0%
//   ・4R大当り(約400個)→GOLDEN TIME65(ST65回)へ：49.5%
//   ・10R大当り(約1000個/実獲得900個)→GOLDEN TIME105(LT、ST105回)へ直行：0.5%
// GOLDEN TIME65中（特図2・電チュー入賞時、当選確率1/66.7）の振り分け:
//   ・2R大当り(約200個/実獲得180個)→継続：40.5%
//   ・10R大当り(約1000個)→継続：46.3%
//   ・9R×2大当り(約1800個/実獲得1620個)→GOLDEN TIME105(LT)へ：13.2%
// GOLDEN TIME105中（特図2・電チュー入賞時、当選確率1/66.7）の振り分け:
//   ・2R大当り(約200個)→継続：40%
//   ・ブチヌキBONUS(約1000個～、平均約3100個/実獲得平均2790個)→継続：60%
// （GOLDEN TIME65継続率約63%は、素の1-(1-1/66.7)^65≈62.5%とほぼ完全に一致し、
// GOLDEN TIME105継続率約80%も、素の1-(1-1/66.7)^105≈79.5%とほぼ完全に一致する
// ため、いずれも残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【「ブチヌキBONUS」は平均値で簡略化した】
// 円グラフには「約1000個～大当り（平均約3100個）」「RUSH中の出玉は一連の大当たり
// 『(10Ror9Ror2R)×複数回』の合計払い出し」との注記があり、実際には複数回の大当りが
// 連続して合計される可変長のボーナスだが、内訳（何回でいくら、の分布）が1geki.jp上に
// 記載されていない。公表の平均値約3100個をそのまま採用した（floor値ではなく平均値を
// 採用したのは、1geki.jpが明示的に「平均」と述べているため）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 9R: 約900個/実獲得810個、4R: 約400個/実獲得360個、2R: 約200個/実獲得180個。
// いずれも比率9/10）。9R×2、ブチヌキBONUS平均値も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-lupin-oc-100lt",
  slug: "p-lupin-oc-100lt",
  name: "Pルパン三世 ONE COLLECTION 100ver.",
  nameKana: "ぴーるぱんさんせいわんこれくしょんひゃくばー",
  aliases: ["ルパン三世ONE COLLECTION", "ルパンパチンコ100", "GOLDEN TIME", "ルパン三世ワンコレ"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/100.1",
    "GOLDEN TIME65・GOLDEN TIME105中の当選確率：1/66.7",
    "GOLDEN TIME65：ST65回、継続率約63%",
    "GOLDEN TIME105（LT）：ST105回、継続率約80%",
    "GOLDEN TIME突入率：約50%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約360個で通常のままが50.0%、4R・実獲得約360個でGOLDEN TIME65へが49.5%、10R・実獲得約900個でGOLDEN TIME105へ直行が0.5%",
    "GOLDEN TIME65中の当選振り分け：2R・実獲得約180個で継続が40.5%、10R・実獲得約900個で継続が46.3%、9R×2・実獲得約1620個でGOLDEN TIME105へが13.2%",
    "GOLDEN TIME105中の当選振り分け：2R・実獲得約180個で継続が40%、ブチヌキBONUS・実獲得平均約2790個で継続が60%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 100.1,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, balls: 360, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.495,
            rounds: 4,
            balls: 360,
            nextState: "goldenTime65",
            tag: "toGt65",
            resultNote: "GOLDEN TIME65",
          },
          {
            weight: 0.005,
            rounds: 10,
            balls: 900,
            nextState: "goldenTime105",
            tag: "toGt105Direct",
            resultNote: "GOLDEN TIME105",
          },
        ],
      },
      onExhausted: null,
    },

    goldenTime65: {
      id: "goldenTime65",
      label: "GOLDEN TIME65",
      mode: "countDown",
      maxAttempts: 65,
      probability: 1 / 66.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.405, rounds: 2, balls: 180, nextState: "goldenTime65", tag: "continue2r" },
          { weight: 0.463, rounds: 10, balls: 900, nextState: "goldenTime65", tag: "continue10r" },
          {
            weight: 0.132,
            rounds: 9,
            displayRounds: 18,
            balls: 1620,
            nextState: "goldenTime105",
            tag: "toGt105",
            resultNote: "GOLDEN TIME105",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "gt65End", resultLabel: "GOLDEN TIME65終了" },
    },

    goldenTime105: {
      id: "goldenTime105",
      label: "GOLDEN TIME105",
      mode: "countDown",
      maxAttempts: 105,
      probability: 1 / 66.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.4, rounds: 2, balls: 180, nextState: "goldenTime105", tag: "continue2r" },
          {
            weight: 0.6,
            rounds: 10,
            displayRounds: 30,
            balls: 2790,
            nextState: "goldenTime105",
            tag: "buchinukiBonus",
            resultNote: "ブチヌキBONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "gt105End", resultLabel: "GOLDEN TIME105終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 9: 810, 4: 360, 2: 180 },
});
