// 第46号機: e魔法少女リリカルなのは（2026年 SanThree スマパチ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_nanoha/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時の図柄揃い時・
// フルドライブST中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/348.5）の振り分け:
//   ・6R大当り(約900個)→チャレンジタイム(時短100回)：49.34%
//   ・6R大当り(約900個)→フルドライブST(ST70回)：49.34%
//   ・10R大当り×2(約3000個)→フルドライブST(ST70回)：1.32%
// チャレンジタイム中（特図1、大当り確率は通常時と同じ1/348.5）:
//   当選契機は「図柄揃い時ST突入率約63%※1（※1 チャレンジタイム100回での大当たりを
//   含む）」という記載のみで、チャレンジタイム自身の当選時の振り分け円グラフは
//   掲載されていない。ただし通常時直行分（49.34%+1.32%=50.66%）とチャレンジタイム
//   100回消化時の素の到達率(1-(1-1/348.5)^100≈25.0%)を組み合わせると、
//   50.66%+49.34%×25.0%≈62.99%と、公表の「約63%」にほぼ完全に一致する。
//   この一致度の高さから、チャレンジタイムでの当選は必ずフルドライブSTへ直行する
//   （合流先を分けない）と判断し、当選時の出玉は円グラフに載っている「6R大当り
//   （約900個）→フルドライブST」と同じ値を採用した（別値の記載が無いため）。
// 電チュー入賞時（特図2・フルドライブST中、大当り確率1/51.6、STOCK獲得時の期待出玉）:
//   ・10R大当り(約1500個)→フルドライブST継続：47%
//   ・10R大当り×2(約3000個)→フルドライブST継続：32%
//   ・10R大当り×3(約4500個)→フルドライブST継続：14%
//   ・10R大当り×4(約6000個)→フルドライブST継続：5%
//   ・10R大当り×5(約7500個)→フルドライブST継続：2%
// （フルドライブSTは規定回数（70回）を全弾外すと通常へ。継続率約75%は、素の
// 1-(1-1/51.6)^70≈74.6%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【「完走型ST」について】
// 機種概要に「完走型STとなっており図柄揃い後もSTが継続」との記載があるが、
// 具体的にどう特殊なのか（通常のST機のように大当り毎に残り回数がST70回に
// リセットされるのか、それとも当初のST70回の残り回数を維持したまま当り続ける
// 一種二種混合機的な挙動なのか）を判別できる数値・図解が無い。継続率約75%が
// 素の「大当り毎にST70回へリセットされる」前提の計算(1-(1-1/51.6)^70≈74.6%)と
// ほぼ一致しているため、このシミュレーターでは他機種と同じ標準的なST実装
// （nextStateを自身に戻すことで大当り毎にST70回へリセットする形）を採用した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 6R: 約900個/実獲得840個、比率14/15）。10R×2～×5も同じ比率で換算
// （約3000個→実獲得2800個、約4500個→4200個、約6000個→5600個、約7500個→7000個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-nanoha",
  slug: "e-nanoha",
  name: "e魔法少女リリカルなのは",
  nameKana: "いーまほうしょうじょりりかるなのは",
  aliases: ["リリカルなのは", "なのはパチンコ", "eなのは", "魔法少女リリカルなのは"],
  manufacturer: { id: "santhree", name: "SanThree（サンスリー）" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時・チャレンジタイム中の大当り確率：1/348.5",
    "フルドライブST中の大当り確率：1/51.6",
    "フルドライブST：ST70回、継続率約75%",
    "図柄揃い時ST突入率：約63%（チャレンジタイムでの当選を含む）",
    "通常時の大当り振り分け（ヘソ入賞時）：6R・実獲得約840個で通常のままではなくチャレンジタイム(時短100回)が49.34%、6R・実獲得約840個でフルドライブSTが49.34%、10R×2・実獲得約2800個でフルドライブSTが1.32%",
    "チャレンジタイム中の当選は必ずフルドライブSTへ直行（詳細はコメント）",
    "フルドライブST中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が47%、10R×2・実獲得約2800個で継続が32%、10R×3・実獲得約4200個で継続が14%、10R×4・実獲得約5600個で継続が5%、10R×5・実獲得約7000個で継続が2%",
    "チャレンジタイムは規定回数（100回）、フルドライブSTは規定回数（70回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 348.5,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.4934,
            rounds: 6,
            balls: 840,
            nextState: "challengeTime",
            tag: "toChallengeTime",
            resultNote: "チャレンジタイム",
          },
          {
            weight: 0.4934,
            rounds: 6,
            balls: 840,
            nextState: "fullDriveST",
            tag: "toFullDriveST",
            resultNote: "フルドライブST",
          },
          {
            weight: 0.0132,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "fullDriveST",
            tag: "toFullDriveSTx2",
            resultNote: "10R×2、フルドライブST",
          },
        ],
      },
      onExhausted: null,
    },

    challengeTime: {
      id: "challengeTime",
      label: "チャレンジタイム",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 348.5,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 6,
            balls: 840,
            nextState: "fullDriveST",
            tag: "ctToFullDriveST",
            resultNote: "フルドライブST",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ctEnd", resultLabel: "チャレンジタイム終了" },
    },

    fullDriveST: {
      id: "fullDriveST",
      label: "フルドライブST",
      mode: "countDown",
      maxAttempts: 70,
      probability: 1 / 51.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.47, rounds: 10, balls: 1400, nextState: "fullDriveST", tag: "stContinue1500" },
          {
            weight: 0.32,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "fullDriveST",
            tag: "stContinue3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.14,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "fullDriveST",
            tag: "stContinue4500",
            resultNote: "10R×3",
          },
          {
            weight: 0.05,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "fullDriveST",
            tag: "stContinue6000",
            resultNote: "10R×4",
          },
          {
            weight: 0.02,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "fullDriveST",
            tag: "stContinue7500",
            resultNote: "10R×5",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stEnd", resultLabel: "フルドライブST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 6: 840 },
});
