// P新世紀エヴァンゲリオン -319 RED-（2026年10月19日導入 ビスティ V-ST機/ミドル）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_eva_319red/）。振り分けとゲーム性は、
// 同ページの3枚の画像（通常時の円グラフ p_eva_319red-gazou3、インパクトモード中の
// 円グラフ p_eva_319red-gazou4、ゲームフロー図 p_eva_319red-gazou223）を
// images.1geki.jpからダウンロードし、Readツールで直接読み取った実数値。
// e新世紀エヴァンゲリオン～はじまりの記憶～（eva17-hajimari.js）を、大当り確率
// 約1/319.7のP機として出し直した機種。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 約1/319.7 ／ 高確率時（ST中） 約1/98.9
//   ST161回（確変は特定ラウンドのV入賞が条件）、ST継続率 約81%（約80.5%＋残保留での
//   引き戻し約1.2%）
//   チャンスタイム 時短100回（高ベース中に特図1で通常当りに当選した場合は500回）
//   出玉 10R=約1500個（実獲得 約1400個） ／ 2R=約300個（実獲得 約280個）
//
// ヘソ入賞時（特図1・通常時）の振り分け（円グラフ gazou3）:
//   ・10R大当り(約1500個)→インパクトモード(ST161回)：約1%
//   ・2R大当り(約300個)→インパクトモード(ST161回)：約64%
//   ・2R大当り(約300個)→チャンスタイム(時短100回)：約35%
// 電チュー入賞時（特図2・右打ち中）の振り分け（円グラフ gazou4）:
//   ・10R大当り(約1500個)→インパクトモード(ST161回)：100%
//
// 【暴走BONUS・暴走モードの扱い（2026-11-02 確認）】
// 2026-10-27の初回チェックでは「暴走BONUS（1・3・5図柄停止）の振り分け率と、暴走モード
// の仕様が本文に無い」としてスキップしていた。今回ゲームフロー図（gazou223）を読み
// 直したところ、通常時の大当り4種（全回転経由・1・3・5図柄停止＝暴走BONUS・奇数図柄
// 揃い・偶数図柄揃い）のうち暴走BONUSは「約300個＋暴走モード」、奇数図柄揃いは
// 「約300個＋インパクトモード」とされ、その行き先が「インパクトモード・暴走モード」
// という1つの枠（ST回数161回・継続率約81%・ALL1500個）として描かれていた。
// つまり暴走モードはインパクトモードと同一スペックのSTの演出違いで、暴走BONUSは
// 円グラフの「2R・約64%→インパクトモード」の内訳の1つにすぎない。よって暴走BONUS
// 単独の振り分け率は不要で、別状態としても実装しない。
//
// 【ST・チャンスタイム消化後の行き先】
// 本文に明記は無いが、数値から確定できる：
//   ・ST継続率: 1-(1-1/98.9)^161 ≈ 80.5% で、公表の「ST継続率約80.5%」と完全に一致する。
//     ST後に時短が付くならこの値より高くなるはずなので、ST消化後は時短なしで通常へ戻る
//   ・チャンスタイム引き戻し: 1-(1-1/319.7)^100 ≈ 26.9% で、公表の「時短100回での引き戻し
//     約26.9%」と一致。消化後は通常へ戻る
//   ・ST突入率: 65% ＋ 35%×26.9% ≈ 74.4%（＋残保留分）で、公表の「約75%」と整合
// チャンスタイム中の当りは右打ち（特図2）なので、gazou4の振り分け（100%で10R→ST）を使う。
//
// 【実装していないもの】
// ・「高ベース中に特図1で通常当りに当選した場合は時短500回」：右打ち中にヘソへ入った
//   玉で当たる例外的なケースのため省略した
// ・「3000BONUS」（ブラックアウト→カヲル登場）：注記に「3000個=1500個×2」とあり、
//   保留連（1500個の当りが続けて2回）の演出なので、通常の連チャンとして自然に再現される
//
// 【出玉は「実獲得個数」を採用】10R→1400個、2R→280個。
// 【spinsPer1000Yen】ボーダーは等価で概ね17〜18回。デカヘソ等の「回る」売りの台では
// ないため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-eva-319red",
  slug: "p-eva-319red",
  name: "P新世紀エヴァンゲリオン -319 RED-",
  nameKana: "ぴーしんせいきえゔぁんげりおんさんいちきゅうれっど",
  aliases: ["エヴァ319RED", "エヴァ レッド", "エヴァ319", "エヴァRED", "エヴァンゲリオン319"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2026,
  releaseDate: "2026-10-19",
  category: "V-ST機（ミドル）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "はじまりの記憶をP機の1/319.7で出し直した一台。初当りの約65%が直接ST161回へ、残り約35%もチャンスタイム100回で引き戻しを狙える。ST中の当りはALL1500個で、継続率約81%の一本道を駆け上がる爽快感が持ち味。暴走BONUSから始まる「暴走モード」はインパクトモードと同じSTの演出違い。",
  rules: [
    "通常時大当り確率：約1/319.7",
    "ST中の大当り確率：約1/98.9",
    "インパクトモード（暴走モードも同スペック）：ST161回、継続率約81%（残保留込み）",
    "チャンスタイム：時短100回（当選確率は通常時と同じ約1/319.7、引き戻し率約26.9%）",
    "ST突入率：約75%（直接突入約65%＋チャンスタイムでの引き戻し）",
    "通常時の振り分け（ヘソ入賞時）：10R・実獲得約1400個でST突入が約1%、2R・実獲得約280個でST突入が約64%（暴走BONUSを含む）、2R・実獲得約280個でチャンスタイムが約35%",
    "右打ち中（ST・チャンスタイム）の振り分け：10R・実獲得約1400個でST突入が100%",
    "ST・チャンスタイムとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.01, rounds: 10, balls: 1400, nextState: "st", tag: "toSt10R", resultNote: "インパクトモード" },
          { weight: 0.64, rounds: 2, balls: 280, nextState: "st", tag: "toSt2R", resultNote: "インパクトモード" },
          { weight: 0.35, rounds: 2, balls: 280, nextState: "chance", tag: "toChance", resultNote: "チャンスタイム" },
        ],
      },
      onExhausted: null,
    },

    st: {
      id: "st",
      label: "インパクトモード",
      mode: "countDown",
      maxAttempts: 161,
      probability: 1 / 98.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "st", tag: "stContinue" }],
      },
      onExhausted: { nextState: "normal", tag: "stEnd", resultLabel: "ST終了" },
    },

    chance: {
      id: "chance",
      label: "チャンスタイム",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 10, balls: 1400, nextState: "st", tag: "chanceToSt", resultNote: "インパクトモード" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceEnd", resultLabel: "チャンスタイム終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
