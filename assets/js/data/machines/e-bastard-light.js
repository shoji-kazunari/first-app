// eフィーバーBASTARD!! -暗黒の破壊神- Light ver.
// （2026年12月7日導入 SANKYO スマパチ/甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_bastard_light/、最終更新日2026年11月19日）。
// 型式名 eAフィーバーバスタードY（検定番号6P0101）。スペック表と大当たり詳細はWebFetchで
// 本文から取得し、振り分けは同ページの円グラフ画像4枚（e_bastard_light_en1/en2/en3/en5）と
// ゲームフロー図（e_bastard_light_gameflow）を images.1geki.jp からダウンロードし、
// Readツールで直接読み取った。
//
// 基本スペック（本文のスペック表）:
//   図柄揃い確率 通常時 約1/99.9 ／ 右打ち中 約1/10.7（特図2に限る・大当り小当り合算）
//   RUSH突入率 100%
//   バスタードRUSH: ST6回+残保留4個、継続率約63%
//     （注記: 時短6回継続率約45%、残保留4個継続率約33%、トータル約63%）
//   超バスタードRUSH: ST10回+残保留4個、継続率約75%
//     （注記: 時短10回継続率約63%、残保留4個継続率約33%、トータル約75%）
//   ラウンド 5R/2R ／ 払い出し(実獲得) 5R 約350個(約300個)・2R 約140個(約120個)
//   賞球数 1&5&7
//
// ヘソ入賞時（特図1・通常時）の振り分け（en1）:
//   ・約140個（2R）→バスタードRUSH(ST6回+残保留4個)：約99.5%
//   ・約700個（350個×2回）→超バスタードRUSH(ST10回+残保留4個)：約0.5%（7図柄揃い）
// バスタードRUSH中（特図2・電チュー入賞時）の振り分け（en2）:
//   ・約350個 →バスタードRUSH：約50.4%
//   ・約700個（350個×2回）→バスタードRUSH：約49.1%
//   ・約700個（350個×2回）→超バスタードRUSH：約0.5%
// アンスラサクスBATTLE（バスタードRUSHの残保留4個）中の振り分け（en5）:
//   ・約350個 →超バスタードRUSH：100%
//   （ゲームフロー図の注記※3「残保留での当選時は350個+超バスタードRUSH」とも一致）
// 超バスタードRUSH中（特図2・電チュー入賞時）の振り分け（en3）:
//   ・約2100個（350個×6回）：約25.0% ／ 約1400個（350個×4回）：約25.0% ／
//     約700個（350個×2回）：約50.0%、いずれも超バスタードRUSH継続
//
// 【状態の組み立て】
// バスタードRUSHは「ST6回」と「残保留4個（アンスラサクスBATTLE）」で当選後の行き先が
// 違うため、2つの状態に分けた。ST6回を外しきるとアンスラサクスBATTLE（4回）へ移り、
// そこも外すと通常へ戻る。
//   検算: 1-(1-1/10.7)^6 ≈ 44.5%（公表 時短6回継続率約45%と一致）
//         残り4回で当たる確率 1-(1-1/10.7)^4 ≈ 32.5%（公表 残保留4個継続率約33%と一致）
//         トータル 0.445+0.555×0.325 ≈ 62.5%（公表約63%と一致）
// 超バスタードRUSHはST10回+残保留4個=14回のcountDownにした。
//   検算: 1-(1-1/10.7)^14 ≈ 74.7%（公表約75%と一致）
//
// 【迷った箇所（仮定を含む）】
// 超バスタードRUSHの「残保留4個」で当たったときの振り分けは、個別の円グラフが無い。
// en3は「超バスタードRUSH中（電チュー入賞時 特図2）」とだけあり、残保留分を分けて
// 示していないため、残保留4個も含めて14回すべてen3の振り分けを使うと仮定した。
// 継続率の検算（14回一括で約75%）とは矛盾しない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（350個→300個、140個→120個、比率6/7）。
// 700/1400/2100個も同じ比率で600/1200/1800個に換算した。
// ゲームフロー図の注記には「約700個は約360個×2回」との表記もあるが、円グラフと
// スペック表の約350個（実獲得約300個）に揃えた。
//
// 【spinsPer1000Yen】デカヘソ等の記載が無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-bastard-light",
  slug: "e-bastard-light",
  name: "eフィーバーBASTARD!! -暗黒の破壊神- Light ver.",
  nameKana: "いーふぃーばーばすたーど あんこくのはかいしん らいとばーじょん",
  aliases: ["バスタード", "BASTARD", "バスタード甘", "BASTARD甘", "バスタードライト", "BASTARD Light", "暗黒の破壊神", "超バスタードRUSH"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2026,
  releaseDate: "2026-12-07",
  category: "スマパチ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "1/99.9の甘デジながら、通常時の当たりは100%でRUSHへ。バスタードRUSHは時短6回のあとに残保留4個のアンスラサクスBATTLEが控え、そこで勝てば上位の超バスタードRUSHへ昇格する二段構え。超バスタードRUSHは継続率約75%で、当たりの半分が約1400個以上という甘デジ屈指の出玉性能。",
  rules: [
    "通常時の図柄揃い確率：約1/99.9",
    "右打ち中の図柄揃い確率：約1/10.7（大当り・小当りの合算）",
    "RUSH突入率：100%",
    "バスタードRUSH：ST6回+残保留4個、継続率約63%（時短6回で約45%、残保留4個で約33%）",
    "超バスタードRUSH：ST10回+残保留4個、継続率約75%",
    "通常時の振り分け（ヘソ入賞時）：2R・実獲得約120個でバスタードRUSHが約99.5%、7図柄揃い（5R×2・実獲得約600個）で超バスタードRUSHが約0.5%",
    "バスタードRUSH中の振り分け：5R・実獲得約300個が約50.4%、5R×2・実獲得約600個が約49.1%（いずれもバスタードRUSH継続）、5R×2で超バスタードRUSHへが約0.5%",
    "アンスラサクスBATTLE（バスタードRUSHの残保留4個）で当たれば、5R・実獲得約300個で100%超バスタードRUSHへ",
    "超バスタードRUSH中の振り分け：5R×6・実獲得約1800個が約25%、5R×4・実獲得約1200個が約25%、5R×2・実獲得約600個が約50%（いずれも継続）",
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
          { weight: 0.995, rounds: 2, balls: 120, nextState: "bastardRush", tag: "toBastardRush", resultNote: "バスタードRUSH" },
          {
            weight: 0.005,
            rounds: 5,
            displayRounds: 10,
            balls: 600,
            nextState: "superRush",
            tag: "toSuperRush7",
            resultNote: "7図柄揃い・超バスタードRUSH",
          },
        ],
      },
      onExhausted: null,
    },

    bastardRush: {
      id: "bastardRush",
      label: "バスタードRUSH",
      mode: "countDown",
      maxAttempts: 6,
      probability: 1 / 10.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.504, rounds: 5, balls: 300, nextState: "bastardRush", tag: "rush350" },
          {
            weight: 0.491,
            rounds: 5,
            displayRounds: 10,
            balls: 600,
            nextState: "bastardRush",
            tag: "rush700",
            resultNote: "5R×2",
          },
          {
            weight: 0.005,
            rounds: 5,
            displayRounds: 10,
            balls: 600,
            nextState: "superRush",
            tag: "rushToSuper",
            resultNote: "5R×2・超バスタードRUSH",
          },
        ],
      },
      onExhausted: {
        nextState: "anthrasaxBattle",
        tag: "toAnthrasax",
        resultLabel: "アンスラサクスBATTLE（残保留4個）へ",
      },
    },

    anthrasaxBattle: {
      id: "anthrasaxBattle",
      label: "アンスラサクスBATTLE（残保留）",
      mode: "countDown",
      maxAttempts: 4,
      probability: 1 / 10.7,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 5, balls: 300, nextState: "superRush", tag: "anthrasaxWin", resultNote: "バトル勝利・超バスタードRUSH" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "bastardRushEnd", resultLabel: "バスタードRUSH終了" },
    },

    superRush: {
      id: "superRush",
      label: "超バスタードRUSH",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 10.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.25,
            rounds: 5,
            displayRounds: 30,
            balls: 1800,
            nextState: "superRush",
            tag: "super2100",
            resultNote: "超絶破天荒 5R×6",
          },
          {
            weight: 0.25,
            rounds: 5,
            displayRounds: 20,
            balls: 1200,
            nextState: "superRush",
            tag: "super1400",
            resultNote: "超絶破天荒 5R×4",
          },
          {
            weight: 0.5,
            rounds: 5,
            displayRounds: 10,
            balls: 600,
            nextState: "superRush",
            tag: "super700",
            resultNote: "5R×2",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "superRushEnd", resultLabel: "超バスタードRUSH終了" },
    },
  },

  distributionTables: {},

  // 5Rには300/600/1200/1800個、2Rには120個があるため代表値のみ置き、
  // 実際の出玉は各onHit.outcomesのballsで上書きする。
  payoutTable: { 5: 300, 2: 120 },
});
