// 第109号機: ｅ Re:ゼロから始める異世界生活 鬼がかり２（2026年 Daito（大都技研）
// ST機/スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_re0_oni2/）。当選時の振り分けは、
// 同ページに掲載されている2枚の円グラフ画像（通常時・RUSH中）をダウンロードして
// Readツールで直接読み取った実数値。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 1/349.9 ／ RUSH中 1/99.9
//   RUSH突入率  55%  ／  RUSH継続率 約77%（RUSH回数144回）
//   ラウンド 10R/2R ／ 賞球数 1&4&15
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個) / 2R=約300個(約280個)
//
// ヘソ入賞時（特図1・通常時、確率1/349.9）の振り分け:
//   ・10R大当り(約1500個)→通常のまま（時短なし）：45.0%
//   ・10R大当り(約1500個)→RUSH(ST144回)：45.0%
//   ・10R大当り×2(約3000個)→RUSH(ST144回)：10.0%
//   45.0+10.0=55.0% がRUSH突入率と一致する。
// 電チュー入賞時（特図2・RUSH中、確率1/99.9）の振り分け（いずれもRUSH継続・ST144回）:
//   ・Re:Start（出玉表記なし、ST144回へリセットのみ）：14.0%
//   ・2R大当り(約300個)：6.0%
//   ・10R大当り(約1500個)：55.0%
//   ・10R大当り×4(約6000個)：25.0%
//   継続率約77%は、素の1-(1-1/99.9)^144≈76.5%とほぼ一致するため、残保留等の
//   引き戻しの無いシンプルな規定回数countDownで再現できる。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R相当1500個→実獲得1400個、
// 2R相当300個→実獲得280個、比率14/15。RUSH中の合計値もこの比率で換算:
// 3000個→2800個、6000個→5600個）。
//
// 【ラウンド数（rounds）とdisplayRoundsについて】
// 「10R×2」「10R×4」はラウンド内訳の無い合算表示だが、rounds自体は単位ブロック
// （10）のままにして、見た目のR数だけdisplayRounds（20・40）で別に持たせた
// （stateEngine.jsのコメント参照）。「Re:Start」は出玉0個のST再セットのみの当たり
// として、p-zonsaga.js等と同じ考え方でrounds:1・balls:0で表現した。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダーライン」は「現在調査中」で未公開のため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-re0-oni2",
  slug: "e-re0-oni2",
  name: "ｅ Re:ゼロから始める異世界生活 鬼がかり２",
  nameKana: "いーりーぜろからはじめるいせかいせいかつおにがかりに",
  aliases: ["リゼロ鬼がかり2", "鬼がかり2", "リゼロ鬼がかり２", "鬼がかり２"],
  manufacturer: { id: "daito", name: "Daito（大都技研）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（ST機・スマパチ・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/349.9",
    "RUSH中の当選確率：1/99.9",
    "RUSH：ST144回、継続率約77%",
    "RUSH突入率：55%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが45.0%、10R・実獲得約1400個でRUSHへが45.0%、10R×2・実獲得約2800個でRUSHへが10.0%",
    "RUSH中の当選振り分け（いずれも継続・ST144回リセット）：出玉無しのRe:Startが14.0%、2R・実獲得約280個が6.0%、10R・実獲得約1400個が55.0%、10R×4・実獲得約5600個が25.0%",
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
          { weight: 0.45, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.45, rounds: 10, balls: 1400, nextState: "rush", tag: "toRush10R", resultNote: "RUSH" },
          {
            weight: 0.1,
            rounds: 10,
            balls: 2800,
            displayRounds: 20,
            nextState: "rush",
            tag: "toRush20R",
            resultNote: "10R×2、RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 144,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.14, rounds: 1, balls: 0, nextState: "rush", tag: "reStart", resultNote: "Re:Start" },
          { weight: 0.06, rounds: 2, balls: 280, nextState: "rush", tag: "continue2R" },
          { weight: 0.55, rounds: 10, balls: 1400, nextState: "rush", tag: "continue10R" },
          {
            weight: 0.25,
            rounds: 10,
            balls: 5600,
            displayRounds: 40,
            nextState: "rush",
            tag: "continue10Rx4",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
