// 第80号機: e黄門ちゃま 寿限無LLサイズ（2025年 HEIWA（平和） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_koumon_jlls/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時（図柄揃い）・寿限無RUSH中・寿限無RUSH極中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/348.5）の振り分け:
//   ・2R大当り(約300個/実獲得280個)→通常（時短なし）：約48%
//   ・2R大当り(約300個)→寿限無RUSH(ST66回)へ：約52%
// 寿限無RUSH中（特図2・電チュー入賞時、当選確率1/97.0）の振り分け:
//   ・10R×2大当り(約3000個/実獲得2800個)→継続：50%
//   ・10R×4大当り+α(約6000個+α/実獲得5600個+α)→寿限無RUSH極(LT、ST132回)へ：50%
// 寿限無RUSH極中（特図2・電チュー入賞時、当選確率1/97.0）の振り分け:
//   ・10R×2大当り(約3000個)→継続：93%
//   ・10R×4大当り+α(約6000個+α)→継続：7%
// （寿限無RUSH継続率約50%は、素の1-(1-1/97.0)^66≈49.5%とほぼ完全に一致し、
// 寿限無RUSH極継続率約75%も、素の1-(1-1/97.0)^132≈74.5%とほぼ完全に一致するため、
// いずれも残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【「水戸チャージ」は通常状態の確率に合算する形で簡略化した】
// 「図柄揃い確率（通常時）1/399.8」の脚注に「水戸チャージを除く当選確率（大当たり
// 確率1/348.5）」とあり、1/399.8は図柄揃いと水戸チャージ経由の当選を合算した値だと
// 分かる。水戸チャージ自体の発生率・出玉振り分けの詳細（1geki.jp上の個別ページ）は
// この概要ページには含まれていなかったため、通常状態の確率をこの合算値1/399.8とし、
// 振り分けは図柄揃い時の円グラフ（48%/52%）をそのまま流用する簡略化とした。
//
// 【「10R×4大当り+α」の「+α」は未実装】
// 上振れ分の発生条件・確率が1geki.jp上に記載されておらず、実獲得5600個を基本値
// として採用した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率いずれも14/15）。10R×2・×4も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-koumon-jlls",
  slug: "e-koumon-jlls",
  name: "e黄門ちゃま 寿限無LLサイズ",
  nameKana: "いーこうもんちゃまじゅげむえるえるさいず",
  aliases: ["黄門ちゃま寿限無", "寿限無RUSH", "黄門ちゃまパチンコ", "e黄門ちゃま"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2025,
  category: "パチンコ（スマパチ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時当選確率：1/399.8（図柄揃い1/348.5と水戸チャージの合算値）",
    "寿限無RUSH・寿限無RUSH極中の当選確率：1/97.0",
    "寿限無RUSH：ST66回、継続率約50%",
    "寿限無RUSH極（LT）：ST132回、継続率約75%",
    "寿限無RUSH突入率：約52%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが約48%、2R・実獲得約280個で寿限無RUSHへが約52%",
    "寿限無RUSH中の当選振り分け：10R×2・実獲得約2800個で継続が50%、10R×4・実獲得約5600個で寿限無RUSH極へが50%",
    "寿限無RUSH極中の当選振り分け：10R×2・実獲得約2800個で継続が93%、10R×4・実獲得約5600個で継続が7%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.52,
            rounds: 2,
            balls: 280,
            nextState: "jugemuRush",
            tag: "toRush",
            resultNote: "寿限無RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    jugemuRush: {
      id: "jugemuRush",
      label: "寿限無RUSH",
      mode: "countDown",
      maxAttempts: 66,
      probability: 1 / 97.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "jugemuRush",
            tag: "continue",
          },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "jugemuRushKiwami",
            tag: "toKiwami",
            resultNote: "寿限無RUSH極",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "寿限無RUSH終了" },
    },

    jugemuRushKiwami: {
      id: "jugemuRushKiwami",
      label: "寿限無RUSH極",
      mode: "countDown",
      maxAttempts: 132,
      probability: 1 / 97.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.93,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "jugemuRushKiwami",
            tag: "continue",
          },
          {
            weight: 0.07,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "jugemuRushKiwami",
            tag: "continueBig",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kiwamiEnd", resultLabel: "寿限無RUSH極終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 2800, 2: 280 },
});
