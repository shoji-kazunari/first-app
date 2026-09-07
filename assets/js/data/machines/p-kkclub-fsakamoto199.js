// 第99号機: Pコマコマ倶楽部with坂本冬美199ver.（2022年 TOYOMARU（豊丸産業） ライトミドル/ST機/遊タイム）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_kkclub_fsakamoto199/）。スペック表・
// 「当選時の振り分け」表（円グラフではなく通常の表組み）に記載の実数値をそのまま使用。
//
// 大当り確率は低確率時1/199.8・高確率時1/49.9。スペシャルチャンス（ST50回+時短50回）
// 突入率100%。当選時の振り分け（ヘソ入賞時・電チュー入賞時で共通）:
//   ・10R確変(約1000個/実獲得900個)→スペシャルチャンスへ：50.0%
//   ・5R確変(約500個/実獲得450個)→スペシャルチャンスへ：25.0%
//   ・3R確変(約300個/実獲得270個)→スペシャルチャンスへ：25.0%
// （スペシャルチャンス継続率約72%は、ST50回・確率1/49.9の継続率約63.6%と、
// ST消化後の時短50回・確率1/199.8の継続率約22.0%を掛け合わせた
// 1-(1-1/49.9)^50×(1-1/199.8)^50≈71.6%とほぼ一致するため、ST50回状態→
// 時短50回状態の2状態を順につなぐ形で再現できる。ともに当選時はスペシャルチャンス
// （ST50回状態）へ戻る）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 5R: 約500個/実獲得450個、3R: 約300個/実獲得270個）。
//
// 【「低確率500回消化で発動、遊タイム759回」は未実装】
// 通常時に一定回数はまらないと電サポ状態が強制発動する救済（遊タイム）が
// あるが、はまり回数のカウントという別軸の状態管理が必要になるため、
// 通常のST機としての挙動のみを実装した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-kkclub-fsakamoto199",
  slug: "p-kkclub-fsakamoto199",
  name: "Pコマコマ倶楽部with坂本冬美199ver.",
  nameKana: "ぴーこまこまくらぶういずさかもとふゆみひゃくきゅうじゅうきゅうばー",
  aliases: ["コマコマ倶楽部パチンコ", "坂本冬美パチンコ", "スペシャルチャンス"],
  manufacturer: { id: "toyomaru", name: "TOYOMARU（豊丸産業）" },
  releaseYear: 2022,
  category: "パチンコ（ライトミドル・ST機・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/199.8",
    "スペシャルチャンス（ST50回）中の当選確率：1/49.9",
    "スペシャルチャンス消化後の時短50回中の当選確率：1/199.8",
    "スペシャルチャンス：ST50回+時短50回、継続率約72%",
    "スペシャルチャンス突入率：100%",
    "大当り振り分け（ヘソ入賞時・電チュー入賞時で共通）：10R・実獲得約900個でスペシャルチャンスへが50.0%、5R・実獲得約450個でスペシャルチャンスへが25.0%、3R・実獲得約270個でスペシャルチャンスへが25.0%",
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
          { weight: 0.5, rounds: 10, balls: 900, nextState: "specialChanceSt", tag: "toRushBig", resultNote: "スペシャルチャンス" },
          { weight: 0.25, rounds: 5, balls: 450, nextState: "specialChanceSt", tag: "toRushMid", resultNote: "スペシャルチャンス" },
          { weight: 0.25, rounds: 3, balls: 270, nextState: "specialChanceSt", tag: "toRushSmall", resultNote: "スペシャルチャンス" },
        ],
      },
      onExhausted: null,
    },

    specialChanceSt: {
      id: "specialChanceSt",
      label: "スペシャルチャンス（ST）",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 49.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "specialChanceSt", tag: "continueBig" },
          { weight: 0.25, rounds: 5, balls: 450, nextState: "specialChanceSt", tag: "continueMid" },
          { weight: 0.25, rounds: 3, balls: 270, nextState: "specialChanceSt", tag: "continueSmall" },
        ],
      },
      onExhausted: { nextState: "specialChanceJitan", tag: "toJitan", resultLabel: "スペシャルチャンス（時短）" },
    },

    specialChanceJitan: {
      id: "specialChanceJitan",
      label: "スペシャルチャンス（時短）",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 199.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "specialChanceSt", tag: "continueBig" },
          { weight: 0.25, rounds: 5, balls: 450, nextState: "specialChanceSt", tag: "continueMid" },
          { weight: 0.25, rounds: 3, balls: 270, nextState: "specialChanceSt", tag: "continueSmall" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "スペシャルチャンス終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 5: 450, 3: 270 },
});
