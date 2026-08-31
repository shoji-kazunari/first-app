// 第11号機: e牙狼12黄金騎士極限（2025年 SanseiR&D スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_garo12/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・10R大当り(約1500個)→通常時（時短なし）：50.0%
//   ・10R大当り(約1500個)→極限7500バトル（次回1回まで）：50.0%
// 電チュー入賞時（特図2・極限7500バトル中）の振り分け:
//   ・10R大当り(約1500個)→通常時（バトル失敗）：50.0%
//   ・10R×5大当り(約7500個)→魔戒CHANCE LT（次回1回まで）：50.0%
// 電チュー入賞時（特図2・魔戒CHANCE LT中）の振り分け:
//   ・10R大当り(約1500個)→通常時（LT終了）：約24%
//   ・10R×5大当り(約7500個)→魔戒CHANCE LT継続：約25%
//   ・10R大当り(約1500個)→魔戒CHANCE LT継続：約51%
// （継続率25%+51%=約76%が1geki.jp発表の「魔戒CHANCE LT継続率約76%」と一致）
//
// 極限7500バトル・魔戒CHANCE LTはいずれも「実質大当たり確率1/1」「次回まで」の
// ループタイプで、1回の抽選で必ず結果が出る（スペック表の「1stバトル成功率50%」
// 「突破率50%」等はこの円グラフの2分岐と同じ内容を機種概要の文章として説明した
// もの）。そのためstateEngine側ではprobability:1で表現している。probability:1だと
// 「必ず1回目で当たる」ため、countDown+maxAttempts:1にすると消化しきり（ハズレ）に
// 絶対到達できずmachineValidator/テストの「どの状態からでも消化しきりに到達できる」
// 前提と矛盾する。そのため2状態ともcountUp（規定回数なし）にしている
// （どのみち初回で必ず当たるので、見た目の挙動はcountDown+1回と変わらない）。
//
// 【ガロチャージについて】
// スペック表には、ヘソ入賞時のもう1つの当選契機として「ガロチャージ」（約1/1749.9、
// 2R・約300個、常に通常時へ）が説明されている。ただし円グラフ（通常時の大当たり時の
// 出玉振り分け確率）は「10R大当り→通常50%／10R大当り→極限7500バトル50%」の2択
// のみで、ガロチャージ単体の出現率は数値として公開されていない。このシミュレーターは
// 数値の裏取りができるこの円グラフの2択をそのまま実装し、ガロチャージは「通常時
// 大当りの一部がそう見える」という演出上の呼び分けとして扱う（e-gundamseed-climax.js
// のSEEDチャージと同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表に明記されている基準（10R: 約1500個/実獲得1400個、比率14/15）を、
// 明記の無い10R×5(約7500個)にもそのまま適用した（実獲得約7000個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-garo12",
  slug: "e-garo12",
  name: "e牙狼12黄金騎士極限",
  nameKana: "いーがろじゅうにおうごんきしきょくげん",
  aliases: ["牙狼", "ガロ", "牙狼12", "牙狼7500", "黄金騎士極限", "牙狼極限"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D" },
  releaseYear: 2025,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/349.9",
    "極限7500バトル・魔戒CHANCE LTはいずれも実質大当たり確率1/1（次回1回のみのループタイプ）",
    "魔戒CHANCE LT継続率：約76%",
    "通常時の大当たり振り分け（ヘソ入賞時）：10R・実獲得約1400個で通常のままが50.0%、10R・実獲得約1400個で極限7500バトルへが50.0%",
    "極限7500バトル中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で通常へ戻るが50.0%、10R×5・実獲得約7000個で魔戒CHANCE LTへが50.0%",
    "魔戒CHANCE LT中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個でLT終了が約24%、10R×5・実獲得約7000個で継続が約25%、10R・実獲得約1400個で継続が約51%",
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
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "battle7500", tag: "toBattle" },
        ],
      },
      onExhausted: null,
    },

    battle7500: {
      id: "battle7500",
      label: "極限7500バトル",
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
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "normal", tag: "battleFail" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "chanceLT",
            tag: "battleSuccess",
            resultNote: "10R×5",
          },
        ],
      },
      onExhausted: null,
    },

    chanceLT: {
      id: "chanceLT",
      label: "魔戒CHANCE LT",
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
          { weight: 0.24, rounds: 10, balls: 1400, nextState: "normal", tag: "ltEnd" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "chanceLT",
            tag: "ltContinueMega",
            resultNote: "10R×5",
          },
          { weight: 0.51, rounds: 10, balls: 1400, nextState: "chanceLT", tag: "ltContinue" },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  // 10Rには1400/7000個の2種類があるため、代表値のみ置き、実際の出玉は
  // 各onHit.outcomesのballsで上書きする。
  payoutTable: { 10: 1400 },
});
