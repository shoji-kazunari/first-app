// 第106号機: eフィーバーダンベル何キロ持てる？2（2026年 SANKYO（三共） スマパチ/
// ライトミドル/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_danberu2/）。当選時の振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（図柄揃い時・RUSH中）をダウンロード
// してReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/149.9）の振り分け:
//   ・2R大当り約300個(実獲得280個)→通常のまま：約75%
//   ・2R大当り約300個(実獲得280個)→RUSH(ST127回)へ：約25%
// RUSH中（特図2・電チュー入賞時、確率1/97.7）の振り分け（いずれもRUSH継続）:
//   ・約900個(実獲得840個)：約12.5%
//   ・約2100個(実獲得1960個)：約37.5%
//   ・約3300個(実獲得3080個)：約37.5%
//   ・約4500個(実獲得4200個)+ゴールデンタイム：約12.5%
// （注記「特図2大当り(1500個or300個)3回分の出玉の合計値」の通り、これらは
// 3回分の当り（300個or1500個）の合計表示だが、本実装では単純に合計値を
// そのまま1回のonHit outcomeとして扱った。「ゴールデンタイム」は最高値の
// 演出名で、遷移先はRUSH(ST127回)自体と変わらないため独立の状態にはしていない。
// 継続率約73%は、素の1-(1-1/97.7)^127≈72.9%とほぼ完全に一致するため、
// 残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R相当1500個→実獲得1400個、
// 2R相当300個→実獲得280個、比率14/15。RUSH中の合計値もこの比率で換算）。
//
// 【ラウンド数（rounds）について】
// RUSH中の当り（900個～4500個）はラウンド数の内訳が無く、賞球合計のみの
// 表示のため、rounds値は出玉に影響しないダミー値として1を使った
// （e-worlddaistar.js等と同じ考え方）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-danberu2",
  slug: "e-danberu2",
  name: "eフィーバーダンベル何キロ持てる？2",
  nameKana: "いーふぃーばーだんべるなんきろもてるにー",
  aliases: ["ダンベル何キロ持てる2パチンコ", "ダンベルパチンコ", "ゴールデンタイム"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2026,
  category: "パチンコ（スマパチ・ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/149.9",
    "RUSH中の当選確率：1/97.7",
    "RUSH：ST127回、継続率約73%",
    "RUSH突入率：約25%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが約75%、2R・実獲得約280個でRUSHへが約25%",
    "RUSH中の当選振り分け（いずれも継続）：実獲得約840個が約12.5%、実獲得約1960個が約37.5%、実獲得約3080個が約37.5%、実獲得約4200個（ゴールデンタイム）が約12.5%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 149.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.25, rounds: 2, balls: 280, nextState: "rush", tag: "toRush", resultNote: "RUSH" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 127,
      probability: 1 / 97.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.125, rounds: 1, balls: 840, nextState: "rush", tag: "continue900" },
          { weight: 0.375, rounds: 1, balls: 1960, nextState: "rush", tag: "continue2100" },
          { weight: 0.375, rounds: 1, balls: 3080, nextState: "rush", tag: "continue3300" },
          { weight: 0.125, rounds: 1, balls: 4200, nextState: "rush", tag: "continue4500", resultNote: "ゴールデンタイム" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 1: 4200 },
});
