// 第34号機: e シン・ウルトラマン 79ver.（2026年9月7日導入予定 OK!! スマパチ/甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_shin_ultraman79/）。導入開始日2026年9月7日の
// 新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため先取りで追加した。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// 右打ち中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/79.9）の振り分け:
//   ・5R大当り(約500個)→ウルトラバトルモード(時短1回)：100%
// 電チュー入賞時（特図2・右打ち中）の振り分け（ウルトラバトルモード・
// ゼットンATTACKで共通の表として実装）:
//   ・3R大当り(約300個)→ゼットンATTACK(時短1回)：70.0%
//   ・10R大当り(約1000個)→ゼットンATTACK(時短1回)：30.0%
//
// ウルトラバトルモード・ゼットンATTACKはいずれも「時短1回」の一発勝負の
// 状態（mode:countDown, maxAttempts:1）。
// ウルトラバトルモードの当選確率は約1/3.1で、素の計算1/3.1≈32.3%は公表の
// 「ウルトラバトルモード突破率約33%」とほぼ一致する。
// ゼットンATTACKの当選確率は約1/1.3で、素の計算1/1.3≈76.9%は公表の
// 「ゼットンATTACK継続率約80%」に近い（差は小さく、大きな引き戻し等は
// 見られない）。
// ゼットンATTACKが当選した場合の振り分け表は1geki.jpに個別掲載が無いため、
// 「右打ち中」円グラフ（ウルトラバトルモード当選時の表、目的地は常に
// ゼットンATTACK）と同じ表を使い、当選時は自身（ゼットンATTACK、時短1回に
// リセット）へ戻る形で実装した。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 5R: 約500個/実獲得450個、3R: 約300個/実獲得270個、比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-shin-ultraman79",
  slug: "e-shin-ultraman79",
  name: "e シン・ウルトラマン 79ver.",
  nameKana: "いーしんうるとらまんななじゅうきゅうばー",
  aliases: ["シン・ウルトラマン79", "シンウルトラマン79ver.", "eシンウルトラマン", "ウルトラマン79"],
  manufacturer: { id: "ok", name: "OK!!" },
  releaseYear: 2026,
  category: "スマパチ（一種二種混合機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/79.9",
    "ウルトラバトルモード中の当選確率：約1/3.1（時短1回、突破率約33%）",
    "ゼットンATTACK中の当選確率：約1/1.3（時短1回、継続率約80%）",
    "ウルトラバトルモード突入率：100%（初当り時は必ず突入）",
    "通常時の大当り振り分け（ヘソ入賞時）：5R・実獲得約450個で必ずウルトラバトルモード(時短1回)へ",
    "ウルトラバトルモード・ゼットンATTACK中の当選振り分け（電チュー入賞時、共通）：3R・実獲得約270個でゼットンATTACKへが70.0%、10R・実獲得約900個でゼットンATTACKへが30.0%",
    "ウルトラバトルモード・ゼットンATTACKとも時短1回を外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 79.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 5,
            balls: 450,
            nextState: "ultraBattleMode",
            tag: "toUltraBattleMode",
            resultNote: "ウルトラバトルモード",
          },
        ],
      },
      onExhausted: null,
    },

    ultraBattleMode: {
      id: "ultraBattleMode",
      label: "ウルトラバトルモード",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 3.1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.7,
            rounds: 3,
            balls: 270,
            nextState: "zettonAttack",
            tag: "toZetton300",
            resultNote: "ゼットンATTACK",
          },
          {
            weight: 0.3,
            rounds: 10,
            balls: 900,
            nextState: "zettonAttack",
            tag: "toZetton1000",
            resultNote: "ゼットンATTACK",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ultraBattleModeEnd", resultLabel: "ウルトラバトルモード終了" },
    },

    zettonAttack: {
      id: "zettonAttack",
      label: "ゼットンATTACK",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 1.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.7, rounds: 3, balls: 270, nextState: "zettonAttack", tag: "zettonContinue300" },
          { weight: 0.3, rounds: 10, balls: 900, nextState: "zettonAttack", tag: "zettonContinue1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "zettonAttackEnd", resultLabel: "ゼットンATTACK終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 270, 5: 450, 10: 900 },
});
