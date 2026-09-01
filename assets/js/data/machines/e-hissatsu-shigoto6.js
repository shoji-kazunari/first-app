// 第28号機: ぱちんこ 必殺仕事人Ⅵ（2026年 KYORAKU スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_hissatusigoto6/）。
// 大当たり振り分けは、同ページに掲載されている4枚の円グラフ画像（通常時・
// 必殺RUSH（初回）中・必殺RUSH・チャンスタイム100中・必殺RUSH～中村主水出陣～中）
// をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、当選確率約1/319.9＝大当たり確率1/347.9とC時短
// 確率1/3987.6の合算値）の振り分け:
//   ・3R大当り(約450個)→チャンスタイム100(時短100回)：46.0%
//   ・3R大当り(約450個)→必殺RUSH(ST120回)：46.0%
//   ・C時短当選(出玉なし)→必殺RUSH(ST120回)：8.0%
// （46.0%+8.0%=54.0%＝「約54.0%で必殺RUSHに突入」と一致）
// 「C時短当選」は出玉0個の枝を表現できない（machineValidatorの制約、
// e-kinnikuman.js等と同じ問題）ため、同じ移行先（必殺RUSH）である46.0%枝に
// 合算した（RUSH突入率自体は54.0%のまま変えていない）。
//
// チャンスタイム100（時短100回、当選確率約1/399.9）は必殺RUSHへの引き戻し
// 専用状態。素の計算1-(1-1/399.9)^100≈22.2%は公表の「チャンスタイム100
// 引き戻し率約22.2%」と一致し、通常時の直行54.0%と合わせて
// 54.0%+46.0%×22.2%≈64.2%＝公表の「RUSH突入率約64.2%」とも一致する
// （＝チャンスタイム100は素の計算だけで公表値と揃っており、他機種のような
// 未実装の引き戻しギャップは無い）。
//
// 必殺RUSHは「初回」と「2連目以降」で当選時の振り分けが異なる
// （e-zom100.jsのハンドレッドドリーム初回/2回目以降と同じ構造）:
//   ・初回（rushFirst、通常時・チャンスタイム100からの入口）: 10R(1500個)で
//     必殺RUSH継続50.0%、10R(1500個)で必殺RUSH～中村主水出陣～突入50.0%
//   ・2連目以降（rush）・チャンスタイム100の引き戻し当選も同じ表を使用:
//     10R(1500個)で必殺RUSH継続67.0%、10R(1500個)で中村主水出陣突入33.0%
// 必殺RUSH～中村主水出陣～（rushMainMizu）: 10R×2(3000個)で必殺RUSHへ50.0%、
// 10R×4(6000個)で中村主水出陣を継続50.0%
//
// いずれも当選確率は共通で約1/88.3、ST120回の規定回数消化型。
// 素の計算1-(1-1/88.3)^120≈74.5%は公表の「継続率約75%」とほぼ一致しており、
// 大きな引き戻しギャップは無い。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 3R: 約450個/実獲得420個、比率14/15）。明記の無い3000/6000個にも
// 同じ比率をそのまま適用した（3000→2800、6000→5600。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-hissatsu-shigoto6",
  slug: "e-hissatsu-shigoto6",
  name: "ぱちんこ 必殺仕事人Ⅵ",
  nameKana: "ぱちんこひっさつしごとにんろく",
  aliases: ["必殺仕事人6", "必殺仕事人Ⅵ", "必殺仕事人", "仕事人6", "必殺仕事人パチンコ"],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の当選確率：約1/319.9（大当たり確率1/347.9とC時短確率1/3987.6の合算値）",
    "必殺RUSH・チャンスタイム100・中村主水出陣とも当選確率は約1/88.3（チャンスタイムのみ約1/399.9）",
    "必殺RUSH・中村主水出陣：ST120回、継続率約75%",
    "チャンスタイム100：時短100回、必殺RUSHへの引き戻し率約22.2%",
    "RUSH突入率：約64.2%（通常時直行54.0%＋チャンスタイム100引き戻し分）",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約420個でチャンスタイム100が46.0%、3R・実獲得約420個で必殺RUSHが46.0%、C時短当選（出玉なし）で必殺RUSHが8.0%",
    "チャンスタイム100中の当選振り分け：10R・実獲得約1400個で必殺RUSHが67.0%、10R・実獲得約1400個で中村主水出陣が33.0%",
    "必殺RUSH（初回）中の当選振り分け：10R・実獲得約1400個で必殺RUSH継続が50.0%、10R・実獲得約1400個で中村主水出陣が50.0%",
    "必殺RUSH（2連目以降）中の当選振り分け：10R・実獲得約1400個で継続が67.0%、10R・実獲得約1400個で中村主水出陣が33.0%",
    "中村主水出陣中の当選振り分け：10R×2・実獲得約2800個で必殺RUSHへが50.0%、10R×4・実獲得約5600個で中村主水出陣継続が50.0%",
    "いずれも規定回数（120回）を全弾外すと通常へ",
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
          {
            weight: 0.46,
            rounds: 3,
            balls: 420,
            nextState: "chanceTime100",
            tag: "toChanceTime100",
            resultNote: "チャンスタイム100",
          },
          {
            weight: 0.54,
            rounds: 3,
            balls: 420,
            nextState: "rushFirst",
            tag: "toRushFirst",
            resultNote: "必殺RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    chanceTime100: {
      id: "chanceTime100",
      label: "チャンスタイム100",
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
          { weight: 0.67, rounds: 10, balls: 1400, nextState: "rush", tag: "ctToRush" },
          {
            weight: 0.33,
            rounds: 10,
            balls: 1400,
            nextState: "rushMainMizu",
            tag: "ctToRushMainMizu",
            resultNote: "中村主水出陣",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ctEnd", resultLabel: "チャンスタイム100終了" },
    },

    rushFirst: {
      id: "rushFirst",
      label: "必殺RUSH",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 88.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "rush", tag: "rushFirstToRush" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "rushMainMizu",
            tag: "rushFirstToMizu",
            resultNote: "中村主水出陣",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushFirstEnd", resultLabel: "必殺RUSH終了" },
    },

    rush: {
      id: "rush",
      label: "必殺RUSH",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 88.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.67, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue" },
          {
            weight: 0.33,
            rounds: 10,
            balls: 1400,
            nextState: "rushMainMizu",
            tag: "rushToMizu",
            resultNote: "中村主水出陣",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "必殺RUSH終了" },
    },

    rushMainMizu: {
      id: "rushMainMizu",
      label: "必殺RUSH～中村主水出陣～",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 88.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "mizuToRush",
            resultNote: "10R×2",
          },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rushMainMizu",
            tag: "mizuContinue",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "mizuEnd", resultLabel: "必殺RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 420, 10: 1400 },
});
