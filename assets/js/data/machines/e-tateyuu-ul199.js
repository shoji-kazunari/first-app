// 第103号機: e盾の勇者の成り上がり アルティメット199ver.（2026年 TAIYO ELEC
// （タイヨーエレック） ライトミドル/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_tateyuu_ul199/）。当選時の振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・RISING RUSH勝利時・
// 裏アルティメットタイム中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/199）の振り分け:
//   ・2R大当り約280個→通常のまま：48.0%
//   ・2R大当り約280個→RISING RUSHへ：49.9%
//   ・2R+10R大当り+α 約1680個+α→裏アルティメットタイム(時短80回)へ直行：2.0%
//   ・10R大当り×2+α 約2800個+α→裏アルティメットタイム(時短80回)へ直行：0.1%
// RISING RUSH（電チュー入賞時・特図2、転落式）:
//   当選確率1/45.2、転落確率1/23.7（勝率約40%）。
//   （素の勝率p0=(1/45.2)/((1/45.2)+(1/23.7))≈34.4%に、残保留4個ぶんの
//   引き戻し1-(1-1/45.2)^4≈8.6%を足し合わせた0.344+(1-0.344)×0.086≈40.0%が
//   公表の「RISING RUSH突破率約40%」とほぼ完全に一致するため、e-accel-world.jsと
//   同じonFall.residualAttempts:4（標準の残保留4個）で再現できる）
//   勝利時の振り分け: 10R大当り×2 約2800個→裏アルティメットタイム(時短80回)へ：90.0%、
//   10R大当り×3+α 約4200個+α→裏アルティメットタイム(時短80回)へ：10.0%
// 裏アルティメットタイム中（電チュー入賞時・特図2、確率1/45.2）の振り分け:
//   ・10R大当り約1400個→継続：90.0%
//   ・10R大当り×2+α 約2800個+α→継続：10.0%
// （継続率約85%は、電サポ80回+残保留4個＝計84回の素の1-(1-1/45.2)^84≈84.7%と
// ほぼ完全に一致するため、追加の補正なしで再現できる）
//
// 【「ST回数：80回or10000回」の10000回は未実装】
// スペック表には「80回+残保留4個or10000回+残保留4個」とあるが、10000回に
// 分岐する条件・比率の記載が見当たらず、また継続率約85%は80回側だけで
// 再現できるため、10000回側は実装していない（他機種のp-lupin-zenigata77lt.js
// における同様の「10000回」未実装と同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。「+α」表記の出玉（1800個+α等）は
// 実獲得比率のみ換算し、+α分は未反映。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-tateyuu-ul199",
  slug: "e-tateyuu-ul199",
  name: "e盾の勇者の成り上がり アルティメット199ver.",
  nameKana: "いーたてのゆうしゃのなりあがりあるてぃめっとひゃくきゅうじゅうきゅうばー",
  aliases: ["盾の勇者の成り上がりパチンコ", "タテユウパチンコ", "RISING RUSH", "裏アルティメットタイム"],
  manufacturer: { id: "taiyo-elec", name: "TAIYO ELEC（タイヨーエレック）" },
  releaseYear: 2026,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199",
    "RISING RUSH中の当選確率：1/45.2（転落確率1/23.7の転落式）",
    "裏アルティメットタイム中の当選確率：1/45.2",
    "裏アルティメットタイム：時短80回、継続率約85%",
    "RISING RUSH突破率：約40%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが48.0%、2R・実獲得約280個でRISING RUSHへが49.9%、実獲得約1680個で裏アルティメットタイムへ直行が2.0%、実獲得約2800個で裏アルティメットタイムへ直行が0.1%",
    "RISING RUSH勝利時の振り分け：10R×2・実獲得約2800個で裏アルティメットタイムへが90.0%、10R×3・実獲得約4200個で裏アルティメットタイムへが10.0%",
    "裏アルティメットタイム中の当選振り分け：10R・実獲得約1400個で継続が90.0%、10R×2・実獲得約2800個で継続が10.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.499, rounds: 2, balls: 280, nextState: "risingRush", tag: "toRush", resultNote: "RISING RUSH" },
          {
            weight: 0.02,
            rounds: 10,
            balls: 1680,
            nextState: "uraUltimateTime",
            tag: "toLtDirectMid",
            resultNote: "裏アルティメットタイム",
          },
          {
            weight: 0.001,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "uraUltimateTime",
            tag: "toLtDirectBig",
            resultNote: "裏アルティメットタイム",
          },
        ],
      },
      onExhausted: null,
    },

    risingRush: {
      id: "risingRush",
      label: "RISING RUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 45.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.9,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "uraUltimateTime",
            tag: "toLtBig",
            resultNote: "裏アルティメットタイム",
          },
          {
            weight: 0.1,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "uraUltimateTime",
            tag: "toLtHuge",
            resultNote: "裏アルティメットタイム",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 23.7,
        nextState: "normal",
        tag: "risingRushFall",
        resultLabel: "RISING RUSH終了（転落）",
        residualAttempts: 4,
      },
    },

    uraUltimateTime: {
      id: "uraUltimateTime",
      label: "裏アルティメットタイム",
      mode: "countDown",
      maxAttempts: 84,
      probability: 1 / 45.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.9, rounds: 10, balls: 1400, nextState: "uraUltimateTime", tag: "continue" },
          {
            weight: 0.1,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "uraUltimateTime",
            tag: "continueBig",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltEnd", resultLabel: "裏アルティメットタイム終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
