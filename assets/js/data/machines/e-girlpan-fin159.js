// 第48号機: eガールズ＆パンツァー最終章 159ver.（2026年 HEIWA スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_girlpan_fin159/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・戦車道RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/159.8）の振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：約75%
//   ・2R大当り(約300個)→戦車道RUSH(LT、ST3回+残保留1個)：約25%
// 電チュー入賞時（特図2・戦車道RUSH中、当選確率1/3.4）の振り分け:
//   ・大当り→戦車道RUSH継続：100%（出玉は下記参照）
// （戦車道RUSHはST3回+残保留1個＝計4回転を全弾外すと通常へ。継続率約75%は、
// 素の1-(1-1/3.4)^4≈75.2%とほぼ一致しており、maxAttempts:4の単純なcountDown
// として実装した。1geki.jp側の内訳表記「時短3回引き戻し率約64.1%＋残保留1個
// 引き戻し率約28.9%の合算」とも整合する）
//
// 【戦車道RUSH中の出玉を「約1500個」固定にした理由】
// 1geki.jpには「ST中大当たり時の出玉振り分けテーブル」として、RUSH突入時に
// 内部で選ばれる5種類の「シナリオ」（BARどん底/革命鎮圧/知波単魂/高温サウナ/
// 最強の挑戦者）ごとに、ST1～3回転目の出玉が約1500～約4500個の範囲で変化する
// 表が掲載されている。円グラフ側も「約1500個～約4500個（滞在シナリオによって
// 毎変動大当たり時の出玉が変化）」とまとめて表示するのみで、各シナリオの
// 選択確率（重み）は数値として一切公開されていない。
// 推測でシナリオの選択率を作ることはできないため、このシミュレーターでは
// 全シナリオに共通する最低保証ライン（どのシナリオでも必ずどこかの回転で
// 出る値）であり、かつ1geki.jp自身が「残保留で当選した場合は約1500個」と
// 明記している実在の数値である約1500個に固定して実装した。これにより
// 実際の期待出玉より控えめに出る（シナリオ次第で最大4500個まで乗る変動を
// 反映していない）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-girlpan-fin159",
  slug: "e-girlpan-fin159",
  name: "eガールズ＆パンツァー最終章 159ver.",
  nameKana: "いーがーるずあんどぱんつぁーさいしゅうしょう159ばー",
  aliases: ["ガルパン159", "ガールズアンドパンツァー最終章", "eガルパン", "ガルパン最終章159"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/159.8",
    "戦車道RUSH中の当選確率：1/3.4",
    "戦車道RUSH（LT）：ST3回+残保留1個、継続率約75%",
    "戦車道RUSH（LT）突入率：約25%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが約75%、2R・実獲得約280個で戦車道RUSHが約25%",
    "戦車道RUSH中の当選振り分け（電チュー入賞時）：実獲得約1400個で継続が100%（シナリオ次第で最大4500個まで乗る変動は未実装。詳細はコメント）",
    "戦車道RUSHは規定回数（ST3回+残保留1個）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 159.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.75, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.25,
            rounds: 2,
            balls: 280,
            nextState: "rush",
            tag: "toRush",
            resultNote: "戦車道RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "戦車道RUSH",
      mode: "countDown",
      maxAttempts: 4,
      probability: 1 / 3.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue" }],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "戦車道RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
