// 第78号機: P真・座頭市物語LT99ver.（2025年 newgin（ニューギン） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_shinzatouichi_lt99/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・竜騰虎闘モード＋激闘の鼓動中・
// 神速一閃モード中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/99.9）の振り分け:
//   ・2R大当り(約200個/実獲得180個)→激闘の鼓動(ST20回+残保留4個)へ：約79.5%
//   ・4R大当り(約400個/実獲得360個)→激闘の鼓動(ST20回+残保留4個)へ：約20.0%
//   ・10R大当り(約1000個/実獲得900個)→竜騰虎闘モード(ST51回+残保留4個)へ直行：約0.5%
// 激闘の鼓動・竜騰虎闘モード中（特図2・電チュー入賞時、当選確率約1/46.6、円グラフ
// 「竜騰虎闘モード・激闘の鼓動中」共通）の振り分け:
//   ・3R大当り(約300個/実獲得270個)→竜騰虎闘モードへ：約70.5%
//   ・10R大当り(約1000個)→竜騰虎闘モードへ：約19.5%
//   ・10R大当り(約1000個)→神速一閃モード(LT、ST130回+残保留4個)へ：約10.0%
// 神速一閃モード中（LT、特図2・電チュー入賞時、当選確率約1/46.6）の振り分け:
//   ・3R大当り(約300個)→継続：約70.5%
//   ・10R大当り(約1000個)→継続：約29.5%
// （激闘の鼓動突破率約41%は、素の1-(1-1/46.6)^20≈35.2%＋残保留4個込みの
// 1-(1-1/46.6)^24≈40.6%とほぼ一致し、竜騰虎闘モード継続率約70%も、
// 1-(1-1/46.6)^55≈69.7%とほぼ一致し、神速一閃モード継続率約95%も、
// 1-(1-1/46.6)^134≈94.5%とほぼ一致するため、いずれも「規定回数+残保留4個」を
// maxAttemptsに直接足し込むだけのシンプルなcountDownで再現できる
// （20+4=24、51+4=55、130+4=134）。神速一閃モードのループ率（3R70.5%/
// 10R29.5%）は、竜騰虎闘モード側の3R70.5%/10R19.5%/神速突入10.0%のうち
// 神速側だけを取り出した比率（19.5:10.0の和29.5に対する分配）と一致している）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 4R: 約400個/実獲得360個、3R: 約300個/実獲得270個、2R: 約200個/実獲得180個。
// いずれも比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-shinzatouichi-lt99",
  slug: "p-shinzatouichi-lt99",
  name: "P真・座頭市物語LT99ver.",
  nameKana: "ぴーしんざとういちものがたりえるてぃーきゅうじゅうきゅうばー",
  aliases: ["座頭市パチンコ", "座頭市LT99", "真・座頭市物語", "神速一閃モード"],
  manufacturer: { id: "newgin", name: "newgin（ニューギン）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/99.9",
    "激闘の鼓動・竜騰虎闘モード・神速一閃モード中の当選確率：約1/46.6",
    "激闘の鼓動：ST20回+残保留4個、突破率約41%",
    "竜騰虎闘モード：ST51回+残保留4個、継続率約70%",
    "神速一閃モード（LT）：ST130回+残保留4個、継続率約95%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約180個で激闘の鼓動へが約79.5%、4R・実獲得約360個で激闘の鼓動へが約20.0%、10R・実獲得約900個で竜騰虎闘モードへ直行が約0.5%",
    "激闘の鼓動・竜騰虎闘モード中の当選振り分け：3R・実獲得約270個で竜騰虎闘モードへが約70.5%、10R・実獲得約900個で竜騰虎闘モードへが約19.5%、10R・実獲得約900個で神速一閃モードへが約10.0%",
    "神速一閃モード中の当選振り分け：3R・実獲得約270個で継続が約70.5%、10R・実獲得約900個で継続が約29.5%",
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
            weight: 0.795,
            rounds: 2,
            balls: 180,
            nextState: "gekitouKodou",
            tag: "toKodou2r",
            resultNote: "激闘の鼓動",
          },
          {
            weight: 0.2,
            rounds: 4,
            balls: 360,
            nextState: "gekitouKodou",
            tag: "toKodou4r",
            resultNote: "激闘の鼓動",
          },
          {
            weight: 0.005,
            rounds: 10,
            balls: 900,
            nextState: "ryuutoukoutouMode",
            tag: "toRyuutou",
            resultNote: "竜騰虎闘モード",
          },
        ],
      },
      onExhausted: null,
    },

    gekitouKodou: {
      id: "gekitouKodou",
      label: "激闘の鼓動",
      mode: "countDown",
      maxAttempts: 24,
      probability: 1 / 46.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.705,
            rounds: 3,
            balls: 270,
            nextState: "ryuutoukoutouMode",
            tag: "toRyuutou3r",
            resultNote: "竜騰虎闘モード",
          },
          {
            weight: 0.195,
            rounds: 10,
            balls: 900,
            nextState: "ryuutoukoutouMode",
            tag: "toRyuutou10r",
            resultNote: "竜騰虎闘モード",
          },
          {
            weight: 0.1,
            rounds: 10,
            balls: 900,
            nextState: "shinsokuIssenMode",
            tag: "toShinsoku",
            resultNote: "神速一閃モード",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kodouEnd", resultLabel: "激闘の鼓動終了" },
    },

    ryuutoukoutouMode: {
      id: "ryuutoukoutouMode",
      label: "竜騰虎闘モード",
      mode: "countDown",
      maxAttempts: 55,
      probability: 1 / 46.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.705, rounds: 3, balls: 270, nextState: "ryuutoukoutouMode", tag: "continue3r" },
          { weight: 0.195, rounds: 10, balls: 900, nextState: "ryuutoukoutouMode", tag: "continue10r" },
          {
            weight: 0.1,
            rounds: 10,
            balls: 900,
            nextState: "shinsokuIssenMode",
            tag: "toShinsoku",
            resultNote: "神速一閃モード",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ryuutouEnd", resultLabel: "竜騰虎闘モード終了" },
    },

    shinsokuIssenMode: {
      id: "shinsokuIssenMode",
      label: "神速一閃モード",
      mode: "countDown",
      maxAttempts: 134,
      probability: 1 / 46.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.705, rounds: 3, balls: 270, nextState: "shinsokuIssenMode", tag: "continue3r" },
          { weight: 0.295, rounds: 10, balls: 900, nextState: "shinsokuIssenMode", tag: "continue10r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "shinsokuEnd", resultLabel: "神速一閃モード終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 4: 360, 3: 270, 2: 180 },
});
