// e ノーゲーム・ノーライフ119Ver.（2026年11月2日導入 TAKAO スマパチ/ライト/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_ngnl_119/）。型式名 eノーゲーム・ノーライフV2B
// （検定番号511218）。スペック表と注記はWebFetchで本文から取得し、振り分けは同ページの
// 画像3枚（通常時の円グラフ e_ngnl_119-gazou1、ノゲノラッシュ・HYPER中の円グラフ gazou2、
// ゲームフロー図 gazou139）を images.1geki.jp からダウンロードし、Readツールで直接読み取った。
//
// 基本スペック:
//   大当り確率 通常時 1/119.8 ／ ノゲノラッシュ・HYPER中 約1/23.1
//   （※1 大当り確率1/119.8と小当り確率1/28.7の合算値。1/119.8+1/28.7 ≈ 1/23.15で一致）
//   出玉 10R=約1000個(実獲得約900個) / 3R=約300個(約270個)
//   ノゲノラッシュ: ST12回＋残存保留4個、継続率約51%
//   ノゲノラッシュHYPER: ST32回＋残存保留4個、継続率約80%
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou1）:
//   ・10R大当り(約1000個)→通常（時短なし）：50.0%
//   ・10R大当り(約1000個)→ノゲノラッシュ（ST12回＋残存保留4個）：50.0%
//   （ゲームフロー図ではノゲノラBONUS＝RUSH直行と、BONUSからの昇格演出があるが、
//   円グラフ上は合計でRUSH 50%／通常 50%）
// 電チュー入賞時（特図2・ノゲノラッシュ／HYPER中）の振り分け（gazou2）:
//   ・10R大当り(約1000個)→ノゲノラッシュHYPER（ST32回＋残存保留4個）：50.0%
//   ・3R大当り(約300個)→ノゲノラッシュHYPER（ST32回＋残存保留4個）：50.0%
//
// 【検算】
//   ST12回 1-(1-1/23.1)^12 ≈ 41.2%（注記「電サポ12回の継続率約41.1%」）
//   ST32回 1-(1-1/23.1)^32 ≈ 75.7%（注記「電サポ32回の継続率約75.6%」）
//   残存保留4個も同じ確率と見て「規定回数＋4」をそのままcountDownにすると
//   1-(1-1/23.1)^16 ≈ 50.7%（公表の継続率約51%）、1-(1-1/23.1)^36 ≈ 79.7%（公表約80%）
//   で、公表の継続率と一致する。
//
// 【迷った箇所】
// 注記には「残存保留4個の継続率約26.2%」とあり、これを素直に合算すると
// 41.1%＋58.9%×26.2% ≈ 56.5%、75.6%＋24.4%×26.2% ≈ 82.0% となって公表の
// 継続率（約51%・約80%）と合わない。一方、残存保留4個を1/23.1で抽選したとき
// （1-(1-1/23.1)^4 ≈ 16.2%）は両方の公表値と一致する。26.2%の意味は1geki.jp上で
// 説明が無く判断できないため、公表の継続率（見出しの値）を再現する「12＋4＝16回」
// 「32＋4＝36回」のcountDownで実装した。
//
// 【実装していないもの】
// ・遊タイム、デカヘソの記載は無い
//
// 【出玉は「実獲得個数」を採用】10R→900個、3R→270個。
// 【spinsPer1000Yen】ボーダーは「現在調査中」でデカヘソ等の記載も無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-ngnl-119",
  slug: "e-ngnl-119",
  name: "e ノーゲーム・ノーライフ119Ver.",
  nameKana: "いーのーげーむのーらいふいちいちきゅうばーじょん",
  aliases: ["ノーゲーム・ノーライフ", "ノゲノラ", "ノーゲームノーライフ", "ノゲノラ119", "ノゲノラッシュ", "ノゲノラッシュHYPER"],
  manufacturer: { id: "takao", name: "TAKAO（高尾）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・ライト・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "初当りは全て10Rで、半分がST12回＋残存保留4個の「ノゲノラッシュ」へ。ここで1回当てれば、ST32回＋残存保留4個・継続率約80%の「ノゲノラッシュHYPER」に格上げされる二段構えで、最初の16回転をくぐり抜けられるかが勝負どころ。HYPER中の当りは10Rと3Rが五分五分。",
  rules: [
    "通常時大当り確率：1/119.8",
    "ノゲノラッシュ・HYPER中の当選確率：約1/23.1（大当り1/119.8と小当り1/28.7の合算）",
    "ノゲノラッシュ：ST12回＋残存保留4個、継続率約51%",
    "ノゲノラッシュHYPER：ST32回＋残存保留4個、継続率約80%",
    "ノゲノラッシュ突入率：通常時大当りの50%",
    "通常時の振り分け（ヘソ入賞時）：10R・実獲得約900個で通常のままが50.0%、10R・実獲得約900個でノゲノラッシュが50.0%",
    "ノゲノラッシュ・HYPER中の振り分け（電チュー入賞時）：10R・実獲得約900個が50.0%、3R・実獲得約270個が50.0%（いずれもHYPERへ）",
    "ノゲノラッシュ・HYPERを全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 119.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 10, balls: 900, nextState: "rush", tag: "toRush", resultNote: "ノゲノラッシュ" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "ノゲノラッシュ",
      mode: "countDown",
      maxAttempts: 16,
      probability: 1 / 23.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "hyper", tag: "rushToHyper10R", resultNote: "ノゲノラッシュHYPER" },
          { weight: 0.5, rounds: 3, balls: 270, nextState: "hyper", tag: "rushToHyper3R", resultNote: "ノゲノラッシュHYPER" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ノゲノラッシュ終了" },
    },

    hyper: {
      id: "hyper",
      label: "ノゲノラッシュHYPER",
      mode: "countDown",
      maxAttempts: 36,
      probability: 1 / 23.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "hyper", tag: "hyperContinue10R" },
          { weight: 0.5, rounds: 3, balls: 270, nextState: "hyper", tag: "hyperContinue3R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hyperEnd", resultLabel: "ノゲノラッシュHYPER終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 3: 270 },
});
