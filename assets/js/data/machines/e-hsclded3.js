// 第57号機: e 学園黙示録ハイスクール・オブ・ザ・デッド3（2026年 TAKAO スマパチ/ラッキートリガー機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_hsclded3/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// 奴RUSH(SUPER)中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/299.2）の振り分け:
//   ・6R大当り(約660個)→通常（時短なし）：50.0%
//   ・6R大当り(約660個)→奴RUSH(電サポ47回+残存保留4回)：49.5%
//   ・6R大当り(約660個)→奴RUSH SUPER(電サポ80回+残存保留4回)へ直行：0.5%
// 電チュー入賞時（特図2・奴RUSH／奴RUSH SUPER中、当選確率約1/32.4）の振り分け:
//   ・10R大当り(約1200個)→奴RUSH SUPERへ：40.0%
//   ・8R大当り(約960個)→奴RUSH SUPERへ：1.0%
//   ・7R大当り(約840個)→奴RUSH SUPERへ：3.0%
//   ・6R大当り(約720個)→奴RUSH SUPERへ：6.0%
//   ・3R大当り(約360個)→奴RUSH SUPERへ：50.0%
// （円グラフ・機種概要とも「奴RUSH中の当りは必ず奴RUSH SUPERへ突入」「奴RUSH
// SUPER中はそのまま継続」という同一の振り分けテーブルを共有しているため、
// 両状態のonHit.outcomesは共通にした。当選確率約1/32.4は「※1 大当たり確率
// 1/299.2と小当たり確率1/36.4の合算値」で、1/299.2+1/36.4≈1/32.45と一致する。
// 内訳を分ける情報が無いため合算値をそのまま使用）
// （奴RUSHは電サポ47回+残存保留4回＝計51回転を全弾外すと通常へ。継続率約80%は
// 素の1-(1-1/32.4)^51≈79.8%とほぼ一致。奴RUSH SUPERは電サポ80回+残存保留4回＝
// 計84回転で、継続率約93%は素の1-(1-1/32.4)^84≈92.8%とほぼ一致。いずれも
// 残保留分をmaxAttemptsに含めるだけで再現できる）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1200個/実獲得1100個、
// 8R: 約960個/実獲得880個、7R: 約840個/実獲得770個、6R: 約720個/実獲得660個
// [RUSH中]、6R: 約660個/実獲得600個[通常時の入り口]、3R: 約360個/実獲得330個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-hsclded3",
  slug: "e-hsclded3",
  name: "e 学園黙示録ハイスクール・オブ・ザ・デッド3",
  nameKana: "いーがくえんもくしろくはいすくーるおぶざでっどすりー",
  aliases: ["HOTD3", "ハイスクールオブザデッド3", "学園黙示録3", "e学園黙示録3", "がくもくHOTD3"],
  manufacturer: { id: "takao", name: "TAKAO（高尾）" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/299.2",
    "奴RUSH・奴RUSH SUPER中の当選確率：ともに約1/32.4（大当り確率1/299.2と小当り確率1/36.4の合算）",
    "奴RUSH：電サポ47回+残存保留4回、継続率約80%",
    "奴RUSH SUPER：電サポ80回+残存保留4回、継続率約93%",
    "RUSH突入率：約50%",
    "通常時の大当り振り分け（ヘソ入賞時）：6R・実獲得約600個で通常のままが50.0%、6R・実獲得約600個で奴RUSHが49.5%、6R・実獲得約600個で奴RUSH SUPER直行が0.5%",
    "奴RUSH・奴RUSH SUPER共通の当選振り分け（電チュー入賞時）：10R・実獲得約1100個が40.0%、8R・実獲得約880個が1.0%、7R・実獲得約770個が3.0%、6R・実獲得約660個が6.0%、3R・実獲得約330個が50.0%（いずれも奴RUSH SUPERへ）",
    "奴RUSH・奴RUSH SUPERとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 299.2,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 6, balls: 600, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.495,
            rounds: 6,
            balls: 600,
            nextState: "yatsuRush",
            tag: "toYatsuRush",
            resultNote: "奴RUSH",
          },
          {
            weight: 0.005,
            rounds: 6,
            balls: 600,
            nextState: "yatsuRushSuper",
            tag: "toYatsuRushSuperDirect",
            resultNote: "奴RUSH SUPER",
          },
        ],
      },
      onExhausted: null,
    },

    yatsuRush: {
      id: "yatsuRush",
      label: "奴RUSH",
      mode: "countDown",
      maxAttempts: 51,
      probability: 1 / 32.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.4,
            rounds: 10,
            balls: 1100,
            nextState: "yatsuRushSuper",
            tag: "toSuper10R",
            resultNote: "奴RUSH SUPER",
          },
          {
            weight: 0.01,
            rounds: 8,
            balls: 880,
            nextState: "yatsuRushSuper",
            tag: "toSuper8R",
            resultNote: "奴RUSH SUPER",
          },
          {
            weight: 0.03,
            rounds: 7,
            balls: 770,
            nextState: "yatsuRushSuper",
            tag: "toSuper7R",
            resultNote: "奴RUSH SUPER",
          },
          {
            weight: 0.06,
            rounds: 6,
            balls: 660,
            nextState: "yatsuRushSuper",
            tag: "toSuper6R",
            resultNote: "奴RUSH SUPER",
          },
          {
            weight: 0.5,
            rounds: 3,
            balls: 330,
            nextState: "yatsuRushSuper",
            tag: "toSuper3R",
            resultNote: "奴RUSH SUPER",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "yatsuRushEnd", resultLabel: "奴RUSH終了" },
    },

    yatsuRushSuper: {
      id: "yatsuRushSuper",
      label: "奴RUSH SUPER",
      mode: "countDown",
      maxAttempts: 84,
      probability: 1 / 32.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.4, rounds: 10, balls: 1100, nextState: "yatsuRushSuper", tag: "continue10R" },
          { weight: 0.01, rounds: 8, balls: 880, nextState: "yatsuRushSuper", tag: "continue8R" },
          { weight: 0.03, rounds: 7, balls: 770, nextState: "yatsuRushSuper", tag: "continue7R" },
          { weight: 0.06, rounds: 6, balls: 660, nextState: "yatsuRushSuper", tag: "continue6R" },
          { weight: 0.5, rounds: 3, balls: 330, nextState: "yatsuRushSuper", tag: "continue3R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "yatsuRushSuperEnd", resultLabel: "奴RUSH SUPER終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1100, 8: 880, 7: 770, 6: 660, 3: 330 },
});
