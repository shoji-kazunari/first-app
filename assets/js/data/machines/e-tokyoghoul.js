// 第8号機: e 東京喰種（2025年 ビスティ スマパチ/LT機。「超デカ超一撃ver.」の前作）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_tokyoghoul/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// 導入日は2025年4月21日で、e-tokyoghoul-tyo1geki.js（超デカ超一撃ver.、2026年6月導入）
// の前作にあたる（1geki.jp自身が「シリーズ最新機種（後継機）へ」と本機のページから
// 誘導している）。ただし今週のアクセスランキング4位にまだ入っており実働している台
// なので、前作として別に追加した。
//
// ヘソ入賞時（特図1・通常時）の大当り振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：約49%
//   ・10R大当り(約1500個)→HYPER喰種RUSH(ST130回)：約50%
//   ・2R大当り（喰種チャージ、約300個）→HYPER喰種RUSH(ST130回)：約1%
// 電チュー入賞時（特図2・HYPER喰種RUSH中）の振り分け:
//   ・10R×2大当り(約3000個)→HYPER喰種RUSH継続：約97%
//   ・10R×4大当り(約6000個)→HYPER喰種RUSH継続：約3%
// （超デカ超一撃ver.と異なり、こちらは円グラフに喰種チャージが独立した1つの
// スライスとして出ており、上乗せループのような非公開の継続率も存在しない
// シンプルな2状態構成だった）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表は払い出し個数と実獲得個数の両方を載せている（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個。10R×2・10R×4も同じ比率14/15で換算）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-tokyoghoul",
  slug: "e-tokyoghoul",
  name: "e 東京喰種",
  nameKana: "いーとうきょうぐーる",
  aliases: ["東京喰種", "東京グール", "トーキョーグール", "喰種", "東京喰種無印", "東京喰種W"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2025,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/199.9（図柄揃い1/399.9とチャージ1/399.9の合算）",
    "HYPER喰種RUSH中の当選確率：約1/95.3",
    "HYPER喰種RUSH：ST130回、継続率約75%",
    "RUSH突入率：約51%（チャージからの突入を含む）",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で時短なしが約49%、10R・実獲得約1400個でHYPER喰種RUSH(ST130回)が約50%、喰種チャージ（2R・実獲得約280個）でHYPER喰種RUSHが約1%",
    "HYPER喰種RUSH中の当選振り分け（電チュー入賞時）：10R×2・実獲得約2800個で継続が約97%、10R×4・実獲得約5600個で継続が約3%",
    "HYPER喰種RUSHは規定回数（130回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "hyperRush", tag: "toHyperRush" },
          {
            weight: 0.01,
            rounds: 2,
            balls: 280,
            nextState: "hyperRush",
            tag: "chargeToHyperRush",
            resultNote: "喰種チャージ",
          },
        ],
      },
      onExhausted: null,
    },

    hyperRush: {
      id: "hyperRush",
      label: "HYPER喰種RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 95.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.97,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "hyperRush",
            tag: "rushContinue",
            resultNote: "10R×2",
          },
          {
            weight: 0.03,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "hyperRush",
            tag: "rushContinueMega",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hyperRushEnd", resultLabel: "HYPER喰種RUSH終了" },
    },
  },

  distributionTables: {},

  // 10Rには1400/2800/5600個の3種類、2Rには280個の1種類があるため、
  // 代表値のみ置き、実際の出玉は各onHit.outcomesのballsで上書きする。
  payoutTable: { 10: 1400, 2: 280 },
});
