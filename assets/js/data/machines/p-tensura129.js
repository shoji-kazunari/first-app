// 第98号機: P転生したらスライムだった件129ver.（2025年 SanseiR&D（サンセイR&D） ライト/ST機/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_tensura129/）。当選時の振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（特図1・特図2ST中・特図2時短中）を
// ダウンロードしてReadツールで直接読み取った実数値。ゲームフロー画像も確認した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/129.7）の振り分け:
//   ・3R大当り(リミッタ1回)約300個→ハーベストフェスティバルへ：50.0%
//   ・3R大当り(リミッタ255回)約300個→ハーベストフェスティバルへ：50.0%
// （「リミッタ」は内部の周期カウンタで、いずれも行き先・出玉が同一のため
// 1つの outcome（weight:1）にまとめた）
//
// ハーベストフェスティバル中（特図2・電チュー入賞時）の振り分け:
//   ST中: 2R大当り約200個で継続30.0% / 10R大当り約1000個で継続70.0%
//   時短中: 2R大当り約200個で継続15.0%×2パターン(リミッタ違い) /
//           10R大当り約1000個で継続35.0%×2パターン(リミッタ違い)
// （時短中の内訳もリミッタ違いを合算するとST中と全く同じ2R30%/10R70%になるため、
// ST中・時短中を分けず単一のRUSH状態として扱った。ゲームフロー画像・スペック表に
// 記載の「RUSH継続率約75%はST72回の継続率約74.5%と特図2保留4個引き戻し率約3%の
// 合算値」は、電サポ72回に残保留4個を足した計76回・確率1/53.1のシンプルな
// 規定回数countDownで再現できる（素の1-(1-1/53.1)^76≈76.4%で、公表の約75%と近似）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得約900個、
// 3R: 約300個/実獲得約270個、2R: 約200個/実獲得約180個）。
//
// 【1000円あたりの回転数は未公表】
// このページに記載が無いため、既定値の16を採用した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-tensura129",
  slug: "p-tensura129",
  name: "P転生したらスライムだった件129ver.",
  nameKana: "ぴーてんせいしたらすらいむだったけんひゃくにじゅうきゅうばー",
  aliases: ["転スラパチンコ", "転スラ129", "P転生したらスライムだった件ARJ", "ハーベストフェスティバル"],
  manufacturer: { id: "sansei-rd", name: "SanseiR&D（サンセイR&D）" },
  releaseYear: 2025,
  category: "パチンコ（ライト・ST機・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/129.7",
    "ハーベストフェスティバル中の当選確率：1/53.1",
    "ハーベストフェスティバル：電サポ72回、継続率約75%",
    "RUSH突入率：100%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約270個でハーベストフェスティバルへが100%",
    "ハーベストフェスティバル中の当選振り分け：2R・実獲得約180個で継続が30.0%、10R・実獲得約900個で継続が70.0%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 129.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 3,
            balls: 270,
            nextState: "harvestFestival",
            tag: "toRush",
            resultNote: "ハーベストフェスティバル",
          },
        ],
      },
      onExhausted: null,
    },

    harvestFestival: {
      id: "harvestFestival",
      label: "ハーベストフェスティバル",
      mode: "countDown",
      maxAttempts: 76,
      probability: 1 / 53.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 2, balls: 180, nextState: "harvestFestival", tag: "continueSmall" },
          { weight: 0.7, rounds: 10, balls: 900, nextState: "harvestFestival", tag: "continueBig" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ハーベストフェスティバル終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 3: 270, 2: 180 },
});
