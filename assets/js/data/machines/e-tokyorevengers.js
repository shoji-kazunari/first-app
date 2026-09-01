// 第29号機: e東京リベンジャーズ（2025年 GINZA スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_tokyorevengers/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// 芭流覇羅（バルハラ）決戦中）をダウンロードしてReadツールで直接読み取った
// 実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率約1/319.7）の振り分け:
//   ・2R大当り(約300個)→決戦前夜(時短100回)：50.0%
//   ・2R大当り(約300個)→芭流覇羅決戦(ST144回)：46.0%
//   ・10R×2大当り+α(約3000個+α)→芭流覇羅決戦(ST144回)：4.0%
// （46.0%+4.0%=50.0%＝公表の「RUSH突入率50%と時短中の引き戻し確率約22.2%の
// 合算値」の前半部分と一致）
//
// 決戦前夜（時短100回、当選確率約1/399.6）は芭流覇羅決戦への引き戻し専用
// 状態。素の計算1-(1-1/399.6)^100≈22.2%は公表の「時短中の引き戻し確率約
// 22.2%」と一致し、通常時の直行50.0%と合わせて50.0%+50.0%×22.2%≈61.1%で
// 公表の「RUSH（LT）突入率約61%」とも一致する。決戦前夜自身の当選時振り分け
// 表は1geki.jpに個別掲載が無いため、芭流覇羅決戦中と同じ表（電チュー入賞時・
// 特図2）を採用した。
//
// 電チュー入賞時（特図2・芭流覇羅決戦中、当選確率約1/99.9）の振り分け:
//   ・10R大当り(約1500個)→継続：50.0%
//   ・10R×2大当り(約3000個)→継続：47.5%
//   ・10R×3大当り+α(約4500個+α)→継続：2.5%
// （芭流覇羅決戦はST144回の規定回数消化型。素の計算1-(1-1/99.9)^144≈76.5%は
// 公表の「継続率約77%」とほぼ一致しており、大きな引き戻しギャップは無い）
//
// 【実装していない要素】
// ・「約3000個+α」「約4500個+α」の“+α”は内訳・数値の記載が無いため含めていない。
// ・スペック表の「時短・電サポ 100回or144回or実質次回まで」にある「実質次回
//   まで」の枝は、どの当り契機で発生するかの説明・確率とも1geki.jpに記載が
//   無く、2枚の円グラフだけで100%を説明できてしまうため実装していない。
// ・出玉上乗せ特化ZONE「渋谷JACK」も発生条件・上乗せ量が非公開のため未実装。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。明記の無い3000/4500個にも同じ比率を
// そのまま適用した（3000→2800、4500→4200。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-tokyorevengers",
  slug: "e-tokyorevengers",
  name: "e東京リベンジャーズ",
  nameKana: "いーとうきょうりべんじゃーず",
  aliases: ["東リベ", "東京リベンジャーズ", "e東リベ", "トーリベ"],
  manufacturer: { id: "ginza", name: "GINZA" },
  releaseYear: 2025,
  category: "スマパチ（ミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/319.7",
    "芭流覇羅決戦中の当選確率：約1/99.9",
    "決戦前夜（時短）中の当選確率：約1/399.6",
    "芭流覇羅決戦：ST144回、継続率約77%",
    "RUSH（LT）突入率：約61%（通常時直行50.0%＋決戦前夜引き戻し分）",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で決戦前夜(時短100回)が50.0%、2R・実獲得約280個で芭流覇羅決戦が46.0%、10R×2・実獲得約2800個で芭流覇羅決戦が4.0%",
    "決戦前夜・芭流覇羅決戦中の当選振り分け（電チュー入賞時、共通）：10R・実獲得約1400個が50.0%、10R×2・実獲得約2800個が47.5%、10R×3・実獲得約4200個が2.5%（いずれも継続/引き戻し成功）",
    "決戦前夜は規定回数（100回）を全弾外すと通常へ、芭流覇羅決戦は規定回数（144回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 2,
            balls: 280,
            nextState: "kessenzenya",
            tag: "toKessenzenya",
            resultNote: "決戦前夜",
          },
          { weight: 0.46, rounds: 2, balls: 280, nextState: "kessen", tag: "toKessen" },
          {
            weight: 0.04,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kessen",
            tag: "toKessenBig",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: null,
    },

    kessenzenya: {
      id: "kessenzenya",
      label: "決戦前夜",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 399.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "kessen", tag: "zenyaToKessen1500" },
          {
            weight: 0.475,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kessen",
            tag: "zenyaToKessen3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.025,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "kessen",
            tag: "zenyaToKessen4500",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "zenyaEnd", resultLabel: "決戦前夜終了" },
    },

    kessen: {
      id: "kessen",
      label: "芭流覇羅（バルハラ）決戦",
      mode: "countDown",
      maxAttempts: 144,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "kessen", tag: "kessenContinue1500" },
          {
            weight: 0.475,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "kessen",
            tag: "kessenContinue3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.025,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "kessen",
            tag: "kessenContinue4500",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "kessenEnd", resultLabel: "芭流覇羅決戦終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
