// 第105号機: P FAIRY TAIL これが七炎竜の力だ89Ver.（2025年 FUJI（藤商事）
// 甘デジ/ラッキートリガー/二種）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_fairytail_lt89/）。当選時の振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（特図1振り分け・特図2振り分け・
// 上位ラッシュ振り分け）とゲームフロー画像をダウンロードしてReadツールで
// 直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/89）の振り分け:
//   ・約210個→通常のまま：約50%
//   ・約210個→FAIRY RUSHへ：約50%
// FAIRY RUSH中（特図2・電チュー入賞時、当選確率1/59）の振り分け:
//   ・約210個→継続：約60%
//   ・約1500個→継続：約27.5%
//   ・約1500個+α→七炎竜RUSHへ（一夜モード経由）：約12.5%
// 七炎竜RUSH中（特図2・電チュー入賞時、当選確率1/59）の振り分け:
//   ・約210個→継続：約60%
//   ・約1500個+α→継続（一夜モード経由）：約40%
// （「一夜モード」は約1500個を約40%の確率でループ加算する演出のため、
// bonusLoop（probability:0.4, balls:1500）でFAIRY RUSH→七炎竜RUSHの
// 昇格枝・七炎竜RUSHの自己継続枝の両方に付与した。
// FAIRY RUSH継続率約60%は、規定回数50回+残保留4個＝計54回の素の
// 1-(1-1/59)^54≈60.3%とほぼ完全に一致し、七炎竜RUSH継続率約88%も、
// 規定回数120回+残保留4個＝計124回の素の1-(1-1/59)^124≈88.0%と
// ほぼ完全に一致するため、いずれも標準の「規定回数+残保留4個」の
// countDownで再現できる）
//
// 【ラウンド数（rounds）について】
// このページはスペック表に「ラウンド数」の記載が無く、払い出し個数
// （約210個/約1500個/約1500個+α）のみで構成されている。実際のラウンド数が
// 不明なため、rounds値は出玉に影響しないダミー値として1を使い、実際の出玉は
// 各onHit.outcomesのballsで明示した（e-worlddaistar.js等と同じ考え方）。
//
// 【出玉について】
// このページには「実獲得個数」の記載が無く、払い出し個数をそのまま採用した
// （e-accelerator-saikyo.jsと同じ扱い）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-fairytail-lt89",
  slug: "p-fairytail-lt89",
  name: "P FAIRY TAIL これが七炎竜の力だ89Ver.",
  nameKana: "ぴーふぇありーているこれがななえんりゅうのちからだはちじゅうきゅうばー",
  aliases: ["フェアリーテイルパチンコ", "フェアリーテイル89", "FAIRY RUSH", "七炎竜RUSH", "一夜モード"],
  manufacturer: { id: "fuji", name: "FUJI（藤商事）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/89",
    "FAIRY RUSH・七炎竜RUSH中の当選確率：ともに1/59",
    "FAIRY RUSH：ST50回、継続率約60%",
    "七炎竜RUSH：ST120回、継続率約88%",
    "FAIRY RUSH突入率：約50%",
    "通常時の大当り振り分け（ヘソ入賞時）：約210個で通常のままが約50%、約210個でFAIRY RUSHへが約50%",
    "FAIRY RUSH中の当選振り分け：約210個で継続が約60%、約1500個で継続が約27.5%、約1500個で七炎竜RUSHへが約12.5%（一夜モード経由、約40%でさらに1500個ずつ上乗せしループ）",
    "七炎竜RUSH中の当選振り分け：約210個で継続が約60%、約1500個で継続が約40%（一夜モード経由、約40%でさらに1500個ずつ上乗せしループ）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 89,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 210, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 1, balls: 210, nextState: "fairyRush", tag: "toRush", resultNote: "FAIRY RUSH" },
        ],
      },
      onExhausted: null,
    },

    fairyRush: {
      id: "fairyRush",
      label: "FAIRY RUSH",
      mode: "countDown",
      maxAttempts: 54,
      probability: 1 / 59,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.6, rounds: 1, balls: 210, nextState: "fairyRush", tag: "continueSmall" },
          { weight: 0.275, rounds: 1, balls: 1500, nextState: "fairyRush", tag: "continueBig" },
          {
            weight: 0.125,
            rounds: 1,
            balls: 1500,
            nextState: "shichienryuuRush",
            tag: "toUpgrade",
            resultNote: "七炎竜RUSH",
            bonusLoop: { probability: 0.4, balls: 1500 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "FAIRY RUSH終了" },
    },

    shichienryuuRush: {
      id: "shichienryuuRush",
      label: "七炎竜RUSH",
      mode: "countDown",
      maxAttempts: 124,
      probability: 1 / 59,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.6, rounds: 1, balls: 210, nextState: "shichienryuuRush", tag: "continueSmall" },
          {
            weight: 0.4,
            rounds: 1,
            balls: 1500,
            nextState: "shichienryuuRush",
            tag: "continueBig",
            bonusLoop: { probability: 0.4, balls: 1500 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "七炎竜RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 1: 1500 },
});
