// 第2号機: eパチンコ 新世紀エヴァンゲリオン〜はじまりの記憶〜（2025年 ビスティ スマパチ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_eva17/）。この機種以降、
// 新機種のスペック確認は1geki.jpを標準ソースにする方針（詳細は
// memory: machine-spec-sourcing を参照）。
//
// 大当たり振り分けは、同ページに掲載されている円グラフ画像を直接読み取って
// 確認した実数値（WebFetchはテキストしか読めず%を拾えなかったが、画像
// ファイルとしてダウンロードしてReadツールで直接見れば読み取れた）。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・2R大当り(約300個)→インパクトモード(ST157回)：約50.0%
//   ・2R大当り(約300個)→チャンスタイム(時短100回)：約49.5%
//   ・10R大当り(約1500個)→インパクトモード(ST157回)：約0.5%
// 電チュー入賞時（特図2・インパクトモード中/チャンスタイム中共通）の振り分け:
//   ・8R大当り×2(約2400個)→インパクトモード(ST157回)：約99.5%
//   ・8R大当り×4(約4800個・LT成立)→インパクトモード(ST157回)：約0.5%
// 状態遷移: ST全弾外れ（157回転消化）→通常、チャンスタイム全弾外れ（100回転消化）→通常
// （いずれも1geki.jpのゲームフロー説明に明記）。
//
// 上記以外の基本値（確率1/399.9・1/99.6、ST157回転、時短100回転）は
// 複数の情報源で一致しており確定値として扱っている。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "eva17-hajimari",
  slug: "eva17-hajimari",
  name: "eパチンコ 新世紀エヴァンゲリオン〜はじまりの記憶〜",
  nameKana: "いーぱちんこしんせいきえゔぁんげりおんはじまりのきおく",
  aliases: ["エヴァ17", "エヴァンゲリオン17", "はじまりの記憶", "エヴァはじまりの記憶", "エヴァ最新台"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2025,
  category: "スマパチ（ST機/ラッキートリガー）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/399.9",
    "ST（インパクトモード）中大当たり確率：約1/99.6",
    "ST：157回転（1回でも当選すれば再びST継続。継続率は約80%）",
    "時短（チャンスタイム）：100回転（大当たり確率は通常時と同じ約1/399.9）",
    "通常時の大当たり振り分け（ヘソ入賞時）：2R・約300個でST直行が約50.0%、2R・約300個で時短が約49.5%、10R・約1500個でST直行が約0.5%",
    "時短（チャンスタイム）中に当選するとST（インパクトモード）へ",
    "ST・時短中の当選振り分け（電チュー入賞時）：8R・約2400個が約99.5%、8R・約4800個（LT成立）が約0.5%",
    "STを全弾外すと通常へ、時短（チャンスタイム）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 2, balls: 300, nextState: "st", tag: "toStDirect" },
          { weight: 0.495, rounds: 2, balls: 300, nextState: "chanceTime", tag: "toChanceTime" },
          {
            weight: 0.005,
            rounds: 10,
            balls: 1500,
            nextState: "st",
            tag: "toStDirectMega",
            resultNote: "全回転",
          },
        ],
      },
      onExhausted: null,
    },

    chanceTime: {
      id: "chanceTime",
      label: "時短（チャンスタイム）",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.995, rounds: 8, balls: 2400, nextState: "st", tag: "chanceToSt" },
          {
            weight: 0.005,
            rounds: 8,
            balls: 4800,
            nextState: "st",
            tag: "chanceToStMega",
            resultNote: "LT成立",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceTimeEnd", resultLabel: "時短終了" },
    },

    st: {
      id: "st",
      label: "ST（インパクトモード）",
      mode: "countDown",
      maxAttempts: 157,
      probability: 1 / 99.6,
      actionLabel: "JUDGEMENT",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.995, rounds: 8, balls: 2400, nextState: "st", tag: "stContinue" },
          {
            weight: 0.005,
            rounds: 8,
            balls: 4800,
            nextState: "st",
            tag: "ltEntry",
            resultNote: "LT成立",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stEnd", resultLabel: "ST終了" },
    },
  },

  distributionTables: {},

  // ST・時短中の8Rには通常(2400個)とLT成立(4800個)の2種類があるため、
  // ここには代表値のみ置き、実際の出玉は各onHit.outcomesのballsで上書きする。
  payoutTable: { 2: 300, 8: 2400, 10: 1500 },
});
