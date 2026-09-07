// 第64号機: P【超甘LT】この素晴らしい世界に祝福を！最終クエスト1/49
// （2025年 TOYOMARU（豊丸産業） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_konosuba49lt/）。概要ページ自体には
// 円グラフ画像が埋め込まれていなかったため、同ページ内の直リンク画像（gazou113/107/
// 108/109）をダウンロードしてReadツールで直接読み取った実数値（特図1振り分け・
// 特図2振り分け・RUSH中振り分け・ラッキートリガー振り分けの4枚）。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/49.9）の振り分け:
//   ・4R大当り(約200個/実獲得約160個)→このすばチャレンジ(ST6回+残保留4個)へ：100%
// このすばチャレンジ中（特図2・電チュー入賞時、当選確率1/25.1）の振り分け:
//   ・4R大当り(約200個or約220個)→このすばRUSH(ST33回+残保留4個)へ：90.0%
//   ・7R大当り(約490個/実獲得約420個)→祝福RUSH(LT、次回まで)へ：10.0%
// このすばRUSH中（特図2・電チュー入賞時、当選確率1/25.1）の振り分け:
//   ・4R大当り(約200個or約220個)→このすばRUSH継続：90.0%
//   ・7R大当り(約490個)→このすばRUSH継続：9.0%
//   ・7R大当り(約490個)→祝福RUSH(LT)へ：1.0%
// 祝福RUSH中（特図2・電チュー入賞時、LT、次回まで）の振り分け:
//   ・4R大当り(約200個or約220個)→祝福RUSH継続：87.0%
//   ・7R大当り(約490個)→祝福RUSH継続：10.0%
//   ・4R大当り(約220個/実獲得約180個)→このすばRUSH(ST33回+残保留4個)へ降格：3.0%
// （このすばチャレンジ突破率約33%は、素の1-(1-1/25.1)^10≈33.4%とほぼ一致し、
// このすばRUSH継続率約78%は、素の1-(1-1/25.1)^37≈77.8%とほぼ一致するため、
// いずれも「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけで再現できる
// （ST6回+残保留4個=10、ST33回+残保留4個=37）。「初当りからのLT突入率約4.7%」は
// 複数状態をまたぐ複合値のため、この実装からの独立検算はしていない）
//
// 【「約200個or約220個」の扱い】
// 円グラフの同じ枠内に2つの数値が併記されており、内訳（どちらがどの割合か）は
// 開示されていない。e-girlpan-fin159.js等と同じ考え方で、開示されていない内訳は
// 少ない方（約200個/実獲得約160個）に寄せて実装した。「約220個」単独で明記されて
// いる祝福RUSH中の降格枠（3.0%）のみ、実獲得約180個をそのまま採用した。
//
// 【祝福RUSH（LT）を「次回まで」＝probability維持のcountUp/maxAttempts:nullで実装】
// p-rezero2-129.jsの超強欲PREMIUM BONUSと同じ扱い。規定回数がなく、当りが続く限り
// 無期限に継続する（このすばRUSHへの降格3.0%を除く）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-konosuba49lt",
  slug: "p-konosuba49lt",
  name: "P【超甘LT】この素晴らしい世界に祝福を！最終クエスト1/49",
  nameKana: "ぴーちょうあまえるてぃーこのすばらしいせかいにしゅくふくをさいしゅうくえすとよんじゅうきゅう",
  aliases: [
    "このすば49",
    "このすば1/49",
    "このすばLT",
    "この素晴らしい世界に祝福を49",
    "超甘LTこのすば",
    "このすば最終クエスト",
    "konosuba49",
  ],
  manufacturer: { id: "toyomaru", name: "TOYOMARU（豊丸産業）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/49.9",
    "電サポ中（このすばチャレンジ・このすばRUSH・祝福RUSH共通）の当選確率：1/25.1",
    "このすばチャレンジ：ST6回+残保留4個、突破率約33%",
    "このすばRUSH：ST33回+残保留4個、継続率約78%",
    "祝福RUSH（LT）：次回まで（無期限）",
    "通常時の大当り振り分け：4R・実獲得約160個でこのすばチャレンジへが100%",
    "このすばチャレンジ中の当選振り分け：4R・実獲得約160個でこのすばRUSHへが90.0%、7R・実獲得約420個で祝福RUSHへが10.0%",
    "このすばRUSH中の当選振り分け：4R・実獲得約160個で継続が90.0%、7R・実獲得約420個で継続が9.0%、7R・実獲得約420個で祝福RUSHへが1.0%",
    "祝福RUSH中の当選振り分け：4R・実獲得約160個で継続が87.0%、7R・実獲得約420個で継続が10.0%、4R・実獲得約180個でこのすばRUSHへ降格が3.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 49.9,
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
            balls: 160,
            nextState: "konosubaChallenge",
            tag: "toChallenge",
            resultNote: "このすばチャレンジ",
          },
        ],
      },
      onExhausted: null,
    },

    konosubaChallenge: {
      id: "konosubaChallenge",
      label: "このすばチャレンジ",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 25.1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.9,
            rounds: 4,
            balls: 160,
            nextState: "konosubaRush",
            tag: "toRush",
            resultNote: "このすばRUSH",
          },
          {
            weight: 0.1,
            rounds: 7,
            balls: 420,
            nextState: "syukufukuRush",
            tag: "toShukufuku",
            resultNote: "祝福RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "このすばチャレンジ終了" },
    },

    konosubaRush: {
      id: "konosubaRush",
      label: "このすばRUSH",
      mode: "countDown",
      maxAttempts: 37,
      probability: 1 / 25.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.9,
            rounds: 4,
            balls: 160,
            nextState: "konosubaRush",
            tag: "continue4r",
          },
          {
            weight: 0.09,
            rounds: 7,
            balls: 420,
            nextState: "konosubaRush",
            tag: "continue7r",
            resultNote: "7R",
          },
          {
            weight: 0.01,
            rounds: 7,
            balls: 420,
            nextState: "syukufukuRush",
            tag: "toShukufuku",
            resultNote: "祝福RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "このすばRUSH終了" },
    },

    syukufukuRush: {
      id: "syukufukuRush",
      label: "祝福RUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 25.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.87,
            rounds: 4,
            balls: 160,
            nextState: "syukufukuRush",
            tag: "continue4r",
          },
          {
            weight: 0.1,
            rounds: 7,
            balls: 420,
            nextState: "syukufukuRush",
            tag: "continue7r",
            resultNote: "7R",
          },
          {
            weight: 0.03,
            rounds: 4,
            balls: 180,
            nextState: "konosubaRush",
            tag: "toKonosubaRush",
            resultNote: "このすばRUSHへ降格",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 7: 420, 4: 160 },
});
