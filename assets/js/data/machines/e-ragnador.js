// 第69号機: eラグナドール 妖しき皇帝と終焉の夜叉姫（2026年 MACY（メーシー） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_ragnador/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・ラグナドATTACK成功時・ラグナドATTACK GOLD
// 成功時）と、個別解説表（裏CHALLENGE・ラグナドRUSH・ラグナドRUSH GOLD・CHAIN CHANCE・
// CHAIN CHANCE GOLD等）の数値を突き合わせて構造化した。この機種はCHAIN CHANCE→裏CHAIN
// CHANCE→裏LTという多段の入れ子構造を持つが、裏CHAIN CHANCE自体の成功率（裏LTへ進む
// 確率）は1geki.jp上に具体的な数値の記載が無く、完全な再現はできなかった。
//
// ヘソ入賞時（特図1・通常時、当選確率1/239.5＝大当り確率1/349.9と裏CHALLENGE発生確率
// （C時短）1/758.9の合算値）の振り分け（円グラフ「通常時」）:
//   ・6R大当り(約900個/実獲得840個)→通常（時短なし）：33.5%
//   ・6R大当り(約900個)→ラグナドRUSH(ST125回)へ：34.2%
//   ・10R×2大当り(約3000個/実獲得2800個)→ラグナドRUSH GOLD(ST125回)へ：0.7%
//   ・裏CHALLENGE(時短50回)へ：31.6%（＝1/758.9 ÷ 1/239.5とちょうど一致）
//
// 裏CHALLENGE（当選確率1/758.9、抽選回数50回転、個別解説表に記載）:
//   ・成功：出玉約1500個(実獲得1400個)+「裏CHAIN CHANCE」突入
//   ・失敗（50回消化）：通常時へ
// （「裏CHAIN CHANCE」自体の成功率が非公開のため、「裏CCは失敗しても『ラグナドRUSH』
// 突入となる」という記載どおり、成功時は最低保証のラグナドRUSHへ直接移行する形に
// 簡略化した。裏CC成功時のラグナドRUSH GOLDへの格上げは未実装）
//
// ラグナドRUSH・ラグナドRUSH GOLD中（ともにST125回転、ラグナドATTACK（GOLD）出現率
// 1/79.2、ATTACK（GOLD）成功期待度約75%、個別解説表に記載）:
//   ・ATTACKが不発（1-1/79.2）：そのまま抽選継続（残りST回数が減るだけ）
//   ・ATTACK発生・成功（75%）：円グラフの振り分けどおり出玉獲得
//   ・ATTACK発生・失敗（25%）：「ST回数をリセット（滞在状態は引き継ぐ）」
// （継続率約80%は、素の1-(1-1/79.2)^125≈79.6%と一致し、これは「ATTACKが125回の
// 抽選中に一度でも発生する確率」を指す。ATTACK失敗時のST回数リセットは、
// stateEngineが同じ状態へのonHit遷移で自動的にremainingをmaxAttemptsへ戻す
// 仕様を利用し、rounds:1・balls:0で自分自身へ遷移させることで表現した）
//
// ラグナドATTACK成功時の振り分け（円グラフ、成功時100%）:
//   ・10R大当り(約1500個/実獲得1400個)→ラグナドRUSH継続：49.3%
//   ・10R×2大当り(約3000個/実獲得2800個)→ラグナドRUSH GOLDへ：0.9%
//   ・10R大当り(約1500個)→CHAIN CHANCEへ：49.8%
// ラグナドATTACK GOLD成功時の振り分け（円グラフ、成功時100%）:
//   ・10R×2大当り(約3000個)→ラグナドRUSH GOLD継続：92.1%
//   ・10R×2大当り(約3000個)→CHAIN CHANCE GOLDへ：7.9%
//
// CHAIN CHANCE（個別解説表: 成功期待度約75%、成功時は約50%でループ、失敗時は
// ラグナドRUSHへ）をprobability:1の即時解決する状態として実装し、ループ部分は
// stateEngineのbonusLoopで表現した:
//   ・成功（75%）：出玉約1500個(実獲得1400個)、bonusLoop(50%, 1400個)でループ加算
//   ・失敗（25%）：出玉0個、ラグナドRUSHへ
// （「ループ時の約50%で裏CHAIN CHANCEに突入」という枝は、裏CC自体の成功率が
// 非公開のため未実装とし、ループはすべて通常のCHAIN CHANCEループとして扱った。
// これは裏LTへの格上げ経路を過小評価する簡略化である）
// CHAIN CHANCE GOLDも同型（当選契機・個別解説表に成功期待度約75%、失敗時は
// ラグナドRUSH GOLDへの記載あり）だが、ループ率の具体的な数値の記載は無い
// （「1G連ループの可能性あり」とのみ記載）。通常CHAIN CHANCEと対称の構造と
// みなし、同じ約50%のループ率を仮定して実装した:
//   ・成功（75%）：出玉約3000個(実獲得2800個)、bonusLoop(50%, 2800個)でループ加算
//   ・失敗（25%）：出玉0個、ラグナドRUSH GOLDへ
//
// 【「LT突入率1/620.1」は複合値のため独立検算していない】
// 通常時直行・ラグナドRUSH経由・裏CHALLENGE経由の複数ルートが絡む複合統計のため、
// この実装からの独立検算はしていない。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-ragnador",
  slug: "e-ragnador",
  name: "eラグナドール 妖しき皇帝と終焉の夜叉姫",
  nameKana: "いーらぐなどーるあやしきこうていとしゅうえんのやしゃひめ",
  aliases: ["ラグナドール", "ラグナドールパチンコ", "eラグナドール", "ラグナドRUSH"],
  manufacturer: { id: "macy", name: "MACY（メーシー）" },
  releaseYear: 2026,
  category: "パチンコ（スマパチ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時当選確率：1/239.5（大当り確率1/349.9と裏CHALLENGE発生確率1/758.9の合算値）",
    "ラグナドRUSH・ラグナドRUSH GOLD：ST125回、ラグナドATTACK（GOLD）出現率1/79.2、成功期待度約75%",
    "ATTACK失敗時はST回数がリセットされる（滞在状態は引き継ぐ）",
    "裏CHALLENGE：当選確率1/758.9、抽選回数50回転",
    "通常時の大当り振り分け：6R・実獲得約840個で通常のままが33.5%、6R・実獲得約840個でラグナドRUSHへが34.2%、10R×2・実獲得約2800個でラグナドRUSH GOLDへが0.7%、裏CHALLENGEへが31.6%",
    "ラグナドATTACK成功時の振り分け：10R・実獲得約1400個で継続が49.3%、10R×2・実獲得約2800個でRUSH GOLDへが0.9%、10R・実獲得約1400個でCHAIN CHANCEへが49.8%",
    "ラグナドATTACK GOLD成功時の振り分け：10R×2・実獲得約2800個で継続が92.1%、10R×2・実獲得約2800個でCHAIN CHANCE GOLDへが7.9%",
    "CHAIN CHANCE・CHAIN CHANCE GOLDは成功期待度約75%、成功時は約50%でループ加算、失敗時はラグナドRUSH（GOLD）へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 239.5,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.335, rounds: 6, balls: 840, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.342,
            rounds: 6,
            balls: 840,
            nextState: "ragnadoRush",
            tag: "toRush",
            resultNote: "ラグナドRUSH",
          },
          {
            weight: 0.007,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ragnadoRushGold",
            tag: "toRushGold",
            resultNote: "ラグナドRUSH GOLD",
          },
          {
            weight: 0.316,
            rounds: 1,
            balls: 0,
            nextState: "uraChallenge",
            tag: "toUraChallenge",
            resultNote: "裏CHALLENGE",
          },
        ],
      },
      onExhausted: null,
    },

    uraChallenge: {
      id: "uraChallenge",
      label: "裏CHALLENGE",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 758.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "ragnadoRush",
            tag: "toRushViaUra",
            resultNote: "ラグナドRUSH（裏CHAIN CHANCE突入濃厚）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "uraChallengeEnd", resultLabel: "裏CHALLENGE終了" },
    },

    ragnadoRush: {
      id: "ragnadoRush",
      label: "ラグナドRUSH",
      mode: "countDown",
      maxAttempts: 125,
      probability: 1 / 79.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.36975,
            rounds: 10,
            balls: 1400,
            nextState: "ragnadoRush",
            tag: "continueRush",
            resultNote: "ラグナドATTACK成功",
          },
          {
            weight: 0.00675,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ragnadoRushGold",
            tag: "toRushGold",
            resultNote: "ラグナドATTACK成功、ラグナドRUSH GOLD",
          },
          {
            weight: 0.3735,
            rounds: 10,
            balls: 1400,
            nextState: "chainChance",
            tag: "toChainChance",
            resultNote: "ラグナドATTACK成功、CHAIN CHANCE",
          },
          {
            weight: 0.25,
            rounds: 1,
            balls: 0,
            nextState: "ragnadoRush",
            tag: "attackFail",
            resultNote: "ラグナドATTACK失敗（ST回数リセット）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ラグナドRUSH終了" },
    },

    ragnadoRushGold: {
      id: "ragnadoRushGold",
      label: "ラグナドRUSH GOLD",
      mode: "countDown",
      maxAttempts: 125,
      probability: 1 / 79.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.69075,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ragnadoRushGold",
            tag: "continueGold",
            resultNote: "ラグナドATTACK GOLD成功",
          },
          {
            weight: 0.05925,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "chainChanceGold",
            tag: "toChainChanceGold",
            resultNote: "ラグナドATTACK GOLD成功、CHAIN CHANCE GOLD",
          },
          {
            weight: 0.25,
            rounds: 1,
            balls: 0,
            nextState: "ragnadoRushGold",
            tag: "attackGoldFail",
            resultNote: "ラグナドATTACK GOLD失敗（ST回数リセット）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushGoldEnd", resultLabel: "ラグナドRUSH GOLD終了" },
    },

    chainChance: {
      id: "chainChance",
      label: "CHAIN CHANCE",
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
            weight: 0.75,
            rounds: 10,
            balls: 1400,
            nextState: "ragnadoRush",
            tag: "ccSuccess",
            resultNote: "CHAIN CHANCE成功",
            bonusLoop: { probability: 0.5, balls: 1400 },
          },
          {
            weight: 0.25,
            rounds: 1,
            balls: 0,
            nextState: "ragnadoRush",
            tag: "ccFail",
          },
        ],
      },
      onExhausted: null,
    },

    chainChanceGold: {
      id: "chainChanceGold",
      label: "CHAIN CHANCE GOLD",
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
            weight: 0.75,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ragnadoRushGold",
            tag: "ccgSuccess",
            resultNote: "CHAIN CHANCE GOLD成功",
            bonusLoop: { probability: 0.5, balls: 2800 },
          },
          {
            weight: 0.25,
            rounds: 1,
            balls: 0,
            nextState: "ragnadoRushGold",
            tag: "ccgFail",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 6: 840 },
});
