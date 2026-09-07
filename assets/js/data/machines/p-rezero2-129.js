// 第32号機: P Re:ゼロから始める異世界生活 season2 129ver.（2026年 Daito ライト機/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_re0season2_129/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・
// 強欲RUSH中・超強欲PREMIUM BONUS中）をダウンロードしてReadツールで直接
// 読み取った実数値（4枚目の「超強欲PREMIUM BONUS出玉期待値」は、前2状態の
// 素の確率から導かれる合算期待値のグラフであり、追加の生データは無いため
// 参照のみで実装には使っていない）。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/129.9）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：50.0%
//   ・2R大当り(約300個)→強欲RUSH(120回)：50.0%
// 電チュー入賞時（特図2・強欲RUSH中、大当り確率約1/99.9）の振り分け:
//   ・2R大当り(約300個)→継続：20.0%
//   ・5R大当り(約750個)→継続：55.0%
//   ・10R大当り(約1500個＝超強欲1500BONUS)→継続：25.0%
// （※超強欲1500BONUS獲得時の50%でLT発動、との注記があり、25.0%のうち
// 半分＝12.5%が超強欲PREMIUM BONUS（LT）へ、残り12.5%はそのまま強欲RUSH
// 継続として実装した）
// 電チュー入賞時（特図2・超強欲PREMIUM BONUS＝LT中）の振り分け:
//   ・2R大当り(約300個)→継続（次回まで）：95.0%
//   ・2R大当り(約300個)→強欲RUSH(120回)へ降格：5.0%
//
// 強欲RUSHは規定回数消化型（ST120回）。素の計算1-(1-1/99.9)^120≈70.1%は
// 公表の「RUSH継続率約70%」とほぼ一致しており、大きな引き戻しギャップは
// 無い。超強欲PREMIUM BONUS自体には規定回数が無く（「次回まで」）、当りの
// たびに95%で継続・5%で強欲RUSHへ戻る構成としている。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 5R: 約750個/実獲得700個、2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-rezero2-129",
  slug: "p-rezero2-129",
  name: "P Re:ゼロから始める異世界生活 season2 129ver.",
  nameKana: "ぴーりーぜろからはじめるいせかいせいかつしーずんつーひゃくにじゅうきゅうばー",
  aliases: ["リゼロ129", "Pリゼロ2", "リゼロ2 129ver.", "Pリゼロseason2", "リゼロ2ライト"],
  manufacturer: { id: "daito", name: "Daito" },
  releaseYear: 2026,
  category: "ライト（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/129.9",
    "強欲RUSH・超強欲PREMIUM BONUS中の大当り確率：約1/99.9",
    "強欲RUSH：ST120回、継続率約70%",
    "RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが50.0%、2R・実獲得約280個で強欲RUSHが50.0%",
    "強欲RUSH中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続が20.0%、5R・実獲得約700個で継続が55.0%、10R・実獲得約1400個で継続が12.5%、10R・実獲得約1400個で超強欲PREMIUM BONUS（LT）突入が12.5%",
    "超強欲PREMIUM BONUS中の当選振り分け（電チュー入賞時）：2R・実獲得約280個で継続が95.0%、2R・実獲得約280個で強欲RUSHへ降格が5.0%",
    "強欲RUSHは規定回数（120回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 129.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 2, balls: 280, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "強欲RUSH",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 2, balls: 280, nextState: "rush", tag: "rushContinue300" },
          { weight: 0.55, rounds: 5, balls: 700, nextState: "rush", tag: "rushContinue750" },
          { weight: 0.125, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.125,
            rounds: 10,
            balls: 1400,
            nextState: "premiumBonus",
            tag: "rushToPremiumBonus",
            resultNote: "超強欲1500BONUS・LT発動",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "強欲RUSH終了" },
    },

    premiumBonus: {
      id: "premiumBonus",
      label: "超強欲PREMIUM BONUS",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.95, rounds: 2, balls: 280, nextState: "premiumBonus", tag: "premiumContinue" },
          {
            weight: 0.05,
            rounds: 2,
            balls: 280,
            nextState: "rush",
            tag: "premiumToRush",
            resultNote: "強欲RUSH",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 5: 700, 10: 1400 },
});
