// 第37号機: e魔女と野獣（2026年9月7日導入予定 FUJI スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_majotoyajuu/）。導入開始日2026年9月7日の
// 新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため先取りで追加した。
// 大当たり振り分けは、同ページに掲載されている4枚の円グラフ画像（図柄揃い・
// 魔女決戦時／復讐RUSH中(初回)／復讐RUSH中(2回目以降)／運命分岐中）を
// ダウンロードしてReadツールで直接読み取った実数値。
// このページは実獲得個数（払い出しと実質獲得の内訳）の記載が無いため、
// 払い出し個数をそのまま使用している（他機種の14/15等の比率は適用していない）。
//
// ヘソ入賞時（特図1・通常時、当選確率1/399＝図柄揃い確率と魔女決戦BONUS
// 当選確率の合算値）の振り分け:
//   ・約400個→通常（時短なし）：49%
//   ・約400個→復讐RUSH(時短75回)：50%
//   ・約400個→運命分岐へ直接突入：1%
//
// 復讐RUSH（電チュー入賞時、当選確率1/95）は初回とそれ以降で振り分けが違う:
//   ・初回：当選時は必ず運命分岐へ突入（出玉の記載無し）
//   ・2回目以降：48%が10R・約1500個で継続、52%が運命分岐へ（出玉の記載無し）
// 「出玉の記載無し」の枝はstateEngineの出玉0個不可の制約
// （e-nanatai3.jsのチャレンジ→RUSHと同じ問題）のため、この機種最小単位の
// 約400個を代表値として付与した。
//
// 運命分岐（復讐RUSH経由、電チュー入賞時）の振り分け:
//   ・50%：10R×2・約3000個→復讐RUSHへ
//   ・29%：10R×4・約6000個→BEAST ATTACK突入（3000個ループ、成功率約65%）
//   ・21%：10R×6・約9000個→超BEAST ATTACK突入（6000個ループ、成功率約30%）
// BEAST ATTACK・超BEAST ATTACKは「演出成功で上乗せして再度突入、失敗で
// 復讐RUSHに復帰」という明示的な連続当選率つきの上乗せループのため、
// stateEngineのbonusLoopプリミティブ（probability, balls）でそのまま
// 表現した（ループ終了後はいずれも復讐RUSHへ）。
// なお運命分岐の円グラフには「通常時に大当り後、直接運命分岐に突入した
// 場合を除く」という注記があり、通常時の1%直行分だけ別の振り分け表が
// あることを示唆しているが、その表自体は1geki.jpに掲載が無いため、
// 復讐RUSH経由と同じ50%/29%/21%の表をそのまま代用した（発生率0.5%未満の
// 極めて稀なケースであり、影響は非常に小さい）。
//
// 【復讐CHARGEは実装していない】
// アイコン停止で当選する約1/2799の契機（約400個、一部で復讐RUSHに直行）。
// 通常時の当選確率1/399には合算されていない別枠の契機で、自身の出現率・
// RUSH直行率とも1geki.jpに数値の記載が無いため実装していない。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-majotoyajuu",
  slug: "e-majotoyajuu",
  name: "e魔女と野獣",
  nameKana: "いーまじょとやじゅう",
  aliases: ["魔女と野獣", "マジョヤジュウ", "e魔女と野獣パチンコ"],
  manufacturer: { id: "fuji", name: "FUJI" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の当選確率：1/399（図柄揃い確率と魔女決戦BONUS当選確率の合算値）",
    "復讐RUSH中の当選確率：1/95",
    "復讐RUSH：時短75回",
    "運命分岐成功率：約50%（平均）。演出成功で3000個または6000個上乗せし、さらにBEAST ATTACK/超BEAST ATTACK（それぞれ約65%/約30%でループ）へ",
    "RUSH突入率：約51%",
    "通常時の大当り振り分け（ヘソ入賞時）：約400個で通常のままが49%、約400個で復讐RUSHが50%、約400個で運命分岐直行が1%",
    "復讐RUSH（初回）中の当選：必ず運命分岐へ突入",
    "復讐RUSH（2回目以降）中の当選振り分け：10R・約1500個で継続が48%、運命分岐へが52%",
    "運命分岐中の振り分け：10R×2・約3000個で復讐RUSHへが50%、10R×4・約6000個でBEAST ATTACK突入が29%、10R×6・約9000個で超BEAST ATTACK突入が21%",
    "復讐RUSHは規定回数（75回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 1, balls: 400, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 1,
            balls: 400,
            nextState: "rushFirst",
            tag: "toRushFirst",
            resultNote: "復讐RUSH",
          },
          {
            weight: 0.01,
            rounds: 1,
            balls: 400,
            nextState: "fateBranch",
            tag: "toFateDirect",
            resultNote: "運命分岐",
          },
        ],
      },
      onExhausted: null,
    },

    rushFirst: {
      id: "rushFirst",
      label: "復讐RUSH",
      mode: "countDown",
      maxAttempts: 75,
      probability: 1 / 95,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 1,
            balls: 400,
            nextState: "fateBranch",
            tag: "rushFirstToFate",
            resultNote: "運命分岐",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushFirstEnd", resultLabel: "復讐RUSH終了" },
    },

    rush: {
      id: "rush",
      label: "復讐RUSH",
      mode: "countDown",
      maxAttempts: 75,
      probability: 1 / 95,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 10, balls: 1500, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.52,
            rounds: 1,
            balls: 400,
            nextState: "fateBranch",
            tag: "rushToFate",
            resultNote: "運命分岐",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "復讐RUSH終了" },
    },

    fateBranch: {
      id: "fateBranch",
      label: "運命分岐",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "rush",
            tag: "fateToRush3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.29,
            rounds: 10,
            displayRounds: 40,
            balls: 6000,
            nextState: "rush",
            tag: "fateToBeast6000",
            resultNote: "10R×4・BEAST ATTACK",
            bonusLoop: { probability: 0.65, balls: 3000 },
          },
          {
            weight: 0.21,
            rounds: 10,
            displayRounds: 60,
            balls: 9000,
            nextState: "rush",
            tag: "fateToSuperBeast9000",
            resultNote: "10R×6・超BEAST ATTACK",
            bonusLoop: { probability: 0.3, balls: 6000 },
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 1: 400, 10: 1500 },
});
