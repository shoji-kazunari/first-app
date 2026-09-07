// 第53号機: e 東京リベンジャーズ 聖夜決戦編（2026年 TAIYO ELEC スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_tokyorevengers_seiya/）。
// 既存のe-tokyorevengers.js（無印）とは型式名・検定番号とも別の続編。大当り振り分けは、
// 同ページに掲載されている円グラフ画像（通常時）をダウンロードしてReadツールで
// 直接読み取った実数値。聖夜決戦中・聖夜決戦CLIMAX中はテキストで「全て」の記載が
// あり単一の値のため円グラフの読み取りは不要だった。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/199.8）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：50.0%
//   ・2R大当り(約300個)→聖夜決戦（転落式）：50.0%
// 電チュー入賞時（特図2・聖夜決戦中、大当り確率約1/10.2、転落確率約1/9.8）の振り分け:
//   ・10R大当り(約1500個)→聖夜決戦CLIMAXへ：100%
// （聖夜決戦突破率約49%は、素の(1/10.2)/((1/10.2)+(1/9.8))≈49.0%と完全に一致
// しており、残保留等の引き戻しは無い）
// 電チュー入賞時（特図2・聖夜決戦CLIMAX中、大当り確率約1/10.2）の振り分け:
//   ・10R大当り×2(約3000個)→聖夜決戦CLIMAX継続：100%
// （聖夜決戦CLIMAXは時短11回+残保留4個＝計15回を全弾外すと通常へ。継続率約79%は、
// 素の1-(1-1/10.2)^15≈78.7%とほぼ一致しており、残保留4個分もmaxAttemptsに含める
// だけで再現できる単純なcountDownとして実装した）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-tokyorevengers-seiya",
  slug: "e-tokyorevengers-seiya",
  name: "e 東京リベンジャーズ 聖夜決戦編",
  nameKana: "いーとうきょうりべんじゃーずせいやけっせんへん",
  aliases: ["東リベ聖夜決戦", "東京リベンジャーズ聖夜決戦編", "e東リベ聖夜決戦", "東京リベンジャーズ続編"],
  manufacturer: { id: "taiyo-elec", name: "TAIYO ELEC（タイヨーエレック）" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.8",
    "聖夜決戦・聖夜決戦CLIMAX中の大当り確率：ともに約1/10.2",
    "聖夜決戦：転落式（転落確率約1/9.8、突破率約49%）。突破後は聖夜決戦CLIMAXへ",
    "聖夜決戦CLIMAX：時短11回+残保留4個、継続率約79%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが50.0%、2R・実獲得約280個で聖夜決戦が50.0%",
    "聖夜決戦中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で聖夜決戦CLIMAXへ突入が100%",
    "聖夜決戦CLIMAX中の当選振り分け（電チュー入賞時）：10R×2・実獲得約2800個で継続が100%",
    "聖夜決戦は転落を引くと通常へ、聖夜決戦CLIMAXは規定回数（15回）を全弾外すと通常へ",
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
          { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "seiyaKessen",
            tag: "toSeiyaKessen",
            resultNote: "聖夜決戦",
          },
        ],
      },
      onExhausted: null,
    },

    seiyaKessen: {
      id: "seiyaKessen",
      label: "聖夜決戦",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 10.2,
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
            nextState: "seiyaClimax",
            tag: "toClimax",
            resultNote: "聖夜決戦CLIMAX",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 9.8,
        nextState: "normal",
        tag: "seiyaKessenFall",
        resultLabel: "聖夜決戦終了（転落）",
      },
    },

    seiyaClimax: {
      id: "seiyaClimax",
      label: "聖夜決戦CLIMAX",
      mode: "countDown",
      maxAttempts: 15,
      probability: 1 / 10.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "seiyaClimax",
            tag: "climaxContinue",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "climaxEnd", resultLabel: "聖夜決戦CLIMAX終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
