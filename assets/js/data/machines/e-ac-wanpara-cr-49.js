// eACわんわんパラダイスCELEBRATION ちょいパチ（49ver.）（2026年10月5日導入 SANYO ちょいパチ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_ac_wanpara_cr/）。振り分けとゲーム性は、
// 同ページのちょいパチ側の画像4枚（通常時の円グラフ e_AC_wanpara_cr-gazou73、チャレンジ/RUSH/
// SUPER RUSH中の円グラフ gazou74、CELEBRATION中の円グラフ gazou75、ゲームフロー図 gazou72）を
// images.1geki.jpからダウンロードし、Readツールで直接読み取った実数値。
//
// 【デュアルスペックの扱い】
// 実機は「甘デジ（77ver.）とちょいパチ（49ver.）の2in1」。両スペックの数値が別々に
// 公開されているため、2つの機種ページに分けて実装した（甘デジ側は e-ac-wanpara-cr-77.js）。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 約1/49.9 ／ 高確率時（ST中） 約1/25.7
//   出玉 10R=約700個(実獲得約600個) / 6R=約420個(約360個) / 5R=約350個(約300個) /
//        4R=約280個(約240個) / 3R=約210個(約180個)
//   わんわんチャレンジ: 時短30回、突破率約50%
//   わんわんRUSH: ST1回＋時短49回、継続率約67%
//   わんわんCELEBRATION: ST1回＋時短119回、継続率約91%
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou73）:
//   ・4R or 6R or 10R大当り(約280〜約700個)→わんわんRUSH(ST1回+時短49回)：2.0%
//   ・5R大当り(約350個)→わんわんチャレンジ(時短30回)：49.0%
//   ・3R大当り(約210個)→わんわんチャレンジ(時短30回)：49.0%
// 電チュー入賞時（特図2・わんわんチャレンジ/わんわんRUSH/SUPERわんわんRUSH中）（gazou74）:
//   ・4R or 6R or 10R大当り→わんわんCELEBRATION：約1%
//   ・10R→RUSH：9.0% ／ 6R→RUSH：約0.2% ／ 5R→RUSH：44.8% ／ 4R→RUSH：約0.2% ／ 3R→RUSH：44.8%
// 電チュー入賞時（特図2・わんわんCELEBRATION中）（gazou75）:
//   ・10R：10.0% ／ 6R：0.2% ／ 5R：44.8% ／ 4R：0.2% ／ 3R：44.8%（いずれもCELEBRATION継続）
//
// 継続率の検算（ゲームフロー図の注記と照合）:
//   ST1回 1/25.7 ≈ 3.9%（注記「約3.9%」）、時短49回 1-(1-1/49.9)^49 ≈ 62.9%（注記「約62.8%」）、
//   時短119回 1-(1-1/49.9)^119 ≈ 91.0%（注記「約91.0%」の合算値と整合）。
//
// 【仮定を置いた箇所（確証のある数値ではない）】
// 通常時のRUSH直行2.0%と、右打ち中のCELEBRATION突入約1%は、円グラフ上「4R or 6R or 10R大当り」と
// まとめて書かれており、ラウンドごとの内訳が公開されていない。ここは仮に4R・6R・10Rを等分
// （各2.0%÷3、各1%÷3）として実装した。内訳が判明したら差し替えること。
//
// 【実装していないもの】
// ・遊タイム（低確率149回消化でSUPERわんわんRUSH＝時短10000回）: 甘デジ側と同じ理由で省略した
//
// 【出玉は「実獲得個数」を採用】10R→600個、6R→360個、5R→300個、4R→240個、3R→180個。
// 【spinsPer1000Yen】ボーダーは等価で概ね17回前後のため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-ac-wanpara-cr-49",
  slug: "e-ac-wanpara-cr-49",
  name: "eACわんわんパラダイスCELEBRATION ちょいパチ",
  nameKana: "いーえーしーわんわんぱらだいすせれぶれーしょんちょいぱち",
  aliases: ["わんわんパラダイス", "わんパラ", "わんわんパラダイスCELEBRATION", "わんパラちょいパチ", "わんパラ49"],
  manufacturer: { id: "sanyo-bussan", name: "SANYO（三洋物産）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（ちょいパチ・ST機・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "甘デジとちょいパチの2in1台のちょいパチ側。1/49.9の軽い初当りから時短30回の「わんわんチャレンジ」を突破すればRUSHへ。RUSHはST1回＋時短49回、最上位の「わんわんCELEBRATION」は時短119回で継続率約91%と、短いスパンで当りを重ねていける。",
  rules: [
    "通常時大当り確率：約1/49.9",
    "ST中の大当り確率：約1/25.7（時短中は約1/49.9）",
    "わんわんチャレンジ：時短30回、突破率約50%",
    "わんわんRUSH：ST1回＋時短49回、継続率約67%（残保留込み）",
    "わんわんCELEBRATION：ST1回＋時短119回、継続率約91%（残保留込み）",
    "通常時の振り分け（ヘソ入賞時）：4R/6R/10RでRUSH直行が2.0%、5R・実獲得約300個でチャレンジが49.0%、3R・実獲得約180個でチャレンジが49.0%",
    "チャレンジ・RUSH中の振り分け：4R/6R/10RでCELEBRATIONが約1%、10Rが9.0%、6Rが約0.2%、5Rが44.8%、4Rが約0.2%、3Rが44.8%（CELEBRATION以外はRUSH）",
    "CELEBRATION中の振り分け：10Rが10.0%、6Rが0.2%、5Rが44.8%、4Rが0.2%、3Rが44.8%（いずれもCELEBRATION継続）",
    "遊タイム（低確率149回消化で時短10000回）はこのシミュレーターでは未実装",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.02 / 3, rounds: 10, balls: 600, nextState: "rush", tag: "toRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.02 / 3, rounds: 6, balls: 360, nextState: "rush", tag: "toRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.02 / 3, rounds: 4, balls: 240, nextState: "rush", tag: "toRush4R", resultNote: "わんわんRUSH" },
          { weight: 0.49, rounds: 5, balls: 300, nextState: "challenge", tag: "toChallenge5R", resultNote: "わんわんチャレンジ" },
          { weight: 0.49, rounds: 3, balls: 180, nextState: "challenge", tag: "toChallenge3R", resultNote: "わんわんチャレンジ" },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "わんわんチャレンジ",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.01 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "challengeToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "challengeToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "challengeToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.09, rounds: 10, balls: 600, nextState: "rush", tag: "challengeToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 6, balls: 360, nextState: "rush", tag: "challengeToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 5, balls: 300, nextState: "rush", tag: "challengeToRush5R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 4, balls: 240, nextState: "rush", tag: "challengeToRush4R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 3, balls: 180, nextState: "rush", tag: "challengeToRush3R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "チャレンジ失敗" },
    },

    rush: {
      id: "rush",
      label: "わんわんRUSH（ST）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 25.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.01 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "rushToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "rushToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "rushToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.09, rounds: 10, balls: 600, nextState: "rush", tag: "rushToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 6, balls: 360, nextState: "rush", tag: "rushToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 5, balls: 300, nextState: "rush", tag: "rushToRush5R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 4, balls: 240, nextState: "rush", tag: "rushToRush4R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 3, balls: 180, nextState: "rush", tag: "rushToRush3R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "rushJitan", tag: "rushStEnd", resultLabel: "ST終了・時短49回へ" },
    },

    rushJitan: {
      id: "rushJitan",
      label: "わんわんRUSH（時短）",
      mode: "countDown",
      maxAttempts: 49,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.01 / 3, rounds: 10, balls: 600, nextState: "celeb", tag: "rushJitanToCeleb10R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 6, balls: 360, nextState: "celeb", tag: "rushJitanToCeleb6R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.01 / 3, rounds: 4, balls: 240, nextState: "celeb", tag: "rushJitanToCeleb4R", resultNote: "わんわんCELEBRATION" },
          { weight: 0.09, rounds: 10, balls: 600, nextState: "rush", tag: "rushJitanToRush10R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 6, balls: 360, nextState: "rush", tag: "rushJitanToRush6R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 5, balls: 300, nextState: "rush", tag: "rushJitanToRush5R", resultNote: "わんわんRUSH" },
          { weight: 0.002, rounds: 4, balls: 240, nextState: "rush", tag: "rushJitanToRush4R", resultNote: "わんわんRUSH" },
          { weight: 0.448, rounds: 3, balls: 180, nextState: "rush", tag: "rushJitanToRush3R", resultNote: "わんわんRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },

    celeb: {
      id: "celeb",
      label: "わんわんCELEBRATION（ST）",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 25.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.1, rounds: 10, balls: 600, nextState: "celeb", tag: "celebCeleb10R" },
          { weight: 0.002, rounds: 6, balls: 360, nextState: "celeb", tag: "celebCeleb6R" },
          { weight: 0.448, rounds: 5, balls: 300, nextState: "celeb", tag: "celebCeleb5R" },
          { weight: 0.002, rounds: 4, balls: 240, nextState: "celeb", tag: "celebCeleb4R" },
          { weight: 0.448, rounds: 3, balls: 180, nextState: "celeb", tag: "celebCeleb3R" },
        ],
      },
      onExhausted: { nextState: "celebJitan", tag: "celebStEnd", resultLabel: "ST終了・時短119回へ" },
    },

    celebJitan: {
      id: "celebJitan",
      label: "わんわんCELEBRATION（時短）",
      mode: "countDown",
      maxAttempts: 119,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.1, rounds: 10, balls: 600, nextState: "celeb", tag: "celebJitanCeleb10R" },
          { weight: 0.002, rounds: 6, balls: 360, nextState: "celeb", tag: "celebJitanCeleb6R" },
          { weight: 0.448, rounds: 5, balls: 300, nextState: "celeb", tag: "celebJitanCeleb5R" },
          { weight: 0.002, rounds: 4, balls: 240, nextState: "celeb", tag: "celebJitanCeleb4R" },
          { weight: 0.448, rounds: 3, balls: 180, nextState: "celeb", tag: "celebJitanCeleb3R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "celebEnd", resultLabel: "CELEBRATION終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 600, 6: 360, 5: 300, 4: 240, 3: 180 },
});
