// 第77号機: P ToLOVEるダークネス 100ver.（2025年 HEIWA（平和） 甘デジ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_toloveru_darkness100/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・楽園計画＜大当り1回目＞・
// 楽園計画＜大当り2回目＞/超ハーレムTIME中）をダウンロードしてReadツールで直接
// 読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/100.8）の振り分け:
//   ・4R大当り(約400個/実獲得360個)→楽園計画(ST40回)へ：100%（RUSH突入率100%）
// 楽園計画中の右打ち確率（大当り1/100.0+小当り1/128.5の合算＝約1/56.2）の振り分け:
//   ・3R大当り(約300個/実獲得270個)→継続：67%
//   ・10R大当り(約1000個/実獲得900個)→継続：33%
// （「楽園計画中に2回大当りするとLT発動」という記載があり、1回目の大当りでは
// 楽園計画(ST40回)が続くだけだが、2回目の大当りで必ず超ハーレムTIME（LT）へ
// 移行する。maxAttemptsのcountDownだけでは「今回のRUSHで何回大当りしたか」を
// 記憶できないため、pa-spumioki6-enk.js等と同じ「達成段階ごとに別の状態を
// 用意する」方式で、1回目未達のrakuenPlan1と、1回大当り済みのrakuenPlan2の
// 2状態に分けて実装した。超ハーレムTIME中も同じ67%/33%の振り分けで継続する）
// （楽園計画継続率約55%は、素の1-(1-1/56.2)^40≈51.2%とほぼ一致し、超ハーレム
// TIME継続率約85%も、素の1-(1-1/56.2)^100≈83.4%とほぼ一致する。残保留4個を
// 加えたトータル継続率も、規定回数+4のcountDown（40→44、100→104）でおおむね
// 再現できる。ただし「ST最終変動+残保留での大当りは楽園計画中1回目として扱われる」
// という、超ハーレムTIME中の残保留での引き戻しだけは1回目に戻す、という細かな
// 挙動までは区別しておらず、残保留分もそのまま同じ状態のmaxAttemptsに足し込む
// 簡略化としている）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 4R: 約400個/実獲得360個、3R: 約300個/実獲得270個。いずれも比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-toloveru-darkness100",
  slug: "p-toloveru-darkness100",
  name: "P ToLOVEるダークネス 100ver.",
  nameKana: "ぴーとらぶるだーくねすひゃくばー",
  aliases: ["トラブルダークネス", "とらぶる100", "ToLOVEるパチンコ", "楽園ハーレム計画"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/100.8",
    "楽園計画・超ハーレムTIME中の当選確率：約1/56.2（大当り1/100.0+小当り1/128.5の合算）",
    "楽園計画：ST40回、継続率約55%",
    "超ハーレムTIME（LT）：ST100回、継続率約85%",
    "RUSH突入率：100%",
    "楽園計画中に2回大当りすると超ハーレムTIME（LT）へ移行",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約360個で楽園計画へが100%",
    "楽園計画・超ハーレムTIME中の当選振り分け：3R・実獲得約270個が67%、10R・実獲得約900個が33%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 100.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 4,
            balls: 360,
            nextState: "rakuenPlan1",
            tag: "toRakuen",
            resultNote: "楽園計画",
          },
        ],
      },
      onExhausted: null,
    },

    rakuenPlan1: {
      id: "rakuenPlan1",
      label: "楽園計画",
      mode: "countDown",
      maxAttempts: 44,
      probability: 1 / 56.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.67,
            rounds: 3,
            balls: 270,
            nextState: "rakuenPlan2",
            tag: "firstHit3r",
            resultNote: "楽園計画（次でLT濃厚）",
          },
          {
            weight: 0.33,
            rounds: 10,
            balls: 900,
            nextState: "rakuenPlan2",
            tag: "firstHit10r",
            resultNote: "楽園計画（次でLT濃厚）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rakuen1End", resultLabel: "楽園計画終了" },
    },

    rakuenPlan2: {
      id: "rakuenPlan2",
      label: "楽園計画",
      mode: "countDown",
      maxAttempts: 44,
      probability: 1 / 56.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.67,
            rounds: 3,
            balls: 270,
            nextState: "superHaremuTime",
            tag: "secondHit3r",
            resultNote: "超ハーレムTIME",
          },
          {
            weight: 0.33,
            rounds: 10,
            balls: 900,
            nextState: "superHaremuTime",
            tag: "secondHit10r",
            resultNote: "超ハーレムTIME",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rakuen2End", resultLabel: "楽園計画終了" },
    },

    superHaremuTime: {
      id: "superHaremuTime",
      label: "超ハーレムTIME",
      mode: "countDown",
      maxAttempts: 104,
      probability: 1 / 56.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.67, rounds: 3, balls: 270, nextState: "superHaremuTime", tag: "continue3r" },
          { weight: 0.33, rounds: 10, balls: 900, nextState: "superHaremuTime", tag: "continue10r" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "haremuEnd", resultLabel: "超ハーレムTIME終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 4: 360, 3: 270 },
});
