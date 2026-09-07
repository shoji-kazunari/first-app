// 第41号機: e 魔法少女まどか☆マギカ3 時間遡行～始まりの願い～（2026年 KYORAKU スマパチ/ラッキートリガー機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_madokamagica3_hajimari/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・ワルプルギスの
// 夜中・アルティメット超RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// 本機は「シリーズ最新機種（後継機）へ」とP魔法少女まどか☆マギカ3 キュゥべえver.への
// 誘導が出ている旧機種だが、今週のアクセスランキング29位にまだ入っており実働している
// 台なので、e-tokyoghoul.js等と同じ扱いで別途追加した（p-madokamagica3.jsとは別の
// パチンコ台。型式名も異なる）。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.9）の振り分け:
//   ・3R大当り(約450個)→通常（時短なし）：30.0%
//   ・3R大当り(約450個)→ワルプルギスの夜(ST100回)：69.0%
//   ・10R大当り(約1500個)→アルティメット超RUSH(ST130回)：1.0%
// 電チュー入賞時（特図2・ワルプルギスの夜中、大当り確率1/146.8）の振り分け:
//   ・5R×2大当り(約1500個)→アルティメット超RUSH(ST130回)：100%
// （ワルプルギスの夜はST100回を全弾外すと通常へ。突破率約50%は、素の
// 1-(1-1/146.8)^100≈49.5%とほぼ一致しており、残保留等の引き戻しは無い）
// 電チュー入賞時（特図2・アルティメット超RUSH中、大当り確率1/82.4）の振り分け:
//   ・5R大当り(約750個)→アルティメット超RUSH継続：25.0%
//   ・5R×4大当り(約3000個)→アルティメット超RUSH継続：75.0%
// （ST130回を全弾外すと通常へ。継続率約80%は、素の1-(1-1/82.4)^130≈79.6%と
// ほぼ一致しており、これも残保留等の引き戻しは無い）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 5R: 約750個/実獲得700個、3R: 約450個/実獲得420個、5R×2: 約1500個/実獲得1400個、
// 5R×4: 約3000個/実獲得2800個、比率14/15）。
//
// 【spinsPer1000Yenについて】
// 1geki.jp記載のボーダーは「概ね20回～22回/1000円を超えるとプラス」で、既存の
// 16回転想定の機種と同水準。デカヘソ等の記載も無いため既定値16のまま実装した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-madokamagica3-hajimari",
  slug: "e-madokamagica3-hajimari",
  name: "e 魔法少女まどか☆マギカ3 時間遡行～始まりの願い～",
  nameKana: "いーまほうしょうじょまどかまぎかすりーじかんそこうはじまりのねがい",
  aliases: [
    "まどマギ3時間遡行",
    "まどマギ3 始まりの願い",
    "魔法少女まどかマギカ3 時間遡行",
    "eまどマギ3",
    "時間遡行まどマギ",
  ],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.9",
    "ワルプルギスの夜中の大当り確率：1/146.8",
    "アルティメット超RUSH中の大当り確率：1/82.4",
    "ワルプルギスの夜：ST100回、突破率約50%",
    "アルティメット超RUSH：ST130回、継続率約80%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約420個で通常のままが30.0%、3R・実獲得約420個でワルプルギスの夜が69.0%、10R・実獲得約1400個でアルティメット超RUSHが1.0%",
    "ワルプルギスの夜中の当選振り分け（電チュー入賞時）：5R×2・実獲得約1400個でアルティメット超RUSHが100%",
    "アルティメット超RUSH中の当選振り分け（電チュー入賞時）：5R・実獲得約700個で継続が25.0%、5R×4・実獲得約2800個で継続が75.0%",
    "ワルプルギスの夜・アルティメット超RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 3, balls: 420, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.69,
            rounds: 3,
            balls: 420,
            nextState: "walpurgisNight",
            tag: "toWalpurgis",
            resultNote: "ワルプルギスの夜",
          },
          {
            weight: 0.01,
            rounds: 10,
            balls: 1400,
            nextState: "ultimateRush",
            tag: "toUltimateDirect",
            resultNote: "アルティメット超RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    walpurgisNight: {
      id: "walpurgisNight",
      label: "ワルプルギスの夜",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 146.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 5,
            displayRounds: 10,
            balls: 1400,
            nextState: "ultimateRush",
            tag: "walpurgisToUltimate",
            resultNote: "5R×2、アルティメット超RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "walpurgisEnd", resultLabel: "ワルプルギスの夜終了" },
    },

    ultimateRush: {
      id: "ultimateRush",
      label: "アルティメット超RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 82.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 5, balls: 700, nextState: "ultimateRush", tag: "ultimateContinue5R" },
          {
            weight: 0.75,
            rounds: 5,
            displayRounds: 20,
            balls: 2800,
            nextState: "ultimateRush",
            tag: "ultimateContinue5Rx4",
            resultNote: "5R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ultimateEnd", resultLabel: "アルティメット超RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 420, 5: 700, 10: 1400 },
});
