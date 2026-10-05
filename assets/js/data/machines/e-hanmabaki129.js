// 第114号機: e範馬刃牙 129ver.（2026年 AMTEX（アムテックス） スマパチ/ライト/
// ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_hanmabaki129/）。当選時の振り分けは、
// 同ページに掲載されている4枚の円グラフ画像（通常時・バトルMODE1/2回目・
// バトルMODE3回目・地上最強の親子喧嘩/史上最強バトルMODE90）をダウンロードして
// Readツールで直接読み取った実数値。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 1/129.7 ／ 右打ち中（バトルMODE・親子喧嘩・バトルMODE90共通）
//               1/1.54
//   ラウンド 10R/5R ／ 賞球数 1&2&7&10
//   払い出し個数（実獲得個数） 10R=約1000個(約900個) / 5R=約500個(約450個)
//
// ヘソ入賞時（特図1・通常時、確率1/129.7）の振り分け:
//   ・5R大当り(約500個)→通常のまま（時短なし）：約47%
//   ・5R大当り(約500個)→バトルMODE（時短1回）：約53%
// バトルMODE1回目・2回目中（電チュー・特図2、確率1/1.54、時短1回）の振り分け:
//   ・10R大当り(約1000個)→地上最強の親子喧嘩へ：約5%
//   ・10R大当り(約1000個)→バトルMODE継続（次の回へ）：約95%
// バトルMODE3回目中（同確率、時短1回）の振り分け:
//   ・10R大当り(約1000個)→地上最強の親子喧嘩へ：100%
//
// 【「地上最強の親子喧嘩」と「史上最強バトルMODE90（時短1回）」は同一構造として統合】
// 円グラフは「地上最強の親子喧嘩/史上最強バトルMODE90中」として1枚にまとめられて
// おり、確率（1/1.54）・出玉（10R・約1000個）・次の分岐（時短10000回70%／
// 時短1回30%）がすべて共通であることが読み取れる。つまり「親子喧嘩（時短1回）」は
// 構造的に「時短1回の史上最強バトルMODE90」そのものと同一のため、本実装では
// 別状態を起こさず、両方を1つの状態「lt90Short（史上最強バトルMODE90・時短1回）」
// として扱った。バトルMODE側からの「地上最強の親子喧嘩へ」という遷移は、
// すべてこのlt90Shortへの遷移として実装している。
//
// 地上最強の親子喧嘩/史上最強バトルMODE90中（確率1/1.54、時短1回または10000回）の
// 振り分け（いずれも10R大当り約1000個、継続時の時短回数のみ変化）:
//   ・時短10000回へ：約70%
//   ・時短1回へ：約30%
// ラッキートリガー継続率約90%（※時短1回の引き戻し約65%・時短10000回の引き戻し
// 約99.9%の合算値）は、素の1-(1-1/1.54)^1≈64.9%・1-(1-1/1.54)^10000≈100%と
// それぞれほぼ一致するため、残保留等の引き戻しの無いシンプルなcountDownの
// 繰り返しで再現できる（70%×ほぼ100%+30%×約65%≈89.4%）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R→900個、5R→450個。比率9/10）。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダーライン」は「現在調査中」で未公開のため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-hanmabaki129",
  slug: "e-hanmabaki129",
  name: "e範馬刃牙 129ver.",
  nameKana: "いーはんまばきひゃくにじゅうきゅうばー",
  aliases: ["範馬刃牙パチンコ", "刃牙パチンコ", "バキ129", "バトルMODE"],
  manufacturer: { id: "amtex", name: "AMTEX（アムテックス）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（スマパチ・ライト・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/129.7",
    "右打ち中（バトルMODE・史上最強バトルMODE90共通）の当選確率：1/1.54",
    "バトルMODE突入率：約53%",
    "バトルMODEは3回勝利で地上最強の親子喧嘩（史上最強バトルMODE90・時短1回）へ",
    "史上最強バトルMODE90：時短1回or10000回、ラッキートリガー継続率約90%",
    "通常時の振り分け：5R・実獲得約450個で通常のままが約47%、5R・実獲得約450個でバトルMODEへが約53%",
    "バトルMODE1・2回目の振り分け：10R・実獲得約900個で親子喧嘩へが約5%、10R・実獲得約900個で継続が約95%",
    "バトルMODE3回目の振り分け：10R・実獲得約900個で親子喧嘩へ100%",
    "史上最強バトルMODE90中の振り分け：10R・実獲得約900個で時短10000回へが約70%、10R・実獲得約900個で時短1回へが約30%",
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
          { weight: 0.47, rounds: 5, balls: 450, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.53,
            rounds: 5,
            balls: 450,
            nextState: "battleMode1",
            tag: "toBattleMode",
            resultNote: "バトルMODE",
          },
        ],
      },
      onExhausted: null,
    },

    battleMode1: {
      id: "battleMode1",
      label: "バトルMODE（1回目）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 1.54,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.95,
            rounds: 10,
            balls: 900,
            nextState: "battleMode2",
            tag: "continueBattle",
            resultNote: "バトルMODE",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 900,
            nextState: "lt90Short",
            tag: "toOyakogenka",
            resultNote: "地上最強の親子喧嘩",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "battleFail", resultLabel: "バトルMODE終了" },
    },

    battleMode2: {
      id: "battleMode2",
      label: "バトルMODE（2回目）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 1.54,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.95,
            rounds: 10,
            balls: 900,
            nextState: "battleMode3",
            tag: "continueBattle",
            resultNote: "バトルMODE",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 900,
            nextState: "lt90Short",
            tag: "toOyakogenka",
            resultNote: "地上最強の親子喧嘩",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "battleFail", resultLabel: "バトルMODE終了" },
    },

    battleMode3: {
      id: "battleMode3",
      label: "バトルMODE（3回目）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 1.54,
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
            balls: 900,
            nextState: "lt90Short",
            tag: "toOyakogenka",
            resultNote: "地上最強の親子喧嘩",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "battleFail", resultLabel: "バトルMODE終了" },
    },

    lt90Short: {
      id: "lt90Short",
      label: "史上最強バトルMODE90（時短1回）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 1.54,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.7, rounds: 10, balls: 900, nextState: "lt90Long", tag: "toLong" },
          { weight: 0.3, rounds: 10, balls: 900, nextState: "lt90Short", tag: "toShort" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltEnd", resultLabel: "ラッキートリガー終了" },
    },

    lt90Long: {
      id: "lt90Long",
      label: "史上最強バトルMODE90（時短10000回）",
      mode: "countDown",
      maxAttempts: 10000,
      probability: 1 / 1.54,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.7, rounds: 10, balls: 900, nextState: "lt90Long", tag: "toLong" },
          { weight: 0.3, rounds: 10, balls: 900, nextState: "lt90Short", tag: "toShort" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltEnd", resultLabel: "ラッキートリガー終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 5: 450 },
});
