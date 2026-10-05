// 第112号機: Pドラムde 電音部 超ドラ熱4500ver.（2026年 MIZUHO（ミズホ）
// ライトミドル/一種二種混合機/遊タイム）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_denonbu/）。当選時の振り分けは、
// 同ページに掲載されている4枚の円グラフ画像（通常時・遊タイム中・りむるしか
// 勝たんチャレンジ中・超ドラ熱ATTACK中）をダウンロードしてReadツールで直接
// 読み取った実数値。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 1/259.0 ／ 右打ち中（チャレンジ・ATTACK共通） 1/2.0
//   ラウンド 10R/2R ／ 賞球数 1&7&15
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個) / 2R=約300個(約280個)
//
// ヘソ入賞時（特図1・通常時、確率1/259.0）の振り分け:
//   ・2R大当り(約300個)→通常のまま（時短なし）：49.0%
//   ・2R大当り(約300個)→りむるしか勝たんチャレンジ（時短1回）：50.0%
//   ・10R×3大当り(約4500個)→超ドラ熱ATTACK（時短1回、直撃）：1.0%
// りむるしか勝たんチャレンジ中（電チュー入賞時・特図2、確率1/2.0、時短1回）の
// 振り分け: 当選（100%）→10R大当り(約1500個)→超ドラ熱ATTACK。
// 外れた場合（1/2で外れ）は通常時へ戻る（りむるしか勝たんチャレンジ成功期待度
// 約50%と一致）。
// 超ドラ熱ATTACK中（電チュー入賞時・特図2、確率1/2.0、時短1回を当たるたびに
// 繰り返す1回転決着ループ）の振り分け:
//   ・10R×3大当り(約4500個)→ATTACK継続：98.0%
//   ・10R×3＋10R×3大当り(約9000個)→ATTACK継続：2.0%
//   継続率約50%は1/2.0そのものと一致する。
//
// 【「遊タイム100回（通常時550回消化で発動）」は未実装】
// はまり回数のカウントという別軸の状態管理が必要になるため、通常のゲーム性
// のみを実装した（p-kkclub-fsakamoto199.js・p-tojinomiko199.jsの遊タイム省略と
// 同じ扱い）。遊タイム発動中は電チュー側（特図2、1/2.0）の恩恵を受けられる
// ことがページに記載されているが、発動条件自体を再現していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（比率14/15。10R=1400個、2R=280個、
// 4500個→実獲得4200個、9000個→実獲得8400個）。
//
// 【ラウンド数（rounds）とdisplayRoundsについて】
// 「10R×3」「10R×3＋10R×3」はラウンド内訳の無い合算表示のため、roundsは単位
// ブロック（10）のままにして、見た目のR数だけdisplayRounds（30・60）で別に
// 持たせた（e-re0-oni2.js等と同じ考え方）。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダー」欄にある「30～33回/1000円を超えるとプラス」は損益分岐の
// 目安であり、実際の回転ペース（spinsPer1000Yen）とは別の指標のため、ここでは
// 使わない。実回転数自体の掲載は無いため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-denonbu",
  slug: "p-denonbu",
  name: "Pドラムde 電音部 超ドラ熱4500ver.",
  nameKana: "ぴーどらむでーでんおんぶちょうどらねつよんせんごひゃくばー",
  aliases: ["電音部パチンコ", "ドラムde電音部", "超ドラ熱ATTACK", "りむるしか勝たんチャレンジ"],
  manufacturer: { id: "mizuho", name: "MIZUHO（ミズホ）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（ライトミドル・一種二種混合機・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/259.0",
    "りむるしか勝たんチャレンジ・超ドラ熱ATTACK中の当選確率：1/2.0",
    "超ドラ熱ATTACK：時短1回を当たるたびに繰り返す1回転決着ループ、継続率約50%",
    "りむるしか勝たんチャレンジ成功期待度：約50%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが49.0%、2R・実獲得約280個でりむるしか勝たんチャレンジへが50.0%、10R×3・実獲得約4200個で超ドラ熱ATTACKへ直撃が1.0%",
    "りむるしか勝たんチャレンジ成功時：10R・実獲得約1400個で超ドラ熱ATTACKへ",
    "超ドラ熱ATTACK中の当選振り分け（いずれも継続）：10R×3・実獲得約4200個が98.0%、10R×3＋10R×3・実獲得約8400個が2.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 259.0,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "challenge",
            tag: "toChallenge",
            resultNote: "りむるしか勝たんチャレンジ",
          },
          {
            weight: 0.01,
            rounds: 10,
            balls: 4200,
            displayRounds: 30,
            nextState: "rush",
            tag: "toRushDirect",
            resultNote: "10R×3、超ドラ熱ATTACK",
          },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "りむるしか勝たんチャレンジ",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 2.0,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "challengeSuccess",
            resultNote: "超ドラ熱ATTACK",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeFail", resultLabel: "チャレンジ失敗" },
    },

    rush: {
      id: "rush",
      label: "超ドラ熱ATTACK",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 2.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.98, rounds: 10, balls: 4200, displayRounds: 30, nextState: "rush", tag: "continue4500" },
          {
            weight: 0.02,
            rounds: 10,
            balls: 8400,
            displayRounds: 60,
            nextState: "rush",
            tag: "continue9000",
            resultNote: "10R×3＋10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "超ドラ熱ATTACK終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
