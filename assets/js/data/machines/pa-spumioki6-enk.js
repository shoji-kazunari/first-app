// 第58号機: PAスーパー海物語IN沖縄6 Withえなこ（2026年 SANYO パチンコ/ST機・甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/pa_spumioki6_enk/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像（通常時・電チュー
// 入賞時・ジンベェタイム中）をダウンロードしてReadツールで直接読み取った実数値。
//
// 【ゲーム構造：電サポ回数の「降格なし」ラチェット】
// 大当たり確率（低確率時）1/99.9、（高確率時）1/9.9。大当たりすると必ず
// 「ST5回＋時短N回」（電サポ合計25回/50回/120回のいずれか）に突入し、
// ST5回は高確率1/9.9、時短N回は低確率1/99.9で抽選する（ST・時短とも当りが
// 出ればさらに次の「ST5回+時短N回」に突入し、両方外れて初めて通常へ戻る）。
// この機種最大の特徴は「大当り継続中は電サポ回数の降格が無い」ことで、
// 一度電サポ50回（またはジンベェタイム＝120回）に到達すると、以後その回転数
// より短い電サポしか付与しない当り（例：本来25回止まりの4R当り）を引いても
// 電サポ回数は下がらず、その時点の到達回数のまま据え置かれる。
// 10R大当りは通常時・電サポ中を問わず必ずジンベェタイム（ST5回+時短115回＝
// 合計120回）に直行する。
//
// ヘソ入賞時（特図1・通常時、低確率1/99.9）の振り分け（円グラフ「通常時」）:
//   ・4R大当り(約400個)→ST5回+時短20回(計25回)：45.0%
//   ・4R大当り(約400個)→ST5回+時短45回(計50回)：4.0%
//   ・6R大当り(約600個)→ST5回+時短45回(計50回)：50.0%
//   ・10R大当り(約1000個)→ジンベェタイム(ST5回+時短115回、計120回)：1.0%
// 電チュー入賞時（特図2、円グラフ「電チュー入賞時」）の振り分け（降格なしのため
// 実際の遷移先は現在の到達回数に依存。詳細は下記states参照）:
//   ・4R大当り(約400個)→ST5回+時短20回 or 45回（降格なし）：30.0%
//   ・4R大当り(約400個)→ST5回+時短45回(計50回)：6.0%
//   ・6R大当り(約600個)→ST5回+時短45回(計50回)：54.0%
//   ・10R大当り(約1000個)→ジンベェタイム(計120回)：10.0%
// ジンベェタイム中（円グラフ「ジンベェタイム中」、降格なしなので必ずジンベェタイム
// 継続）:
//   ・4R大当り(約400個)→ジンベェタイム継続：36.0%（電チュー入賞時の30%+6%を合算。
//     すでにジンベェタイムに到達しているため「20回or45回」の区別が意味を持たず、
//     両方ともジンベェタイム=120回のまま据え置かれる）
//   ・6R大当り(約600個)→ジンベェタイム継続：54.0%
//   ・10R大当り(約1000個)→ジンベェタイム継続：10.0%
//
// 【実装方法：到達回数ごとに別状態を用意】
// stateEngineは状態ごとにしか回転数を管理できず、「これまでの最大到達回数」を
// 状態をまたいで持ち越す仕組みが無い。そのため到達回数（25回/50回/120回）ごとに
// 「ST5回」状態と「時短N回」状態のペアを用意し、電チュー入賞時の30%枠（本来
// 25回止まりの4R当り）は、現在いる状態が25回トラックなら25回トラックへ、
// 50回・ジンベェタイムトラックなら同じトラックへ留まる形で、降格なしの挙動を
// 状態遷移だけで再現した（トラックをまたいで下がる遷移は一切作らない）。
//
// トータル継続率検算: ジンベェタイム(ST5回+時短115回+残保留4個=計119回)の場合、
// 1-(1-1/9.9)^5 + (1-(1-1/9.9)^5を外す確率)×(1-(1-1/99.9)^119)
// ≈0.4059+0.5941×0.6979≈0.8205≈82%となり、公表の「トータル継続期待度は約82%」
// にほぼ一致した（残保留4個をmaxAttemptsに含めるだけで再現できる）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 6R: 約600個/実獲得540個、4R: 約400個/実獲得360個）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-spumioki6-enk",
  slug: "pa-spumioki6-enk",
  name: "PAスーパー海物語IN沖縄6 Withえなこ",
  nameKana: "ぴーえーすーぱーうみものがたりいんおきなわろくうぃずえなこ",
  aliases: ["沖海6", "沖海6えなこ", "スーパー海物語沖縄6", "海物語沖縄6", "PA沖海6"],
  manufacturer: { id: "sanyo", name: "SANYO" },
  releaseYear: 2026,
  category: "パチンコ（ST機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時（低確率）大当たり確率：1/99.9",
    "ST中（高確率）大当たり確率：1/9.9",
    "大当たり後は必ずST5回+時短N回へ突入（電サポ合計25回/50回/120回。10R大当りは必ずジンベェタイム=120回）",
    "電サポ回数は「降格なし」：一度到達した回数より短い電サポしか付与しない当りを引いても回数は下がらない",
    "トータル継続期待度：約82%（ジンベェタイム到達時。ST5回+時短115回+残保留4個の合算）",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約360個で計25回が45.0%、4R・実獲得約360個で計50回が4.0%、6R・実獲得約540個で計50回が50.0%、10R・実獲得約900個でジンベェタイム(計120回)が1.0%",
    "電チュー入賞時の当選振り分け：4R・実獲得約360個（降格なしで現トラック相当）が30.0%、4R・実獲得約360個で計50回が6.0%、6R・実獲得約540個で計50回が54.0%、10R・実獲得約900個でジンベェタイムが10.0%",
    "ST5回・時短N回とも全弾外すと次の段階（ST→時短、時短→通常）へ",
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
            weight: 0.45,
            rounds: 4,
            balls: 360,
            nextState: "st25",
            tag: "toTrack25",
            resultNote: "ST5回+時短20回",
          },
          {
            weight: 0.04,
            rounds: 4,
            balls: 360,
            nextState: "st50",
            tag: "toTrack50From4R",
            resultNote: "ST5回+時短45回",
          },
          {
            weight: 0.5,
            rounds: 6,
            balls: 540,
            nextState: "st50",
            tag: "toTrack50From6R",
            resultNote: "ST5回+時短45回",
          },
          {
            weight: 0.01,
            rounds: 10,
            balls: 900,
            nextState: "stJinbe",
            tag: "toJinbeDirect",
            resultNote: "ジンベェタイム",
          },
        ],
      },
      onExhausted: null,
    },

    st25: {
      id: "st25",
      label: "ST（電サポ計25回コース）",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 9.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 4, balls: 360, nextState: "st25", tag: "stay25" },
          { weight: 0.06, rounds: 4, balls: 360, nextState: "st50", tag: "upgrade50From4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "st50", tag: "upgrade50From6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "toJinbeFrom25" },
        ],
      },
      onExhausted: { nextState: "jitan25", tag: "st25End", resultLabel: "ST終了→時短20回" },
    },

    jitan25: {
      id: "jitan25",
      label: "時短20回（電サポ計25回コース）",
      mode: "countDown",
      maxAttempts: 24,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.3, rounds: 4, balls: 360, nextState: "st25", tag: "jitan25Stay25" },
          { weight: 0.06, rounds: 4, balls: 360, nextState: "st50", tag: "jitan25Upgrade50From4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "st50", tag: "jitan25Upgrade50From6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "jitan25ToJinbe" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitan25End", resultLabel: "時短終了" },
    },

    st50: {
      id: "st50",
      label: "ST（電サポ計50回コース）",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 9.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.36, rounds: 4, balls: 360, nextState: "st50", tag: "stay50From4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "st50", tag: "stay50From6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "toJinbeFrom50" },
        ],
      },
      onExhausted: { nextState: "jitan50", tag: "st50End", resultLabel: "ST終了→時短45回" },
    },

    jitan50: {
      id: "jitan50",
      label: "時短45回（電サポ計50回コース）",
      mode: "countDown",
      maxAttempts: 49,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.36, rounds: 4, balls: 360, nextState: "st50", tag: "jitan50Stay50From4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "st50", tag: "jitan50Stay50From6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "jitan50ToJinbe" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitan50End", resultLabel: "時短終了" },
    },

    stJinbe: {
      id: "stJinbe",
      label: "ST（ジンベェタイム）",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 9.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.36, rounds: 4, balls: 360, nextState: "stJinbe", tag: "jinbeStayFrom4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "stJinbe", tag: "jinbeStayFrom6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "jinbeStayFrom10R" },
        ],
      },
      onExhausted: { nextState: "jitanJinbe", tag: "stJinbeEnd", resultLabel: "ST終了→時短115回" },
    },

    jitanJinbe: {
      id: "jitanJinbe",
      label: "時短115回（ジンベェタイム）",
      mode: "countDown",
      maxAttempts: 119,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.36, rounds: 4, balls: 360, nextState: "stJinbe", tag: "jitanJinbeStayFrom4R" },
          { weight: 0.54, rounds: 6, balls: 540, nextState: "stJinbe", tag: "jitanJinbeStayFrom6R" },
          { weight: 0.1, rounds: 10, balls: 900, nextState: "stJinbe", tag: "jitanJinbeStayFrom10R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanJinbeEnd", resultLabel: "時短終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 4: 360, 6: 540, 10: 900 },
});
