// 第79号機: P海物語 極JAPAN（2025年 SANYO（三洋物産） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_umi_kiwamijapan/）。大当り振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（通常時・ST中）をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.6）の振り分け:
//   ・10R大当り(約1500個/実獲得1400個)→極チャンス(ST20回+残保留4個)へ：50.0%
//   ・10R大当り(約1500個)→極ノ刻(ST100回+残保留4個)へ直行：50.0%
// ST中（特図2・電チュー入賞時、当選確率1/73.9、円グラフ「ST中」）の振り分け:
//   ・2R大当り(約300個/実獲得280個)：25.0%
//   ・10R大当り(約1500個)：55.0%
//   ・10R×2大当り+α(約3000個+上乗せチャンス/実獲得2800個)：20.0%
// （極チャンス自体の専用円グラフは無いため、電チュー入賞時の振り分けは極チャンス・
// 極ノ刻とも共通の「ST中」円グラフを流用し、極チャンス中の当りは必ず極ノ刻へ
// 移行するものとして実装した。極ノ刻トータル突入率約64%は「50%（直行）+50%×
// 約28%（極チャンス経由）」で説明でき、実際50+50×0.28=64.0%と一致する。
// 極チャンスの引き戻し率約28%も、素の1-(1-1/73.9)^24≈27.9%とほぼ完全に一致し、
// 極ノ刻継続率約76%も、素の1-(1-1/73.9)^104≈75.9%とほぼ一致するため、いずれも
// 「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけのシンプルな
// countDownで再現できる（20+4=24、100+4=104）」)
//
// 【「上乗せチャンス」（約1/4で約300個or約1500個の上乗せ）は未実装】
// 上乗せ発生時に300個・1500個のどちらが選ばれるかの内訳（重み）が1geki.jp上に
// 記載されておらず、上乗せ無しの実獲得約2800個を基本値として採用した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率いずれも14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-umi-kiwamijapan",
  slug: "p-umi-kiwamijapan",
  name: "P海物語 極JAPAN",
  nameKana: "ぴーうみものがたりきわめじゃぱん",
  aliases: ["海物語極ジャパン", "極ジャパン", "海物語パチンコ極JAPAN", "極ノ刻"],
  manufacturer: { id: "sanyo-bussan", name: "SANYO（三洋物産）" },
  releaseYear: 2025,
  category: "パチンコ（ミドル・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.6",
    "極チャンス・極ノ刻中の当選確率：1/73.9",
    "極チャンス：ST20回+残保留4個、引き戻し率約28%",
    "極ノ刻：ST100回+残保留4個、継続率約76%",
    "極ノ刻トータル突入率：約64%（直行50%+極チャンス経由14%）",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で極チャンスへが50.0%、10R・実獲得約1400個で極ノ刻へ直行が50.0%",
    "電チュー入賞時の当選振り分け（極チャンス・極ノ刻共通）：2R・実獲得約280個が25.0%、10R・実獲得約1400個が55.0%、10R×2・実獲得約2800個+上乗せチャンスが20.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "kiwamiChance",
            tag: "toChance",
            resultNote: "極チャンス",
          },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "kiwamiNoToki",
            tag: "toKiwami",
            resultNote: "極ノ刻",
          },
        ],
      },
      onExhausted: null,
    },

    kiwamiChance: {
      id: "kiwamiChance",
      label: "極チャンス",
      mode: "countDown",
      maxAttempts: 24,
      probability: 1 / 73.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.25,
            rounds: 2,
            balls: 280,
            nextState: "kiwamiNoToki",
            tag: "toKiwami2r",
            resultNote: "極ノ刻",
          },
          {
            weight: 0.55,
            rounds: 10,
            balls: 1400,
            nextState: "kiwamiNoToki",
            tag: "toKiwami10r",
            resultNote: "極ノ刻",
          },
          {
            weight: 0.2,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kiwamiNoToki",
            tag: "toKiwami20r",
            resultNote: "極ノ刻、上乗せチャンス",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceEnd", resultLabel: "極チャンス終了" },
    },

    kiwamiNoToki: {
      id: "kiwamiNoToki",
      label: "極ノ刻",
      mode: "countDown",
      maxAttempts: 104,
      probability: 1 / 73.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 2, balls: 280, nextState: "kiwamiNoToki", tag: "continue2r" },
          { weight: 0.55, rounds: 10, balls: 1400, nextState: "kiwamiNoToki", tag: "continue10r" },
          {
            weight: 0.2,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kiwamiNoToki",
            tag: "continue20r",
            resultNote: "上乗せチャンス",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kiwamiEnd", resultLabel: "極ノ刻終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
