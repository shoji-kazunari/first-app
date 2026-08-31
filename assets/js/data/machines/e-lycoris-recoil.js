// 第9号機: eリコリス・リコイル（2026年 newgin スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/lycoris_recoil/）。
// 大当たり振り分けは、同ページに掲載されている4枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・3R大当たり(約310個・実獲得280個)→通常（時短なし）：20.0%
//   ・4R大当たり(約600個・実獲得560個)→通常（時短なし）：30.0%
//   ・3R大当たり(約310個・実獲得280個)→RUSH突入：5.0%
//   ・10R大当たり(約1500個・実獲得1400個)→RUSH突入：0.1%
//   ・4R大当たり(約600個・実獲得560個)→RUSH突入：44.9%
// （RUSH突入時は円グラフ脚注のとおり約30%でモードBから、約70%でモードAから開始。
// 上記5パターンのうちRUSH突入する3パターンそれぞれに、この70/30をかけ合わせて
// 実装している）
//
// 電チュー入賞時（特図2・モードA中）の振り分け:
//   ・5R大当たり(約750個・実獲得700個)→モードA継続：50.0%
//   ・5R大当たり(約750個・実獲得700個)→モードBへ：50.0%
// 電チュー入賞時（特図2・モードB中）の振り分け:
//   ・5R×4大当たり(約3000個・実獲得2800個)→モードB継続：50.0%
//   ・5R×8+α大当たり(約6000個・実獲得5600個)→アルティメットドライブ(UD)：50.0%
//
// 状態遷移: SPECIAL LycoReco RUSH HYPER DELUXE（モードA/B共通でST132回）を
// 全弾外すと通常へ。継続率約75%は1/97.1・132回転から自然に導かれる値と一致
// （1-(1-1/97.1)^132≈75%）。
//
// 【アルティメットドライブ(UD)について】
// UDは「突入時点で6000個獲得が濃厚となり、その後は3000個の大当たりが50%で
// ループする」という説明で、独立したST回数を持たない（1geki.jpにもUD専用の
// 回転数・当選確率の記載が無い）。「アルティメットドライブ（UD）中出玉期待度」の
// 円グラフ（6000個50%・9000個25%・12000個12.5%・15000個6.3%・18000個3.1%・
// 21000個以上3.1%）は、50%の等比数列と完全に一致し、東京喰種 超デカ超一撃ver.の
// 喰MAXループと同じ構造。そのため独立した状態(state)は作らず、モードBの
// 「5R×8+α」outcomeにstateEngineのbonusLoopをそのまま付与し（base:5600個、
// 成功ごとに+2800個）、UDの解決後はモードBへ戻る形で実装している
// （SAO夜空のSWORD DRIVEのような非公開の継続率を推測する必要はなかった）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表・各大当たり詳細ページに実獲得個数が明記されている値をそのまま使用
// （3R:280個、4R:560個、5R:700個、10R:1400個、5R×4:2800個、5R×8+α:5600個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-lycoris-recoil",
  slug: "e-lycoris-recoil",
  name: "eリコリス・リコイル",
  nameKana: "いーりこりすりこいる",
  aliases: ["リコリコ", "リコリス・リコイル", "リコリスリコイル", "リコリス", "千束", "たきな"],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/259.7",
    "RUSH中大当たり確率：約1/97.1（電チューロング解放確率）",
    "SPECIAL LycoReco RUSH HYPER DELUXE：ST132回、継続率約75%",
    "RUSH突入率：約50%（通常時の大当たりのうち、RUSHへ突入するのが約50%）。突入時は約30%でモードBから、約70%でモードAから開始",
    "通常時の大当たり振り分け（ヘソ入賞時）：3R・実獲得約280個で通常のままが20.0%、4R・実獲得約560個で通常のままが30.0%、3R・実獲得約280個でRUSH突入が5.0%、10R・実獲得約1400個でRUSH突入が0.1%、4R・実獲得約560個でRUSH突入が44.9%",
    "モードA中の当選振り分け（電チュー入賞時）：5R・実獲得約700個でモードA継続が50.0%、5R・実獲得約700個でモードBへが50.0%",
    "モードB中の当選振り分け（電チュー入賞時）：5R×4・実獲得約2800個でモードB継続が50.0%、5R×8+α・実獲得約5600個+αでアルティメットドライブ(UD)が50.0%（UDは3000個(実獲得2800個)の上乗せが50%で成功する限りループする、独立したST回数を持たないボーナス）",
    "SPECIAL LycoReco RUSH HYPER DELUXEは規定回数（132回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 259.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 3, balls: 280, nextState: "normal", tag: "toNormal3R" },
          { weight: 0.3, rounds: 4, balls: 560, nextState: "normal", tag: "toNormal4R" },
          {
            weight: 0.035,
            rounds: 3,
            balls: 280,
            nextState: "modeA",
            tag: "toModeA3R",
            resultNote: "3R→モードA",
          },
          {
            weight: 0.015,
            rounds: 3,
            balls: 280,
            nextState: "modeB",
            tag: "toModeB3R",
            resultNote: "3R→モードB",
          },
          {
            weight: 0.0007,
            rounds: 10,
            balls: 1400,
            nextState: "modeA",
            tag: "toModeA10R",
            resultNote: "10R→モードA",
          },
          {
            weight: 0.0003,
            rounds: 10,
            balls: 1400,
            nextState: "modeB",
            tag: "toModeB10R",
            resultNote: "10R→モードB",
          },
          {
            weight: 0.3143,
            rounds: 4,
            balls: 560,
            nextState: "modeA",
            tag: "toModeA4R",
            resultNote: "4R→モードA",
          },
          {
            weight: 0.1347,
            rounds: 4,
            balls: 560,
            nextState: "modeB",
            tag: "toModeB4R",
            resultNote: "4R→モードB",
          },
        ],
      },
      onExhausted: null,
    },

    modeA: {
      id: "modeA",
      label: "SPECIAL LycoReco RUSH HYPER DELUXE（モードA）",
      mode: "countDown",
      maxAttempts: 132,
      probability: 1 / 97.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 5, balls: 700, nextState: "modeA", tag: "modeAContinue" },
          { weight: 0.5, rounds: 5, balls: 700, nextState: "modeB", tag: "modeAToModeB" },
        ],
      },
      onExhausted: {
        nextState: "normal",
        tag: "modeAEnd",
        resultLabel: "SPECIAL LycoReco RUSH HYPER DELUXE終了",
      },
    },

    modeB: {
      id: "modeB",
      label: "SPECIAL LycoReco RUSH HYPER DELUXE（モードB）",
      mode: "countDown",
      maxAttempts: 132,
      probability: 1 / 97.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 5,
            displayRounds: 20,
            balls: 2800,
            nextState: "modeB",
            tag: "modeB3000",
            resultNote: "5R×4",
          },
          {
            weight: 0.5,
            rounds: 5,
            displayRounds: 40,
            balls: 5600,
            nextState: "modeB",
            tag: "toUD",
            resultNote: "ULTIMATE DRIVE 5R×8",
            bonusLoop: { probability: 0.5, balls: 2800 },
          },
        ],
      },
      onExhausted: {
        nextState: "normal",
        tag: "modeBEnd",
        resultLabel: "SPECIAL LycoReco RUSH HYPER DELUXE終了",
      },
    },
  },

  distributionTables: {},

  // 3R=280個、4R=560個、5R=700個、10R=1400個が代表値。
  // モードBの5R×4/5R×8+αは各onHit.outcomesのballsで上書きする。
  payoutTable: { 3: 280, 4: 560, 5: 700, 10: 1400 },
});
