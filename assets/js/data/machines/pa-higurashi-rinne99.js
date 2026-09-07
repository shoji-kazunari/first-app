// 第87号機: PAひぐらしのなく頃に 輪廻転生99Ver.（2025年 D-light（ディ・ライト） 甘デジ/転落抽選/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/pa_higurashi_rinne99/）。大当り振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（通常時・真惨劇RUSH／エンジェルモード中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/99.9）の振り分け:
//   ・4R大当り(約360個/実獲得320個)→エンジェルモート(時短100回)へ：95.0%
//   ・4R大当り(約360個)→真惨劇RUSH(次回まで)へ直行：5.0%
// エンジェルモート・真惨劇RUSH中で共通の振り分け（円グラフ「真惨劇RUSH／エンジェル
// モード中」、特図2・電チュー入賞時）:
//   ・4R大当り(約360個)→真惨劇RUSHへ：80.0%
//   ・10R大当り(約900個/実獲得800個)→真惨劇RUSHへ：20.0%
// （エンジェルモートは時短100回の「電チューが開くだけ」の状態で、当選確率は
// 通常時と同じ1/99.9のまま（「RUSH突入率約65%」＝5%＋95%×[100回消化中に
// 1/99.9で1回以上当たる確率約63.4%]≈65.3%と一致することから判断した）。
// 真惨劇RUSH自体は当選確率1/49.9・転落確率1/133.7の転落式で、継続率約73%は
// 素の (1/49.9)/((1/49.9)+(1/133.7))≈72.8%とほぼ完全に一致するため、残保留の
// 引き戻し等は無いと判断した）
//
// 【「遊タイム」（低確率199回転消化で大当り+RUSH突入濃厚、大当り間で1回のみ）は
// 未実装】
// pa-oumi-agnes-premium.jsと同じ理由（stateEngineは状態ごとに消化回数を管理して
// おり、通常→エンジェルモート→通常…と状態をまたいで低確率消化回数を積算し
// 続ける仕組みを持たない）で実装していない。低確率1/99.9を199回消化する前に
// 当たる確率は約87%で、遊タイムが発動するのは主に大きくハマった場合の下振れ
// ケースに限られる。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約900個/実獲得800個、
// 4R: 約360個/実獲得320個、いずれも比率8/9）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-higurashi-rinne99",
  slug: "pa-higurashi-rinne99",
  name: "PAひぐらしのなく頃に 輪廻転生99Ver.",
  nameKana: "ぴーえーひぐらしのなくころにりんねてんせいきゅうじゅうきゅうばー",
  aliases: ["ひぐらし輪廻転生", "ひぐらしパチンコ", "真惨劇RUSH", "ひぐらし99"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "真惨劇RUSH中の当選確率：1/49.9、転落確率：1/133.7",
    "エンジェルモート：時短100回（当選確率は通常時と同じ1/99.9）",
    "真惨劇RUSH：次回まで（転落式）、継続率約73%",
    "RUSH突入率：約65%（時短での引き戻しを含む）",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約320個でエンジェルモートへが95.0%、4R・実獲得約320個で真惨劇RUSHへ直行が5.0%",
    "エンジェルモート・真惨劇RUSH中の当選振り分け：4R・実獲得約320個が80.0%、10R・実獲得約800個が20.0%",
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
          {
            weight: 0.95,
            rounds: 4,
            balls: 320,
            nextState: "angelMoat",
            tag: "toAngelMoat",
            resultNote: "エンジェルモート",
          },
          {
            weight: 0.05,
            rounds: 4,
            balls: 320,
            nextState: "shinsangekiRush",
            tag: "toRushDirect",
            resultNote: "真惨劇RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    angelMoat: {
      id: "angelMoat",
      label: "エンジェルモート",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.8,
            rounds: 4,
            balls: 320,
            nextState: "shinsangekiRush",
            tag: "toRush4r",
            resultNote: "真惨劇RUSH",
          },
          {
            weight: 0.2,
            rounds: 10,
            balls: 800,
            nextState: "shinsangekiRush",
            tag: "toRush10r",
            resultNote: "真惨劇RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "angelMoatEnd", resultLabel: "エンジェルモート終了" },
    },

    shinsangekiRush: {
      id: "shinsangekiRush",
      label: "真惨劇RUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.8, rounds: 4, balls: 320, nextState: "shinsangekiRush", tag: "continue4r" },
          { weight: 0.2, rounds: 10, balls: 800, nextState: "shinsangekiRush", tag: "continue10r" },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 133.7,
        nextState: "normal",
        tag: "rushFall",
        resultLabel: "真惨劇RUSH終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 800, 4: 320 },
});
