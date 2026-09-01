// 第33号機: eアサルトリリィ（2026年9月7日導入予定 Bisty スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_assaultlily/）。導入開始日2026年9月7日の
// 新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため先取りで追加した。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// ASSAULT RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/164.4）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：74.7%
//   ・2R大当り(約300個)→ASSAULT RUSH(ST100回)：25.3%
// （RUSH突入率約25.3%と一致）
//
// 電チュー入賞時（特図2・ASSAULT RUSH中、ST中リーチ確率約1/65.5）の振り分け:
//   ・STリセット（出玉なし）→継続：9.9%
//   ・10R大当り(約1500個)→継続：45.0%
//   ・10R×2大当り(約3000個)→継続：35.7%
//   ・10R×3大当り(約4500個)→継続：9.4%
// （ASSAULT RUSHは規定回数消化型。素の計算1-(1-1/65.5)^100≈78.5%は公表の
// 「RUSH継続率約80%（STリセットを含む）」とほぼ一致しており、大きな
// 引き戻しギャップは無い）
//
// 【「STリセット」の扱い】
// 出玉の記載が無くST100回のカウンタをリセットするだけの当り。stateEngineの
// onHit.outcomesは正の出玉が前提のため出玉0個の枝を表現できない
// （e-kinnikuman.js等と同じ制約）。出玉のある枝のうち最小の「10R・実獲得
// 1400個」枝に合算した（9.9%+45.0%=54.9%）。RUSH継続の確率自体は変えていない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。明記の無い3000/4500個にも同じ比率を
// そのまま適用した（3000→2800、4500→4200。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-assaultlily",
  slug: "e-assaultlily",
  name: "eアサルトリリィ",
  nameKana: "いーあさるとりりぃ",
  aliases: ["アサルトリリィ", "アサリリ", "eアサリリ"],
  manufacturer: { id: "bisty", name: "Bisty" },
  releaseYear: 2026,
  category: "スマパチ（ライト・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：約1/164.4",
    "ASSAULT RUSH中のリーチ確率：約1/65.5",
    "ASSAULT RUSH：ST100回、継続率約80%（STリセットを含む）",
    "RUSH突入率：約25.3%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが74.7%、2R・実獲得約280個でASSAULT RUSHが25.3%",
    "ASSAULT RUSH中の当選振り分け（電チュー入賞時）：約1400個が54.9%（STリセット含む）、約2800個が35.7%、約4200個が9.4%（いずれも継続）",
    "ASSAULT RUSHは規定回数（100回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 164.4,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.747, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.253, rounds: 2, balls: 280, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "ASSAULT RUSH",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 65.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.549, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.357,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.094,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "rushContinue4500",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ASSAULT RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
