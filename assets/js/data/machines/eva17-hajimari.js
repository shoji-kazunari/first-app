// 第2号機: eパチンコ 新世紀エヴァンゲリオン〜はじまりの記憶〜（2025年 ビスティ スマパチ/ST機）
//
// 「新機種はデータだけを追加すればよい」設計の実証として作成。
// 実機の確率・回転数・出玉（1/399.9、1/99.6、ST157回転、時短100回転、
// ラウンド構成2/8/10R、出玉300/1500/2400/4800個、LT突入率約61.4%）は
// 公開スペック情報どおりだが、「大当たりがどの割合でどのラウンド/遷移先に
// 振り分けられるか」という詳細な内訳表は公開情報に見当たらなかったため、
// 実機の合算値（LT突入率・継続率など）と矛盾しない範囲でこのファイル内で
// 仮の重み付けをしている（rulesには実機で確認できる数値のみを表示し、
// 仮の内訳は表示していない）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "eva17-hajimari",
  slug: "eva17-hajimari",
  name: "eパチンコ 新世紀エヴァンゲリオン〜はじまりの記憶〜",
  nameKana: "いーぱちんこしんせいきえゔぁんげりおんはじまりのきおく",
  aliases: ["エヴァ17", "エヴァンゲリオン17", "はじまりの記憶", "エヴァはじまりの記憶", "エヴァ最新台"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2025,
  category: "スマパチ（ST機/ラッキートリガー）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/399.9",
    "ST（IMPACT MODE）中大当たり確率：約1/99.6",
    "ST：157回転（1回でも当選すれば再びST継続）",
    "時短（チャンスタイム）：100回転（大当たり確率は通常時と同じ約1/399.9）",
    "初当たりは「時短（チャンスタイム）」または「ST直行」のいずれかへ",
    "ST中はラッキートリガー（LT）成立でより有利な当選が期待できる（LT成立時の合算突入率：約61.4%）",
    "STを全弾外すと時短（チャンスタイム）へ引き戻し、時短も全弾外すと通常へ",
    "ラウンド構成：2R／8R／10R×10カウント",
    "大当たり出玉目安：約300／1500／2400／4800個（獲得ラウンド・当選内容により変動）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.495, rounds: 2, balls: 300, nextState: "chanceTime", tag: "toChanceTime" },
          { weight: 0.35, rounds: 8, balls: 1500, nextState: "st", tag: "toStDirect8" },
          { weight: 0.13, rounds: 10, balls: 2400, nextState: "st", tag: "toStDirect10" },
          {
            weight: 0.025,
            rounds: 10,
            balls: 4800,
            nextState: "st",
            tag: "toStDirectMega",
            resultNote: "特別大当たり",
          },
        ],
      },
      onExhausted: null,
    },

    chanceTime: {
      id: "chanceTime",
      label: "時短（チャンスタイム）",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.6, rounds: 8, balls: 1500, nextState: "st", tag: "chanceToSt8" },
          { weight: 0.3, rounds: 10, balls: 2400, nextState: "st", tag: "chanceToSt10" },
          {
            weight: 0.1,
            rounds: 10,
            balls: 4800,
            nextState: "st",
            tag: "chanceToStMega",
            resultNote: "特別大当たり",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceTimeEnd", resultLabel: "時短終了" },
    },

    st: {
      id: "st",
      label: "ST（IMPACT MODE）",
      mode: "countDown",
      maxAttempts: 157,
      probability: 1 / 99.6,
      actionLabel: "JUDGEMENT",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.614,
            rounds: 10,
            balls: 4800,
            nextState: "st",
            tag: "ltEntry",
            resultNote: "LT突入",
          },
          { weight: 0.386, rounds: 8, balls: 1500, nextState: "st", tag: "stContinue" },
        ],
      },
      onExhausted: { nextState: "chanceTime", tag: "stEnd", resultLabel: "ST終了（時短引き戻し）" },
    },
  },

  distributionTables: {},

  // 10Rには通常大当たり(2400個)と特別大当たり(4800個)の2種類があるため、
  // ここには代表値のみ置き、実際の出玉は各onHit.outcomesのballsで上書きする。
  payoutTable: { 2: 300, 8: 1500, 10: 2400 },
});
