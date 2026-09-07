// 第49号機: eフィーバーブルーロック Light ver.（2026年 SANKYO スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_bluelock_light/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像（図柄揃い時・右打ち中）を
// ダウンロードしてReadツールで直接読み取った実数値。既存のe-bluelock.js（無印）とは
// 型式名・検定番号とも別のライト版のため、別ファイルとして追加した。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率1/120.1）の振り分け:
//   ・2R大当り(約140個)→エゴイストBATTLE(転落式)：約5%
//   ・10R大当り(約700個)→エゴイストBATTLE(転落式)：約1%
//   ・3R大当り(約210個)→頂上決戦(転落式)：約94%
//
// 【頂上決戦・エゴイストBATTLEは転落式（onFall）で実装】
// スペック表に「図柄揃い確率（右打ち中）：1/39.1」「頂上決戦突破率：約57%
// （※3 普電ショート開放[発生率約1/55]当選で終了）」「エゴイストBATTLE継続率：
// 約72%（※5 普電ショート開放[発生率約1/100]当選で終了）」とあり、頂上決戦・
// エゴイストBATTLEとも規定回数ではなく「図柄揃い(1/39.1) or 普電ショート開放
// (転落)を引くまで」の転落式であることが分かる。
// 検算: 頂上決戦 (1/39.1)/((1/39.1)+(1/55))≈58.4%（公表約57%とほぼ一致）、
// エゴイストBATTLE (1/39.1)/((1/39.1)+(1/100))≈71.9%（公表約72%とほぼ一致）。
// いずれも残保留等の引き戻しは無く、素の転落確率のみで再現できる。
//
// 【頂上決戦とエゴイストBATTLEの当り振り分けは共通】
// 「右打ち中の大当たり時の出玉振り分け確率」円グラフは、頂上決戦・エゴイスト
// BATTLEの区別なく「右打ち中（電チュー入賞、特図2）」として1枚にまとまっており、
// 全ての出目が「エゴイストBATTLE 実質次回まで」となっている。つまり頂上決戦での
// 図柄揃い（突破）も、エゴイストBATTLE中の継続当りも、同じ振り分けテーブルを
// 使ってエゴイストBATTLEへ入る/留まる構造と判断し、両状態のonHit.outcomesを
// 共通にした。
//   ・8R大当り(約560個)→エゴイストBATTLE：約50%
//   ・8R大当り×2(約1120個)→エゴイストBATTLE：約37%
//   ・8R大当り×3(約1680個)→エゴイストBATTLE：約12%
//   ・8R大当り×5(約2800個)→エゴイストBATTLE：約1%
//
// 【「エゴストラタイム」上乗せを実装していない理由】
// 個別ページには、8R×5(約2800個)の大当たり消化後に「エゴストラタイム」という
// 追加の上乗せモードへ突入し得る（「継続するパターンも存在する」）との記載が
// あるが、突入率・継続率とも数値の記載が無い。推測で埋められないため、
// 8R×5の枠は+αを含めない約2800個（実獲得約2400個）の固定値として実装した
// （実際の期待出玉より控えめに出る）。
//
// 【出玉比率について（この機種は6/7）】
// 他の多くの機種は実獲得個数が払い出し個数の14/15だが、本機は独自の6/7比率
// （10R:約700個/実獲得600個、8R:約560個/実獲得480個、3R:約210個/実獲得180個、
// 2R:約140個/実獲得120個）。スペック表に明記されている実獲得個数をそのまま
// 採用した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-bluelock-light",
  slug: "e-bluelock-light",
  name: "eフィーバーブルーロック Light ver.",
  nameKana: "いーふぃーばーぶるーろっくらいとばー",
  aliases: ["ブルーロックライト", "ブルーロック120", "eブルーロックLight", "eフィーバーブルーロックライト版"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時図柄揃い確率：1/120.1",
    "右打ち中（頂上決戦・エゴイストBATTLE）の図柄揃い確率：1/39.1",
    "頂上決戦：転落式（転落確率約1/55、突破率約57%）。突破後はエゴイストBATTLEへ",
    "エゴイストBATTLE：転落式（転落確率約1/100、継続率約72%）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約120個でエゴイストBATTLEが約5%、10R・実獲得約600個でエゴイストBATTLEが約1%、3R・実獲得約180個で頂上決戦が約94%",
    "頂上決戦・エゴイストBATTLE共通の当選振り分け（電チュー入賞時）：8R・実獲得約480個が約50%、8R×2・実獲得約960個が約37%、8R×3・実獲得約1440個が約12%、8R×5・実獲得約2400個が約1%（「エゴストラタイム」上乗せは未実装。詳細はコメント）",
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
