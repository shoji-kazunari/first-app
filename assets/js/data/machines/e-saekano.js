// 第94号機: ｅ冴えない彼女の育てかた（2025年 Daito（大都技研） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_saekano/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・冴えてる彼女RUSH・冴えてる彼女RUSH♭）を
// ダウンロードしてReadツールで直接読み取った実数値。ラウンド数（○R）の表記がスペック
// 表に無く、払い出し個数のみが公開されているため、rounds:1の形式的な値で表現した
// （e-accelerator-saikyo.js等と同じ扱い）。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/179.6）の振り分け:
//   ・大当り(約300個/実獲得280個)→通常（時短なし）：49.0%
//   ・大当り(約300個)→冴えてる彼女RUSH(ST55回)へ：51.0%
// 冴えてる彼女RUSH中（特図2・電チュー入賞時、当選確率1/35.1）の振り分け:
//   ・大当り(約300個)→継続：50.0%
//   ・大当り(約600個/実獲得560個)→継続：25.0%
//   ・大当り(約1200個/実獲得1120個)→継続：10.0%
//   ・大当り(約2400個/実獲得2240個)→冴えてる彼女RUSH♭(LT、ST86回)へ：15.0%
// 冴えてる彼女RUSH♭中（特図2・電チュー入賞時、当選確率1/35.1）の振り分け:
//   ・大当り(約300個)→継続：50.0%　・大当り(約600個)→継続：25.0%
//   ・大当り(約1200個)→継続：10.0%　・大当り(約2400個)→継続：15.0%
// （冴えてる彼女RUSH継続率約80%は、素の1-(1-1/35.1)^55≈79.6%とほぼ完全に一致し、
// 冴えてる彼女RUSH♭継続率約92%も、素の1-(1-1/35.1)^86≈91.7%とほぼ完全に一致する
// ため、いずれも残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（約2400個/実獲得2240個、約1200個/実獲得
// 1120個、約600個/実獲得560個、約300個/実獲得280個、いずれも比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-saekano",
  slug: "e-saekano",
  name: "ｅ冴えない彼女の育てかた",
  nameKana: "いーさえないかのじょのそだてかた",
  aliases: ["冴えカノ", "冴えない彼女の育てかたパチンコ", "冴えてる彼女RUSH", "eサエカノ"],
  manufacturer: { id: "daito", name: "Daito（大都技研）" },
  releaseYear: 2025,
  category: "パチンコ（スマパチ・ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/179.6",
    "冴えてる彼女RUSH・冴えてる彼女RUSH♭中の当選確率：1/35.1",
    "冴えてる彼女RUSH：ST55回、継続率約80%",
    "冴えてる彼女RUSH♭（LT）：ST86回、継続率約92%",
    "冴えてる彼女RUSH突入率：51%",
    "通常時の大当り振り分け（ヘソ入賞時）：実獲得約280個で通常のままが49.0%、実獲得約280個で冴えてる彼女RUSHへが51.0%",
    "冴えてる彼女RUSH・RUSH♭中の当選振り分け：実獲得約280個が50.0%、実獲得約560個が25.0%、実獲得約1120個が10.0%、実獲得約2240個（RUSH中のみRUSH♭へ）が15.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 179.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 1, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.51,
            rounds: 1,
            balls: 280,
            nextState: "saeteruRush",
            tag: "toRush",
            resultNote: "冴えてる彼女RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    saeteruRush: {
      id: "saeteruRush",
      label: "冴えてる彼女RUSH",
      mode: "countDown",
      maxAttempts: 55,
      probability: 1 / 35.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 280, nextState: "saeteruRush", tag: "continue300" },
          { weight: 0.25, rounds: 1, balls: 560, nextState: "saeteruRush", tag: "continue600" },
          { weight: 0.1, rounds: 1, balls: 1120, nextState: "saeteruRush", tag: "continue1200" },
          {
            weight: 0.15,
            rounds: 1,
            balls: 2240,
            nextState: "saeteruRushFlat",
            tag: "toRushFlat",
            resultNote: "冴えてる彼女RUSH♭",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "冴えてる彼女RUSH終了" },
    },

    saeteruRushFlat: {
      id: "saeteruRushFlat",
      label: "冴えてる彼女RUSH♭",
      mode: "countDown",
      maxAttempts: 86,
      probability: 1 / 35.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 1, balls: 280, nextState: "saeteruRushFlat", tag: "continue300" },
          { weight: 0.25, rounds: 1, balls: 560, nextState: "saeteruRushFlat", tag: "continue600" },
          { weight: 0.1, rounds: 1, balls: 1120, nextState: "saeteruRushFlat", tag: "continue1200" },
          { weight: 0.15, rounds: 1, balls: 2240, nextState: "saeteruRushFlat", tag: "continue2400" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushFlatEnd", resultLabel: "冴えてる彼女RUSH♭終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 1: 280 },
});
