// eACわんわんパラダイスCELEBRATION 甘デジ（77ver.）（2026年10月5日導入 SANYO 甘デジ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_ac_wanpara_cr/）。振り分けとゲーム性は、
// 同ページの甘デジ側の画像4枚（通常時の円グラフ e_AC_wanpara_cr-gazou2、チャレンジ/RUSH/
// SUPER RUSH中の円グラフ gazou3、CELEBRATION中の円グラフ gazou4、ゲームフロー図 gazou71）を
// images.1geki.jpからダウンロードし、Readツールで直接読み取った実数値。
//
// 【デュアルスペックの扱い】
// 実機は「甘デジ（77ver.）とちょいパチ（49ver.）の2in1」で、1geki.jpにも両スペックの
// スペック表・円グラフ・ゲームフロー図が別々に載っている。このシミュレーターでは
// 2つの機種ページに分けて実装した（ちょいパチ側は e-ac-wanpara-cr-49.js）。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 約1/77.7 ／ 高確率時（ST中） 約1/39.9
//   出玉 10R=約700個(実獲得約600個) / 6R=約420個(約360個) / 4R=約280個(約240個)
//   わんわんチャレンジ: 時短50回、突破率約50%
//   わんわんRUSH: ST30回＋時短20回、継続率約66%
//   わんわんCELEBRATION: ST30回＋時短90回、継続率約85%
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou2）:
//   ・10R大当り(約700個)→わんわんRUSH(ST30回+時短20回)：3.0%
//   ・6R大当り(約420個)→わんわんチャレンジ(時短50回)：48.5%
//   ・4R大当り(約280個)→わんわんチャレンジ(時短50回)：48.5%
// 電チュー入賞時（特図2・わんわんチャレンジ/わんわんRUSH/SUPERわんわんRUSH中）（gazou3）:
//   ・4R or 6R or 10R大当り(約280〜約700個)→わんわんCELEBRATION：2.8%
//   ・10R大当り(約700個)→わんわんRUSH：18.0%
//   ・6R大当り(約420個)→わんわんRUSH：39.6%
//   ・4R大当り(約280個)→わんわんRUSH：39.6%
// 電チュー入賞時（特図2・わんわんCELEBRATION中）（gazou4）:
//   ・10R：20.0% ／ 6R：40.0% ／ 4R：40.0%（いずれもCELEBRATION継続）
//
// 継続率の検算（ゲームフロー図の注記と照合）:
//   ST30回 1-(1-1/39.9)^30 ≈ 53.3%（注記「約53.2%」）、時短20回 1-(1-1/77.7)^20 ≈ 22.8%
//   （注記「約22.8%」）、時短90回 1-(1-1/77.7)^90 ≈ 68.8%（注記「約68.8%」）。いずれも
//   規定回数どおりの単純なcountDownで再現できる（残保留での引き戻し分は含まない）。
//
// 【仮定を置いた箇所（確証のある数値ではない）】
// 右打ち中のCELEBRATION突入2.8%は円グラフ上「4R or 6R or 10R大当り（約280〜約700個）」と
// まとめて書かれており、ラウンドごとの内訳が公開されていない。ここは仮に4R・6R・10Rを
// 等分（各2.8%÷3）として実装した。出玉の期待値への影響は1回の当りあたり数十個程度と小さいが、
// 内訳が判明したら差し替えること。
//
// 【実装していないもの】
// ・遊タイム（低確率149回消化でSUPERわんわんRUSH＝時短10000回）: 状態をまたいで低確率の
//   回転数を積算する仕組みがstateEngineに無いため、pa-oumi-agnes-premium.js等と同じく
//   省略した。SUPERわんわんRUSH中の当りの振り分け自体はgazou3に含まれている
//
// 【出玉は「実獲得個数」を採用】10R→600個、6R→360個、4R→240個。
// 【spinsPer1000Yen】ボーダーは等価で概ね16回前後のため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-ac-wanpara-cr-77",
  slug: "e-ac-wanpara-cr-77",
  name: "eACわんわんパラダイスCELEBRATION 甘デジ",
  nameKana: "いーえーしーわんわんぱらだいすせれぶれーしょんあまでじ",
  aliases: ["わんわんパラダイス", "わんパラ", "わんわんパラダイスCELEBRATION", "わんパラ甘デジ", "わんパラ77"],
  manufacturer: { id: "sanyo-bussan", name: "SANYO（三洋物産）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（甘デジ・ST機・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "甘デジとちょいパチの2in1台の甘デジ側。初当りの97%が時短50回の「わんわんチャレンジ」で、突破すればST30回＋時短20回の「わんわんRUSH」。RUSH中の2.8%で引ける最上位「わんわんCELEBRATION」は時短が90回まで伸び、継続率約85%と一気に化ける。",
  rules: [
    "通常時大当り確率：約1/77.7",
    "ST中の大当り確率：約1/39.9（時短中は約1/77.7）",
    "わんわんチャレンジ：時短50回、突破率約50%",
    "わんわんRUSH：ST30回＋時短20回、継続率約66%（残保留込み）",
    "わんわんCELEBRATION：ST30回＋時短90回、継続率約85%（残保留込み）",
    "通常時の振り分け（ヘソ入賞時）：10R・実獲得約600個でRUSH直行が3.0%、6R・実獲得約360個でチャレンジが48.5%、4R・実獲得約240個でチャレンジが48.5%",
    "チャレンジ・RUSH中の振り分け：4R/6R/10RでCELEBRATIONが2.8%、10RでRUSHが18.0%、6RでRUSHが39.6%、4RでRUSHが39.6%",
    "CELEBRATION中の振り分け：10Rが20.0%、6Rが40.0%、4Rが40.0%（いずれもCELEBRATION継続）",
    "遊タイム（低確率149回消化で時短10000回）はこのシミュレーターでは未実装",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 77.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.03, rounds: 10, balls: 600, nextState: "rush", tag: "toRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.485, rounds: 6, balls: 360, nextState: "challenge", tag: "toChallenge6R", resultNote: "わんわんチャレンジ" },
          { weight: 0.485, rounds: 4, balls: 240, nextState: "challenge", tag: "toChallenge4R", resultNote: "わんわんチャレンジ" },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "わんわんチャレンジ",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 77.7,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.028 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "challengeToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "challengeToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "challengeToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.18, rounds: 10, balls: 600, nextState: "rush", tag: "challengeToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 6, balls: 360, nextState: "rush", tag: "challengeToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 4, balls: 240, nextState: "rush", tag: "challengeToRush4R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "チャレンジ失敗" },
    },

    rush: {
      id: "rush",
      label: "わんわんRUSH（ST）",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 39.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.028 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "rushToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "rushToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "rushToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.18, rounds: 10, balls: 600, nextState: "rush", tag: "rushToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 6, balls: 360, nextState: "rush", tag: "rushToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 4, balls: 240, nextState: "rush", tag: "rushToRush4R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "rushJitan", tag: "rushStEnd", resultLabel: "ST終了・時短20回へ" },
    },

    rushJitan: {
      id: "rushJitan",
      label: "わんわんRUSH（時短）",
      mode: "countDown",
      maxAttempts: 20,
      probability: 1 / 77.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.028 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "rushJitanToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "rushJitanToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.028 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "rushJitanToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.18, rounds: 10, balls: 600, nextState: "rush", tag: "rushJitanToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 6, balls: 360, nextState: "rush", tag: "rushJitanToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.396, rounds: 4, balls: 240, nextState: "rush", tag: "rushJitanToRush4R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },

    celeb: {
      id: "celeb",
      label: "わんわんCELEBRATION（ST）",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 39.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 10, balls: 600, nextState: "celeb", tag: "celebCeleb10R" },
          { weight: 0.4, rounds: 6, balls: 360, nextState: "celeb", tag: "celebCeleb6R" },
          { weight: 0.4, rounds: 4, balls: 240, nextState: "celeb", tag: "celebCeleb4R" },
        ],
      },
      onExhausted: { nextState: "celebJitan", tag: "celebStEnd", resultLabel: "ST終了・時短90回へ" },
    },

    celebJitan: {
      id: "celebJitan",
      label: "わんわんCELEBRATION（時短）",
      mode: "countDown",
      maxAttempts: 90,
      probability: 1 / 77.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.2, rounds: 10, balls: 600, nextState: "celeb", tag: "celebJitanCeleb10R" },
          { weight: 0.4, rounds: 6, balls: 360, nextState: "celeb", tag: "celebJitanCeleb6R" },
          { weight: 0.4, rounds: 4, balls: 240, nextState: "celeb", tag: "celebJitanCeleb4R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "celebEnd", resultLabel: "CELEBRATION終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 600, 6: 360, 4: 240 },
});
