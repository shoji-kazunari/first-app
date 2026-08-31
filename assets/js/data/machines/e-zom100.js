// 第14号機: eゾン100～ゾンビになるまでにしたい100のこと～（2026年 SanseiR&D スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_zom100/）。
// 大当たり振り分けは、同ページに掲載されている6枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1）の大当たり振り分け:
//   ・通常時: 2R(約300個)→ハピネスタイム(時短なし30回)75.0% / 2R(約300個)→
//     ゾンデミックパーティー(ST100回)25.0%
//   ・ハピネスタイム中: 2R(約200個)→フォーチュンチャンス(時短なし30回)50.0% /
//     2R(約300個)→ゾンデミックパーティー50.0%
//   ・フォーチュンチャンス中: 2R+10R(約1800個)→ゾンデミックパーティー50.0% /
//     2R+10R×2(約3300個)→ハンドレッドドリーム(初回)50.0%
// 電チュー入賞時（特図2）の大当たり振り分け:
//   ・ゾンデミックパーティー中: 10R(約1500個)→継続30.0% / 10R×2(約3000個)→
//     ハンドレッドドリーム(初回)70.0%
//   ・ハンドレッドドリーム（初回）中: 10R×2(約3000個)→ハンドレッドドリーム
//     (2回目以降)49.0% / 10R×4(約6000個)→ハンドレッドドリーム(2回目以降)51.0%
//   ・ハンドレッドドリーム（2回目以降）中: 10R(約1500個)44.5% / 10R×2(約3000個)
//     27.2% / 10R×4(約6000個)28.3%（いずれも継続）
//
// ハピネスタイム・フォーチュンチャンスは円グラフに「（ヘソ入賞時 特図1）」と
// 明記されており、電サポの付かない左打ち状態（時短なし・規定回数消化型）。
// このシミュレーターでは通常時と同じ大当たり確率（1/199.5、公式に別の値の
// 記載が無いため）で実装し、通常時と同様に投資が積み上がる状態として扱った。
//
// ハンドレッドドリームは転落抽選型（大当たり確率約1/34、転落確率約1/99）。
// 継続率の計算値 (1/34)/((1/34)+(1/99))≈74.4%は公表の「継続率約75%」と近く、
// 残保留の引き戻しは無いと判断し、onFall.residualAttemptsは指定していない
// （pf-gundam-uc.jsとは異なりここでは不要だった）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表に実獲得個数が明記されている値はそのまま使用（2R:300→280、
// 10R:1500→1400、10R×2:3000→2800、10R×4:6000→5600、比率14/15）。
// フォーチュンチャンスの1800個・3300個には実獲得個数の記載が無かったが、
// 上記の比率がどの段でも一致していたため、同じ14/15を適用した
// （1800→1680、3300→3080。いずれも割り切れる）。
//
// 【ハピネスタイムの「約200個」だけ実獲得個数が不明】
// ハピネスタイム→フォーチュンチャンスの枝（円グラフのみに登場し、詳細テーブルが
// 存在しない）は「約200個」とだけ書かれており、実獲得個数の記載も無く、
// 14/15を掛けても186.67…と割り切れない（他の全ての段は割り切れていた）。
// 無理に比率を当てはめて数値を作ることは避け、払い出し基準の200個をそのまま
// 実獲得個数として使っている（他の段よりわずかに少なめに出玉を見積もっている
// 可能性がある）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-zom100",
  slug: "e-zom100",
  name: "eゾン100～ゾンビになるまでにしたい100のこと～",
  nameKana: "いーぞんひゃくぞんびになるまでにしたいひゃくのこと",
  aliases: ["ゾン100", "ゾンビになるまでにしたい100のこと", "ゾン100パチンコ", "ゾンビ100"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/199.5",
    "ゾンデミックパーティー中の当選確率：約1/146.6（ST100回）",
    "ハンドレッドドリーム中の当選確率：約1/34、転落確率：約1/99（継続率約75%）",
    "通常時の大当たり振り分け（ヘソ入賞時）：2R・実獲得約280個でハピネスタイム(時短なし30回)が75.0%、2R・実獲得約280個でゾンデミックパーティー(ST100回)が25.0%",
    "ハピネスタイム中の振り分け（ヘソ入賞時）：2R・約200個でフォーチュンチャンス(時短なし30回)が50.0%、2R・実獲得約280個でゾンデミックパーティーが50.0%",
    "フォーチュンチャンス中の振り分け（ヘソ入賞時）：2R+10R・実獲得約1680個でゾンデミックパーティーが50.0%、2R+10R×2・実獲得約3080個でハンドレッドドリーム(初回)が50.0%",
    "ゾンデミックパーティー中の振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が30.0%、10R×2・実獲得約2800個でハンドレッドドリーム(初回)が70.0%",
    "ハンドレッドドリーム(初回)中の振り分け（電チュー入賞時）：10R×2・実獲得約2800個が49.0%、10R×4・実獲得約5600個が51.0%（いずれもハンドレッドドリーム(2回目以降)へ）",
    "ハンドレッドドリーム(2回目以降)中の振り分け（電チュー入賞時）：10R・実獲得約1400個が44.5%、10R×2・実獲得約2800個が27.2%、10R×4・実獲得約5600個が28.3%（いずれも継続）",
    "ハピネスタイム・フォーチュンチャンスは規定回数（30回）を全弾外すと通常へ、ゾンデミックパーティーは規定回数（100回）を全弾外すと通常へ、ハンドレッドドリームは転落小当たりを引くと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.5,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 2, balls: 280, nextState: "happiness", tag: "toHappiness" },
          { weight: 0.25, rounds: 2, balls: 280, nextState: "party", tag: "toParty" },
        ],
      },
      onExhausted: null,
    },

    happiness: {
      id: "happiness",
      label: "ハピネスタイム",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 199.5,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: true,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 200, nextState: "fortune", tag: "toFortune" },
          { weight: 0.5, rounds: 2, balls: 280, nextState: "party", tag: "happinessToParty" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "happinessEnd", resultLabel: "ハピネスタイム終了" },
    },

    fortune: {
      id: "fortune",
      label: "フォーチュンチャンス",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 199.5,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: true,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            balls: 1680,
            nextState: "party",
            tag: "fortuneToParty",
            resultNote: "DREAM CHALLENGE BONUS",
          },
          {
            weight: 0.5,
            rounds: 10,
            balls: 3080,
            nextState: "hdFirst",
            tag: "fortuneToHdFirst",
            resultNote: "HUNDRED DREAM3000",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "fortuneEnd", resultLabel: "フォーチュンチャンス終了" },
    },

    party: {
      id: "party",
      label: "ゾンデミックパーティー",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 146.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 10, balls: 1400, nextState: "party", tag: "partyContinue" },
          {
            weight: 0.7,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "hdFirst",
            tag: "partyToHdFirst",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "partyEnd", resultLabel: "ゾンデミックパーティー終了" },
    },

    hdFirst: {
      id: "hdFirst",
      label: "ハンドレッドドリーム",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 34,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.49,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "hdMore",
            tag: "hdFirstTo3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.51,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "hdMore",
            tag: "hdFirstTo6000",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 99,
        nextState: "normal",
        tag: "hdFall",
        resultLabel: "ハンドレッドドリーム終了（転落）",
      },
    },

    hdMore: {
      id: "hdMore",
      label: "ハンドレッドドリーム（2回目以降）",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 34,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.445, rounds: 10, balls: 1400, nextState: "hdMore", tag: "hdMoreTo1500" },
          {
            weight: 0.272,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "hdMore",
            tag: "hdMoreTo3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.283,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "hdMore",
            tag: "hdMoreTo6000",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 99,
        nextState: "normal",
        tag: "hdMoreFall",
        resultLabel: "ハンドレッドドリーム終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
