// 第61号機: eカケグルイ 219ver（2026年 D-light スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kakegurui219/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（図柄揃い時・
// 絶対王政RUSH BURST中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/219）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：75.0%
//   ・2R大当り(約300個)→絶対王政RUSH BURST(LT、ST148回)へ直行：0.5%
//   ・10R大当り(約1500個)+上乗せジャッジメント→絶対王政RUSH BURSTへ：24.5%
// （「RUSH突入率約25%はBETチャージからの突入込み」との記載があるが、この円グラフの
// 3択（75.0%/0.5%/24.5%）自体がヘソ入賞の結果を最終的にまとめた値になっており、
// 合計が100%になっているため、BETチャージを別枠として分ける必要は無いと判断した）
// 電チュー入賞時（特図2・絶対王政RUSH BURST中、当選確率約1/99）の振り分け:
//   ・10R大当り(約1500個)→継続：60.0%
//   ・10R大当り(約1500個)+「50/50ジャッジメント」→継続：40.0%
// （絶対王政RUSH BURSTは規定回数（148回）を全弾外すと通常へ。継続率約80%[7500個
// 獲得時の1G連を含む]に対し、素の1-(1-1/99)^148≈77.7%とやや差があるが、
// 「50/50ジャッジメント」の上乗せ分を含めた実質値と見て許容範囲とした）
//
// 【「上乗せジャッジメント」「50/50ジャッジメント」をbonusLoopで実装】
// 「50/50ジャッジメントは失敗時に狂言乱舞BONUS（約1500個）を獲得、成功すれば
// 約1500個～約7500個（約1500個×複数回当選の合計）」との記載があり、必ず最低
// 1500個は獲得した上で、50%成功する限り約1500個ずつ上乗せし続ける構造と判断できる。
// 通常時の「上乗せジャッジメント」も同じ「ジャッジメント」という名称・同じ1500～7500個
// の範囲のため、同じ仕組みとみなし、どちらもstateEngineのbonusLoopプリミティブ
// （probability: 0.5, balls: 1400）で実装した。
//
// 【「ツラヌキチャレンジ」は実装していない】
// 約7500個を獲得すると「ツラヌキチャレンジ」に突入し、更なる出玉獲得の
// チャンスがあると説明されているが、発生率・成功率とも数値の記載が無いため
// 実装していない（bonusLoopは実際の7500個上限を超えて確率的に伸び続けるが、
// 発生率6.25%以下の裾野に限られる誤差として許容した）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kakegurui219",
  slug: "e-kakegurui219",
  name: "eカケグルイ 219ver",
  nameKana: "いーかけぐるいにーいちきゅうばー",
  aliases: ["カケグルイ219", "eカケグルイ", "賭ケグルイパチンコ", "カケグルイ219ver"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：約1/219",
    "絶対王政RUSH BURST中の当選確率：約1/99",
    "絶対王政RUSH BURST（LT）：ST148回、継続率約80%（50/50ジャッジメントの上乗せ込み）",
    "RUSH突入率：約25%（BETチャージからの突入を含む）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが75.0%、2R・実獲得約280個で絶対王政RUSH BURST直行が0.5%、10R・実獲得約1400個+上乗せジャッジメントで絶対王政RUSH BURSTが24.5%",
    "絶対王政RUSH BURST中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が60.0%、10R・実獲得約1400個+50/50ジャッジメントで継続が40.0%（成功する限り約1400個ずつ上乗せ）",
    "絶対王政RUSH BURSTは規定回数（148回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 219,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.005,
            rounds: 2,
            balls: 280,
            nextState: "rushBurst",
            tag: "toRushBurstDirect",
            resultNote: "絶対王政RUSH BURST",
          },
          {
            weight: 0.245,
            rounds: 10,
            balls: 1400,
            nextState: "rushBurst",
            tag: "toRushBurstJudgment",
            resultNote: "絶対王政RUSH BURST、上乗せジャッジメント",
            bonusLoop: { probability: 0.5, balls: 1400 },
          },
        ],
      },
      onExhausted: null,
    },

    rushBurst: {
      id: "rushBurst",
      label: "絶対王政RUSH BURST",
      mode: "countDown",
      maxAttempts: 148,
      probability: 1 / 99,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.6, rounds: 10, balls: 1400, nextState: "rushBurst", tag: "continue1500" },
          {
            weight: 0.4,
            rounds: 10,
            balls: 1400,
            nextState: "rushBurst",
            tag: "continueJudgment",
            resultNote: "50/50ジャッジメント",
            bonusLoop: { probability: 0.5, balls: 1400 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushBurstEnd", resultLabel: "絶対王政RUSH BURST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
