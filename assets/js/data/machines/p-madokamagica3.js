// 第13号機: P魔法少女まどか☆マギカ3（2024年 KYORAKU ライトミドル/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_madokamagica3/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・4R大当り(約400個)→通常（時短なし）：45.0%
//   ・4R大当り(約400個)→マギカRUSH(ST60回)：54.0%
//   ・10R大当り(約1500個)→アルティメット超RUSH(ST120回)：1.0%
// 電チュー入賞時（特図2・マギカRUSH中）の振り分け:
//   ・10R大当り(約1500個)→マギカRUSH継続：50%
//   ・10R大当り(約1500個)→「ワルプルギスの夜BONUS」：50%
//     （円グラフ脚注：勝率約55%でアルティメット超RUSH(ST120回)へ、
//     敗北45%でマギカRUSH(ST60回)継続。出玉はどちらも同じ約1500個）
// 電チュー入賞時（特図2・アルティメット超RUSH中）の振り分け:
//   ・10R大当り(約1500個)→アルティメット超RUSH継続：100%
//
// 【「残保留4個」の引き戻しを実装していない理由】
// スペック表には「ST回数60回+残保留4個」「継続率約65%（残保留4個の引き戻し率
// 約6.3%を含む）」とあり、規定回数を消化しきった瞬間に、既に保留にあった4回転分の
// 当落だけ追加で見る（転落抽選型のonFall.residualAttemptsと同種の仕組み）ことが
// 分かる。ただしこの機種は転落抽選型ではなく規定回数消化型で、stateEngineの
// residualAttemptsはonFall専用（転落を引いた瞬間の残保留を見る仕組み）のため、
// このままでは流用できない。継続率への影響は約2〜3ポイント程度（マギカRUSH:
// 素の62.5%→表記65%、アルティメット超RUSH: 素の86.0%→表記87%）と小さいため、
// 今回はこの引き戻しを実装せず、規定回数（60回/120回）どおりのシンプルな
// countDownで実装した。エンジンに「規定回数消化型でも残保留を見る」機能を
// 追加すれば、より正確に再現できる（pf-gundam-uc.jsのonFall.residualAttempts
// とは別の新しい仕組みが必要）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 4R: 約400個/実獲得360個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-madokamagica3",
  slug: "p-madokamagica3",
  name: "P魔法少女まどか☆マギカ3",
  nameKana: "ぴーまほうしょうじょまどかまぎかすりー",
  aliases: ["まどマギ", "まどマギ3", "魔法少女まどかマギカ", "まどか☆マギカ", "まどか", "マミる"],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2024,
  category: "ライトミドル（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/199.9",
    "RUSH中の大当たり確率：約1/62.2",
    "マギカRUSH：ST60回、継続率約65%（残保留4個の引き戻し込み。このシミュレーターでは未実装）",
    "アルティメット超RUSH：ST120回、継続率約87%（同上）",
    "RUSH突入率：約55%（通常時の大当たりのうち、マギカRUSHへ突入するのが54.0%、アルティメット超RUSHへ直行するのが1.0%）",
    "通常時の大当たり振り分け（ヘソ入賞時）：4R・実獲得約360個で通常のままが45.0%、4R・実獲得約360個でマギカRUSH(ST60回)が54.0%、10R・実獲得約1400個でアルティメット超RUSH(ST120回)が1.0%",
    "マギカRUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個でマギカRUSH継続が50%、「ワルプルギスの夜BONUS」（同じく実獲得約1400個。勝率約55%でアルティメット超RUSHへ、敗北でマギカRUSH継続）が50%",
    "アルティメット超RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が100%",
    "マギカRUSH・アルティメット超RUSHとも規定回数を全弾外すと通常へ",
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
          { weight: 0.45, rounds: 4, balls: 360, nextState: "normal", tag: "toNormal" },
          { weight: 0.54, rounds: 4, balls: 360, nextState: "magicaRush", tag: "toMagicaRush" },
          { weight: 0.01, rounds: 10, balls: 1400, nextState: "ultraRush", tag: "toUltraRush" },
        ],
      },
      onExhausted: null,
    },

    magicaRush: {
      id: "magicaRush",
      label: "マギカRUSH",
      mode: "countDown",
      maxAttempts: 60,
      probability: 1 / 62.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "magicaRush", tag: "magicaContinue" },
          {
            weight: 0.275,
            rounds: 10,
            balls: 1400,
            nextState: "ultraRush",
            tag: "walpurgisWin",
            resultNote: "ワルプルギスの夜BONUS 勝利",
          },
          {
            weight: 0.225,
            rounds: 10,
            balls: 1400,
            nextState: "magicaRush",
            tag: "walpurgisLose",
            resultNote: "ワルプルギスの夜BONUS 敗北",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "magicaRushEnd", resultLabel: "マギカRUSH終了" },
    },

    ultraRush: {
      id: "ultraRush",
      label: "アルティメット超RUSH",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 62.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "ultraRush", tag: "ultraContinue" }],
      },
      onExhausted: { nextState: "normal", tag: "ultraRushEnd", resultLabel: "アルティメット超RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 4: 360, 10: 1400 },
});
