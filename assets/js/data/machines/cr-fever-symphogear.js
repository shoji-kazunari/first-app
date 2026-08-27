// 第1号機: CRフィーバー戦姫絶唱シンフォギア（2017年 SANKYO ライトミドル）
//
// このファイルは「データ」だけを持つ。抽選・状態遷移のロジックはcore/stateEngine.jsが
// 汎用的に解釈するので、新しい機種を追加する場合はこの形式のファイルを1つ増やし、
// data/machines/index.jsに読み込みを追加するだけでよい。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "cr-fever-symphogear",
  slug: "cr-fever-symphogear",
  name: "CRフィーバー戦姫絶唱シンフォギア",
  nameKana: "しーあーるふぃーばーせんきぜっしょうしんふぉぎあ",
  aliases: [
    "シンフォギア",
    "しんふぉぎあ",
    "初代シンフォギア",
    "せんきぜっしょうしんふぉぎあ",
    "戦姫絶唱シンフォギア",
    "CRフィーバーシンフォギア",
  ],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2017,
  category: "ライトミドル",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  // スペック・ルール説明欄に表示する短文（攻略情報や期待度の説明は含めない）
  rules: [
    "通常時大当たり確率：1/199.8",
    "右打ち中の実質大当たり確率：約1/7.4",
    "初当たりの99%：4R大当たり後「最終決戦」へ",
    "初当たりの1%：15R大当たり後「シンフォギアチャンス」へ直行",
    "最終決戦：時短1回＋残保留4個で最大5回（約1/7.4）を抽選し、1回でも当選でシンフォギアチャンスへ",
    "最終決戦を5回とも外すと「最終決戦敗北」となり通常へ戻る",
    "シンフォギアチャンス：時短7回＋残保留4個で最大11回（約1/7.4）を抽選",
    "シンフォギアチャンス中の当選でラウンド消化後、再びシンフォギアチャンス（残り11回）へ",
    "シンフォギアチャンスを11回とも外すと通常へ戻る",
    "最終決戦・シンフォギアチャンス中のラウンド振り分け：4R 50% / 8R 7% / 12R 3% / 15R 40%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.99, rounds: 4, nextState: "finalBattle", tag: "toFinalBattle" },
          {
            weight: 0.01,
            rounds: 15,
            nextState: "symphogearChance",
            tag: "rushDirect",
            resultNote: "RUSH直行",
          },
        ],
      },
      onExhausted: null,
    },

    finalBattle: {
      id: "finalBattle",
      label: "最終決戦",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 7.4,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        distributionTable: "roundDistribution",
        nextState: "symphogearChance",
        tag: "finalBattleWin",
      },
      onExhausted: { nextState: "normal", tag: "finalBattleLose", resultLabel: "最終決戦敗北" },
    },

    symphogearChance: {
      id: "symphogearChance",
      label: "シンフォギアチャンス",
      mode: "countDown",
      maxAttempts: 11,
      probability: 1 / 7.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        distributionTable: "roundDistribution",
        nextState: "symphogearChance",
        tag: "rushContinue",
      },
      onExhausted: {
        nextState: "normal",
        tag: "symphogearChanceEnd",
        resultLabel: "シンフォギアチャンス終了",
      },
    },
  },

  distributionTables: {
    roundDistribution: [
      { rounds: 4, weight: 0.5 },
      { rounds: 8, weight: 0.07 },
      { rounds: 12, weight: 0.03 },
      { rounds: 15, weight: 0.4 },
    ],
  },

  // 1ラウンドあたり約91玉（アタッカー賞球14×7カウント）を基準にした獲得出玉目安。
  // ロジックには直書きせず、機種データ側でラウンド数→出玉のテーブルとして保持する。
  payoutTable: { 4: 364, 8: 728, 12: 1092, 15: 1365 },
});
