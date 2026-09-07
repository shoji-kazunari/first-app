// 第84号機: Pゾンビランドサガ（2025年 Sammy（サミー） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_zonsaga/）。大当り振り分けは、同ページに
// 掲載されている4枚の円グラフ画像（通常時・サガRUSH中・サガRUSH LTチャンス中・
// 七福ヘドバンRUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/159.8）の振り分け:
//   ・3R大当り(約405個/実獲得378個)→通常（時短なし）：50.0%
//   ・3R大当り(約405個)→サガRUSH(ST90回)へ：50.0%
// サガRUSH中（特図2・電チュー入賞時、当選確率1/71.4）の振り分け:
//   ・STリセット(出玉無し)→継続：20.0%
//   ・10R大当り(約1225個/実獲得1134個)→継続：40.0%
//   ・4R大当り(約415個/実獲得378個)→継続：20.0%
//   ・10R大当り(約1225個)→サガRUSH LTチャンスへ：20.0%
// サガRUSH LTチャンス中（特図2・電チュー入賞時、当選確率1/71.4）の振り分け:
//   ・STリセット(出玉無し)→継続：20.0%
//   ・10R大当り(約1225個)→七福ヘドバンRUSH(LT、実質次回まで)へ：40.0%
//   ・10R大当り(約1225個)→継続：40.0%
// 七福ヘドバンRUSH中（特図2・電チュー入賞時、当選確率1/36.6）の振り分け:
//   ・10R大当り(約1225個)→通常（時短なし）：12.2%
//   ・10R大当り(約1225個)→継続：87.8%
//
// 【継続率と残保留について】
// サガRUSH継続率約76%（残保留込み）に対し、素の1-(1-1/71.4)^90≈71.9%と、
// 残保留4個を同じ1/71.4のまま加えた1-(1-1/71.4)^94≈73.4%のどちらも公表値に
// 届かない。スペック表には「特図2残保留：1/29.6」という、本編（1/71.4）より
// 明確に高い専用の残保留確率が別途記載されており、90回消化後にこの1/29.6で
// 4回だけ追加判定すると1-0.2810×(1-1/29.6)^4≈75.5%となり、公表の「約76%」と
// ほぼ一致する。ただしstateEngineのresidualAttemptsはonFall（転落式）専用で、
// 規定回数消化型のこの機種にはそのまま流用できない（p-madokamagica3.js等と
// 同じ理由）ため、この残保留（本編と異なる確率での4回）は実装せず、素の
// maxAttempts=90のシンプルなcountDownとした（ギャップは既知のまま残す）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1225個/実獲得1134個、
// 4R: 約415個/実獲得378個、3R: 約405個/実獲得378個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-zonsaga",
  slug: "p-zonsaga",
  name: "Pゾンビランドサガ",
  nameKana: "ぴーぞんびらんどさが",
  aliases: ["ゾンサガ", "ゾンビランドサガパチンコ", "七福ヘドバンRUSH", "サガRUSH"],
  manufacturer: { id: "sammy", name: "Sammy（サミー）" },
  releaseYear: 2025,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/159.8",
    "サガRUSH・サガRUSH LTチャンス中の当選確率：1/71.4",
    "七福ヘドバンRUSH中の当選確率：1/36.6",
    "サガRUSH・サガRUSH LTチャンス：ST90回、継続率約76%（残保留込み、詳細はコメント参照）",
    "七福ヘドバンRUSH（LT）：実質次回まで、継続率約89.4%",
    "RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約378個で通常のままが50.0%、3R・実獲得約378個でサガRUSHへが50.0%",
    "サガRUSH中の当選振り分け：STリセットで継続が20.0%、10R・実獲得約1134個で継続が40.0%、4R・実獲得約378個で継続が20.0%、10R・実獲得約1134個でサガRUSH LTチャンスへが20.0%",
    "サガRUSH LTチャンス中の当選振り分け：STリセットで継続が20.0%、10R・実獲得約1134個で七福ヘドバンRUSHへが40.0%、10R・実獲得約1134個で継続が40.0%",
    "七福ヘドバンRUSH中の当選振り分け：10R・実獲得約1134個で通常のままが12.2%、10R・実獲得約1134個で継続が87.8%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 159.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 378, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 3,
            balls: 378,
            nextState: "sagaRush",
            tag: "toSagaRush",
            resultNote: "サガRUSH",
          },
        ],
      },
      onExhausted: null,
    },

    sagaRush: {
      id: "sagaRush",
      label: "サガRUSH",
      mode: "countDown",
      maxAttempts: 90,
      probability: 1 / 71.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 1, balls: 0, nextState: "sagaRush", tag: "stReset" },
          { weight: 0.4, rounds: 10, balls: 1134, nextState: "sagaRush", tag: "continue10r" },
          { weight: 0.2, rounds: 4, balls: 378, nextState: "sagaRush", tag: "continue4r" },
          {
            weight: 0.2,
            rounds: 10,
            balls: 1134,
            nextState: "sagaRushLtChance",
            tag: "toLtChance",
            resultNote: "サガRUSH LTチャンス",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "サガRUSH終了" },
    },

    sagaRushLtChance: {
      id: "sagaRushLtChance",
      label: "サガRUSH LTチャンス",
      mode: "countDown",
      maxAttempts: 90,
      probability: 1 / 71.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 1, balls: 0, nextState: "sagaRushLtChance", tag: "stReset" },
          {
            weight: 0.4,
            rounds: 10,
            balls: 1134,
            nextState: "shichifukuHeadbangRush",
            tag: "toHeadbang",
            resultNote: "七福ヘドバンRUSH",
          },
          { weight: 0.4, rounds: 10, balls: 1134, nextState: "sagaRushLtChance", tag: "continue10r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltChanceEnd", resultLabel: "サガRUSH LTチャンス終了" },
    },

    shichifukuHeadbangRush: {
      id: "shichifukuHeadbangRush",
      label: "七福ヘドバンRUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 36.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.122, rounds: 10, balls: 1134, nextState: "normal", tag: "end" },
          {
            weight: 0.878,
            rounds: 10,
            balls: 1134,
            nextState: "shichifukuHeadbangRush",
            tag: "continue",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1134, 4: 378, 3: 378 },
});
