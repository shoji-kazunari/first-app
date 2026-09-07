// 第96号機: P貞子（2024年 FUJI（藤商事） ライトミドル/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_sadako/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・超貞子RUSH中・極最恐BONUS中）をダウンロード
// してReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/201＝呪縛ジャッジ成功・貞子チャージ・貞子
// チャージ覚醒の合算値）の振り分け:
//   ・約3000個(1500個×2回分)→通常（時短なし）：40%
//   ・約4500個+α(1500個×3回分以上)→超貞子RUSH(ST100回)へ：50%
//   ・約3000個(1500個×2回分)→超貞子RUSH(ST100回)へ：10%
// （「1500個×3回分以上」は、基本の1500個に確率50%でさらに1500個ずつ上乗せする
// ループと解釈でき、bonusLoop（probability:0.5, balls:1500）で表現した）
// 超貞子RUSH中（特図2・電チュー入賞時、当選確率約1/77）の振り分け:
//   ・約1500個→継続：100%（うち約50%でさらに「極最恐BONUS」としてループ継続）
// 極最恐BONUS期待値（円グラフ「極最恐BONUS中」、超貞子RUSHの50%枠の内訳）:
//   ・1500個×2回分：約50%　・×3回分：約25%　・×4回分：約12.5%　・×5回分以上：約12.5%
// （この内訳も基本1500個+確率50%のループと完全に一致する（P(=2)=50%、
// P(=3)=25%、P(=4)=12.5%、P(≥5)=12.5%）ため、超貞子RUSHの当り自体を
// bonusLoop（probability:0.5, balls:1500）で表現するだけで両方の円グラフを
// 矛盾なく再現できる。継続率約73%は、素の1-(1-1/77)^100≈73.0%と完全に一致する
// ため、残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる）
//
// 【出玉について】
// このページには「実獲得個数」の記載が無く、払い出し個数をそのまま採用した
// （e-accelerator-saikyo.jsと同じ扱い）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-sadako",
  slug: "p-sadako",
  name: "P貞子",
  nameKana: "ぴーさだこ",
  aliases: ["貞子パチンコ", "リングパチンコ", "超貞子RUSH", "極最恐BONUS"],
  manufacturer: { id: "fuji", name: "FUJI（藤商事）" },
  releaseYear: 2024,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/201（呪縛ジャッジ成功・貞子チャージ・貞子チャージ覚醒の合算値）",
    "超貞子RUSH中の当選確率：約1/77",
    "超貞子RUSH：ST100回、継続率約73%",
    "RUSH突入率：約60%",
    "通常時の大当り振り分け（ヘソ入賞時）：約3000個で通常のままが40%、約4500個+α（bonusLoop）で超貞子RUSHへが50%、約3000個で超貞子RUSHへが10%",
    "超貞子RUSH中の当選振り分け：約1500個を獲得し継続、約50%でさらに1500個ずつ上乗せしながらループ（極最恐BONUS）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 201,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.4, rounds: 10, displayRounds: 20, balls: 3000, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 30,
            balls: 4500,
            nextState: "choSadakoRush",
            tag: "toRushBig",
            resultNote: "超貞子RUSH",
            bonusLoop: { probability: 0.5, balls: 1500 },
          },
          {
            weight: 0.1,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "choSadakoRush",
            tag: "toRush",
            resultNote: "超貞子RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    choSadakoRush: {
      id: "choSadakoRush",
      label: "超貞子RUSH",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 77,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1500,
            nextState: "choSadakoRush",
            tag: "continue",
            bonusLoop: { probability: 0.5, balls: 1500 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "超貞子RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500 },
});
