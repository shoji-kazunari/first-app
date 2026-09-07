// 第72号機: e異世界でチート能力を手にした俺は現実世界をも無双する ～レベルアップは人生を変えた～
// （2026年 FUJI（藤商事） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_iseleve/）。大当り振り分けは、同ページに
// 掲載されている2枚の円グラフ画像（通常時・RUSH中）と個別解説表（RUSH）の数値を
// 突き合わせて構造化した。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/179）の振り分け（円グラフ「通常時」）:
//   ・2R大当り(約300個)→通常（時短なし）：約80.0%
//   ・2R大当り(約300個)→RUSH(ST70回)へ：約19.8%
//   ・10R大当り(約1500個)→RUSH(ST70回)へ、BONUS1G連以上確定：約0.2%
// （19.8%+0.2%＝20.0%が「RUSH突入率約20%」と一致する）
//
// RUSH中（特図2・電チュー入賞時、抽選確率1/77＝電チューロング開放確率、個別解説表に
// 記載）は、当りのたびに「BONUS」（約1500個）を獲得して再度RUSHへ突入する。BONUS自体は
// 約59%で1G連（ループ）が続く。
// （「BONUS当選期待度約60%」は、素の1-(1-1/77)^70≈60.0%と完全に一致するため、ST70回・
// 確率1/77の単純なcountDownで再現できる。「RUSH×BONUS 1G連TOTAL継続率約83%」は
// 1-(1-0.60)×(1-0.59)≈83.6%と近い値になり、ST70回のヒット率とBONUSループ率という
// 独立した2つの継続経路を組み合わせた合成値と考えられる）
//
// 【RUSH中の出玉振り分け（13%/20%/28%/33%/5%/1%、約450個～約4500個）は簡略化した】
// 円グラフの各枠は「特図2大当り3回分の出玉の合計値」という注記があり、1回あたりの
// 個別の出玉が一定でないことを示しているが、1回あたりの正確な内訳（各回の出玉が
// どう分布するか）は公開されていない。「初回BONUSは1G連が濃厚」「以降の1G連ループ率
// 約59%」という2つの数値だけは明確なため、1回あたりの出玉をこのサイトの標準的な
// 大当り単位である約1500個に固定し、bonusLoop（probability:0.59, balls:1500）で
// ループを表現する簡略化とした（e-girlpan-fin159.js等と同種の簡略化）。
//
// 【出玉について】
// このページには「実獲得個数」の記載が無く、払い出し個数をそのまま採用した
// （e-accelerator-saikyo.jsと同じ扱い）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-iseleve",
  slug: "e-iseleve",
  name: "e異世界でチート能力を手にした俺は現実世界をも無双する ～レベルアップは人生を変えた～",
  nameKana: "いーいせかいでちーとのうりょくをてにしたおれはげんじつせかいをもむそうする",
  aliases: ["いせれべ", "異世界チート", "いせれべパチンコ", "異世界でチート能力を手にした俺"],
  manufacturer: { id: "fuji", name: "FUJI（藤商事）" },
  releaseYear: 2026,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/179",
    "RUSH中の抽選確率：1/77（電チューロング開放確率）",
    "RUSH：ST70回、BONUS当選期待度約60%",
    "BONUS 1G連ループ率：約59%（RUSH×BONUS 1G連TOTAL継続率約83%）",
    "RUSH突入率：約20%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・約300個で通常のままが約80.0%、2R・約300個でRUSHへが約19.8%、10R・約1500個でRUSHへ（BONUS1G連以上確定）が約0.2%",
    "RUSH中の当選振り分け：BONUS・約1500個を獲得しRUSH継続、BONUS自体は約59%で1G連ループ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 179,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.8, rounds: 2, balls: 300, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.198,
            rounds: 2,
            balls: 300,
            nextState: "rush",
            tag: "toRush",
            resultNote: "RUSH",
          },
          {
            weight: 0.002,
            rounds: 10,
            balls: 1500,
            nextState: "rush",
            tag: "toRushWithBonus",
            resultNote: "RUSH、BONUS1G連以上",
            bonusLoop: { probability: 0.59, balls: 1500 },
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 70,
      probability: 1 / 77,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1500,
            nextState: "rush",
            tag: "bonus",
            resultNote: "BONUS",
            bonusLoop: { probability: 0.59, balls: 1500 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500, 2: 300 },
});
