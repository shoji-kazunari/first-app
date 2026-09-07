// 機種追加: P 魔法少女まどか☆マギカ3 キュゥべえver.（2026年 KYORAKU 甘デジ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_madomagi3_ama/）。導入日2026年6月8日。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・
// マギカRUSH中・アルティメット超RUSH中）をダウンロードしてReadツールで
// 直接読み取った実数値。p-madokamagica3.js（2024年、LT機版）とは別の型式
// （P魔法少女まどか☆マギカ3MAJ1、甘デジ版）の独立した機種。
//
// ヘソ入賞時（特図1・通常時、大当たり確率約1/99.9※大当たりと小当たりの合算値、
// 小当たり時はV入賞が条件）の振り分け:
//   ・2R大当り(約200個)→通常（時短なし）：45.0%
//   ・2R大当り(約200個)→マギカRUSH(ST60回+残保留4個)：54.5%
//   ・10R大当り(約1000個)→アルティメット超RUSH(ST135回+残保留4個)直行：0.5%
// （「チャレンジBONUS」（2R）は当選時点では通常/マギカRUSHどちらへ行くか
// 決まっておらず、消化中の演出成功でマギカRUSHへ、失敗で通常へ、という
// 建付けだが、出玉・振り分け率は円グラフの数値と完全に一致するため、
// このシミュレーターでは中間の演出状態を作らずヘソ入賞の時点で確定させた。
// 「虹7図柄揃い」（10R）はアルティメット超RUSHへ直行する別枠の大当たり）。
//
// 電チュー入賞時（特図2・マギカRUSH中、大当たり確率約1/62.1）の振り分け:
//   ・4R大当り(約400個)→マギカRUSH継続：50.0%
//   ・10R大当り(約1000個)→ワルプルギスの夜BONUSへ：50.0%
// ワルプルギスの夜BONUSは「ラウンドバトル勝率約50%」の一発判定
// （出玉の記載無し、e-majotoyajuu.jsの運命分岐と同じ構造）で、勝利で
// アルティメット超RUSH(ST135回+残保留4個)、敗北でマギカRUSH(ST60回+
// 残保留4個)に突入する。stateEngineのballs:0（明示的な0を許可する
// machineValidator.jsの改訂により表現可能）で実装した。
//
// 電チュー入賞時（特図2・アルティメット超RUSH中、大当たり確率約1/62.1）の
// 振り分け: 4R大当り(約400個)・10R大当り(約1000個)とも継続50.0%ずつ
// （円グラフ注記「※残保留で引き戻した場合は、マギカRUSHの振り分け」は
// 転落時の話ではなく規定回数消化後の残保留引き戻しを指しており、
// stateEngineのresidualAttemptsではなくmaxAttempts加算（下記）で表現済み）。
//
// 【残保留4個をmaxAttemptsへ組み込む実装】
// マギカRUSH・アルティメット超RUSHとも「ST○回+残保留4個」の規定回数消化型
// （onFallを使わない）で、公表の「継続率（残保留込み）」はマギカRUSH:約65%、
// アルティメット超RUSH:約90%。この機種もonFallを使わない規定回数消化型
// なので、残保留4個をmaxAttempts自体に足し込むだけで数学的に正確に
// 再現できる（e-enen2-99.js等で確立した手法と同じ）。実際に計算式
// 1-(1-1/62.1)^Nへ代入すると、N=64（60+4）で約64.6%、N=139（135+4）で
// 約89.5%となり、公表値にほぼ一致した。maxAttemptsは本来のST回数+4とし、
// includesResidualHold: trueを立てて画面に「（残保留込み）」と注記する。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 4R: 約400個/実獲得360個、2R: 約200個/実獲得180個、比率いずれも9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-madomagi3-ama",
  slug: "p-madomagi3-ama",
  name: "P 魔法少女まどか☆マギカ3 キュゥべえver.",
  nameKana: "ぴーまほうしょうじょまどかまぎかすりーきゅぅべぇばー",
  aliases: ["まどマギ3甘デジ", "まどか☆マギカ3甘デジ", "まどマギ3キュゥべえ", "Pまどマギ3"],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2026,
  category: "パチンコ（一種二種混合機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/99.9（大当たりと小当たりの合算値）",
    "マギカRUSH・アルティメット超RUSH中の大当たり確率：ともに約1/62.1",
    "マギカRUSH：ST60回（残保留込みで実質64回）・継続率約65%",
    "アルティメット超RUSH：ST135回（残保留込みで実質139回）・継続率約90%",
    "RUSH突入率：約55%（うち約0.5%はアルティメット超RUSHへ直行）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約180個で通常のままが45.0%、2R・実獲得約180個でマギカRUSHが54.5%、10R・実獲得約900個でアルティメット超RUSH直行が0.5%",
    "マギカRUSH中の当選振り分け（電チュー入賞時）：4R・実獲得約360個で継続が50.0%、10R・実獲得約900個でワルプルギスの夜BONUS（勝率約50%、勝利でアルティメット超RUSH・敗北でマギカRUSHへ）が50.0%",
    "アルティメット超RUSH中の当選振り分け（電チュー入賞時）：4R・実獲得約360個、10R・実獲得約900個とも継続が50.0%ずつ",
    "マギカRUSH・アルティメット超RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.005,
            rounds: 10,
            balls: 900,
            nextState: "ultimateRush",
            tag: "toUltimateDirect",
            resultNote: "虹7図柄揃い",
          },
          {
            weight: 0.545,
            rounds: 2,
            balls: 180,
            nextState: "magicaRush",
            tag: "toMagicaRush",
            resultNote: "チャレンジBONUS成功",
          },
          {
            weight: 0.45,
            rounds: 2,
            balls: 180,
            nextState: "normal",
            tag: "toNormalChallengeFail",
            resultNote: "チャレンジBONUS",
          },
        ],
      },
      onExhausted: null,
    },

    magicaRush: {
      id: "magicaRush",
      label: "マギカRUSH",
      mode: "countDown",
      maxAttempts: 64, // 本来のST60回+残保留4個
      includesResidualHold: true,
      probability: 1 / 62.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, balls: 360, nextState: "magicaRush", tag: "magicaContinue400" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 900,
            nextState: "warupurugisuBonus",
            tag: "magicaToWarupurugisu",
            resultNote: "ワルプルギスの夜BONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "magicaEnd", resultLabel: "マギカRUSH終了" },
    },

    warupurugisuBonus: {
      id: "warupurugisuBonus",
      label: "ワルプルギスの夜BONUS",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 1,
            balls: 0,
            nextState: "ultimateRush",
            tag: "warupurugisuWin",
            resultNote: "ラウンドバトル勝利",
          },
          {
            weight: 0.5,
            rounds: 1,
            balls: 0,
            nextState: "magicaRush",
            tag: "warupurugisuLose",
            resultNote: "ラウンドバトル敗北",
          },
        ],
      },
      onExhausted: null,
    },

    ultimateRush: {
      id: "ultimateRush",
      label: "アルティメット超RUSH",
      mode: "countDown",
      maxAttempts: 139, // 本来のST135回+残保留4個
      includesResidualHold: true,
      probability: 1 / 62.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, balls: 360, nextState: "ultimateRush", tag: "ultimateContinue400" },
          { weight: 0.5, rounds: 10, balls: 900, nextState: "ultimateRush", tag: "ultimateContinue1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ultimateEnd", resultLabel: "アルティメット超RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 180, 4: 360, 10: 900 },
});
