// 第23号機: e EDENS ZERO ～究極LT～（2026年 NANASHOW スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_edenszero/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・
// 絆バトルRUSH中・ULTRA OVER DRIVE中）をダウンロードしてReadツールで直接
// 読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/399.9）の振り分け:
//   ・10R大当り(1500個)→通常（時短なし）：50.0%
//   ・10R大当り(1500個)→絆バトルRUSH：50.0%
// （※1「チャージ当り（入浴タイム）を除く」とあり、入浴タイム（約1/2799.9、
// 2R・300個、常に通常時へ）は円グラフにも数値の記載が無いため、e-garo12.js
// のガロチャージ等と同じ理由でこのシミュレーターには実装していない）
//
// 絆バトルRUSHは転落式（バトル勝利確率約1/1.7、バトル敗北確率約1/5.7、
// 継続率約77%）。バトル勝利時の内訳は:
//   ・67%：10R大当り(1500個)→RUSH継続
//   ・33%：究極臨界JUDGEMENT発生（10R～10R×5、1500個～7500個）
// 究極臨界JUDGEMENTは「3000個以上の出玉獲得でULTRA OVER DRIVE突入、1500個の
// 場合は絆バトルRUSH継続」で、「実質成功期待度（3000個以上）は約86%」と公表
// されている。ただし成功時の3000/4500/6000/7500個の内訳（個々の重み）は
// 1geki.jpに数値の記載が無く、円グラフも「1500個～7500個」の一括表示のみ。
// そのためJUDGEMENTは次の2値に単純化して実装した:
//   ・14%（=100%-86%）：10R大当り(1500個)→絆バトルRUSH継続
//   ・86%：ULTRA OVER DRIVEへ突入。成功時の内訳が不明なため、保守的に成功の
//     最小値である10R×2(3000個)を代表値として採用した（実際の期待値は
//     3000～7500個の範囲でこれより高くなる可能性がある）
//
// ULTRA OVER DRIVE（究極LT）も転落式（バトル勝利確率約1/1.3、バトル敗北確率
// 約1/4.2、継続率約77%）。当選時の内訳:
//   ・14.5%：10R大当り(1500個)
//   ・35.6%：10R×2大当り(3000個)
//   ・33.6%：10R×3大当り(4500個)
//   ・14.1%：10R×4大当り(6000個)
//   ・2.2%：10R×5大当り(7500個)
// （いずれも継続。転落で通常へ）
//
// 【引き戻し等の未実装ギャップについて】
// 絆バトルRUSHの素の計算(1/1.7)/((1/1.7)+(1/5.7))≈77.0%、ULTRA OVER DRIVEの
// 素の計算(1/1.3)/((1/1.3)+(1/4.2))≈76.4%はいずれも公表の継続率約77%とほぼ
// 一致しており、他機種で見られる残保留・LAST ATTACK等の大きな引き戻し
// ギャップは無い。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 1500個/実獲得1400個、比率14/15）。
// 明記の無い10R×2～×5にも同じ比率をそのまま適用した
// （3000→2800、4500→4200、6000→5600、7500→7000。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-edenszero",
  slug: "e-edenszero",
  name: "e EDENS ZERO ～究極LT～",
  nameKana: "いーえでんずぜろきゅうきょくえるてぃー",
  aliases: ["エデンズゼロ", "EDENS ZERO", "エデンズゼロ究極LT", "eエデンズゼロ"],
  manufacturer: { id: "nanashow", name: "NANASHOW" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：約1/399.9",
    "絆バトルRUSH：転落式（バトル勝利確率約1/1.7、バトル敗北確率約1/5.7、継続率約77%）",
    "ULTRA OVER DRIVE（究極LT）：転落式（バトル勝利確率約1/1.3、バトル敗北確率約1/4.2、継続率約77%）",
    "RUSH突入率：図柄揃いの50%",
    "通常時の大当り振り分け（ヘソ入賞時・図柄揃い）：10R・実獲得1400個で通常のままが50.0%、10R・実獲得1400個で絆バトルRUSHが50.0%",
    "絆バトルRUSH中のバトル勝利時の振り分け：10R・実獲得1400個で継続が67%、究極臨界JUDGEMENT発生が33%（成功率約86%でULTRA OVER DRIVE突入。詳細はコメント）",
    "ULTRA OVER DRIVE中のバトル勝利時の振り分け：10R・実獲得1400個が14.5%、10R×2・実獲得2800個が35.6%、10R×3・実獲得4200個が33.6%、10R×4・実獲得5600個が14.1%、10R×5・実獲得7000個が2.2%（いずれも継続）",
    "絆バトルRUSH・ULTRA OVER DRIVEとも転落でバトル敗北となり通常へ",
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
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "kizunaRush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    kizunaRush: {
      id: "kizunaRush",
      label: "絆バトルRUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 1.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.67, rounds: 10, balls: 1400, nextState: "kizunaRush", tag: "rushContinue" },
          {
            weight: 0.0462,
            rounds: 10,
            balls: 1400,
            nextState: "kizunaRush",
            tag: "judgementFail",
            resultNote: "究極臨界JUDGEMENT",
          },
          {
            weight: 0.2838,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ultraOverDrive",
            tag: "judgementSuccess",
            resultNote: "究極臨界JUDGEMENT成功",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 5.7,
        nextState: "normal",
        tag: "rushFall",
        resultLabel: "絆バトルRUSH終了（転落）",
      },
    },

    ultraOverDrive: {
      id: "ultraOverDrive",
      label: "ULTRA OVER DRIVE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 1.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.145, rounds: 10, balls: 1400, nextState: "ultraOverDrive", tag: "odContinue1" },
          {
            weight: 0.356,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ultraOverDrive",
            tag: "odContinue2",
            resultNote: "10R×2",
          },
          {
            weight: 0.336,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "ultraOverDrive",
            tag: "odContinue3",
            resultNote: "10R×3",
          },
          {
            weight: 0.141,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "ultraOverDrive",
            tag: "odContinue4",
            resultNote: "10R×4",
          },
          {
            weight: 0.022,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "ultraOverDrive",
            tag: "odContinue5",
            resultNote: "10R×5",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 4.2,
        nextState: "normal",
        tag: "odFall",
        resultLabel: "ULTRA OVER DRIVE終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400 },
});
