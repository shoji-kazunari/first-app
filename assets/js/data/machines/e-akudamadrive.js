// 第71号機: eアクダマドライブ（2026年 SANYO（三洋物産） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_akudamadrive/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（図柄揃い時・ドラマチックST中・LTアクダマドライブ中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.6）の振り分け:
//   ・4R大当り(約600個/実獲得560個)→ドラマチックST(ST78回)へ：100%（ST突入率100%）
// ドラマチックST中（特図2・電チュー入賞時、当選確率1/85.9）の振り分け:
//   ・ST回数リセット(出玉無し)→ドラマチックST継続：約19%
//   ・10R大当り(約1500個/実獲得1400個)→ドラマチックSTorLT：約81%
// （「2回目のST中大当たりでLTに移行」という注記があり、ST中の大当たり（19%の
// ST回数リセットは含まない）を1回引くとドラマチックST継続、2回連続で引くとLT
// アクダマドライブへ格上げされる。maxAttemptsのcountDownだけでは「今回のSTで
// 大当たりを何回引いたか」を記憶できないため、pa-spumioki6-enk.jsと同じ「達成
// 段階ごとに別の状態を用意する」方式で、1回目未達のdramaticST1と、1回大当たり
// 済みのdramaticST2の2状態に分けて実装した）
// LTアクダマドライブ中（特図2・電チュー入賞時、当選確率1/85.9）の振り分け:
//   ・10R×2大当り(約3000個/実獲得2800個)→LTアクダマドライブ継続：100%
//
// （ST78回継続率約59.8%は、素の1-(1-1/85.9)^78≈59.9%とほぼ完全に一致し、
// ST120回継続率約75.4%も、素の1-(1-1/85.9)^120≈75.5%とほぼ完全に一致する。
// 残保留4個を加えたトータル継続率（約62%・約77%）も、規定回数+4のcountDown
// （ST78→82、ST120→124）でおおむね再現できる。ただし「残保留での大当たり後は
// ST(1回目)に突入」という、残保留経由の当りだけドラマチックST1へ戻すという
// 細かな挙動までは区別しておらず、残保留分もそのまま同じ状態のmaxAttemptsに
// 足し込む簡略化としている）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 4R: 約600個/実獲得560個、比率いずれも14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-akudamadrive",
  slug: "e-akudamadrive",
  name: "eアクダマドライブ",
  nameKana: "いーあくだまどらいぶ",
  aliases: ["アクダマドライブ パチンコ", "アクダマドライブ", "eアクダマ", "ドラマチックST"],
  manufacturer: { id: "sanyo-bussan", name: "SANYO（三洋物産）" },
  releaseYear: 2026,
  category: "パチンコ（スマパチ・ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.6",
    "ドラマチックST・LTアクダマドライブ中の当選確率：1/85.9",
    "ドラマチックST：ST78回、継続率約62%（残保留4個込み）",
    "LTアクダマドライブ：ST120回、継続率約77%（残保留4個込み）",
    "ST突入率：100%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約560個でドラマチックSTへが100%",
    "ドラマチックST中の当選振り分け：ST回数リセット（出玉無し）が約19%、10R・実獲得約1400個で継続or LTへが約81%（2回目の大当りでLTへ）",
    "LTアクダマドライブ中の当選振り分け：10R×2・実獲得約2800個で継続が100%",
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
            weight: 1,
            rounds: 4,
            balls: 560,
            nextState: "dramaticSt1",
            tag: "toDramaticSt",
            resultNote: "ドラマチックST",
          },
        ],
      },
      onExhausted: null,
    },

    dramaticSt1: {
      id: "dramaticSt1",
      label: "ドラマチックST",
      mode: "countDown",
      maxAttempts: 82,
      probability: 1 / 85.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.19, rounds: 1, balls: 0, nextState: "dramaticSt1", tag: "stReset" },
          {
            weight: 0.81,
            rounds: 10,
            balls: 1400,
            nextState: "dramaticSt2",
            tag: "firstBigHit",
            resultNote: "ドラマチックST継続（次でLT濃厚）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "dramaticSt1End", resultLabel: "ドラマチックST終了" },
    },

    dramaticSt2: {
      id: "dramaticSt2",
      label: "ドラマチックST",
      mode: "countDown",
      maxAttempts: 82,
      probability: 1 / 85.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.19, rounds: 1, balls: 0, nextState: "dramaticSt2", tag: "stReset" },
          {
            weight: 0.81,
            rounds: 10,
            balls: 1400,
            nextState: "ltAkudamaDrive",
            tag: "secondBigHit",
            resultNote: "LTアクダマドライブ",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "dramaticSt2End", resultLabel: "ドラマチックST終了" },
    },

    ltAkudamaDrive: {
      id: "ltAkudamaDrive",
      label: "LTアクダマドライブ",
      mode: "countDown",
      maxAttempts: 124,
      probability: 1 / 85.9,
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
            displayRounds: 20,
            balls: 2800,
            nextState: "ltAkudamaDrive",
            tag: "continue",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltEnd", resultLabel: "LTアクダマドライブ終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 4: 560 },
});
