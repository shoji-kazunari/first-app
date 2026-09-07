// 第75号機: eシャーマンキング（2025年 MACY（メーシー） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_shamanking/）。大当り振り分けは、同ページに
// 掲載されている2枚の円グラフ画像（通常時・シャーマンバトル勝利時）と、個別解説表
// （起きパチョモード・シャーマンファイト）の数値を突き合わせて構造化した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/349.9）の振り分け（円グラフ「通常時」）:
//   ・9R大当り(約450個/実獲得360個)→起きパチョモード(時短20回)へ：50.0%
//   ・9R大当り(約450個)→シャーマンファイト(LT、ST130回)へ直接：48.5%
//   ・10R大当り+α(約1500個+α/実獲得1400個+α)→シャーマンファイトへ：1.5%
//
// シャーマンファイト中（LT、ST130回、シャーマンバトル出現率1/77.4、勝率53%）:
// 「消化中は、1/77.4でシャーマンバトルに突入し、勝利で大当たり+シャーマンファイト
// 継続、敗北でST回数リセット」という記載どおり、シャーマンファイトの当選はすべて
// シャーマンバトルであり、勝率53%はその内訳。円グラフ「シャーマンバトル勝利時」の
// 4パターン（10R/10R×2/10R×3/10R×4＝約1500/3000/4500/6000個）は勝利時（53%）の
// 内訳で、敗北（47%）はST回数がリセットされる（stateEngineが同じ状態への遷移で
// remainingを自動的にmaxAttemptsへ戻す仕様を利用し、rounds:1・balls:0で自分自身へ
// 遷移させて表現した。e-ragnador.jsのラグナドATTACK失敗時と同じ扱い）。
// （トータル継続率約83%は、素の1-(1-1/77.4)^130≈81.6%に近い値になる。あらゆる
// 「勝敗を問わないシャーマンバトルの発生」自体が継続とみなせるため、130回の
// 単純なcountDownで大枠を再現できる）
//
// 【起きパチョモード（時短20回、シャーマンバトル出現率1/348.6）の実装について】
// 「たとえ負けてもシャーマンファイト（LT）突入となる」という記載は、あくまで
// 「20回の間にシャーマンバトルが出現し、そのバトルに負けた」場合の話であって、
// 「20回当たらずシャーマンバトルが一度も出現しなかった」場合の話ではない
// （前者はonHitの敗北枝、後者はonExhaustedで区別して実装する必要がある）。
// そのため、20回のcountDownのonHit（1/348.6でシャーマンバトル発生、勝率は
// シャーマンファイトと同じ53%と仮定。負けてもシャーマンファイトへ突入）と、
// onExhausted（一度もバトルが出現しないまま20回消化した場合は通常へ戻る）を
// 分けて表現した。起きパチョモード中のシャーマンバトル勝利時の出玉振り分けは
// 個別の円グラフが無いため、シャーマンファイトと同じ4パターンの比率を流用した
// （未確認の仮定として明記）。
//
// 【「時短・電サポ：20回or130回or10500回」の10500回は未実装】
// この概要ページには10500回に相当する状態の詳細（突入条件・振り分け）の記載が
// 見当たらず、実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 9R: 約450個/実獲得360個）。10R×2～×4も同じ10R単位の比率で換算した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-shamanking",
  slug: "e-shamanking",
  name: "eシャーマンキング",
  nameKana: "いーしゃーまんきんぐ",
  aliases: ["シャーマンキングパチンコ", "eシャーマンキング でっけぇえなver.", "シャーマンファイト"],
  manufacturer: { id: "macy", name: "MACY（メーシー）" },
  releaseYear: 2025,
  category: "パチンコ（スマパチ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/349.9",
    "シャーマンファイト中のシャーマンバトル出現率：1/77.4、勝率53%",
    "起きパチョモード中のシャーマンバトル出現率：1/348.6",
    "起きパチョモード：時短20回。バトルが出現した場合は勝敗を問わずシャーマンファイトへ、一度も出現せず20回消化した場合は通常へ戻る",
    "シャーマンファイト（LT）：ST130回、トータル継続率約83%",
    "通常時の大当り振り分け（ヘソ入賞時）：9R・実獲得約360個で起きパチョモードへが50.0%、9R・実獲得約360個でシャーマンファイトへ直接が48.5%、10R・実獲得約1400個+αでシャーマンファイトへが1.5%",
    "シャーマンバトル勝利時の出玉振り分け：10R・実獲得約1400個が49.4%、10R×2・実獲得約2800個が36.9%、10R×3・実獲得約4200個が12.2%、10R×4・実獲得約5600個が1.5%",
    "シャーマンバトル敗北時（47%）はST回数がリセットされる",
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
          {
            weight: 0.5,
            rounds: 9,
            balls: 360,
            nextState: "okipachoMode",
            tag: "toOkipacho",
            resultNote: "起きパチョモード",
          },
          {
            weight: 0.485,
            rounds: 9,
            balls: 360,
            nextState: "shamanFight",
            tag: "toFightDirect",
            resultNote: "シャーマンファイト",
          },
          {
            weight: 0.015,
            rounds: 10,
            balls: 1400,
            nextState: "shamanFight",
            tag: "toFightBonus",
            resultNote: "シャーマンファイト、大当たり+α",
          },
        ],
      },
      onExhausted: null,
    },

    okipachoMode: {
      id: "okipachoMode",
      label: "起きパチョモード",
      mode: "countDown",
      maxAttempts: 20,
      probability: 1 / 348.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.26182,
            rounds: 10,
            balls: 1400,
            nextState: "shamanFight",
            tag: "win1500",
            resultNote: "シャーマンバトル勝利、シャーマンファイト",
          },
          {
            weight: 0.19557,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "shamanFight",
            tag: "win3000",
            resultNote: "シャーマンバトル勝利、シャーマンファイト",
          },
          {
            weight: 0.06466,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "shamanFight",
            tag: "win4500",
            resultNote: "シャーマンバトル勝利、シャーマンファイト",
          },
          {
            weight: 0.00795,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "shamanFight",
            tag: "win6000",
            resultNote: "シャーマンバトル勝利、シャーマンファイト",
          },
          {
            weight: 0.47,
            rounds: 1,
            balls: 0,
            nextState: "shamanFight",
            tag: "battleLose",
            resultNote: "シャーマンファイト",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "okipachoEnd", resultLabel: "起きパチョモード終了" },
    },

    shamanFight: {
      id: "shamanFight",
      label: "シャーマンファイト",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 77.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.26182,
            rounds: 10,
            balls: 1400,
            nextState: "shamanFight",
            tag: "win1500",
            resultNote: "シャーマンバトル勝利",
          },
          {
            weight: 0.19557,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "shamanFight",
            tag: "win3000",
            resultNote: "シャーマンバトル勝利",
          },
          {
            weight: 0.06466,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "shamanFight",
            tag: "win4500",
            resultNote: "シャーマンバトル勝利",
          },
          {
            weight: 0.00795,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "shamanFight",
            tag: "win6000",
            resultNote: "シャーマンバトル勝利",
          },
          {
            weight: 0.47,
            rounds: 1,
            balls: 0,
            nextState: "shamanFight",
            tag: "battleLose",
            resultNote: "シャーマンバトル敗北（ST回数リセット）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "fightEnd", resultLabel: "シャーマンファイト終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 9: 360 },
});
