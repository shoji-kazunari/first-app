// 第35号機: PA大海物語Withアグネス・ラム Premium Edition
// （2026年9月7日導入予定 SANYO ST機/甘デジ/確変ループ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/pa_oumi_agnspe/）。導入開始日2026年9月7日の
// 新台で、導入前だが1geki.jpにスペック・振り分け割合とも掲載済みのため先取りで追加した。
// 円グラフではなく本文とスペック表・大当たり詳細表に数値がそのまま明記されている。
//
// 【ゲーム構造】海物語シリーズ共通の「確変ループ」型。大当たり確率（低確率時）
// 約1/99.9で当選すると、必ず「ST10回＋時短N回」（合計は当選図柄で25/50/100回の
// いずれか）に突入する。ST10回は大当たり確率約1/19.5、後半の時短N回は
// 低確率時と同じ約1/99.9（電サポは付くが確率自体は上がらない）。ST・時短中に
// 再度当選すれば、また新たに「ST10回＋時短N回」へ突入する（転落や消化しきりでの
// 特別扱いは無い、素直なループ構造）。
//
// ヘソ・電チュー入賞共通の大当たり振り分け（本文より）:
//   ・約4%：GREAT LUCKY MAX（10R・約1080個）→ST+時短90回（合計100回）
//   ・約60%：SUPER LUCKY（6R・約648個）→ST+時短40回（合計50回）
//   ・約36%：LUCKY（4R・約432個）→ST+時短15回（合計25回）
// （スペック表の「時短・電サポ 25回or50回or100回」は、ST10回を含めた合計値
// （10+15=25、10+40=50、10+90=100）で、当選契機ごとに一意に決まる）
//
// 【LUCKY(4R)の移行先表記についての注記】
// 大当たり詳細表には「消化後の移行先：ST+時短50回or15回へ」（本文側の説明文では
// 「ST+時短40回or15回へ突入する」）と、50/40/15が入り乱れた表記揺れがある。
// スペック表の合計値リスト（25/50/100の3種のみ）と、GREAT LUCKY MAX→90、
// SUPER LUCKY→40が確定していることから、残るLUCKYの行き先は消去法で
// 「時短15回（合計25回）」の一択と判断した（50・40はそれぞれ他の当選契機の値の
// 誤記・混入と判断）。
//
// 【プレミアム遊タイム（低確率239回消化で発動、時短10000回）は実装していない】
// 通常時・時短中を横断して「低確率で消化した回転数」を239回まで積算し続ける
// 天井（テンジョウ）機能。このシミュレーターのstateEngineは状態ごとに
// 消化回数を管理しており、通常→ST→時短→通常…と状態をまたいで回転数を
// 積算し続ける仕組みを持たないため実装していない（低確率1/99.9を239回
// 消化する前に当たる確率は約91%で、遊タイムが発動するのは主に大きく
// ハマった場合の下振れケースに限られる）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1080個/実獲得990個、
// 6R: 約648個/実獲得594個、4R: 約432個/実獲得396個、比率いずれも約11/12）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-oumi-agnes-premium",
  slug: "pa-oumi-agnes-premium",
  name: "PA大海物語Withアグネス・ラム Premium Edition",
  nameKana: "ぴーえーおおうみものがたりうぃずあぐねすらむぷれみあむえでぃしょん",
  aliases: ["大海物語アグネス", "アグネスラム大海物語", "大海アグネス", "PA大海物語アグネス", "大海物語アグネスラム"],
  manufacturer: { id: "sanyo", name: "SANYO" },
  releaseYear: 2026,
  category: "ST機（甘デジ・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時（低確率）大当たり確率：約1/99.9",
    "ST中の大当たり確率：約1/19.5、時短中の大当たり確率：約1/99.9（確率は上がらず電サポのみ）",
    "大当たり後は必ずST10回＋時短N回へ突入（当選図柄でN=15/40/90が決まる）",
    "通常時・ST中・時短中いずれの当選振り分けも共通：約4%でGREAT LUCKY MAX(10R・実獲得約990個)→ST+時短90回、約60%でSUPER LUCKY(6R・実獲得約594個)→ST+時短40回、約36%でLUCKY(4R・実獲得約396個)→ST+時短15回",
    "ST10回・時短N回とも全弾外すと次の段階（ST→時短、時短→通常）へ",
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
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "toGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "toSuper",
            resultNote: "SUPER LUCKY",
          },
          { weight: 0.36, rounds: 4, balls: 396, nextState: "stLucky", tag: "toLucky", resultNote: "LUCKY" },
        ],
      },
      onExhausted: null,
    },

    stGreat: {
      id: "stGreat",
      label: "ST（GREAT LUCKY MAX後）",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 19.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "stGreatToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "stGreatToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "stGreatToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "jitanGreat", tag: "stGreatEnd", resultLabel: "ST終了→時短90回" },
    },

    jitanGreat: {
      id: "jitanGreat",
      label: "時短90回（GREAT LUCKY MAX後）",
      mode: "countDown",
      maxAttempts: 90,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "jitanGreatToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "jitanGreatToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "jitanGreatToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanGreatEnd", resultLabel: "時短終了" },
    },

    stSuper: {
      id: "stSuper",
      label: "ST（SUPER LUCKY後）",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 19.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "stSuperToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "stSuperToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "stSuperToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "jitanSuper", tag: "stSuperEnd", resultLabel: "ST終了→時短40回" },
    },

    jitanSuper: {
      id: "jitanSuper",
      label: "時短40回（SUPER LUCKY後）",
      mode: "countDown",
      maxAttempts: 40,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "jitanSuperToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "jitanSuperToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "jitanSuperToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanSuperEnd", resultLabel: "時短終了" },
    },

    stLucky: {
      id: "stLucky",
      label: "ST（LUCKY後）",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 19.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "stLuckyToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "stLuckyToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "stLuckyToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "jitanLucky", tag: "stLuckyEnd", resultLabel: "ST終了→時短15回" },
    },

    jitanLucky: {
      id: "jitanLucky",
      label: "時短15回（LUCKY後）",
      mode: "countDown",
      maxAttempts: 15,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.04,
            rounds: 10,
            balls: 990,
            nextState: "stGreat",
            tag: "jitanLuckyToGreat",
            resultNote: "GREAT LUCKY MAX",
          },
          {
            weight: 0.6,
            rounds: 6,
            balls: 594,
            nextState: "stSuper",
            tag: "jitanLuckyToSuper",
            resultNote: "SUPER LUCKY",
          },
          {
            weight: 0.36,
            rounds: 4,
            balls: 396,
            nextState: "stLucky",
            tag: "jitanLuckyToLucky",
            resultNote: "LUCKY",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanLuckyEnd", resultLabel: "時短終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 4: 396, 6: 594, 10: 990 },
});
