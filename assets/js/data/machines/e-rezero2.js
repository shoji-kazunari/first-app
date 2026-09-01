// 第21号機: e Re:ゼロから始める異世界生活 season2（2023年 Daito スマパチ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_re0season2/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/349.9）の振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：45.0%
//   ・10R×2大当り(約3000個+α)→RUSH：55.0%
// 電チュー入賞時（特図2・RUSH中、大当り確率約1/99.9）の振り分け:
//   ・2R大当り(約300個)→RUSH継続：20.0%
//   ・10R大当り(約1500個)→RUSH継続：55.0%
//   ・10R×2大当り(約3000個+α)→RUSH継続：25.0%
// （RUSHはいずれの当りでもRUSH自身へ戻る＝ST145回のカウンタが毎回リセットされる
// タイプで、145回を全弾外すと通常へ。素の計算1-(1-1/99.9)^145≈76.8%は公表の
// 「RUSH継続率約77%」とほぼ一致しており、他機種のような残保留・LAST ATTACK等の
// 引き戻しは無い（差分の実装漏れではない）ことを確認済み）
//
// 【「約3000個+α」の“+α”について】
// 円グラフ・機種概要とも「約3000個+α」とだけ表記され、+αの具体的な内訳・上乗せ量は
// 1geki.jpに数値の記載が無い。実獲得個数の記載も無いため、+αを含めない「約3000個」
// （実獲得約2800個、14/15の比率のまま）で実装し、上乗せ分は反映していない
// （出玉はやや少なめに出る可能性がある）。
//
// 【強欲RUSH・ドキドキRUSHについて】
// RUSH中の演出モードとして「強欲RUSH」「ドキドキRUSH」の2種類（カスタム機能との
// 組み合わせで全96パターン）があるが、これらは大当り時の告知演出が異なるだけで
// 当選確率・出玉振り分けに差は無い（e-accel-world.jsのBrainBurst2039/直結モードと
// 同じ、演出選択のみの違い）。そのため状態を分けず1つのRUSH状態として実装した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、10R×2: 約3000個/実獲得2800個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-rezero2",
  slug: "e-rezero2",
  name: "e Re:ゼロから始める異世界生活 season2",
  nameKana: "いーりーぜろからはじめるいせかいせいかつしーずんつー",
  aliases: ["リゼロ2", "リゼロseason2", "Re:ゼロ2", "eリゼロ2", "リゼロシーズン2"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2023,
  category: "スマパチ（一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/349.9",
    "RUSH中の大当り確率：約1/99.9",
    "RUSH：ST145回、継続率約77%",
    "RUSH突入率：55%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが45.0%、10R×2・実獲得約2800個(+α未実装)でRUSHが55.0%",
    "RUSH中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続が20.0%、10R・実獲得約1400個で継続が55.0%、10R×2・実獲得約2800個(+α未実装)で継続が25.0%",
    "RUSHは規定回数（145回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 349.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.45, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.55,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "toRush",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 145,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 2, balls: 280, nextState: "rush", tag: "rushContinue2R" },
          { weight: 0.55, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue10R" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue10Rx2",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
