// 第31号機: e冥妃転生（2026年 MACY スマパチ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_meihitensei/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・
// SEVEN'S RUSH中・脳汁3000チャンス中）をダウンロードしてReadツールで直接
// 読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/199.8）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：59.5%
//   ・2R大当り(約300個)→SEVEN'S RUSH(ST130回)：40.0%
//   ・10R×2大当り(約3000個)→SEVEN'S RUSH or 脳汁3000チャンス(ST130回)：0.5%
// （40.0%+0.5%=40.5%＝「通常時の当選時の突入率」と一致）
//
// 電チュー入賞時（特図2・SEVEN'S RUSH中、大当り確率約1/95.5）の振り分け:
//   ・10R大当り(約1500個)→継続：75%
//   ・10R×2大当り(約3000個)→SEVEN'S RUSH or 脳汁3000チャンス：25%
// （SEVEN'S RUSHは規定回数消化型。素の計算1-(1-1/95.5)^130≈74.5%は公表の
// 「継続率約75%」とほぼ一致しており、大きな引き戻しギャップは無い）
//
// 「SEVEN'S RUSH or 脳汁3000チャンス」の内訳は、公式に「脳汁3000チャンス
// 突入率（SEVEN'S RUSH HYPER BONUS当選時）約50%」という記載があり、この
// 3000個の当り自体が「HYPER BONUS」と呼ばれていることから、通常時の0.5%枝・
// RUSH中の25%枝のどちらも同じ50%で脳汁3000チャンスへ分岐するものとして
// 実装した（0.5%→0.25%/0.25%、25%→12.5%/12.5%）。
//
// 【脳汁3000チャンス（成功率約50%）について】
// 成功（約50%）で約3000個を追加獲得しチャンスがループ、失敗（約50%）は
// 出玉の記載が無くSEVEN'S RUSHへ戻る。円グラフでも失敗枝だけラウンド数・
// 出玉の表示が無く、実質0個の枝と判断できる（他機種のSTリセット等と同じ
// 出玉0個問題）。stateEngineのonHit.outcomesは正の出玉が必須のため、失敗枝
// にはこの機種の最小単位である2R(実獲得280個)を代表値として割り当てた
// （本来の0個よりわずかに出玉が多く出る）。
//
// 【コレー のすごろくゲームは実装していない】
// 普電ロング開放（約1/496.5、滞在10回転）を経て「特図2実質確率1/1」で
// 大当たりし、当選時は必ずLTへ突入する側の契機（※コレーのすごろくゲーム中の
// 大当たりは全てLTへ突入）。LT突入率の公表値41.6%（大当たり40.5%＋コレーの
// すごろくゲーム分の合算）のうち、この契機の寄与は約1.1ポイントとごく小さく、
// また当選時の出玉振り分け表も1geki.jpに掲載が無いため実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。明記の無い3000個（10R×2）にも
// 同じ比率をそのまま適用した（3000→2800。割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-meihitensei",
  slug: "e-meihitensei",
  name: "e冥妃転生",
  nameKana: "いーめいひてんせい",
  aliases: ["冥妃転生", "メイヒテンセイ", "eメイヒテンセイ"],
  manufacturer: { id: "macy", name: "MACY" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.8",
    "SEVEN'S RUSH中の大当り確率：約1/95.5",
    "SEVEN'S RUSH：ST130回、継続率約75%",
    "RUSH突入率：約40.5%（通常時の当選時）",
    "脳汁3000チャンス成功率：約50%（成功で約3000個を追加獲得しループ、失敗でSEVEN'S RUSHへ）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが59.5%、2R・実獲得約280個でSEVEN'S RUSHが40.0%、10R×2・実獲得約2800個でSEVEN'S RUSH/脳汁3000チャンスが0.5%",
    "SEVEN'S RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が75%、10R×2・実獲得約2800個でSEVEN'S RUSH継続/脳汁3000チャンス突入が25%（さらに50%ずつに分岐）",
    "SEVEN'S RUSHは規定回数（130回）を全弾外すと通常へ",
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
          { weight: 0.595, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.4, rounds: 2, balls: 280, nextState: "rush", tag: "toRush" },
          {
            weight: 0.0025,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "toRushBig",
            resultNote: "10R×2",
          },
          {
            weight: 0.0025,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "nozuiChance",
            tag: "toChanceBig",
            resultNote: "10R×2・脳汁3000チャンス",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "SEVEN'S RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 95.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.125,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.125,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "nozuiChance",
            tag: "rushToChance",
            resultNote: "10R×2・脳汁3000チャンス",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "SEVEN'S RUSH終了" },
    },

    nozuiChance: {
      id: "nozuiChance",
      label: "脳汁3000チャンス",
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
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "nozuiChance",
            tag: "chanceSuccess",
            resultNote: "10R×2",
          },
          { weight: 0.5, rounds: 2, balls: 280, nextState: "rush", tag: "chanceFail" },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
