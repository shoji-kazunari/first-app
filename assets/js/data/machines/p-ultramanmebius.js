// 第60号機: P ウルトラマンメビウス デカヘソ319（2026年 OK!! パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_ultramanmebius/）。
// 大当り振り分けは、同ページに掲載されている5枚の円グラフ画像（通常時・初回RUSH中・
// RUSH中[タロウ参戦]・RUSH中[セブン参戦]・最上位RUSH中[ウルトラの父参戦]）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// 【ゲーム構造：仲間参戦チェーン】
// RUSHに突入すると「初回RUSH」→「タロウ参戦」→「セブン参戦」→「最上位RUSH
// （ウルトラの父参戦）」の順に、当りのたびに次の仲間へ引き継がれていく構造。
// 最上位RUSH（ウルトラの父参戦）に到達した後は、当りのたびに自分自身へ戻り続ける
// （それ以上の格上げは無い）。全ての段階でRUSH中確率1/12.3、ST10回+残保留4個は共通。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.9）の振り分け:
//   ・4R大当り(約600個)→通常（時短なし）：49.0%
//   ・4R大当り(約600個)→RUSH(初回、ST10回+残保留4個)：50.5%
//   ・7R大当り×5(約5250個)→最上位RUSH(ST10回+残保留4個)へ直行：0.5%
// 電チュー入賞時（特図2・各RUSH中、当選確率1/12.3）の振り分け:
//   ・初回RUSH中：7R大当り(約1050個)→RUSH（タロウ参戦）へ：100%
//   ・RUSH（タロウ参戦）中：7R(約1050個)50.0%/7R×2(約2100個)50.0%→RUSH（セブン参戦）へ
//   ・RUSH（セブン参戦）中：7R(約1050個)50.0%/7R×3(約3150個)50.0%→最上位RUSHへ
//   ・最上位RUSH中：7R(約1050個)50.0%/7R×5(約5250個)50.0%→最上位RUSH継続
// （各RUSHは規定回数（ST10回+残保留4個＝計14回転）を全弾外すと通常へ。継続率約70%は、
// 素の1-(1-1/12.3)^14≈69.5%とほぼ一致しており、残保留分もmaxAttemptsに含めるだけで
// 再現できる）
//
// 【残保留での当選時の特殊ルートは未実装】
// 各円グラフに「※残保留での大当たりは出玉約1050個+最上位RUSH突入」との注記があり、
// 本来は「ST10回消化中の当り」と「残保留4個消化中の当り」で移行先が異なる
// （残保留中に当たると仲間参戦を飛ばして最上位RUSHへ直行する）。stateEngineの
// countDownはST部分と残保留部分を区別して当り先を分けられないため、このシミュレーター
// では区別せず常に通常の仲間参戦チェーン通りに進むものとして実装した（上振れの
// 一部を反映していない）。
//
// 【spinsPer1000Yenについて・要確認】
// 「デカヘソ319」を名乗る台で、ボーダーも概ね30～32回/1000円と、既存の16回転想定の
// 機種のほぼ倍。ただし実測の回転数自体は1geki.jpに記載が無く、依頼者の実感でしか
// 決められないため（e-tokyoghoul-tyo1geki.jsの28と同種の判断が必要）、判断がつくまで
// 既定値16のまま実装し、依頼者に要確認として残す。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（7R: 約1050個/実獲得980個、
// 4R: 約600個/実獲得560個、比率いずれも14/15）。7R×2～×5も同じ比率で換算。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-ultramanmebius",
  slug: "p-ultramanmebius",
  name: "P ウルトラマンメビウス デカヘソ319",
  nameKana: "ぴーうるとらまんめびうすでかへそさんいちきゅう",
  aliases: ["ウルトラマンメビウス", "メビウスデカヘソ", "Pウルトラマンメビウス", "ウルトラマンメビウスパチンコ"],
  manufacturer: { id: "ok", name: "OK!!（オッケー）" },
  releaseYear: 2026,
  category: "パチンコ（ミドル・ラッキートリガー・一種二種混合機）",

  // 要確認: 「デカヘソ」を売りにする台だが、実測値が無いため既定値のまま。
  // 詳細はファイル冒頭のコメント参照。
  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.9",
    "各RUSH中の当選確率：1/12.3（共通）",
    "RUSH：初回→タロウ参戦→セブン参戦→最上位RUSHの順に格上げ。各段階ST10回+残保留4個、継続率約70%",
    "RUSH突入率：約51%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約560個で通常のままが49.0%、4R・実獲得約560個でRUSH(初回)が50.5%、7R×5・実獲得約4900個で最上位RUSH直行が0.5%",
    "初回RUSH中の当選振り分け：7R・実獲得約980個でタロウ参戦へが100%",
    "タロウ参戦中の当選振り分け：7R・実獲得約980個が50.0%、7R×2・実獲得約1960個が50.0%（いずれもセブン参戦へ）",
    "セブン参戦中の当選振り分け：7R・実獲得約980個が50.0%、7R×3・実獲得約2940個が50.0%（いずれも最上位RUSHへ）",
    "最上位RUSH中の当選振り分け：7R・実獲得約980個が50.0%、7R×5・実獲得約4900個が50.0%（いずれも継続）",
    "各RUSHとも規定回数を全弾外すと通常へ",
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
          { weight: 0.49, rounds: 4, balls: 560, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.505,
            rounds: 4,
            balls: 560,
            nextState: "rushFirst",
            tag: "toRushFirst",
            resultNote: "RUSH",
          },
          {
            weight: 0.005,
            rounds: 7,
            displayRounds: 35,
            balls: 4900,
            nextState: "rushFather",
            tag: "toTopDirect",
            resultNote: "最上位RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    rushFirst: {
      id: "rushFirst",
      label: "RUSH（初回）",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 12.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 7,
            balls: 980,
            nextState: "rushTarou",
            tag: "toTarou",
            resultNote: "RUSH（タロウ参戦）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushFirstEnd", resultLabel: "RUSH終了" },
    },

    rushTarou: {
      id: "rushTarou",
      label: "RUSH（タロウ参戦）",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 12.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 7,
            balls: 980,
            nextState: "rushSeven",
            tag: "toSeven1",
            resultNote: "RUSH（セブン参戦）",
          },
          {
            weight: 0.5,
            rounds: 7,
            displayRounds: 14,
            balls: 1960,
            nextState: "rushSeven",
            tag: "toSeven2",
            resultNote: "7R×2、RUSH（セブン参戦）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushTarouEnd", resultLabel: "RUSH終了" },
    },

    rushSeven: {
      id: "rushSeven",
      label: "RUSH（セブン参戦）",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 12.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 7,
            balls: 980,
            nextState: "rushFather",
            tag: "toFather1",
            resultNote: "最上位RUSH",
          },
          {
            weight: 0.5,
            rounds: 7,
            displayRounds: 21,
            balls: 2940,
            nextState: "rushFather",
            tag: "toFather2",
            resultNote: "7R×3、最上位RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushSevenEnd", resultLabel: "RUSH終了" },
    },

    rushFather: {
      id: "rushFather",
      label: "最上位RUSH（ウルトラの父参戦）",
      mode: "countDown",
      maxAttempts: 14,
      probability: 1 / 12.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 7, balls: 980, nextState: "rushFather", tag: "continue1" },
          {
            weight: 0.5,
            rounds: 7,
            displayRounds: 35,
            balls: 4900,
            nextState: "rushFather",
            tag: "continue5",
            resultNote: "7R×5",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushFatherEnd", resultLabel: "最上位RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 7: 980, 4: 560 },
});
