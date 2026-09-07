// 機種追加: PA花の慶次～傾奇一転87ver.（2026年 newgin 甘デジ・遊タイム）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/pa_hanakei_kabuki87/）。導入日2026年6月8日。
// 大当たり振り分けは、同ページに掲載されている円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当たり確率1/87.8、特図1・特図2共通）の振り分け:
//   ・4R大当り(約400個)→傾奇RUSH(ST75回+残保留4個)：99.0%
//   ・10R大当り(約1000個)→傾奇RUSH(ST75回+残保留4個)：1.0%
// （必ずRUSHに突入するが、当り自体の出玉は円グラフの2択に分かれる）
//
// 電チュー入賞時（特図2・傾奇RUSH中、大当たり確率1/87.8）の振り分け:
//   ・10R大当り(約1000個)→継続：33%
//   ・4R大当り(約400個)→継続：67%
// （傾奇RUSHは規定回数消化型。素の計算1-(1-1/87.8)^75≈57.6%は公表の
// 「傾奇RUSH継続率約57.6%」と完全に一致する。トータル継続率約60%は
// 「57.6%+残保留での引き戻しを加味」とあり、e-enen2-99.js等で確立した
// 「残保留4個をmaxAttemptsに足し込む」手法で1-(1-1/87.8)^79≈59.5%となり、
// 公表の約60%とほぼ一致した。maxAttemptsは本来のST75回+4とし、
// includesResidualHold: trueを立てる）。
//
// 【遊タイム（天井）は実装していない】
// 「低確率260回転消化後、遊タイム(5000回)突入」という天井救済の記載が
// あるが、遊タイム中の当選確率・具体的な仕組み（何回転で何が確定するか等）
// の数値が1geki.jpに記載されておらず、実装すると数値を作ることになるため
// 見送った。260回転〜5000回転という射程は素の大当たり確率1/87.8からしても
// 十分カバーされる範囲であり、天井を実装しない場合の期待値への影響は
// 限定的とみられる。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 4R: 約400個/実獲得360個、比率いずれも9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-hanakei-kabuki87",
  slug: "pa-hanakei-kabuki87",
  name: "PA花の慶次～傾奇一転87ver.",
  nameKana: "ぴーえーはなのけいじかぶきいってんはちじゅうななばー",
  aliases: ["花の慶次 傾奇一転87", "花の慶次甘デジ", "傾奇一転87", "Pa花の慶次"],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "パチンコ（一種二種混合機・甘デジ・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時・傾奇RUSH中の大当たり確率：ともに1/87.8",
    "通常時の大当たりは必ず傾奇RUSHへ突入（RUSH突入率100%、4R・実獲得約360個が99.0%、10R・実獲得約900個が1.0%）",
    "傾奇RUSH：ST75回（残保留込みで実質79回）・継続率約60%",
    "低確率260回転消化で遊タイム(5000回)突入（当選確率等の詳細は1geki.jpに記載無く未実装）",
    "傾奇RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約900個で継続が33%、4R・実獲得約360個で継続が67%",
    "傾奇RUSHは規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 87.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.99, rounds: 4, balls: 360, nextState: "rush", tag: "toRush400", resultNote: "傾奇RUSH" },
          {
            weight: 0.01,
            rounds: 10,
            balls: 900,
            nextState: "rush",
            tag: "toRush1000",
            resultNote: "傾奇RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "傾奇RUSH",
      mode: "countDown",
      maxAttempts: 79, // 本来のST75回+残保留4個
      includesResidualHold: true,
      probability: 1 / 87.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.33, rounds: 10, balls: 900, nextState: "rush", tag: "rushContinue1000" },
          { weight: 0.67, rounds: 4, balls: 360, nextState: "rush", tag: "rushContinue400" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "傾奇RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 4: 360, 10: 900 },
});
