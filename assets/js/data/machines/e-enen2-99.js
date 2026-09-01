// 第36号機: eフィーバー炎炎ノ消防隊2 99ver.（2026年9月7日導入予定 SANKYO スマパチ/甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_enen2_99/）。導入開始日2026年9月7日の
// 新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため先取りで追加した。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・
// 命の呼吸チャレンジ/炎上RUSH/残保留中・アドラバースト中）をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/99.9）の振り分け:
//   ・4R大当り(約400個)→命の呼吸チャレンジ(ST1回+残保留4個)：49%
//   ・4R大当り(約400個)→炎上RUSH(ST30回+残保留4個)：50%
//   ・9R大当り(約900個、"全回転")→アドラバースト(ST64回+残保留4個)：1%
// 電チュー入賞時（特図2・命の呼吸チャレンジ/炎上RUSH中、共通の表）:
//   ・9R大当り(約900個)→アドラバースト：1%
//   ・9R大当り(約900個)→炎上RUSH継続：19%
//   ・4R大当り(約400個)→炎上RUSH継続：80%
// 電チュー入賞時（特図2・アドラバースト中）:
//   ・9R大当り(約900個)→継続：20%
//   ・4R大当り(約400個)→継続：80%
//
// いずれの右打ち状態も大当たり確率は共通で約1/23.8。命の呼吸チャレンジ
// （ST1回）・炎上RUSH（ST30回）・アドラバースト（ST64回）は、いずれもこの
// 1/23.8を規定回数ぶん消化する素の計算がスペック表の「素の継続率」注記と
// 正確に一致する（1-(1-1/23.8)^1≈4.2%、^30≈72.4%、^64≈93.6%）。
//
// 【残保留4個の引き戻しをmaxAttemptsへ組み込む実装（2026-09-02改訂）】
// スペック表には各状態ごとに「時短N回継続率（素）」「残保留4個継続率（約15.8%）」
// 「トータル継続率」が個別に注記されており（命の呼吸チャレンジ:4.2%→19.3%、
// 炎上RUSH:72.4%→76.8%、アドラバースト:93.6%→94.6%）、素の値が上と正確に
// 一致することを確認済み。
//
// この機種はonFallを使わない規定回数消化型（転落ではなく、規定回数を打ち切ったら
// 終了するタイプ）なので、「残保留4個」による引き戻しは、転落式のonFall.
// residualAttemptsのような専用ロジックを組まなくても、maxAttempts自体に4を
// 足し込むだけで数学的に正確に再現できる（独立試行の合計回数が同じなら、途中で
// 追加のチャンスを挟んでも最初から回数に含めても成功確率は変わらないため）。
// 実際に計算式1-(1-1/23.8)^Nへ代入すると、N=5（1+4）で19.3%、N=34（30+4）で
// 76.8%、N=68（64+4）で94.6%と、公表の「トータル継続率」にすべて一致する。
// 各状態のmaxAttemptsは本来のST回数+4（残保留分）とし、
// includesResidualHold: trueを立てて画面の残り回数表示に
// 「（残保留込み）」と小さく注記する（詳細はmachine.jsのspinCounterText参照）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（9R: 約900個/実獲得810個、
// 4R: 約400個/実獲得360個、比率いずれも9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-enen2-99",
  slug: "e-enen2-99",
  name: "eフィーバー炎炎ノ消防隊2 99ver.",
  nameKana: "いーふぃーばーえんえんのしょうぼうたいつーきゅうじゅうきゅうばー",
  aliases: ["炎炎ノ消防隊2", "炎炎2", "炎炎ノ消防隊", "eフィーバー炎炎", "炎炎2 99"],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：1/99.9",
    "命の呼吸チャレンジ・炎上RUSH・アドラバースト中の大当たり確率：共通で約1/23.8",
    "命の呼吸チャレンジ：ST1回（残保留4個込みで実質5回）・継続率約19.3%、炎上RUSH：ST30回（残保留込みで実質34回）・継続率約77%、アドラバースト：ST64回（残保留込みで実質68回）・継続率約95%",
    "トータルRUSH突入率：約60%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約360個で命の呼吸チャレンジが49%、4R・実獲得約360個で炎上RUSHが50%、9R・実獲得約810個でアドラバーストが1%",
    "命の呼吸チャレンジ・炎上RUSH中の当選振り分け（電チュー入賞時、共通）：9R・実獲得約810個でアドラバーストが1%、9R・実獲得約810個で炎上RUSH継続が19%、4R・実獲得約360個で炎上RUSH継続が80%",
    "アドラバースト中の当選振り分け（電チュー入賞時）：9R・実獲得約810個で継続が20%、4R・実獲得約360個で継続が80%",
    "命の呼吸チャレンジ・炎上RUSH・アドラバーストとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.49,
            rounds: 4,
            balls: 360,
            nextState: "challenge",
            tag: "toChallenge",
            resultNote: "命の呼吸チャレンジ",
          },
          { weight: 0.5, rounds: 4, balls: 360, nextState: "rush", tag: "toRush", resultNote: "炎上RUSH" },
          {
            weight: 0.01,
            rounds: 9,
            balls: 810,
            nextState: "adlaBurst",
            tag: "toAdlaBurstDirect",
            resultNote: "全回転・アドラバースト",
          },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "命の呼吸チャレンジ",
      mode: "countDown",
      maxAttempts: 5, // 本来のST1回+残保留4個
      includesResidualHold: true,
      probability: 1 / 23.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.01,
            rounds: 9,
            balls: 810,
            nextState: "adlaBurst",
            tag: "challengeToAdla",
            resultNote: "アドラバースト",
          },
          {
            weight: 0.19,
            rounds: 9,
            balls: 810,
            nextState: "rush",
            tag: "challengeToRush900",
            resultNote: "炎上RUSH",
          },
          {
            weight: 0.8,
            rounds: 4,
            balls: 360,
            nextState: "rush",
            tag: "challengeToRush400",
            resultNote: "炎上RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "命の呼吸チャレンジ終了" },
    },

    rush: {
      id: "rush",
      label: "炎上RUSH",
      mode: "countDown",
      maxAttempts: 34, // 本来のST30回+残保留4個
      includesResidualHold: true,
      probability: 1 / 23.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.01,
            rounds: 9,
            balls: 810,
            nextState: "adlaBurst",
            tag: "rushToAdla",
            resultNote: "アドラバースト",
          },
          { weight: 0.19, rounds: 9, balls: 810, nextState: "rush", tag: "rushContinue900" },
          { weight: 0.8, rounds: 4, balls: 360, nextState: "rush", tag: "rushContinue400" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "炎上RUSH終了" },
    },

    adlaBurst: {
      id: "adlaBurst",
      label: "アドラバースト",
      mode: "countDown",
      maxAttempts: 68, // 本来のST64回+残保留4個
      includesResidualHold: true,
      probability: 1 / 23.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 9, balls: 810, nextState: "adlaBurst", tag: "adlaContinue900" },
          { weight: 0.8, rounds: 4, balls: 360, nextState: "adlaBurst", tag: "adlaContinue400" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "adlaEnd", resultLabel: "アドラバースト終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 4: 360, 9: 810 },
});
