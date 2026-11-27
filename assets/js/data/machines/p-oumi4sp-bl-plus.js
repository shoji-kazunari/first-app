// P大海物語4スペシャル BLACK PLUS
// （2026年12月7日導入 SANYO ライトミドル/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_oumi4sp_bl_plus/、最終更新日2026年11月27日）。
// 型式名 P大海物語4スペシャルプラスRCA（検定番号6P0595）。スペック表・ST・大当たり詳細は
// WebFetchで本文から取得し、振り分けは同ページの円グラフ画像（p_oumi4sp_bl_plus_en）と
// ゲームフロー図（p_oumi4sp_bl_plus_gameflow）を images.1geki.jp からダウンロードし、
// Readツールで直接読み取った。
//
// 基本スペック（本文のスペック表）:
//   大当たり確率 通常時 約1/199.8 ／ 高確率 約1/40.5
//   ST突入率 100%（通常時・ST中とも大当たりの100%）／ ST51回（電サポ50回）／ ST継続率 約72%
//   ラウンド 10R/5R/3R ／ 払い出し(実獲得) 10R 約1500個(約1400個)・5R 約750個(約700個)・
//   3R 約450個(約420個)
//
// 振り分け（円グラフ「通常時・ST中」、ヘソ入賞時 特図1／電チュー入賞時 特図2 共通）:
//   ・10R 約1500個 → ST51回：30%
//   ・5R 約750個 → ST51回：30%
//   ・3R 約450個 → ST51回：40%
//   本文「大当たり出玉は30%で約1500個、30%で約750個、残りの40%で約450個となる」とも一致。
//
// 【状態の組み立て】
// 通常（1/199.8）→ 100% ST。ST（51回、1/40.5）で当たれば再びST、51回外せば通常へ。
//   検算: 1-(1-1/40.5)^51 ≈ 72.1%（公表 ST継続率約72%と一致）
// 51回目は電サポの無い「泣きの1回」だが、抽選は同じ高確率（1/40.5）のまま行われるので、
// 51回のcountDownとしてまとめた（継続率の検算もこの51回で一致する）。
//
// 【出玉は「実獲得個数」を採用】10R 1400個、5R 700個、3R 420個。
// 【spinsPer1000Yen】デカヘソ等の記載が無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-oumi4sp-bl-plus",
  slug: "p-oumi4sp-bl-plus",
  name: "P大海物語4スペシャル BLACK PLUS",
  nameKana: "ぴーおおうみものがたりふぉーすぺしゃる ぶらっくぷらす",
  aliases: ["黒海4プラス", "黒海4", "大海4SP BLACK", "大海4ブラック", "大海物語4スペシャル", "大海4", "海物語", "BLACK PLUS"],
  manufacturer: { id: "sanyo", name: "SANYO（三洋物産）" },
  releaseYear: 2026,
  releaseDate: "2026-12-07",
  category: "パチンコ（ライトミドル・ST機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "1/199.8のライトミドルで、当たれば100%ST51回へ。ST中は1/40.5で継続率約72%。出玉は10R約1500個・5R約750個・3R約450個の3段階で、ST中も同じ振り分け。最初の10回はブラックパールゾーン、最後の51回目は電サポ無しの「泣きの1回」と、ゾーンごとにメリハリがある。",
  rules: [
    "通常時大当たり確率：約1/199.8",
    "ST中大当たり確率：約1/40.5",
    "ST突入率：100%（通常時・ST中とも、大当たり後は必ずST51回）",
    "ST51回（電サポ50回＋泣きの1回）、継続率約72%",
    "大当たり振り分け（ヘソ・電チュー共通）：10R・実獲得約1400個が30%、5R・実獲得約700個が30%、3R・実獲得約420個が40%",
    "ST51回を外しきると通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 10, balls: 1400, nextState: "st", tag: "toSt10R", resultNote: "GREAT LUCKY・ST" },
          { weight: 0.3, rounds: 5, balls: 700, nextState: "st", tag: "toSt5R", resultNote: "ST" },
          { weight: 0.4, rounds: 3, balls: 420, nextState: "st", tag: "toSt3R", resultNote: "ST" },
        ],
      },
      onExhausted: null,
    },

    st: {
      id: "st",
      label: "ST",
      mode: "countDown",
      maxAttempts: 51,
      probability: 1 / 40.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 10, balls: 1400, nextState: "st", tag: "st10R" },
          { weight: 0.3, rounds: 5, balls: 700, nextState: "st", tag: "st5R" },
          { weight: 0.4, rounds: 3, balls: 420, nextState: "st", tag: "st3R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stEnd", resultLabel: "ST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 5: 700, 3: 420 },
});
