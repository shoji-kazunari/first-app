// 第40号機: e 甲鉄城のカバネリ2 輪廻の果報 119ver.（2026年9月7日導入予定 Sammy スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kabaneri2_rinne/）。導入開始日
// 2026年9月7日の新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため
// 先取りで追加した。大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像
// （通常時・RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/119.8）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：74.5%
//   ・2R大当り(約300個)→RUSH「KABANERI OF THE IRON FORTRESS 海門決戦」(ST134回)：25.5%
// （RUSH突入率25.5%と一致）
//
// 電チュー入賞時（特図2・RUSH中、大当り確率約1/89.7）の振り分け:
//   ・10R大当り(約1500個)→継続：95%
//   ・超輪廻ループ突入(基礎3000個)→継続：5%
// 超輪廻ループは機種概要に「約1500個が約70%ループ」と明記されており、
// stateEngineのbonusLoopプリミティブ（probability:0.7, balls:1400）で
// そのまま表現した。円グラフ脚注の「期待出玉約6400個＝3000個＋ループ
// 獲得期待出玉約3418個」とは、bonusLoopの計算上の期待値（1400×0.7/0.3≈3267）
// と近い値であり、大きな乖離は無い。
//
// RUSHは規定回数消化型。素の計算1-(1-1/89.7)^134≈77.7%は公表の
// 「継続率約78%」とほぼ一致しており、大きな引き戻しギャップは無い。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。超輪廻ループの基礎3000個にも
// 同じ比率を適用した（3000→2800）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kabaneri2-rinne119",
  slug: "e-kabaneri2-rinne119",
  name: "e 甲鉄城のカバネリ2 輪廻の果報 119ver.",
  nameKana: "いーこうてつじょうのかばねりつーりんねのかほうひゃくじゅうきゅうばー",
  aliases: ["カバネリ2輪廻", "カバネリ輪廻の果報", "甲鉄城のカバネリ2", "カバネリ119"],
  manufacturer: { id: "sammy", name: "Sammy" },
  releaseYear: 2026,
  category: "スマパチ（ライト・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/119.8",
    "RUSH中の大当り確率：約1/89.7",
    "RUSH：ST134回、継続率約78%",
    "RUSH突入率：25.5%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが74.5%、2R・実獲得約280個でRUSHが25.5%",
    "RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が95%、超輪廻ループ（基礎実獲得約2800個、以降実獲得約1400個ずつ約70%でループ）突入が5%",
    "RUSHは規定回数（134回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 119.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.745, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.255, rounds: 2, balls: 280, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH（海門決戦）",
      mode: "countDown",
      maxAttempts: 134,
      probability: 1 / 89.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.95, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.05,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushToChoRinne",
            resultNote: "超輪廻ループ",
            bonusLoop: { probability: 0.7, balls: 1400 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
