// 第38号機: Pうしおととら～神のせSPEC～100ver.（2026年9月7日導入予定 D-light スマパチ/甘デジ）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_ushitora_kaminose100/）。導入開始日
// 2026年9月7日の新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため
// 先取りで追加した。大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像
// （通常時・真うしとらRUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/100）の振り分け:
//   ・3R大当り(約300個)→通常（時短なし）：32.0%
//   ・3R大当り(約300個)→真うしとらRUSH(ST70回)：68.0%
// （RUSH突入率68%と一致。真うしとらRUSHは規定回数消化型で、素の計算
// 1-(1-1/100)^70≈50.5%は公表の「継続率約51%」とほぼ一致しており、大きな
// 引き戻しギャップは無い）
//
// 電チュー入賞時（特図2・真うしとらRUSH中、当選確率1/100）の振り分け:
//   ・10R大当り(約1000個)→継続：50.0%
//   ・10R×2以上大当り(約2000個以上、「二体で最強BONUS」)→継続：50.0%
// 「二体で最強BONUS」は「約2000個以上（10R×2以上）」～「最大約5000個+α
// （10R×5+α）」という幅のみが公開されており、10R×2/3/4/5各段の個別の
// 振り分け（重み）は1geki.jpに数値の記載が無い。そのため保守的に範囲内の
// 最小値である10R×2(約2000個)を代表値として採用した（実際の期待値はこれより
// 高くなる可能性がある）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 3R: 約300個/実獲得270個、比率9/10）。「二体で最強BONUS」の代表値
// 2000個にも同じ比率を適用した（2000→1800）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-ushitora-kaminose100",
  slug: "p-ushitora-kaminose100",
  name: "Pうしおととら～神のせSPEC～100ver.",
  nameKana: "ぴーうしおととらかみのせすぺっくひゃくばー",
  aliases: ["うしおととら", "うしとら100", "うしおととら100ver.", "神のせSPEC"],
  manufacturer: { id: "d-light", name: "D-light" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：1/100",
    "真うしとらRUSH中の当選確率：1/100",
    "真うしとらRUSH：ST70回、継続率約51%",
    "RUSH突入率：68%",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約270個で通常のままが32.0%、3R・実獲得約270個で真うしとらRUSHが68.0%",
    "真うしとらRUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約900個で継続が50.0%、二体で最強BONUS（10R×2以上・実獲得約1800個以上）で継続が50.0%",
    "真うしとらRUSHは規定回数（70回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 100,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.32, rounds: 3, balls: 270, nextState: "normal", tag: "toNormal" },
          { weight: 0.68, rounds: 3, balls: 270, nextState: "rush", tag: "toRush" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "真うしとらRUSH",
      mode: "countDown",
      maxAttempts: 70,
      probability: 1 / 100,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 900, nextState: "rush", tag: "rushContinue1000" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 1800,
            nextState: "rush",
            tag: "rushContinueBonus",
            resultNote: "二体で最強BONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "真うしとらRUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 270, 10: 900 },
});
