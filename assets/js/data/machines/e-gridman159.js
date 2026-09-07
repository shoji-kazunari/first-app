// 第67号機: スマパチ SSSS.GRIDMAN メガSTART 159ver.（2026年 NANASHOW（七匠） V-ST機/ライト）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_gridman159/）。大当り振り分けは、同ページに
// 掲載されている2枚の円グラフ画像（通常時・右打ち中）をダウンロードしてReadツールで
// 直接読み取った実数値。「右打ち中」の円グラフ1枚が電光RUSH・電光覚醒RUSHの両方の
// 電チュー入賞時振り分けを兼ねている（両状態とも当りは必ず電光覚醒RUSHへ、という
// 構造のため、個別の円グラフが無い）。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/159.8）の振り分け:
//   ・2R大当り(約300個/実獲得約280個)→通常（時短なし）：50.0%
//   ・2R大当り(約300個)→電光RUSH(時短100回)へ：50.0%
// 電チュー入賞時（特図2、右打ち中共通）の振り分け:
//   ・2R大当り(約300個)→電光覚醒RUSH(ST120回)へ：50.0%
//   ・10R大当り(約1500個/実獲得約1400個)→電光覚醒RUSH(ST120回)へ：50.0%
// （電光RUSH中・電光覚醒RUSH中とも、当りは必ず電光覚醒RUSHへ移行する＝電光RUSHへ
// 戻ることは無い）
//
// 【電光RUSH（時短100回）の当選確率について】
// スペック表には「通常時 約1/159.8」「ST中 約1/77.4」の2つの確率しか記載が無く、
// 電光RUSH（「時短」と表記され「ST」とは表記されない）自体の確率は書かれていない。
// 「電光覚醒RUSH突入率約48%（時短100回での引き戻し：約46.6%+残保留4個での
// 引き戻し：約2.48%の合算値）」の「46.6%」は、通常時と同じ確率1/159.8で100回
// 抽選した場合の的中率 1-(1-1/159.8)^100≈46.6%と完全に一致するため、電光RUSHは
// 通常時と同じ確率1/159.8のまま「時短」（電チューサポートのみ）と判断できる。
// 電光覚醒RUSH（ST120回、確率1/77.4）についても、120回のみでの的中率
// 1-(1-1/77.4)^120≈79.0%が「ST継続率:約79.0%」に完全に一致する。
//
// 【残保留4個の扱い】
// 両方とも「+残保留4個での引き戻し：約2.48%」という同一の値が使われているが、
// これは1/159.8での4回抽選 1-(1-1/159.8)^4≈2.47%であり、電光覚醒RUSH側（本来
// 1/77.4のはず）でも同じ通常時確率換算の値が使い回されている。この機種の残保留は
// 単純な「+4回」加算では公表値を厳密に再現できないため、実装では確率をそれぞれの
// 状態自身の確率のまま「規定回数+4」（電光RUSH:100+4=104、電光覚醒RUSH:120+4=124）
// のcountDownとした（電光RUSH:約47.9%、電光覚醒RUSH:約80.1%となり、公表の
// 「約48%」「約80%」という丸めた見出し数値にはほぼ一致する）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-gridman159",
  slug: "e-gridman159",
  name: "スマパチ SSSS.GRIDMAN メガSTART 159ver.",
  nameKana: "すまぱちえすえすえすえすぐりっどまんめがすたーとひゃくごじゅうきゅうばー",
  aliases: ["グリッドマン159", "グリッドマンパチンコ", "eグリッドマン", "SSSSグリッドマン159"],
  manufacturer: { id: "nanashow", name: "NANASHOW（七匠）" },
  releaseYear: 2026,
  category: "パチンコ（ライト・V-ST機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/159.8",
    "電光覚醒RUSH中の当選確率：約1/77.4",
    "電光RUSH：時短100回（+残保留4個）",
    "電光覚醒RUSH：ST120回（+残保留4個）、継続率約80%",
    "電光RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが50.0%、2R・実獲得約280個で電光RUSHへが50.0%",
    "電チュー入賞時の振り分け（電光RUSH中・電光覚醒RUSH中共通）：2R・実獲得約280個で電光覚醒RUSHへが50.0%、10R・実獲得約1400個で電光覚醒RUSHへが50.0%",
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
          { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "denkouRush",
            tag: "toDenkouRush",
            resultNote: "電光RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    denkouRush: {
      id: "denkouRush",
      label: "電光RUSH",
      mode: "countDown",
      maxAttempts: 104,
      probability: 1 / 159.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "denkouKakuseiRush",
            tag: "toKakusei2r",
            resultNote: "電光覚醒RUSH",
          },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "denkouKakuseiRush",
            tag: "toKakusei10r",
            resultNote: "電光覚醒RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "denkouRushEnd", resultLabel: "電光RUSH終了" },
    },

    denkouKakuseiRush: {
      id: "denkouKakuseiRush",
      label: "電光覚醒RUSH",
      mode: "countDown",
      maxAttempts: 124,
      probability: 1 / 77.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 280, nextState: "denkouKakuseiRush", tag: "continue2r" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "denkouKakuseiRush",
            tag: "continue10r",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kakuseiEnd", resultLabel: "電光覚醒RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
