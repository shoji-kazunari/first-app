// 第88号機: e仮面ライダーBLACK（2025年 KYORAKU（京楽） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kmnr_black/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・JUSTICE RUSH中・EXTREME JUSTICE RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/349.9）の振り分け:
//   ・3R大当り(約450個/実獲得420個)→通常（時短なし）：50.0%
//   ・3R大当り(約450個)→JUSTICE RUSH(ST41回+残保留4個)へ：50.0%
// JUSTICE RUSH中（特図2・電チュー入賞時、当選確率1/50.1＝大当り1/233と小当り1/63の
// 合算値）の振り分け:
//   ・10R大当り(約1500個/実獲得1400個)→継続：50.0%
//   ・10R大当り(約1500個)→EXTREME JUSTICE RUSH(LT、ST75回+残保留4個)へ：50.0%
// EXTREME JUSTICE RUSH中（特図2・電チュー入賞時、当選確率1/50.1）の振り分け:
//   ・10R大当り(約1500個)→継続：50.0%
//   ・10R×2大当り(約3000個/実獲得2800個)→継続：50.0%
// （JUSTICE RUSH継続率約60%は、素の1-(1-1/50.1)^45≈59.6%とほぼ完全に一致し、
// EXTREME JUSTICE RUSH継続率約80%も、素の1-(1-1/50.1)^79≈79.7%とほぼ完全に
// 一致するため、いずれも「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけの
// シンプルな規定回数countDownで再現できる（41+4=45、75+4=79））
//
// 【「ブラックギフト」は未実装】
// 通常時の円グラフに「※ブラックギフトは除く」との注記があり、別枠の当選契機が
// 存在することが分かるが、詳細（発生率・出玉）が1geki.jp上に記載されておらず
// 実装していない。
//
// 【spinsPer1000Yenについて・要確認】
// 「デカヘソ＆ダイレクトスタートステージ搭載」との記載があるが、具体的な回転数の
// 記載が無いため、依頼者の実感で確認できるまでは既定値16のまま実装し、
// 要確認として残す。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 3R: 約450個/実獲得420個、いずれも比率14/15）。10R×2も同じ比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kmnr-black",
  slug: "e-kmnr-black",
  name: "e仮面ライダーBLACK",
  nameKana: "いーかめんらいだーぶらっく",
  aliases: ["仮面ライダーブラックパチンコ", "JUSTICE RUSH", "EXTREME JUSTICE RUSH", "e仮面ライダーBLACKパチンコ"],
  manufacturer: { id: "kyoraku", name: "KYORAKU（京楽）" },
  releaseYear: 2025,
  category: "パチンコ（スマパチ・ライトミドル・ラッキートリガー・一種二種混合機）",

  // 要確認: 「デカヘソ」搭載機だが具体的な回転数の記載が無いため既定値のまま。
  // 詳細はファイル冒頭のコメント参照。
  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：1/349.9",
    "JUSTICE RUSH・EXTREME JUSTICE RUSH中の当選確率：1/50.1",
    "JUSTICE RUSH：ST41回+残保留4個、継続率約60%",
    "EXTREME JUSTICE RUSH（LT）：ST75回+残保留4個、継続率約80%",
    "JUSTICE RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約420個で通常のままが50.0%、3R・実獲得約420個でJUSTICE RUSHへが50.0%",
    "JUSTICE RUSH中の当選振り分け：10R・実獲得約1400個で継続が50.0%、10R・実獲得約1400個でEXTREME JUSTICE RUSHへが50.0%",
    "EXTREME JUSTICE RUSH中の当選振り分け：10R・実獲得約1400個で継続が50.0%、10R×2・実獲得約2800個で継続が50.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 349.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 420, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 3,
            balls: 420,
            nextState: "justiceRush",
            tag: "toRush",
            resultNote: "JUSTICE RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    justiceRush: {
      id: "justiceRush",
      label: "JUSTICE RUSH",
      mode: "countDown",
      maxAttempts: 45,
      probability: 1 / 50.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "justiceRush", tag: "continue" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "extremeJusticeRush",
            tag: "toExtreme",
            resultNote: "EXTREME JUSTICE RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "JUSTICE RUSH終了" },
    },

    extremeJusticeRush: {
      id: "extremeJusticeRush",
      label: "EXTREME JUSTICE RUSH",
      mode: "countDown",
      maxAttempts: 79,
      probability: 1 / 50.1,
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
            balls: 1400,
            nextState: "extremeJusticeRush",
            tag: "continue1500",
          },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "extremeJusticeRush",
            tag: "continue3000",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "extremeEnd", resultLabel: "EXTREME JUSTICE RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 3: 420 },
});
