// 第66号機: Pメイドインアビス 奈落の連環蝕（2025年 MACY（メーシー） パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_madeinabyss_naraku/）。大当り振り分けは、
// 同ページに掲載されている4枚の円グラフ画像（通常時・RUSH中・虹の黄金域中・連環蝕中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/129.7）の振り分け:
//   ・2R大当り(約200個/実獲得約180個)→通常（時短なし）：30.0%
//   ・2R大当り(約200個)→RUSH(時短次回or転落まで)：69.0%
//   ・10R大当り(約1000個/実獲得約900個)→虹の黄金域(次回まで)：1.0%
// RUSH中（特図2・電チュー入賞時、当選確率1/29.0＝大当り+小当り合算、転落確率1/72.4）の振り分け:
//   ・6R大当り(約600個/実獲得約540個)→RUSH継続：96.0%
//   ・10R大当り(約1000個)→虹の黄金域へ：4.0%
// 虹の黄金域中（電チュー入賞時・特図2）の振り分け:
//   ・6R大当り(約600個)→RUSHへ（LT外れ）：50.0%
//   ・6R大当り(約600個)→連環蝕(LT、次回まで)へ：46.0%
//   ・10R大当り(約1000個)→連環蝕へ：4.0%
// 連環蝕中（電チュー入賞時・特図2、LT）の振り分け:
//   ・6R大当り(約600個)→RUSHへ（LT終了）：12.0%
//   ・6R大当り(約600個)→連環蝕継続：84.0%
//   ・10R大当り(約1000個)→連環蝕継続：4.0%
// （連環蝕のループ率88%は、円グラフの84.0%+4.0%とちょうど一致する。RUSH・虹の黄金域・
// 連環蝕は仕様表の「時短・電サポ：次回大当たり or転落まで」という単一行が全状態に
// 共通することから、転落確率1/72.4は3状態とも共通と判断した）
//
// 【RUSH継続率約76%と、本実装の素の計算値約71.4%との差について】
// 素の計算 (1/29.0)/((1/29.0)+(1/72.4))≈71.4%に対し、公表の継続率は「約76%」で
// 約4.6ポイントの差がある。虹の黄金域の突入確率（約1/343.3）には「10R大当たりと
// C時短の合算」という注記があり、C時短という別の小当り経由の時短付与ルートが
// 存在することが分かるが、C時短自体の発生率・出玉は1geki.jp上に記載が無く、この
// ギャップの正確な内訳は特定できなかった。e-hokuto11-boukyou.js等と同じ扱いで、
// 開示された基本構造（転落式・虹の黄金域・連環蝕の分岐）をそのまま実装し、この
// 差分はギャップとして残した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 6R: 約600個/実獲得540個、2R: 約200個/実獲得180個。いずれも比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-madeinabyss-naraku",
  slug: "p-madeinabyss-naraku",
  name: "Pメイドインアビス 奈落の連環蝕",
  nameKana: "ぴーめいどいんあびすならくのれんかんしょく",
  aliases: [
    "メイドインアビス パチンコ",
    "メイドインアビス連環蝕",
    "奈落の連環蝕",
    "メイドインアビスパチンコ新台",
  ],
  manufacturer: { id: "macy", name: "MACY（メーシー）" },
  releaseYear: 2025,
  category: "パチンコ（ライト・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/129.7",
    "RUSH・虹の黄金域・連環蝕中の当選確率：1/29.0、転落確率：1/72.4",
    "RUSH・虹の黄金域・連環蝕：時短次回大当たりor転落まで",
    "RUSH突入率：70%",
    "RUSH継続率：約76%（本実装の素の計算値は約71.4%、詳細はファイル冒頭コメント参照）",
    "虹の黄金域突入確率：約1/343.3（10R大当たりとC時短の合算、C時短は未実装）",
    "連環蝕（LT）ループ率：88%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約180個で通常のままが30.0%、2R・実獲得約180個でRUSHへが69.0%、10R・実獲得約900個で虹の黄金域へが1.0%",
    "RUSH中の当選振り分け：6R・実獲得約540個で継続が96.0%、10R・実獲得約900個で虹の黄金域へが4.0%",
    "虹の黄金域中の当選振り分け：6R・実獲得約540個でRUSHへが50.0%、6R・実獲得約540個で連環蝕へが46.0%、10R・実獲得約900個で連環蝕へが4.0%",
    "連環蝕中の当選振り分け：6R・実獲得約540個でRUSHへが12.0%、6R・実獲得約540個で継続が84.0%、10R・実獲得約900個で継続が4.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 129.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 180, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.69,
            rounds: 2,
            balls: 180,
            nextState: "rush",
            tag: "toRush",
            resultNote: "RUSH",
          },
          {
            weight: 0.01,
            rounds: 10,
            balls: 900,
            nextState: "nijiOugon",
            tag: "toNiji",
            resultNote: "虹の黄金域",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 29.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.96, rounds: 6, balls: 540, nextState: "rush", tag: "continue" },
          {
            weight: 0.04,
            rounds: 10,
            balls: 900,
            nextState: "nijiOugon",
            tag: "toNiji",
            resultNote: "虹の黄金域",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 72.4,
        nextState: "normal",
        tag: "rushFall",
        resultLabel: "RUSH終了（転落）",
      },
    },

    nijiOugon: {
      id: "nijiOugon",
      label: "虹の黄金域",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 29.0,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 6,
            balls: 540,
            nextState: "rush",
            tag: "toRushDowngrade",
            resultNote: "RUSHへ",
          },
          {
            weight: 0.46,
            rounds: 6,
            balls: 540,
            nextState: "rengashoku",
            tag: "toRengashoku",
            resultNote: "連環蝕",
          },
          {
            weight: 0.04,
            rounds: 10,
            balls: 900,
            nextState: "rengashoku",
            tag: "toRengashoku10r",
            resultNote: "連環蝕",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 72.4,
        nextState: "normal",
        tag: "nijiFall",
        resultLabel: "虹の黄金域終了（転落）",
      },
    },

    rengashoku: {
      id: "rengashoku",
      label: "連環蝕",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 29.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.12,
            rounds: 6,
            balls: 540,
            nextState: "rush",
            tag: "toRushDowngrade",
            resultNote: "RUSHへ",
          },
          { weight: 0.84, rounds: 6, balls: 540, nextState: "rengashoku", tag: "continue" },
          { weight: 0.04, rounds: 10, balls: 900, nextState: "rengashoku", tag: "continue10r" },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 72.4,
        nextState: "normal",
        tag: "rengashokuFall",
        resultLabel: "連環蝕終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 6: 540, 2: 180 },
});
