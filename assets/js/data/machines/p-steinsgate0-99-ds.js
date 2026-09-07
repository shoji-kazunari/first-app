// 第65号機: デカスタPシュタインズゲート ゼロ まゆしぃば～じょん
// （2025年 newgin（ニューギン） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_steinsgate0_99_ds/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・RUSH 0中・RUSH 0 HYPER中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/99.9）の振り分け:
//   ・4R大当り(約400個/実獲得約360個)→通常（時短なし）：50.0%
//   ・4R大当り(約400個/実獲得約360個)→RUSH 0(時短50回+残保留4個)：50.0%
// RUSH 0中（特図2・電チュー入賞時、当選確率1/59.4＝大当り+小当り合算値）の振り分け:
//   ・3R大当り(約300個/実獲得約270個)→RUSH 0継続：48.0%
//   ・10R大当り(約1000個/実獲得約900個)→RUSH 0継続：48.0%
//   ・タイムリープ→RUSH 0継続：2.0%
//   ・タイムリープ→RUSH 0 HYPER(LT、時短150回+残保留4個)：2.0%
// RUSH 0 HYPER中（特図2・電チュー入賞時、当選確率1/59.4）の振り分け:
//   ・3R大当り(約300個)→RUSH 0 HYPER継続：48.0%
//   ・10R大当り(約1000個)→RUSH 0 HYPER継続：48.0%
//   ・タイムリープ→鳳凰院凶真ZONE(時短10000回)：4.0%
// （RUSH 0継続率約60%は、素の1-(1-1/59.4)^54≈60.0%とほぼ完全に一致し（時短50回単独
// では1-(1-1/59.4)^50≈57.2%で、脚注の「引き戻し率約57.2%」とも一致）、RUSH 0 HYPER
// 継続率約93%も、素の1-(1-1/59.4)^154≈92.7%とほぼ一致する（時短150回単独では約92.2%で、
// 脚注の数値とも一致）。いずれも「規定回数+残保留4個」をmaxAttemptsに直接足し込むだけの
// 単純なcountDownで再現できる（50+4=54、150+4=154）ため、転落抽選やonFallは使っていない）
//
// 【「タイムリープ」をballs:0の状態遷移として実装】
// 円グラフではタイムリープの枠だけ他の枠（3R/10R大当り）と違って具体的な出玉個数が
// 示されておらず、単なる次のステージへの合図（既存の当り出玉に出玉が上乗せされるという
// 記載も無い）と判断できるため、rounds:1・balls:0の明示的なオーバーライドで表現した
// （e-nanatai3.js等と同じ扱い）。
//
// 【鳳凰院凶真ZONEの内部構造は未公開・推定で実装】
// 概要ページには鳳凰院凶真ZONE（時短10000回、事実上無期限）に突入することと、その突入率
// （RUSH 0 HYPER中の4.0%）しか記載が無く、突入後の当り振り分け自体は個別ページ
// （RUSH 0 HYPER概要等）に記載があると思われるが、この概要ページには含まれていなかった。
// 最上位ステージであり格上げ先が無いことから、RUSH 0 HYPERと同じ３R/10R比率（48%/48%）を
// 維持しつつ、残り4%はタイムリープで自分自身へ戻る（p-ultramanmebius.jsのrushFatherと
// 同じ「最上位は自分へ戻る」パターン）と仮定して実装した。
//
// 【spinsPer1000Yenについて・要確認】
// 「デカスタ」搭載で「変動効率が大幅アップ」との記載があるが、具体的な回転数の記載が
// 無いため、e-kyokousuiri.js等のように依頼者の実感で確認できるまでは既定値16のまま
// 実装し、要確認として残す。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-steinsgate0-99-ds",
  slug: "p-steinsgate0-99-ds",
  name: "Pシュタインズゲート ゼロ まゆしぃば～じょん",
  nameKana: "ぴーしゅたいんずげーとぜろまゆしぃばーじょん",
  aliases: [
    "シュタインズゲート ゼロ",
    "シュタゲゼロパチンコ",
    "デカスタシュタインズゲート",
    "Pシュタインズゲート0",
    "シュタゲゼロまゆしぃ",
  ],
  manufacturer: { id: "newgin", name: "newgin（ニューギン）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  // 要確認: 「デカスタ」搭載機だが具体的な回転数の記載が無いため既定値のまま。
  // 詳細はファイル冒頭のコメント参照。
  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "RUSH 0・RUSH 0 HYPER中の当選確率：1/59.4（大当り+小当り合算値）",
    "RUSH 0：時短50回+残保留4個、継続率約60%",
    "RUSH 0 HYPER（LT）：時短150回+残保留4個、継続率約93%",
    "RUSH突入率：約50%",
    "通常時の大当り振り分け（ヘソ入賞時）：4R・実獲得約360個で通常のままが50.0%、4R・実獲得約360個でRUSH 0へが50.0%",
    "RUSH 0中の当選振り分け：3R・実獲得約270個で継続が48.0%、10R・実獲得約900個で継続が48.0%、タイムリープで継続が2.0%、タイムリープでRUSH 0 HYPERへが2.0%",
    "RUSH 0 HYPER中の当選振り分け：3R・実獲得約270個で継続が48.0%、10R・実獲得約900個で継続が48.0%、タイムリープで鳳凰院凶真ZONE（時短10000回）へが4.0%",
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
          { weight: 0.5, rounds: 4, balls: 360, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 4,
            balls: 360,
            nextState: "rush0",
            tag: "toRush0",
            resultNote: "RUSH 0",
          },
        ],
      },
      onExhausted: null,
    },

    rush0: {
      id: "rush0",
      label: "RUSH 0",
      mode: "countDown",
      maxAttempts: 54,
      probability: 1 / 59.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 3, balls: 270, nextState: "rush0", tag: "continue3r" },
          { weight: 0.48, rounds: 10, balls: 900, nextState: "rush0", tag: "continue10r" },
          {
            weight: 0.02,
            rounds: 1,
            balls: 0,
            nextState: "rush0",
            tag: "timeLeapContinue",
            resultNote: "タイムリープ",
          },
          {
            weight: 0.02,
            rounds: 1,
            balls: 0,
            nextState: "rush0Hyper",
            tag: "timeLeapToHyper",
            resultNote: "タイムリープ、RUSH 0 HYPER",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rush0End", resultLabel: "RUSH 0終了" },
    },

    rush0Hyper: {
      id: "rush0Hyper",
      label: "RUSH 0 HYPER",
      mode: "countDown",
      maxAttempts: 154,
      probability: 1 / 59.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 3, balls: 270, nextState: "rush0Hyper", tag: "continue3r" },
          { weight: 0.48, rounds: 10, balls: 900, nextState: "rush0Hyper", tag: "continue10r" },
          {
            weight: 0.04,
            rounds: 1,
            balls: 0,
            nextState: "houououinZone",
            tag: "timeLeapToZone",
            resultNote: "タイムリープ、鳳凰院凶真ZONE",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rush0HyperEnd", resultLabel: "RUSH 0 HYPER終了" },
    },

    houououinZone: {
      id: "houououinZone",
      label: "鳳凰院凶真ZONE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 59.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.48, rounds: 3, balls: 270, nextState: "houououinZone", tag: "continue3r" },
          { weight: 0.48, rounds: 10, balls: 900, nextState: "houououinZone", tag: "continue10r" },
          {
            weight: 0.04,
            rounds: 1,
            balls: 0,
            nextState: "houououinZone",
            tag: "timeLeapContinue",
            resultNote: "タイムリープ",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 900, 4: 360, 3: 270 },
});
