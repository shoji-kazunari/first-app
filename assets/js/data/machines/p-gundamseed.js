// 第17号機: Pフィーバー機動戦士ガンダムSEED（2023年 SANKYO ミドル機、無印版）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_gundamseed/）。
// 「当選時の振り分け」の表（ヘソ入賞時・電チュー入賞時）に数値がそのまま
// 明記されていたため、円グラフ画像の読み取りは不要だった。
//
// 2023年導入の旧機種で、既に追加済みのe-gundamseed-climax.js（eフィーバー機動戦士
// ガンダムSEED クライマックス）の前作にあたる（1geki.jp自身が「シリーズ最新機種
// （後継機）へ」と本機のページから誘導している）。ただし今週のアクセスランキング
// 14位に入っておりまだ実働しているため別機種として追加した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.7）の振り分け:
//   ・3000FEVER(10R×2、約3000個)→フリーダムHYPER(ST120回)：20.0%
//   ・FEVER(2R、約300個)→ストライクRUSH(ST120回)：40.0%
//   ・FEVER(2R、約300個)→ストライクチャレンジ(時短100回)：40.0%
// 電チュー入賞時（特図2・フリーダムHYPER中、大当り確率1/84.0）の振り分け:
//   ・3000FEVER(10R×2、約3000個)→フリーダムHYPER継続(ST120回)：15.0%
//   ・フリーダムFEVER(10R、約1500個)→フリーダムHYPER(ST10000回、実質次回大当り濃厚)：5.0%
//   ・フリーダムFEVER(10R、約1500個)→フリーダムHYPER継続(ST120回)：80.0%
//
// 【ストライクRUSH・ストライクチャレンジの当選時の振り分けについて】
// 1geki.jpにはストライクRUSH・ストライクチャレンジ自身の当選時振り分け表は
// 掲載されていない（表は「ヘソ入賞時」「電チュー入賞時（フリーダムHYPER中）」の
// 2つのみ）。ただし以下の理由から、それぞれ次のように実装した:
//
// ・ストライクRUSH（電チュー、大当り確率1/84.0＝フリーダムHYPERと同一）は、
//   「電チュー入賞時」表の移行先が3行とも「フリーダムHYPER」となっていることから、
//   ストライクRUSH中の当りは常にフリーダムHYPERへ昇格すると判断し、同じ表
//   （15%/5%/80%）を共有する形で実装した。
// ・ストライクチャレンジ（時短100回、大当り確率1/601.3）は、RUSH突入率の内訳
//   「初回大当りからの直行60%（=3000FEVER20%+ストライクRUSH40%）と、ストライク
//   チャレンジの引き戻し率約15.3%の合算値」という記載を検証したところ、
//   1-(1-1/601.3)^100≈15.3%と一致した。つまり「引き戻し率」はチャレンジ100回の
//   間に一度でも当選する確率そのものであり、当選した場合の内訳を別途フィルタリング
//   していないことが分かる。そのためヘソ入賞時と同じ表（20%/40%/40%）を再利用し、
//   「ストライクチャレンジ」枝はチャレンジ自身の継続として扱った
//   （eva15-roar.jsのチャンスタイムと同じ考え方）。
//
// 【入れなかった項目】
// ※6「時短中に当選した場合は450回」は、通常（時短ではない）からの直接遷移である
// ヘソ入賞時の表では到達しない条件のため実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、10R×2: 約3000個/実獲得2800個、比率14/15）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-gundamseed",
  slug: "p-gundamseed",
  name: "Pフィーバー機動戦士ガンダムSEED",
  nameKana: "ぴーふぃーばーきどうせんしがんだむしーど",
  aliases: ["ガンダムSEED", "ガンダムシード", "PSEED", "ガンダムSEED無印", "フリーダムHYPER"],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2023,
  category: "ミドル（一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/319.7",
    "ストライクRUSH・フリーダムHYPER中の大当り確率：ともに約1/84.0",
    "ストライクチャレンジ中の大当り確率：約1/601.3（時短100回）",
    "RUSH突入率：約66%（初回大当りからの直行60% + ストライクチャレンジの引き戻し約15.3%×40%）",
    "通常時の大当り振り分け（ヘソ入賞時）：10R×2・実獲得約2800個でフリーダムHYPER(ST120回)が20.0%、2R・実獲得約280個でストライクRUSH(ST120回)が40.0%、2R・実獲得約280個でストライクチャレンジ(時短100回)が40.0%",
    "フリーダムHYPER・ストライクRUSH中の当選振り分け（電チュー入賞時、共通）：10R×2・実獲得約2800個で継続が15.0%、10R・実獲得約1400個でST10000回（実質次回大当り濃厚）が5.0%、10R・実獲得約1400個で継続が80.0%",
    "ストライクチャレンジ中の当選振り分け：ヘソ入賞時と同じ表を再利用（詳細はコメント）",
    "ストライクRUSH中の当りは常にフリーダムHYPERへ昇格する",
    "ストライクRUSH・ストライクチャレンジ・フリーダムHYPERとも規定回数を全弾外すと通常へ",
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
            weight: 0.2,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "freedomHyper",
            tag: "toFreedomHyper",
            resultNote: "3000FEVER",
          },
          { weight: 0.4, rounds: 2, balls: 280, nextState: "strikeRush", tag: "toStrikeRush" },
          { weight: 0.4, rounds: 2, balls: 280, nextState: "challenge", tag: "toChallenge" },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "ストライクチャレンジ",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 601.3,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.2,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "freedomHyper",
            tag: "challengeToFreedomHyper",
            resultNote: "3000FEVER",
          },
          {
            weight: 0.4,
            rounds: 2,
            balls: 280,
            nextState: "strikeRush",
            tag: "challengeToStrikeRush",
          },
          { weight: 0.4, rounds: 2, balls: 280, nextState: "challenge", tag: "challengeContinue" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "challengeEnd", resultLabel: "ストライクチャレンジ終了" },
    },

    strikeRush: {
      id: "strikeRush",
      label: "ストライクRUSH",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 84.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.15,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "freedomHyper",
            tag: "strikeRushToFreedomHyperMega",
            resultNote: "3000FEVER",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 1400,
            nextState: "freedomHyperInfinite",
            tag: "strikeRushToFreedomHyperInfinite",
            resultNote: "実質次回大当り濃厚",
          },
          {
            weight: 0.8,
            rounds: 10,
            balls: 1400,
            nextState: "freedomHyper",
            tag: "strikeRushToFreedomHyper",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "strikeRushEnd", resultLabel: "ストライクRUSH終了" },
    },

    freedomHyper: {
      id: "freedomHyper",
      label: "フリーダムHYPER",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 84.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.15,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "freedomHyper",
            tag: "freedomHyperContinueMega",
            resultNote: "3000FEVER",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 1400,
            nextState: "freedomHyperInfinite",
            tag: "freedomHyperToInfinite",
            resultNote: "実質次回大当り濃厚",
          },
          { weight: 0.8, rounds: 10, balls: 1400, nextState: "freedomHyper", tag: "freedomHyperContinue" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "freedomHyperEnd", resultLabel: "フリーダムHYPER終了" },
    },

    freedomHyperInfinite: {
      id: "freedomHyperInfinite",
      label: "フリーダムHYPER",
      mode: "countDown",
      maxAttempts: 10000,
      probability: 1 / 84.0,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.15,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "freedomHyper",
            tag: "freedomHyperInfiniteContinueMega",
            resultNote: "3000FEVER",
          },
          {
            weight: 0.05,
            rounds: 10,
            balls: 1400,
            nextState: "freedomHyperInfinite",
            tag: "freedomHyperInfiniteContinue",
            resultNote: "実質次回大当り濃厚",
          },
          {
            weight: 0.8,
            rounds: 10,
            balls: 1400,
            nextState: "freedomHyper",
            tag: "freedomHyperInfiniteToFreedomHyper",
          },
        ],
      },
      onExhausted: {
        nextState: "normal",
        tag: "freedomHyperInfiniteEnd",
        resultLabel: "フリーダムHYPER終了",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
