// 第62号機: eカケグルイ 7500ver（2026年 D-light スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kakegurui7500/）。
// 大当り振り分けは、同ページに掲載されている4枚の円グラフ画像（図柄揃い時・
// 50/50ジャッジメント中・ツラヌキチャレンジ中・絶対王政RUSH BURST中）を
// ダウンロードしてReadツールで直接読み取った実数値。同一シリーズのe-kakegurui219.js
// と同じ「絶対王政RUSH BURST」「50/50ジャッジメント」という名称を使うが、本機は
// ツラヌキチャレンジ・運命の一撃という別の中間ステップを持つ、より発展した構造。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/204）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：75.0%
//   ・10R大当り(約1500個)→50/50ジャッジメントへ：25.0%
// （奇数図柄揃いの「レゾンデートルBONUS」は必ず50/50ジャッジメントへ、偶数図柄揃いの
// 「DEAD or ALIVE CHALLENGE」は演出成功時のみ50/50ジャッジメントへ、という2つの
// 入口があるが、円グラフの75.0%/25.0%は両方の結果を合算した最終値になっているため、
// 別々に実装する必要は無いと判断した）
// 50/50ジャッジメント中（電チュー入賞時・特図2、成功率50%、必ず成立する演出）の振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：50.0%（失敗）
//   ・10R大当り×5(約7500個)→ツラヌキチャレンジへ：50.0%（成功）
// ツラヌキチャレンジ中（電チュー入賞時・特図2、必ず成立する演出）の振り分け:
//   ・10R大当り×5(約7500個)→ツラヌキチャレンジ継続：30.0%
//   ・10R大当り(約1500個)→絶対王政RUSH BURST(ST135回)へ：70.0%
// 絶対王政RUSH BURST中（電チュー入賞時・特図2、当選確率約1/99）の振り分け:
//   ・10R大当り(約1500個)→継続：58.0%
//   ・10R大当り(約1500個)→運命の一撃へ：42.0%
// 運命の一撃（RUSH中当選の42%にセットで付随する追加抽選、当選確率100%）の振り分け:
//   ・→ツラヌキチャレンジへ：約60%（成功）
//   ・→絶対王政RUSH BURSTへ戻る：約40%（失敗）
// （絶対王政RUSH BURSTは規定回数（135回）を全弾外すと通常へ。継続率約75%は、
// 素の1-(1-1/99)^135≈74.8%とほぼ一致しており、運命の一撃による特別な引き戻しは
// 加味しなくてよい）
//
// 【50/50ジャッジメント・ツラヌキチャレンジ・運命の一撃をprobability:1の
// 即時解決する状態として実装】
// この3つはいずれも「外れ」の概念が無く、必ずどちらかの枝に進む演出として
// 説明されている（円グラフの内訳も合計100%）。ツラヌキチャレンジは成功時に
// 同じ状態へ戻って7500個を繰り返し積み増せる一方、失敗時には別の状態
// （絶対王政RUSH BURST）へ出玉を伴って移行するため、stateEngineのbonusLoop
// （同じ額を積み増すだけの仕組み）では表現できない。e-accelerator-saikyo.jsの
// saikyoJudgmentと同じ「probability:1、mode:countUp」の状態として実装し、
// 各状態のonHit.outcomesで分岐先と出玉を個別に指定した。
// 運命の一撃自体には出玉が付随しない（RUSH中大当りの1500個で完結しており、
// 運命の一撃は移行先を決めるだけの抽選）ため、rounds:1・balls:0の
// 明示的なオーバーライドで表現した（e-nanatai3.js等と同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15。e-kakegurui219.jsと同じ比率）。
// 7500個(1500個×5)は実獲得1400個×5=7000個として換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kakegurui7500",
  slug: "e-kakegurui7500",
  name: "eカケグルイ 7500ver",
  nameKana: "いーかけぐるいななせんごひゃくばー",
  aliases: ["カケグルイ7500", "eカケグルイ7500", "賭ケグルイパチンコ7500", "カケグルイ7500ver"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：約1/204",
    "絶対王政RUSH BURST中の当選確率：約1/99",
    "絶対王政RUSH BURST（LT）：ST135回、継続率約75%",
    "50/50ジャッジメント突入率：約25%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが75.0%、10R・実獲得約1400個で50/50ジャッジメントへが25.0%",
    "50/50ジャッジメント（必ず成立）の振り分け：10R・実獲得約1400個で通常時へが50.0%（失敗）、10R×5・実獲得約7000個でツラヌキチャレンジへが50.0%（成功）",
    "ツラヌキチャレンジ（必ず成立）の振り分け：10R×5・実獲得約7000個で継続が30.0%、10R・実獲得約1400個で絶対王政RUSH BURSTへが70.0%",
    "絶対王政RUSH BURST中の当選振り分け：10R・実獲得約1400個で継続が58.0%、10R・実獲得約1400個で運命の一撃へが42.0%",
    "運命の一撃（必ず成立）の振り分け：ツラヌキチャレンジへが約60%（成功）、絶対王政RUSH BURSTへ戻るが約40%（失敗）",
    "絶対王政RUSH BURSTは規定回数（135回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 204,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.25,
            rounds: 10,
            balls: 1400,
            nextState: "judgment5050",
            tag: "toJudgment5050",
            resultNote: "50/50ジャッジメント",
          },
        ],
      },
      onExhausted: null,
    },

    judgment5050: {
      id: "judgment5050",
      label: "50/50ジャッジメント",
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
            displayRounds: 50,
            balls: 7000,
            nextState: "tsuranukiChallenge",
            tag: "judgmentSuccess",
            resultNote: "ツラヌキチャレンジ",
          },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "normal",
            tag: "judgmentFail",
            resultNote: "通常時へ",
          },
        ],
      },
      onExhausted: null,
    },

    tsuranukiChallenge: {
      id: "tsuranukiChallenge",
      label: "ツラヌキチャレンジ",
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
            weight: 0.3,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "tsuranukiChallenge",
            tag: "continueChallenge",
            resultNote: "ツラヌキチャレンジ継続",
          },
          {
            weight: 0.7,
            rounds: 10,
            balls: 1400,
            nextState: "rushBurst",
            tag: "toRushBurst",
            resultNote: "絶対王政RUSH BURST",
          },
        ],
      },
      onExhausted: null,
    },

    rushBurst: {
      id: "rushBurst",
      label: "絶対王政RUSH BURST",
      mode: "countDown",
      maxAttempts: 135,
      probability: 1 / 99,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.58, rounds: 10, balls: 1400, nextState: "rushBurst", tag: "continue" },
          {
            weight: 0.42,
            rounds: 10,
            balls: 1400,
            nextState: "unmeiIchigeki",
            tag: "toUnmei",
            resultNote: "運命の一撃",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushBurstEnd", resultLabel: "絶対王政RUSH BURST終了" },
    },

    unmeiIchigeki: {
      id: "unmeiIchigeki",
      label: "運命の一撃",
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
            weight: 0.6,
            rounds: 1,
            balls: 0,
            nextState: "tsuranukiChallenge",
            tag: "unmeiSuccess",
            resultNote: "ツラヌキチャレンジ",
          },
          {
            weight: 0.4,
            rounds: 1,
            balls: 0,
            nextState: "rushBurst",
            tag: "unmeiFail",
            resultNote: "絶対王政RUSH BURST",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
