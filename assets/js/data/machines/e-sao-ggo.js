// 第59号機: ｅソードアート・オンライン オルタナティブ ガンゲイル・オンライン
// （2026年 Daito スマパチ/ラッキートリガー機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_sao_ggo/）。「シリーズ最新機種
// （後継機）へ」とeソードアート・オンライン アリシゼーション 夜空への誘導が
// 出ている旧機種（型式名も別）だが、円グラフ・スペックとも掲載済みのため
// e-tokyoghoul.js等と同じ扱いで追加した。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・SJ JUDGE中・SJ RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.9）の振り分け:
//   ・大当り(約300個)→SJ JUDGE(ST50回)：97.0%
//   ・大当り(約4500個＝300個×3+300個×12)→SJ RUSH(ST160回)へ直行：3.0%
// （機種概要の本文には「必ずSJ JUDGEに突入」とあるが、円グラフでは3.0%が
// SJ RUSHへ直行する枠として明示されているため、円グラフの数値を優先した）
// 電チュー入賞時（特図2・SJ JUDGE中、大当り確率1/99.9）の振り分け:
//   ・大当り(約3600個＝300個×12)→SJ RUSHへ：100%
// （SJ JUDGEは規定回数（50回）を全弾外すと通常へ。突破率約40%は、素の
// 1-(1-1/99.9)^50≈39.5%とほぼ一致しており、残保留等の引き戻しは無い）
// 電チュー入賞時（特図2・SJ RUSH中、大当り確率1/99.9）の振り分け:
//   ・約3600個(300個×12)→SJ RUSH継続：約30%
//   ・約2100個(300個×7)→SJ RUSH継続：約20%
//   ・約1500個(300個×5)→SJ RUSH継続：約25%
//   ・約900個(300個×3)→SJ RUSH継続：約10%
//   ・約600個(300個×2)→SJ RUSH継続：約10%
//   ・約300個→SJ RUSH継続：約5%
// （SJ RUSHは規定回数（160回）を全弾外すと通常へ。継続率約80%は、素の
// 1-(1-1/99.9)^160≈80.0%と完全に一致しており、残保留等の引き戻しは無い）
//
// 【ラウンド数（rounds）について】
// このページはスペック表に「ラウンド数」の記載が無く（払い出し個数は
// すべて「300個の倍数」として表現されている）。実際のラウンド数が不明なため、
// rounds値は出玉に影響しないダミー値として1を使い、実際の出玉は各onHit.
// outcomesのballsで明示した（e-osubancyo-99.js等と同じ考え方）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（比率いずれも14/15：300個/280個、
// 600個/560個、900個/840個、1500個/1400個、2100個/1960個、3600個/3360個、
// 4500個/4200個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-sao-ggo",
  slug: "e-sao-ggo",
  name: "ｅソードアート・オンライン オルタナティブ ガンゲイル・オンライン",
  nameKana: "いーそーどあーとおんらいんおるたなてぃぶがんげいるおんらいん",
  aliases: ["SAO GGO", "ガンゲイルオンラインパチンコ", "eSAO GGO", "ソードアートオンラインGGO", "SAOガンゲイル"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.9",
    "SJ JUDGE・SJ RUSH中の大当り確率：ともに1/99.9",
    "SJ JUDGE：ST50回、突破率約40%",
    "SJ RUSH：ST160回、継続率約80%",
    "通常時の大当り振り分け（ヘソ入賞時）：実獲得約280個でSJ JUDGEが97.0%、実獲得約4200個（900個+3600個相当）でSJ RUSH直行が3.0%",
    "SJ JUDGE中の当選振り分け（電チュー入賞時）：実獲得約3360個でSJ RUSHへが100%",
    "SJ RUSH中の当選振り分け（電チュー入賞時）：実獲得約3360個が約30%、約1960個が約20%、約1400個が約25%、約840個が約10%、約560個が約10%、約280個が約5%（いずれも継続）",
    "SJ JUDGE・SJ RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.97, rounds: 1, balls: 280, nextState: "sjJudge", tag: "toSjJudge", resultNote: "SJ JUDGE" },
          {
            weight: 0.03,
            rounds: 1,
            balls: 4200,
            nextState: "sjRush",
            tag: "toSjRushDirect",
            resultNote: "SJ RUSH（900個+3600個）",
          },
        ],
      },
      onExhausted: null,
    },

    sjJudge: {
      id: "sjJudge",
      label: "SJ JUDGE",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 1, balls: 3360, nextState: "sjRush", tag: "toSjRush", resultNote: "SJ RUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "sjJudgeEnd", resultLabel: "SJ JUDGE終了" },
    },

    sjRush: {
      id: "sjRush",
      label: "SJ RUSH",
      mode: "countDown",
      maxAttempts: 160,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 1, balls: 3360, nextState: "sjRush", tag: "continue3600" },
          { weight: 0.2, rounds: 1, balls: 1960, nextState: "sjRush", tag: "continue2100" },
          { weight: 0.25, rounds: 1, balls: 1400, nextState: "sjRush", tag: "continue1500" },
          { weight: 0.1, rounds: 1, balls: 840, nextState: "sjRush", tag: "continue900" },
          { weight: 0.1, rounds: 1, balls: 560, nextState: "sjRush", tag: "continue600" },
          { weight: 0.05, rounds: 1, balls: 280, nextState: "sjRush", tag: "continue300" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "sjRushEnd", resultLabel: "SJ RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 1: 280 },
});
