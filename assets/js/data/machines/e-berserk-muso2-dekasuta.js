// 第45号機: デカスタeベルセルク無双第2章 10連撃Ver.（2026年 newgin スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_berserk_muso2_ds/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・放魔RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/299.25）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：50.0%
//   ・2R大当り(約300個)→放魔RUSH(ST100回)：49.9%
//   ・10R大当り(約1500個)→放魔RUSH(ST100回)：0.1%
// 電チュー入賞時（特図2・放魔RUSH中、大当り確率1/69.55）の振り分け:
//   ・3R大当り(約410個)→放魔RUSH継続：50.0%
//   ・10R大当り(約1500個)→放魔RUSH継続：50.0%
// （放魔RUSHは規定回数（100回）を全弾外すと通常へ。RUSH継続率約77%は、素の
// 1-(1-1/69.55)^100≈76.5%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【「OVER KILL」を実装していない理由】
// 1geki.jpには「放魔RUSH中の10R大当たりの一部でOVER KILL発生のチャンス」
// 「放魔RUSHは滞在中の大当たりの50％が10R大当たりとなり、その一部でOVER KILLが
// 発生」との記載があり、OVER KILL発動時は別途「OVER KILLの出玉分布」円グラフ
// （約5190個～12000個以上の8段階、期待出玉約10095個）が掲載されている。
// しかし「10R大当たりの一部」というOVER KILLの発動率そのものは、テキスト・
// 円グラフとも数値の記載が無い（「ステップアップ３段階到達でOVER KILL」等、
// 発動条件がゲーム内演出の結果によるとしか説明されていない）。数値が無い以上
// 推測で埋めることはできないため、このシミュレーターでは10R大当たりを
// 「常に約1500個で放魔RUSH継続」として実装し、OVER KILLによる上振れ
// （約5190～12000個超）は反映していない（出玉はやや控えめに出る）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 3R: 約410個/実獲得380個、2R: 約300個/実獲得280個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-berserk-muso2-dekasuta",
  slug: "e-berserk-muso2-dekasuta",
  name: "デカスタeベルセルク無双第2章 10連撃Ver.",
  nameKana: "でかすたいーべるせるくむそうだいにしょうじゅうれんげきばー",
  aliases: [
    "ベルセルク無双2",
    "デカスタベルセルク無双2",
    "ベルセルク無双第2章",
    "eベルセルク無双2",
    "ベルセルク10連撃",
  ],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/299.25",
    "放魔RUSH中の大当り確率：1/69.55",
    "放魔RUSH：ST100回、継続率約77%",
    "RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが50.0%、2R・実獲得約280個で放魔RUSHが49.9%、10R・実獲得約1400個で放魔RUSHが0.1%",
    "放魔RUSH中の当選振り分け（電チュー入賞時）：3R・実獲得約380個で継続が50.0%、10R・実獲得約1400個で継続が50.0%（「OVER KILL」による上振れ約5190～12000個超は未実装。詳細はコメント）",
    "放魔RUSHは規定回数（100回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 299.25,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.499,
            rounds: 2,
            balls: 280,
            nextState: "houmaRush",
            tag: "toRush",
            resultNote: "放魔RUSH",
          },
          {
            weight: 0.001,
            rounds: 10,
            balls: 1400,
            nextState: "houmaRush",
            tag: "toRushDirect10R",
            resultNote: "放魔RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    houmaRush: {
      id: "houmaRush",
      label: "放魔RUSH",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 69.55,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 380, nextState: "houmaRush", tag: "rushContinue3R" },
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "houmaRush", tag: "rushContinue10R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "放魔RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 3: 380, 2: 280 },
});
