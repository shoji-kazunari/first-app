// 第47号機: P 入るんスタート×織田信奈の野望（2026年 TAKAO パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_odanobuna_hs/）。
// 大当り振り分けは、同ページに掲載されている4枚の円グラフ画像（通常時・激戦ゾーン中・
// 関ヶ原乱舞中・関ヶ原乱舞・極中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/249.1）の振り分け:
//   ・5R大当り(約750個)→激戦ゾーン(時短1回+残存保留4個)：100%
// 激戦ゾーン中（合計5回転＝1回+残存保留4個。当選確率は下記参照）の振り分け:
//   ・C時短→関ヶ原乱舞(時短35回+激戦ゾーン)：約82.8%
//   ・10R大当り(約1500個)→関ヶ原乱舞(時短35回+激戦ゾーン)：約11.5%
//   ・10R大当り(約1500個)→関ヶ原乱舞・極(時短155回+激戦ゾーン)：約5.7%
// 電チュー入賞時（特図2・関ヶ原乱舞中、当選確率1/82.5）の振り分け:
//   ・10R大当り(約1500個)→関ヶ原乱舞継続：約67%
//   ・10R大当り(約1500個)→関ヶ原乱舞・極へ昇格：約33%
// 電チュー入賞時（特図2・関ヶ原乱舞・極中、当選確率1/82.5）の振り分け:
//   ・10R大当り(約1500個)→関ヶ原乱舞・極継続：100%
//
// 【激戦ゾーンの確率1/14.2について】
// スペック表に「当選確率（激戦ゾーン）：約1/14.2※1」「※1 時短最終変動＋残存保留
// 4個：大当り確率1/249.1、小当り確率1/123.4、C時短確率1/17.1の合算値」とあり、
// 1/249.1+1/123.4+1/17.1≈1/14.16と公表の1/14.2にほぼ一致する。激戦ゾーンは
// 「1回+残存保留4個」＝合計5回転の中でこの合算確率を引けるかどうかの勝負で、
// このシミュレーターでは合算値1/14.2をそのままprobabilityに使い、
// maxAttempts:5のcountDown状態として実装した（内訳の大当り/小当り/C時短を
// 個別の確率で分けて抽選する必要はなく、円グラフの82.8%/11.5%/5.7%という
// 当選時の内訳をそのままonHit.outcomesの重みに使える）。
// 突破率の検算: 1-(1-1/14.2)^5≈30.7%と、スペック表の「激戦ゾーン突破率約31%」に
// ほぼ一致。
//
// 【関ヶ原乱舞・極中は「終了後も激戦ゾーンへ」の理由】
// 「関ヶ原乱舞 継続率約55%」「関ヶ原乱舞・極 継続率約90%」という公表値は、
// 「時短本体の継続率」と「時短切れ後の激戦ゾーンでの引き戻し」の合算値だと
// 明記されている（※3 時短35回継続率約34.7％と激戦ゾーン継続率約30.5％の合算値、
// ※4 時短155回継続率約84.9％と激戦ゾーン継続率約30.5％の合算値）。
// 検算: 35回・1/82.5の素の継続率1-(1-1/82.5)^35≈34.7%、155回では
// 1-(1-1/82.5)^155≈84.9%と、どちらも公表の内訳と完全に一致した。
// これは「関ヶ原乱舞・極とも時短を全弾外すと激戦ゾーンへ移行し、そこでの
// 引き戻し（約30.7%）も加味してはじめて公表の継続率になる」ことを意味するため、
// onExhaustedの遷移先を（通常ではなく）激戦ゾーンにして実装した
// （残保留onFallのresidualAttemptsとは別の、状態遷移そのものの分岐）。
//
// 【C時短の出玉について】
// C時短は大当りではなく小当り経由の時短付与のため、それ自体には払い出しが
// 無い（円グラフにも出玉個数の記載が無い）。ただしonHit.outcomesは出玉が
// 正の値であることが必須のため、このシミュレーターではこの機種で最小の
// 開示済みティア（5R・実獲得約700個）を暫定的に流用している
// （e-nanatai3.js等と同じ、ゼロ出玉遷移の近似）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 5R: 約750個/実獲得700個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-odanobuna-hairun",
  slug: "p-odanobuna-hairun",
  name: "P 入るんスタート×織田信奈の野望",
  nameKana: "ぴーはいるんすたーとおだのぶなののぞみ",
  aliases: ["入るんスタート織田信奈", "織田信奈の野望249", "織田信奈の野望入るんスタート", "P織田信奈の野望"],
  manufacturer: { id: "takao", name: "TAKAO（高尾）" },
  releaseYear: 2026,
  category: "パチンコ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/249.1",
    "激戦ゾーンの当選確率：約1/14.2（大当り・小当り・C時短の合算。詳細はコメント）",
    "関ヶ原乱舞・関ヶ原乱舞・極中の当選確率：ともに約1/82.5",
    "激戦ゾーン：1回+残存保留4個（計5回転）、突破率約31%",
    "関ヶ原乱舞：時短35回+激戦ゾーン、継続率約55%",
    "関ヶ原乱舞・極：時短155回+激戦ゾーン、継続率約90%",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約700個で激戦ゾーンが100%",
    "激戦ゾーン中の振り分け：C時短で関ヶ原乱舞が約82.8%、10R・実獲得約1400個で関ヶ原乱舞が約11.5%、10R・実獲得約1400個で関ヶ原乱舞・極が約5.7%",
    "関ヶ原乱舞中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が約67%、10R・実獲得約1400個で関ヶ原乱舞・極への昇格が約33%",
    "関ヶ原乱舞・極中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が100%",
    "関ヶ原乱舞・関ヶ原乱舞・極とも規定回数を全弾外すと激戦ゾーンへ移行し、そこでも外れて初めて通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 249.1,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 5,
            balls: 700,
            nextState: "hexasenZone",
            tag: "toHexasenZone",
            resultNote: "激戦ゾーン",
          },
        ],
      },
      onExhausted: null,
    },

    hexasenZone: {
      id: "hexasenZone",
      label: "激戦ゾーン",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 14.2,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.828,
            rounds: 5,
            balls: 700,
            nextState: "sekigaharaRod",
            tag: "cJikanToSekigahara",
            resultNote: "C時短、関ヶ原乱舞",
          },
          {
            weight: 0.115,
            rounds: 10,
            balls: 1400,
            nextState: "sekigaharaRod",
            tag: "daiatariToSekigahara",
            resultNote: "関ヶ原乱舞",
          },
          {
            weight: 0.057,
            rounds: 10,
            balls: 1400,
            nextState: "sekigaharaGoku",
            tag: "daiatariToSekigaharaGoku",
            resultNote: "関ヶ原乱舞・極",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hexasenZoneEnd", resultLabel: "激戦ゾーン終了" },
    },

    sekigaharaRod: {
      id: "sekigaharaRod",
      label: "関ヶ原乱舞",
      mode: "countDown",
      maxAttempts: 35,
      probability: 1 / 82.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.67, rounds: 10, balls: 1400, nextState: "sekigaharaRod", tag: "continueRod" },
          {
            weight: 0.33,
            rounds: 10,
            balls: 1400,
            nextState: "sekigaharaGoku",
            tag: "upgradeToGoku",
            resultNote: "関ヶ原乱舞・極",
          },
        ],
      },
      onExhausted: {
        nextState: "hexasenZone",
        tag: "rodEnd",
        resultLabel: "関ヶ原乱舞終了（激戦ゾーンへ）",
      },
    },

    sekigaharaGoku: {
      id: "sekigaharaGoku",
      label: "関ヶ原乱舞・極",
      mode: "countDown",
      maxAttempts: 155,
      probability: 1 / 82.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "sekigaharaGoku", tag: "continueGoku" }],
      },
      onExhausted: {
        nextState: "hexasenZone",
        tag: "gokuEnd",
        resultLabel: "関ヶ原乱舞・極終了（激戦ゾーンへ）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 5: 700 },
});
