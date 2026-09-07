// 第42号機: e 甲鉄城のカバネリ2 咲かせや燦然（2026年 GINZA スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kabaneri2/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// 本機は「シリーズ最新機種（後継機）へ」とe甲鉄城のカバネリ2 輪廻の果報 119ver.への
// 誘導が出ている旧機種（型式名も別）。輪廻の果報119ver.はe-kabaneri2-rinne119.jsで
// 別途追加済みだが、こちらの咲かせや燦然も今週のアクセスランキング30位に入っており
// 実働している台なので、e-tokyoghoul.js等と同じ扱いで別途追加した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.7）の振り分け:
//   ・5R大当り(約750個)→通常（時短なし）：50.0%
//   ・5R大当り(約750個)→RUSH「KABANERI OF THE IRON FORTRESS 海門決戦」(ST134回)：50.0%
// 電チュー入賞時（特図2・RUSH中、大当り確率1/98.3）の振り分け:
//   ・10R大当り(約1500個)→RUSH継続：約20%
//   ・5R×4大当り(約3000個)→RUSH継続：約73.8%
//   ・5R×8大当り(約6000個)→RUSH継続：約6.2%
// （RUSHは規定回数（134回）を全弾外すと通常へ。継続率約75%は、素の
// 1-(1-1/98.3)^134≈75.0%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【「6000個」の内訳・実装しなかった部分】
// 機種概要には「※2 約6000個＝約3000個当選時の最終保留が次回約3000個当選の場合」
// との記載があり、円グラフの6.2%という数値自体は「3000個当選が2回連続した」場合の
// 集計値である可能性が示唆されている。ただしこれは円グラフの6.2%という一次データ
// そのものを裏取りできる形で書き換える情報ではなく（「最終保留」の内部構造までは
// 数値が無い）、円グラフに実際に表示されている3択の確率（20%/73.8%/6.2%）は
// そのまま信頼できる値としてonHit.outcomesにそのまま採用した。
//
// 【上乗せ+αをbonusLoopで実装した理由】
// 「※3 +αは上乗せ当選時に約3000個を上乗せ。以降は約7.7%で約3000個がループする。」
// との記載があり、6.2%（約6000個）の枠に当選した後、成功する限り約3000個ずつ
// 上乗せし続けるループが明記されている。これはe-kabaneri2-rinne119.jsの
// 超輪廻ループ、e-tokyoghoul-tyo1geki.jsの喰MAXループと同じ構造のため、
// stateEngineのbonusLoopプリミティブ（probability: 0.077, balls: 2800）で
// そのまま正確に再現した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 5R: 約750個/実獲得700個、5R×4: 約3000個/実獲得2800個、5R×8: 約6000個/実獲得5600個、
// 比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kabaneri2-sakaseya",
  slug: "e-kabaneri2-sakaseya",
  name: "e 甲鉄城のカバネリ2 咲かせや燦然",
  nameKana: "いーこうてつじょうのかばねりつーさかせやさんぜん",
  aliases: ["カバネリ2咲かせや燦然", "カバネリ2旧台", "甲鉄城のカバネリ2咲かせや燦然", "eカバネリ2燦然"],
  manufacturer: { id: "ginza", name: "GINZA（銀座）" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.7",
    "RUSH「KABANERI OF THE IRON FORTRESS 海門決戦」中の大当り確率：1/98.3",
    "RUSH：ST134回、継続率約75%",
    "RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約700個で通常のままが50.0%、5R・実獲得約700個でRUSHが50.0%",
    "RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が約20%、5R×4・実獲得約2800個で継続が約73.8%、5R×8・実獲得約5600個で継続が約6.2%（成功率約7.7%で約2800個ずつ上乗せするループ付き）",
    "RUSHは規定回数（134回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 5, balls: 700, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 5, balls: 700, nextState: "rush", tag: "toRush", resultNote: "RUSH" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 134,
      probability: 1 / 98.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue10R" },
          {
            weight: 0.738,
            rounds: 5,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue5Rx4",
            resultNote: "5R×4",
          },
          {
            weight: 0.062,
            rounds: 5,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushContinue5Rx8",
            resultNote: "5R×8",
            bonusLoop: { probability: 0.077, balls: 2800 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 5: 700 },
});
