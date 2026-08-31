// 第16号機: e 無職転生 ～異世界行ったら本気だす～（2026年 newgin スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_msts/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当り振り分け:
//   ・8R大当り(約1200個)→通常（時短なし）：46%
//   ・8R大当り(約1200個)→無職転生RUSH(ST130回)：54%
// 電チュー入賞時（特図2・無職転生RUSH中）の振り分け:
//   ・10R大当り(約1500個)→継続：50%
//   ・10R×2大当り(約3000個)→継続：26.5%
//   ・10R×4大当り(約6000個)→継続：23.5%
// （継続率約76.5%は1/90.4・ST130回から自然に導かれる値[1-(1-1/90.4)^130≈76.5%]と一致）
//
// 【魔力チャージについて】
// スペック表には「図柄揃い確率（通常時）約1/399.6※1」「※1 魔力チャージを含む
// 大当り確率 約1/348.6」とあり、図柄揃いとは別に「魔力チャージ」という当選契機が
// 存在することが分かる。ただし円グラフ（通常時の大当り時の出玉振り分け確率）は
// 「8R大当り→通常46%／8R大当り→RUSH54%」の2択のみで、魔力チャージ単体の出現率は
// 数値公開されていない。このシミュレーターでは、数値の裏取りができるこの円グラフの
// 2択をそのまま実装し、確率は合算値の1/348.6を使用した（e-gundamseed-climax.jsの
// SEEDチャージと同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（8R: 約1200個/実獲得1120個、
// 10R: 約1500個/実獲得1400個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-mushoku-tensei",
  slug: "e-mushoku-tensei",
  name: "e 無職転生 ～異世界行ったら本気だす～",
  nameKana: "いーむしょくてんせいいせかいいったらほんきだす",
  aliases: ["無職転生", "むしょくてんせい", "異世界行ったら本気だす"],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/348.6（魔力チャージを含む）",
    "無職転生RUSH中の当選確率：約1/90.4",
    "無職転生RUSH：ST130回、継続率約76.5%",
    "RUSH突入率：約54%",
    "通常時の大当り振り分け（ヘソ入賞時）：8R・実獲得約1120個で通常のままが46%、8R・実獲得約1120個で無職転生RUSH(ST130回)が54%",
    "無職転生RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が50%、10R×2・実獲得約2800個で継続が26.5%、10R×4・実獲得約5600個で継続が23.5%",
    "無職転生RUSHは規定回数（130回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 348.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.46, rounds: 8, balls: 1120, nextState: "normal", tag: "toNormal" },
          { weight: 0.54, rounds: 8, balls: 1120, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "無職転生RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 90.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue" },
          {
            weight: 0.265,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinueMega",
            resultNote: "10R×2",
          },
          {
            weight: 0.235,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushContinueUltra",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "無職転生RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 8: 1120, 10: 1400 },
});
