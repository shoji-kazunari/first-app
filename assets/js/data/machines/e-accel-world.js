// 第19号機: eアクセル・ワールド（2026年 newgin スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_accelworld/）。
// 大当たり振り分けは、同ページに掲載されている4枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/184.6）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：30.0%
//   ・2R大当り(約300個)→BURST BATTLE：69.5%
//   ・10R大当り(約1500個)→LT（OVER HEAVEN）：0.5%
// （テキスト解説では「赤図柄揃い→BURST BATTLE」「青図柄揃い→チャレンジ演出
// （成功でBURST BATTLE、失敗で通常）」の2契機に分かれて説明されているが、円グラフ
// 「通常時の大当たり時の出玉振り分け確率」はチャレンジ演出の結果を織り込んだ後の
// 最終移行先で30.0%/69.5%/0.5%の3択にまとまっており、これは「BURST BATTLE突入率
// 69.5%」という機種概要の記載とも一致する。そのためチャレンジ演出は独立した状態を
// 作らず、この円グラフの数値をそのまま実装した）
//
// 電チュー入賞時（特図2・BURST BATTLE中、転落式）の振り分け:
//   ・10R大当り(約1500個)→LT（OVER HEAVEN）：100%
//   （大当り確率約1/36.7、転落確率約1/9.4の転落抽選と並行。突破率約33%※1は
//   「転落後の残保留+LAST ATTACKでの引き戻しを含めた数値」であり、素の
//   (1/36.7)/((1/36.7)+(1/9.4))≈20.4%より高い。p-madokamagica3.js /
//   e-sao-senko.jsと同じ理由（stateEngineのresidualAttemptsはonFall専用で、
//   規定回数消化型はもちろん転落型でも「転落後にもう一段抽選」という仕組みは
//   表現できない）でこのシミュレーターでは引き戻しを実装せず、素の転落確率
//   （約1/9.4）のみで転落を判定する。他機種より差（20.4%→33%）が大きいが、
//   同じ制約・同じ方針で扱っている）
//
// 【OVER HEAVEN（LT前半）を「初回1発の6000個固定」に簡略化した理由】
// LTは「電チュー入賞時（LT前半 OVER HEAVEN中）」の円グラフで10R×4(約6000個)が
// 100%と表示されており、本来は当りするたびに6000個を獲得し続ける電サポ回数
// 変動型RUSHで、「平均滞在回数は約11回転」で後半パート（0.51%で6000個・
// 99.49%で1500個、いずれもOVER HEAVENへ戻る＝再度LT前半へ）に切り替わる。
// ただし前半から後半へ切り替わる条件（1回ごとの終了抽選率など）は1geki.jpに
// 数値の記載が無く、平均滞在回数からの逆算（幾何分布と仮定して1-1/11≈90.9%を
// 毎回転の継続率とする等）は依頼者への確認なしに数値を作ることになるため、
// 実装前に依頼者へ質問した。回答は「初回1発目だけ6000個固定にする」。
// これに従い、LT初当り（通常時0.5%またはBURST BATTLE突破100%のいずれか）の
// 直後に1回だけ確定で10R×4(約6000個・実獲得5600個)を付与し（overHeavenFirst
// 状態）、そのままLT後半パートの当り振り分け（0.51%/99.49%）へ移行する形に
// 簡略化した。これは1geki.jpの公開値そのままではなく、依頼者の指示による
// このシミュレーター独自の簡略化ルールである。平均11発×6000個が期待値の
// 本来のOVER HEAVENより、シミュレーター上の期待出玉は少なめになる。
//
// LT後半パート（電チュー入賞時、大当り確率約1/36.7）の振り分け:
//   ・10R大当り×4(約6000個)→OVER HEAVEN(=LT継続)：0.51%
//   ・10R大当り(約1500個)→OVER HEAVEN(=LT継続)：99.49%
// （転落確率約1/65.8で通常へ。トータル継続率約78%※1も上と同じ「残保留+LAST
// ATTACKでの引き戻しを含めた数値」で、素の(1/36.7)/((1/36.7)+(1/65.8))≈64.2%
// より高い。BURST BATTLEと同じ方針で素の転落確率のみを実装している）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、10R×4: 約6000個/実獲得5600個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-accel-world",
  slug: "e-accel-world",
  name: "eアクセル・ワールド",
  nameKana: "いーあくせるわーるど",
  aliases: ["アクセルワールド", "アクセル・ワールド", "AW", "eAW", "加速世界"],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/184.6",
    "BURST BATTLE・LT中の大当り確率：ともに約1/36.7",
    "BURST BATTLE：転落式（転落確率約1/9.4）。突破後はLT（OVER HEAVEN）へ",
    "LT：転落式（転落確率約1/65.8）。継続中はOVER HEAVEN⇔後半パートを行き来する",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが30.0%、2R・実獲得約280個でBURST BATTLEが69.5%、10R・実獲得約1400個でLTが0.5%",
    "BURST BATTLE中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個でLTが100%",
    "LT初当り直後は1回だけ確定で10R×4・実獲得約5600個を獲得（OVER HEAVEN前半を簡略化した独自ルール。詳細はコメント）",
    "LT後半パート中の当選振り分け（電チュー入賞時）：10R×4・実獲得約5600個が0.51%、10R・実獲得約1400個が99.49%（いずれも継続）",
    "BURST BATTLE・LTとも転落小当たりを引くと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 184.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.695, rounds: 2, balls: 280, nextState: "burstBattle", tag: "toBurstBattle" },
          {
            weight: 0.005,
            rounds: 10,
            balls: 1400,
            nextState: "overHeavenFirst",
            tag: "toLt",
            resultNote: "LT（OVER HEAVEN）",
          },
        ],
      },
      onExhausted: null,
    },

    burstBattle: {
      id: "burstBattle",
      label: "BURST BATTLE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 36.7,
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
            balls: 1400,
            nextState: "overHeavenFirst",
            tag: "burstBattleToLt",
            resultNote: "LT（OVER HEAVEN）",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 9.4,
        nextState: "normal",
        tag: "burstBattleFall",
        resultLabel: "BURST BATTLE終了（転落）",
      },
    },

    overHeavenFirst: {
      id: "overHeavenFirst",
      label: "OVER HEAVEN（LT前半）",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
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
            displayRounds: 40,
            balls: 5600,
            nextState: "ltSecondHalf",
            tag: "overHeavenFirstHit",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: null,
    },

    ltSecondHalf: {
      id: "ltSecondHalf",
      label: "LT後半パート",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 36.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.0051,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "ltSecondHalf",
            tag: "ltSecondHalfMega",
            resultNote: "10R×4",
          },
          {
            weight: 0.9949,
            rounds: 10,
            balls: 1400,
            nextState: "ltSecondHalf",
            tag: "ltSecondHalfContinue",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 65.8,
        nextState: "normal",
        tag: "ltFall",
        resultLabel: "LT終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
