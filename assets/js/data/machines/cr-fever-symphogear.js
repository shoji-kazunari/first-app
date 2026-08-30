// 第1号機: CRフィーバー戦姫絶唱シンフォギア（2017年 SANKYO ライトミドル）
//
// このファイルは「データ」だけを持つ。抽選・状態遷移のロジックはcore/stateEngine.jsが
// 汎用的に解釈するので、新しい機種を追加する場合はこの形式のファイルを1つ増やし、
// data/machines/index.jsに読み込みを追加するだけでよい。
//
// 【出玉は「実獲得個数」を採用（払い出し基準からの変更）・この機種だけ推定値】
// 他4機種を実獲得個数（払い出しから消費分を差し引いた、実際に持ち玉へ乗る量）へ
// 揃えたのに合わせて、この機種のpayoutTableも実獲得基準へ切り替えた
// （経緯はpf-gundam-uc.jsのコメント参照）。
// ただしこの機種は導入が古く、1geki.jpに掲載ページが見当たらず実獲得個数を
// 直接確認できなかった。他4機種（エヴァ17・虚構推理・ガンダムユニコーン・
// ガンダムSEEDクライマックス）はいずれも実獲得が払い出しのちょうど14/15
// （約93.3%）だったため、同じ比率をこの機種にも当てはめて概算した
// （依頼者の了承済み。実機・1geki.jpでの裏取りはできていない点に注意）。
//   4R:  364個 → 340個（364×14/15、四捨五入）
//   8R:  728個 → 679個
//   12R: 1092個 → 1019個
//   15R: 1365個 → 1274個
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

  // 1ラウンドあたり約91玉（アタッカー賞球14×7カウント）の払い出しを基準に、
  // そこから実獲得比14/15を掛けた値（ファイル冒頭のコメント参照）。
  // ロジックには直書きせず、機種データ側でラウンド数→出玉のテーブルとして保持する。
  payoutTable: { 4: 340, 8: 679, 12: 1019, 15: 1274 },
});
