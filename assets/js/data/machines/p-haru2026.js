// 第55号機: P 春一番 2026（2026年 Sophia パチンコ/ST機・甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_haru2026/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・乱舞モード中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1&特図2・通常時、大当り確率約1/89.9）の振り分け:
//   ・2R大当り(約200個)→乱舞モード(ST60回)：15.0%
//   ・4R大当り(約400個)→乱舞モード(ST60回)：70.0%
//   ・10R大当り(約1000個)→乱舞モード(ST60回)：15.0%
// （通常時の大当りは必ず乱舞モードへ突入するため、「通常のまま」の枠は無い）
// 電チュー入賞時（特図2・乱舞モード中、大当り確率約1/65.9）の振り分け:
//   ・4R大当り(約400個)→乱舞モード継続：75.0%
//   ・10R大当り(約1000個)→乱舞モード継続：25.0%
// （乱舞モードは規定回数（60回）を全弾外すと通常へ。継続率約60%は、素の
// 1-(1-1/65.9)^60≈60.0%と完全に一致しており、残保留等の引き戻しは無い）
//
// 【出玉比率について（この機種は9/10）】
// 他の多くの機種は実獲得個数が払い出し個数の14/15だが、本機は独自の9/10比率
// （10R:約1000個/実獲得900個、4R:約400個/実獲得360個、2R:約200個/実獲得180個）。
// スペック表に明記されている実獲得個数をそのまま採用した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-haru2026",
  slug: "p-haru2026",
  name: "P 春一番 2026",
  nameKana: "ぴーはるいちばんにーぜろにーろく",
  aliases: ["春一番2026", "P春一番", "春一番パチンコ2026"],
  manufacturer: { id: "sophia", name: "Sophia（ソフィア）" },
  releaseYear: 2026,
  category: "パチンコ（ST機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/89.9",
    "乱舞モード中の大当り確率：約1/65.9",
    "乱舞モード：ST60回、継続率約60%",
    "ST突入率：100%（通常時の大当りは必ず乱舞モードへ）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約180個で乱舞モードが15.0%、4R・実獲得約360個で乱舞モードが70.0%、10R・実獲得約900個で乱舞モードが15.0%",
    "乱舞モード中の当選振り分け（電チュー入賞時）：4R・実獲得約360個で継続が75.0%、10R・実獲得約900個で継続が25.0%",
    "乱舞モードは規定回数（60回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 89.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.15,
            rounds: 2,
            balls: 180,
            nextState: "ranbuMode",
            tag: "toRanbu2R",
            resultNote: "乱舞モード",
          },
          {
            weight: 0.7,
            rounds: 4,
            balls: 360,
            nextState: "ranbuMode",
            tag: "toRanbu4R",
            resultNote: "乱舞モード",
          },
          {
            weight: 0.15,
            rounds: 10,
            balls: 900,
            nextState: "ranbuMode",
            tag: "toRanbu10R",
            resultNote: "乱舞モード",
          },
        ],
      },
      onExhausted: null,
    },

    ranbuMode: {
      id: "ranbuMode",
      label: "乱舞モード",
      mode: "countDown",
      maxAttempts: 60,
      probability: 1 / 65.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 4, balls: 360, nextState: "ranbuMode", tag: "continue400" },
          { weight: 0.25, rounds: 10, balls: 900, nextState: "ranbuMode", tag: "continue1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ranbuEnd", resultLabel: "乱舞モード終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 180, 4: 360, 10: 900 },
});
