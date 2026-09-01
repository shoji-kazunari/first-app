// 第30号機: スマートぱちんこ ソードアート・オンライン（2023年 KYORAKU スマパチ/V-ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_sword_art_online/）。
// このページは短縮フォーマットで、円グラフではなく「当選時の振り分け」の
// 表にヘソ入賞時・電チュー入賞時の数値がそのまま明記されていた。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.9）の振り分け:
//   ・3R確変(約450個)→SWORD RUSH(ST159回)：50.0%
//   ・3R通常(約450個)→SWORD CHANCE(時短100回)：50.0%
// 電チュー入賞時（特図2・SWORD RUSH中、大当り確率1/97.7）の振り分け:
//   ・10R確変(約1500個)→SWORD RUSH継続：100%
//
// 【SWORD CHANCEの引き戻し確率について】
// SWORD CHANCE自身の当選振り分け表はこのページに掲載が無いが、「ST突入率
// 約64%※1（※1 時短100回+残保留4個の引き戻し率約28%とRUSH Linkシステムからの
// RUSH突入率約1%を含めた合算値）」との記載があり、通常時の直行50.0%と
// 合わせて逆算すると50.0%+50.0%×x=64%→x≈28%となる。SWORD CHANCEを大当り
// 確率と同じ低確率（1/319.9）で100回消化すると仮定した場合の素の引き戻し率
// 1-(1-1/319.9)^100≈26.9%は、公表の28%（残保留4個の引き戻し＋RUSH Link分を
// 含む）に近く、大きなギャップは無い。そのためSWORD CHANCEの当選確率は
// 1/319.9を採用し、当選時はSWORD RUSHと同じ10R(1500個)を獲得するものとして
// 実装した。
//
// 【実装していない要素】
// ・残保留4個の引き戻し（ST消化直後の追加抽選）は、p-madokamagica3.js等と
//   同じ理由（stateEngineのresidualAttemptsはonFall専用）で未実装。
// ・「RUSH Linkシステム」（RUSH Link CHANCE、ST終了後33%で時短111回+αへ
//   突入し、そこからさらにRUSHへ引き戻る仕組み）は、このページには概要と
//   突入率のみの記載で、RUSH Link CHANCE自身の当選確率・出玉振り分け表が
//   別ページ（サブページ）に分かれておりこのページからは取得できなかった。
//   全体への寄与も「RUSH突入率約1%」と小さいため、このシミュレーターでは
//   実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 3R: 約450個/実獲得420個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "sp-sao",
  slug: "sp-sao",
  name: "スマートぱちんこ ソードアート・オンライン",
  nameKana: "すまーとぱちんこそーどあーとおんらいん",
  aliases: ["SAOスマパチ", "スマパチSAO", "ソードアートオンラインスマパチ", "SAO無印パチンコ"],
  manufacturer: { id: "kyoraku", name: "KYORAKU" },
  releaseYear: 2023,
  category: "スマパチ（ミドル・V-ST機・突然時短）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.9",
    "SWORD RUSH中の大当り確率：1/97.7",
    "SWORD RUSH：ST159回、継続率約81%+α（このシミュレーターでは+α未実装）",
    "SWORD CHANCE：時短100回、SWORD RUSHへの引き戻し確率1/319.9（詳細はコメント）",
    "ST突入率：約64%（通常時直行50.0%＋SWORD CHANCE引き戻し分。RUSH Linkシステムからの約1%は未実装）",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約420個でSWORD RUSHが50.0%、3R・実獲得約420個でSWORD CHANCEが50.0%",
    "SWORD RUSH・SWORD CHANCEとも当選時は10R・実獲得約1400個でSWORD RUSHへ（継続/引き戻し成功）",
    "SWORD RUSHは規定回数（159回）、SWORD CHANCEは規定回数（100回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 420, nextState: "swordRush", tag: "toRush" },
          {
            weight: 0.5,
            rounds: 3,
            balls: 420,
            nextState: "swordChance",
            tag: "toChance",
            resultNote: "SWORD CHANCE",
          },
        ],
      },
      onExhausted: null,
    },

    swordChance: {
      id: "swordChance",
      label: "SWORD CHANCE",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 319.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "swordRush", tag: "chanceToRush" }],
      },
      onExhausted: { nextState: "normal", tag: "chanceEnd", resultLabel: "SWORD CHANCE終了" },
    },

    swordRush: {
      id: "swordRush",
      label: "SWORD RUSH",
      mode: "countDown",
      maxAttempts: 159,
      probability: 1 / 97.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, balls: 1400, nextState: "swordRush", tag: "rushContinue" }],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "SWORD RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 420, 10: 1400 },
});
