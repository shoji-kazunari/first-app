// 第91号機: PLT OVERLORD魔導王光臨129ver.（2025年 SanseiR&D（サンセイR&D） ライト/ラッキートリガー/二種）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_lt_overlord129/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・シャルティアバトル中・
// OVERMAX中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/129.7）の振り分け:
//   ・2R大当り(約200個/実獲得180個)→通常（時短なし）：50%
//   ・2R大当り(約200個)→シャルティアバトル(時短1回)へ：50%
// シャルティアバトル中（「時短1回」の即時解決する演出、電チュー入賞時・特図2、
// 当選確率約1/1.398）の振り分け:
//   ・10R大当り(約1000個/実獲得900個)→継続：約90.5%
//   ・10R大当り(約1000個)→OVERMAX(LT、時短200回)へ：約9.5%
// OVERMAX中（同じく即時解決する演出、電チュー入賞時・特図2）の振り分け:
//   ・10R大当り(約1000個)→継続：約89.5%
//   ・10R大当り(約1000個)→通常（時短なし）：約10.5%
// （シャルティアバトル・OVERMAXとも当選確率が約1/1.398と極めて高く、時短1回・
// 時短200回という規定回数の消化がほぼ確実に完了する構造のため、
// e-accelerator-saikyo.jsのsaikyoJudgmentと同じ「probability:1、mode:countUp」の
// 即時解決する状態として実装した（規定回数countDownで再現しても実質的に
// ほぼ同じ結果になる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 2R: 約200個/実獲得180個、いずれも比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-lt-overlord129",
  slug: "p-lt-overlord129",
  name: "PLT OVERLORD魔導王光臨129ver.",
  nameKana: "ぴーえるてぃーおーばーろーどまどうおうこうりんひゃくにじゅうきゅうばー",
  aliases: ["オーバーロードパチンコ", "オーバーロード129", "シャルティアバトル", "OVERMAX"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D（サンセイR&D）" },
  releaseYear: 2025,
  category: "パチンコ（ライト・ラッキートリガー・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/129.7",
    "シャルティアバトル：時短1回の即時解決演出、突破率約9.5%",
    "OVERMAX（LT）：時短200回の即時解決演出、継続率約89.5%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約180個で通常のままが50%、2R・実獲得約180個でシャルティアバトルへが50%",
    "シャルティアバトル中の振り分け：10R・実獲得約900個で継続が約90.5%、10R・実獲得約900個でOVERMAXへが約9.5%",
    "OVERMAX中の振り分け：10R・実獲得約900個で継続が約89.5%、10R・実獲得約900個で通常へが約10.5%",
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
          { weight: 0.5, rounds: 2, balls: 180, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 2,
            balls: 180,
            nextState: "sharutiaBattle",
            tag: "toBattle",
            resultNote: "シャルティアバトル",
          },
        ],
      },
      onExhausted: null,
    },

    sharutiaBattle: {
      id: "sharutiaBattle",
      label: "シャルティアバトル",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.905, rounds: 10, balls: 900, nextState: "sharutiaBattle", tag: "continue" },
          {
            weight: 0.095,
            rounds: 10,
            balls: 900,
            nextState: "overmax",
            tag: "toOvermax",
            resultNote: "OVERMAX",
          },
        ],
      },
      onExhausted: null,
    },

    overmax: {
      id: "overmax",
      label: "OVERMAX",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.895, rounds: 10, balls: 900, nextState: "overmax", tag: "continue" },
          { weight: 0.105, rounds: 10, balls: 900, nextState: "normal", tag: "end", resultNote: "通常へ" },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 2: 180 },
});
