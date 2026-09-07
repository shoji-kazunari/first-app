// 第27号機: e結城友奈は勇者である～極限7500～（2026年 SanseiR&D スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_yuyuyu7500/）。
// 大当たり振り分けは、同ページに掲載されている4枚の円グラフ画像（通常時・
// 真・勇者RUSH中・大満開RUSH中・BONUSジャッジ振り分け）をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/349）の振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：48.5%
//   ・10R大当り(約1500個)→真・勇者RUSH(ST115回)：51.5%
// 電チュー入賞時（特図2・真・勇者RUSH中、大当り確率約1/96.3）の振り分け:
//   ・ST回数リセット（出玉の記載無し）→真・勇者RUSH継続：約25%
//   ・BONUSジャッジ→大満開RUSH(ST135回)へ：約75%
// 電チュー入賞時（特図2・大満開RUSH中）は、当りは常に100%でBONUSジャッジへ。
// BONUSジャッジ振り分け（RUSH中図柄揃い時）:
//   ・10R大当り(約1500個)→継続：75%
//   ・10R×5大当り(約7500個)→継続：25%
//
// 【「ST回数リセット」の扱い】
// 真・勇者RUSH中の当り25%は出玉個数の記載が無く、ST115回のカウンタを
// リセットして真・勇者RUSHを継続するだけの当り。stateEngineのonHit.outcomes
// は出玉が正の数であることが前提のため、出玉0個の枝は表現できない
// （e-kinnikuman.jsのSTリセットと同じ問題）。この機種には2R等の小さい払出し
// 単位が無く10R(1500個)のみが公開値のため、このシミュレーターでは唯一の
// 公開単位である10R(実獲得1400個)をST回数リセット枝の出玉として採用した
// （真・勇者RUSHに留まる確率自体は25%のまま変えていない）。
//
// 【継続率について】
// 真・勇者RUSHの素の計算1-(1-1/96.3)^115≈69.9%は公表の「継続率約70%
// （※1 ST115回の引き戻し率）」と、大満開RUSHの素の計算1-(1-1/96.3)^135≈75.6%
// は公表の「継続率約76%（※2 ST135回の引き戻し率）」とそれぞれほぼ一致して
// おり、大きな引き戻しギャップは無い（＝どちらも規定回数消化型で、他機種の
// ような未実装の残保留・LAST ATTACK要素は無い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 比率14/15）。明記の無い7500個（10R×5）にも同じ比率を適用した
// （7500→7000。割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-yuyuyu7500",
  slug: "e-yuyuyu7500",
  name: "e結城友奈は勇者である～極限7500～",
  nameKana: "いーゆうきゆうなはゆうしゃであるきょくげんななせんごひゃく",
  aliases: ["ゆゆゆ", "結城友奈", "ゆゆゆ極限7500", "結城友奈は勇者である", "極限7500"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D" },
  releaseYear: 2026,
  category: "スマパチ（ミドル・ラッキートリガー・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/349",
    "RUSH中の大当り確率：約1/96.3",
    "真・勇者RUSH：ST115回、継続率約70%",
    "大満開RUSH：ST135回、継続率約76%",
    "RUSH突入率：51.5%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが48.5%、10R・実獲得約1400個で真・勇者RUSHが51.5%",
    "真・勇者RUSH中の当選振り分け（電チュー入賞時）：ST回数リセットで継続が約25%、BONUSジャッジ経由で大満開RUSHへが約75%",
    "大満開RUSH中の当選振り分け（電チュー入賞時）：常にBONUSジャッジへ。BONUSジャッジは10R・実獲得約1400個が75%、10R×5・実獲得約7000個が25%（いずれも継続）",
    "真・勇者RUSH・大満開RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 349,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.485, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.515, rounds: 10, balls: 1400, nextState: "shinYuushaRush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    shinYuushaRush: {
      id: "shinYuushaRush",
      label: "真・勇者RUSH",
      mode: "countDown",
      maxAttempts: 115,
      probability: 1 / 96.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 10, balls: 1400, nextState: "shinYuushaRush", tag: "rushReset" },
          {
            weight: 0.5625,
            rounds: 10,
            balls: 1400,
            nextState: "daimankaiRush",
            tag: "toBonusRush1500",
            resultNote: "BONUSジャッジ",
          },
          {
            weight: 0.1875,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "daimankaiRush",
            tag: "toBonusRush7500",
            resultNote: "BONUSジャッジ・10R×5",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "真・勇者RUSH終了" },
    },

    daimankaiRush: {
      id: "daimankaiRush",
      label: "大満開RUSH",
      mode: "countDown",
      maxAttempts: 135,
      probability: 1 / 96.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.75,
            rounds: 10,
            balls: 1400,
            nextState: "daimankaiRush",
            tag: "continue1500",
            resultNote: "BONUSジャッジ",
          },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "daimankaiRush",
            tag: "continue7500",
            resultNote: "BONUSジャッジ・10R×5",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "daimankaiEnd", resultLabel: "大満開RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400 },
});
