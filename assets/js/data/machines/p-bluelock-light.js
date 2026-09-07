// 第50号機: Pフィーバーブルーロック Light ver.（2026年 SANKYO パチンコ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_bluelock_light/）。
// e-bluelock-light.js（eフィーバーブルーロック Light ver.）と同時期に導入されたP版
// （型式名・検定番号が別。1geki.jp側もページが別立て）。大当り確率・転落確率・
// 突破率・継続率・出玉振り分けの円グラフ（図柄揃い時・右打ち中）とも、数値を
// 比較したところe版とすべて完全に同一だった。そのためstates以下はe版と
// 同一の実装にしている（詳しい根拠・「エゴストラタイム」未実装の理由・
// 6/7出玉比率についてはe-bluelock-light.jsのコメントを参照）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-bluelock-light",
  slug: "p-bluelock-light",
  name: "Pフィーバーブルーロック Light ver.",
  nameKana: "ぴーふぃーばーぶるーろっくらいとばー",
  aliases: ["Pブルーロックライト", "Pブルーロック120", "Pフィーバーブルーロックライト版", "ブルーロックパチンコ版"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2026,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：1/120.1",
    "右打ち中（頂上決戦・エゴイストBATTLE）の図柄揃い確率：1/39.1",
    "頂上決戦：転落式（転落確率約1/55、突破率約57%）。突破後はエゴイストBATTLEへ",
    "エゴイストBATTLE：転落式（転落確率約1/100、継続率約72%）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約120個でエゴイストBATTLEが約5%、10R・実獲得約600個でエゴイストBATTLEが約1%、3R・実獲得約180個で頂上決戦が約94%",
    "頂上決戦・エゴイストBATTLE共通の当選振り分け（電チュー入賞時）：8R・実獲得約480個が約50%、8R×2・実獲得約960個が約37%、8R×3・実獲得約1440個が約12%、8R×5・実獲得約2400個が約1%（「エゴストラタイム」上乗せは未実装）",
    "頂上決戦・エゴイストBATTLEとも転落を引くと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 120.1,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.05,
            rounds: 2,
            balls: 120,
            nextState: "egoistBattle",
            tag: "toEgoistBattleDirect2R",
            resultNote: "エゴイストBATTLE",
          },
          {
            weight: 0.01,
            rounds: 10,
            balls: 600,
            nextState: "egoistBattle",
            tag: "toEgoistBattleDirect10R",
            resultNote: "エゴイストBATTLE",
          },
          {
            weight: 0.94,
            rounds: 3,
            balls: 180,
            nextState: "choujouKessen",
            tag: "toChoujouKessen",
            resultNote: "頂上決戦",
          },
        ],
      },
      onExhausted: null,
    },

    choujouKessen: {
      id: "choujouKessen",
      label: "頂上決戦",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 39.1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 8, balls: 480, nextState: "egoistBattle", tag: "toEgoistBattle1" },
          {
            weight: 0.37,
            rounds: 8,
            displayRounds: 16,
            balls: 960,
            nextState: "egoistBattle",
            tag: "toEgoistBattle2",
            resultNote: "8R×2",
          },
          {
            weight: 0.12,
            rounds: 8,
            displayRounds: 24,
            balls: 1440,
            nextState: "egoistBattle",
            tag: "toEgoistBattle3",
            resultNote: "8R×3",
          },
          {
            weight: 0.01,
            rounds: 8,
            displayRounds: 40,
            balls: 2400,
            nextState: "egoistBattle",
            tag: "toEgoistBattle5",
            resultNote: "8R×5",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 55,
        nextState: "normal",
        tag: "choujouKessenFall",
        resultLabel: "頂上決戦終了（転落）",
      },
    },

    egoistBattle: {
      id: "egoistBattle",
      label: "エゴイストBATTLE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 39.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 8, balls: 480, nextState: "egoistBattle", tag: "continue1" },
          {
            weight: 0.37,
            rounds: 8,
            displayRounds: 16,
            balls: 960,
            nextState: "egoistBattle",
            tag: "continue2",
            resultNote: "8R×2",
          },
          {
            weight: 0.12,
            rounds: 8,
            displayRounds: 24,
            balls: 1440,
            nextState: "egoistBattle",
            tag: "continue3",
            resultNote: "8R×3",
          },
          {
            weight: 0.01,
            rounds: 8,
            displayRounds: 40,
            balls: 2400,
            nextState: "egoistBattle",
            tag: "continue5",
            resultNote: "8R×5",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 100,
        nextState: "normal",
        tag: "egoistBattleFall",
        resultLabel: "エゴイストBATTLE終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 120, 3: 180, 10: 600, 8: 480 },
});
