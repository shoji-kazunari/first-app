// 第52号機: ｅ一方通行 最狂（2026年 orange/藤商事グループ スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_accelerator_saikyo/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・一方通行OVER
// RUSH中・最狂ジャッジメント中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、当選確率1/253）の振り分け:
//   ・大当り(約300個)→通常（時短なし）：約70%
//   ・大当り(約300個)→一方通行OVER RUSH(ST15回)：約30%
// 電チュー入賞時（特図2・OVER RUSH中、当選確率1/13＝電チューロング開放確率）の振り分け:
//   ・約1500個→OVER RUSH継続：50%
//   ・約3000個(特図2大当たり2回分)→OVER RUSH継続：25%
//   ・約3000個(特図2大当たり2回分)→最狂ジャッジメントへ：25%
// 最狂ジャッジメント（3000個の枠に必ず付随する追加抽選、当選確率100%）の振り分け:
//   ・約7500個(特図2大当たり5回分)→OVER RUSHへ戻る：約45%
//   ・約1500個→OVER RUSHへ戻る：約55%
// （OVER RUSHは規定回数（15回）を全弾外すと通常へ。継続率約70%は、素の
// 1-(1-1/13)^15≈70.0%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【最狂ジャッジメントの実装について】
// 最狂ジャッジメントは独自のST回数や当選確率が公開されておらず、OVER RUSH中の
// 「約3000個+最狂ジャッジメント」枠（25%）にセットで付随する形で説明されている。
// 円グラフ「最狂ジャッジメント中」の45%/55%も合計が100%になっており、外れという
// 概念が無い（必ずどちらかを獲得してOVER RUSHへ戻る）ため、probability:1の
// 即時解決する状態として実装した（e-accel-world.jsのoverHeavenFirstと同じ扱い）。
//
// 【出玉について】
// このページには他の多くの機種にある「実獲得個数」の記載が無く、払い出し個数
// （約300個/約1500個/約3000個/約7500個）のみが公開されている。そのためこの
// シミュレーターでは追加の換算をせず、公開されている数値をそのまま採用した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-accelerator-saikyo",
  slug: "e-accelerator-saikyo",
  name: "ｅ一方通行 最狂",
  nameKana: "いーいっぽうつうこうさいきょう",
  aliases: [
    "一方通行最狂",
    "アクセラレータ最狂",
    "とある魔術の禁書目録一方通行最狂",
    "e一方通行",
    "一方通行パチンコ",
  ],
  manufacturer: { id: "orange-fuji", name: "orange(オレンジ)/藤商事グループ" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時当選確率：1/253",
    "一方通行OVER RUSH中の当選確率：1/13（電チューロング開放確率）",
    "一方通行OVER RUSH：ST15回、継続率約70%",
    "RUSH突入率：約30%",
    "通常時の大当り振り分け（ヘソ入賞時）：大当り約300個で通常のままが約70%、大当り約300個でOVER RUSHが約30%",
    "OVER RUSH中の当選振り分け（電チュー入賞時）：約1500個で継続が50%、約3000個で継続が25%、約3000個+最狂ジャッジメントが25%",
    "最狂ジャッジメント（必ず成立）：約7500個でOVER RUSHへ戻るが約45%、約1500個でOVER RUSHへ戻るが約55%",
    "OVER RUSHは規定回数（15回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 253,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.7, rounds: 2, balls: 300, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.3,
            rounds: 2,
            balls: 300,
            nextState: "overRush",
            tag: "toOverRush",
            resultNote: "一方通行OVER RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    overRush: {
      id: "overRush",
      label: "一方通行OVER RUSH",
      mode: "countDown",
      maxAttempts: 15,
      probability: 1 / 13,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1500, nextState: "overRush", tag: "continue1500" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "overRush",
            tag: "continue3000",
          },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "saikyoJudgment",
            tag: "toJudgment",
            resultNote: "最狂ジャッジメント",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "overRushEnd", resultLabel: "OVER RUSH終了" },
    },

    saikyoJudgment: {
      id: "saikyoJudgment",
      label: "最狂ジャッジメント",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.45,
            rounds: 10,
            displayRounds: 50,
            balls: 7500,
            nextState: "overRush",
            tag: "judgmentBig",
            resultNote: "最狂ジャッジメント成功",
          },
          {
            weight: 0.55,
            rounds: 10,
            balls: 1500,
            nextState: "overRush",
            tag: "judgmentSmall",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 2: 300, 10: 1500 },
});
