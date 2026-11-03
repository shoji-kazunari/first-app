// 桃太郎電鉄 〜ぱちんこも定番！〜（2026年11月2日導入 Konami Amusement 甘デジ/ST機/設定付）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_momotetu/）。型式名 PA桃太郎電鉄定番AS
// （検定番号610706）。スペック表・設定別の振り分け表はWebFetchで本文から取得し、
// 円グラフとゲームフロー図は同ページの画像4枚（通常時の円グラフ p_momotetu_gazou46、
// 右打ち中（設定1）の円グラフ gazou47、右打ち中（設定6）の円グラフ gazou48、
// ゲームフロー図 gazou49）を images.1geki.jp からダウンロードし、Readツールで直接読み取った。
//
// 【設定は「設定1」だけを実装】
// 実機は設定1〜6付き（低確率1/89.8〜1/89.2、高確率1/60.3〜1/59.9、右打ち中の10R比率が
// 設定で変わる）。このシミュレーターのstateEngineは設定を切り替える仕組みを持たないため、
// 1geki.jpの継続率・突破率の注記が基準にしている設定1の数値で実装した。
//
// 基本スペック（設定1）:
//   大当り確率 通常時 1/89.8 ／ 桃鉄RUSH中（ST） 1/60.3 ／ 桃鉄チャレンジ中 1/89.8
//   出玉 10R=約800個(実獲得約700個) / 8R=約640個(約560個) / 6R=約480個(約420個)
//        / 5R=約400個(約350個) / 4R=約320個(約280個)
//   桃鉄チャレンジ: 時短50回＋残保留4個、突破率約45.3%
//   桃鉄RUSH: ST77回＋残保留4個 または 電サポ10000回（実質次回まで）、継続率約75%
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou46）:
//   ・5R大当り(約400個)→桃鉄RUSH（電サポ77回）：1.0%（桃鉄BONUS＝7図柄揃い）
//   ・5R大当り(約400個)→桃鉄チャレンジ（電サポ50回）：99.0%（BONUS＝7図柄以外）
// 電チュー入賞時（特図2・右打ち中＝桃鉄チャレンジ／桃鉄RUSH）の振り分け（設定1）:
//   円グラフ gazou47 は 10R 12.5% / 8R 12.5% / 6R 12.5% / 5R 12.5% / 4R 50.0%
//   （いずれも「桃鉄RUSH 電サポ77回or10000回」）。本文の設定別表で77回/10000回に分かれる:
//     電サポ77回     ：10R 11.5% / 8R 12.0% / 6R 12.0% / 5R 12.0% / 4R 47.5%（計95%）
//     電サポ次回まで ：10R 1.0%  / 8R 0.5%  / 6R 0.5%  / 5R 0.5%  / 4R 2.5% （計5%）
//   2表の和が円グラフの値（12.5/12.5/12.5/12.5/50.0）と一致することを確認した。
//
// 【検算（ゲームフロー図の注記と照合）】
//   桃鉄チャレンジ50回 1-(1-1/89.8)^50 ≈ 42.9%（注記「約42.8%」）
//   残保留4個（低確率）1-(1-1/89.8)^4 ≈ 4.4%（注記「約4.4%」）
//   → 突破率 0.429＋0.571×0.044 ≈ 45.4%（公表「約45.3%」）
//   ST77回 1-(1-1/60.3)^77 ≈ 72.4%（注記「約72.4%」）
//   → 77回側の継続 0.724＋0.276×0.044 ≈ 73.6%、10000回側は約99.9%
//   → 0.95×73.6%＋0.05×99.9% ≈ 74.9%（公表「約75%」）
//   以上より「規定回数のcountDown→残保留4個（低確率）のcountDown→通常」という
//   素直なチェーンで公表値が再現できる。
//
// 【仮定を置いた箇所（確証のある数値ではない）】
// ・電サポ10000回（実質次回まで）中の大当り確率は1geki.jpに個別の記載が無い。
//   ゲームフロー図が「ST回数 77回 or 実質次回まで」とST回数の欄に並べていることから
//   ST（1/60.3）と解釈した。どちらの確率でも10000回以内にほぼ確実に当たる（引き戻し
//   約99.9%）ため、結果に影響するのは「次の当りまでの回転数」だけ。
// ・桃鉄チャレンジ／桃鉄RUSHを外し切ったあとの移行先は本文に明記が無いが、
//   注記の「残保留4個の引き戻し率」を合算した上で、時短なしの通常時へ戻ると解釈した。
//
// 【実装していないもの】
// ・設定2〜6（上記の通り）
// ・遊タイム（低確率250回消化で時短10000回）: 状態をまたいで低確率の回転数を積算する
//   仕組みがstateEngineに無いため、pa-oumi-agnes-premium.js等と同じく省略した
// ・「サイコロチャレンジ」は右打ち中の大当り（4R〜10R）の出目を決める演出で、
//   振り分け自体は上の表に含まれている
//
// 【出玉は「実獲得個数」を採用】10R→700個、8R→560個、6R→420個、5R→350個、4R→280個。
// 【spinsPer1000Yen】デカヘソ等の記載もボーダーの記載も無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-momotetsu",
  slug: "pa-momotetsu",
  name: "桃太郎電鉄 〜ぱちんこも定番！〜",
  nameKana: "ももたろうでんてつぱちんこもていばん",
  aliases: ["桃鉄", "桃鉄甘", "桃太郎電鉄", "桃鉄パチンコ", "PA桃太郎電鉄", "桃鉄RUSH", "桃鉄チャレンジ"],
  manufacturer: { id: "konami-am", name: "Konami Amusement（コナミアミューズメント）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（甘デジ・ST機・設定付・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "初当りの99%は時短50回の「桃鉄チャレンジ」で、突破率は約45%。RUSHに入ればST77回で継続率約75%、さらに当りの5%は電サポ10000回の「実質次回まで」が付く。右打ち中の当りは4R〜10Rの5段階で、サイコロの出目どおりに出玉が変わる。",
  rules: [
    "設定1の数値で実装（実機は設定1〜6付き）",
    "通常時大当り確率：1/89.8（桃鉄チャレンジ中も同じ）",
    "桃鉄RUSH（ST）中の大当り確率：1/60.3",
    "桃鉄チャレンジ：時短50回＋残保留4個、突破率約45.3%",
    "桃鉄RUSH：ST77回＋残保留4個（当りの5%は電サポ10000回＝実質次回まで）、継続率約75%",
    "通常時の振り分け（ヘソ入賞時）：5R・実獲得約350個で桃鉄RUSH直行が1.0%、5R・実獲得約350個で桃鉄チャレンジが99.0%",
    "右打ち中の振り分け（電チュー入賞時・設定1）：10Rが12.5%、8Rが12.5%、6Rが12.5%、5Rが12.5%、4Rが50.0%（うち計5%が電サポ10000回、残りがST77回）",
    "チャレンジ・RUSHを外し切ると残保留4個（低確率）を消化して通常へ",
    "遊タイム（低確率250回消化で時短10000回）はこのシミュレーターでは未実装",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 89.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.01, rounds: 5, balls: 350, nextState: "rush", tag: "toRush", resultNote: "桃鉄BONUS・桃鉄RUSH" },
          { weight: 0.99, rounds: 5, balls: 350, nextState: "challenge", tag: "toChallenge", resultNote: "桃鉄チャレンジ" },
        ],
      },
      onExhausted: null,
    },

    challenge: {
      id: "challenge",
      label: "桃鉄チャレンジ",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 89.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.115, rounds: 10, balls: 700, nextState: "rush", tag: "challengeToRush10R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 8, balls: 560, nextState: "rush", tag: "challengeToRush8R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 6, balls: 420, nextState: "rush", tag: "challengeToRush6R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 5, balls: 350, nextState: "rush", tag: "challengeToRush5R", resultNote: "桃鉄RUSH" },
          { weight: 0.475, rounds: 4, balls: 280, nextState: "rush", tag: "challengeToRush4R", resultNote: "桃鉄RUSH" },
          { weight: 0.01, rounds: 10, balls: 700, nextState: "rushNext", tag: "challengeToNext10R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 8, balls: 560, nextState: "rushNext", tag: "challengeToNext8R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 6, balls: 420, nextState: "rushNext", tag: "challengeToNext6R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 5, balls: 350, nextState: "rushNext", tag: "challengeToNext5R", resultNote: "電サポ次回まで" },
          { weight: 0.025, rounds: 4, balls: 280, nextState: "rushNext", tag: "challengeToNext4R", resultNote: "電サポ次回まで" },
        ],
      },
      onExhausted: { nextState: "zanHoryu", tag: "challengeEnd", resultLabel: "チャレンジ終了・残保留4個へ" },
    },

    rush: {
      id: "rush",
      label: "桃鉄RUSH（ST77回）",
      mode: "countDown",
      maxAttempts: 77,
      probability: 1 / 60.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.115, rounds: 10, balls: 700, nextState: "rush", tag: "rushToRush10R" },
          { weight: 0.12, rounds: 8, balls: 560, nextState: "rush", tag: "rushToRush8R" },
          { weight: 0.12, rounds: 6, balls: 420, nextState: "rush", tag: "rushToRush6R" },
          { weight: 0.12, rounds: 5, balls: 350, nextState: "rush", tag: "rushToRush5R" },
          { weight: 0.475, rounds: 4, balls: 280, nextState: "rush", tag: "rushToRush4R" },
          { weight: 0.01, rounds: 10, balls: 700, nextState: "rushNext", tag: "rushToNext10R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 8, balls: 560, nextState: "rushNext", tag: "rushToNext8R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 6, balls: 420, nextState: "rushNext", tag: "rushToNext6R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 5, balls: 350, nextState: "rushNext", tag: "rushToNext5R", resultNote: "電サポ次回まで" },
          { weight: 0.025, rounds: 4, balls: 280, nextState: "rushNext", tag: "rushToNext4R", resultNote: "電サポ次回まで" },
        ],
      },
      onExhausted: { nextState: "zanHoryu", tag: "rushStEnd", resultLabel: "ST終了・残保留4個へ" },
    },

    rushNext: {
      id: "rushNext",
      label: "桃鉄RUSH（電サポ10000回）",
      mode: "countDown",
      maxAttempts: 10000,
      probability: 1 / 60.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.115, rounds: 10, balls: 700, nextState: "rush", tag: "nextToRush10R" },
          { weight: 0.12, rounds: 8, balls: 560, nextState: "rush", tag: "nextToRush8R" },
          { weight: 0.12, rounds: 6, balls: 420, nextState: "rush", tag: "nextToRush6R" },
          { weight: 0.12, rounds: 5, balls: 350, nextState: "rush", tag: "nextToRush5R" },
          { weight: 0.475, rounds: 4, balls: 280, nextState: "rush", tag: "nextToRush4R" },
          { weight: 0.01, rounds: 10, balls: 700, nextState: "rushNext", tag: "nextToNext10R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 8, balls: 560, nextState: "rushNext", tag: "nextToNext8R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 6, balls: 420, nextState: "rushNext", tag: "nextToNext6R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 5, balls: 350, nextState: "rushNext", tag: "nextToNext5R", resultNote: "電サポ次回まで" },
          { weight: 0.025, rounds: 4, balls: 280, nextState: "rushNext", tag: "nextToNext4R", resultNote: "電サポ次回まで" },
        ],
      },
      onExhausted: { nextState: "zanHoryu", tag: "nextEnd", resultLabel: "電サポ終了・残保留4個へ" },
    },

    zanHoryu: {
      id: "zanHoryu",
      label: "残保留4個",
      mode: "countDown",
      maxAttempts: 4,
      probability: 1 / 89.8,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.115, rounds: 10, balls: 700, nextState: "rush", tag: "zanToRush10R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 8, balls: 560, nextState: "rush", tag: "zanToRush8R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 6, balls: 420, nextState: "rush", tag: "zanToRush6R", resultNote: "桃鉄RUSH" },
          { weight: 0.12, rounds: 5, balls: 350, nextState: "rush", tag: "zanToRush5R", resultNote: "桃鉄RUSH" },
          { weight: 0.475, rounds: 4, balls: 280, nextState: "rush", tag: "zanToRush4R", resultNote: "桃鉄RUSH" },
          { weight: 0.01, rounds: 10, balls: 700, nextState: "rushNext", tag: "zanToNext10R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 8, balls: 560, nextState: "rushNext", tag: "zanToNext8R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 6, balls: 420, nextState: "rushNext", tag: "zanToNext6R", resultNote: "電サポ次回まで" },
          { weight: 0.005, rounds: 5, balls: 350, nextState: "rushNext", tag: "zanToNext5R", resultNote: "電サポ次回まで" },
          { weight: 0.025, rounds: 4, balls: 280, nextState: "rushNext", tag: "zanToNext4R", resultNote: "電サポ次回まで" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "zanEnd", resultLabel: "残保留終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 700, 8: 560, 6: 420, 5: 350, 4: 280 },
});
