// 第15号機: e女神のカフェテラス（2025年 JFJ スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_megamicafe/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：約60%
//   ・2R大当り(約300個)→女神の交響曲TIME(LT、ST100回)：約40%
// （テキストには「女神のカフェテラスBONUS RUSH」「女神のカフェテラスBONUS」
// 「ハーレムチャレンジ」「TERRACE CHARGE」という個別の当選契機が説明されているが、
// 円グラフはこの2択のみで、個別の出現率・成功率は数値公開されていない。
// e-gundamseed-climax.jsのSEEDチャージと同じ扱いで、円グラフの2択をそのまま実装した）
//
// 電チュー入賞時（特図2・女神の交響曲TIME中）の振り分け:
//   ・約25%で1500個、約50%で3000個、約25%で4500個+α。
//   4500個時はさらに約25%（「吐息CHANCE」成功）で"+α"の「まるっと爆乗せ」が発生し、
//   同じ25/50/25の抽選が再帰的に上乗せされる（成功する限り繰り返す）。
//   ただしLT突入後「初回」の1回目だけは、+αの対象外で4500個固定となる
//   （円グラフ脚注・詳細テーブルの脚注に明記）。
//
// 【まるっと爆乗せの実装方法】
// 1geki.jpの「まるっと爆乗せ時合算出玉期待値」円グラフ（6000個25%・7500個50%・
// 9000個以上25%）が、25/50/25の抽選を25%の再帰的継続で畳み込んだ分布と厳密に
// 一致することを確認した（6000=4500+1500、7500=4500+3000、9000以上=4500+4500以降の
// さらなる再帰）。そのため確率を推測する必要はなく、東京喰種・リコリスリコイルと
// 同種の「成功する限り上乗せが続くループ」として、二項分布ではなく多段の畳み込みで
// 厳密に計算し、payoutTableのballs個別指定で12段階の分布として実装している
// （12段目以降の極小確率［合計約0.00006%未満］は最後の枠に丸めて吸収）。
//
// 【初回だけ+αが無い扱い】
// LT突入後の1回目の当選だけ+α抽選が発生しないため、「ltFirst」（初回、25/50/25の
// 単発のみ）と「ltRush」（2回目以降、上記の再帰抽選あり）の2状態に分けて実装した
// （e-zom100.jsのハンドレッドドリーム「初回/2回目以降」と同じパターン）。
//
// 【出玉は「実獲得個数」を採用】
// 1geki.jpにはTERRACE CHARGEの実獲得個数（約300個→約280個、比率14/15）のみ
// 明記されており、他の大当たりパターンには実獲得個数の記載が無かった。この
// 機種で唯一確認できた比率14/15を、明記の無い他の全ての段（300/1500/3000/4500
// および再帰の上乗せ分）にもそのまま適用した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-megamicafe",
  slug: "e-megamicafe",
  name: "e女神のカフェテラス",
  nameKana: "いーめがみのかふぇてらす",
  aliases: ["女神のカフェテラス", "めがみのカフェテラス", "カフェテラス"],
  manufacturer: { id: "jfj", name: "JFJ" },
  releaseYear: 2025,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/348（TERRACE CHARGEからの突入を含む）",
    "女神の交響曲TIME中の当選確率：約1/73",
    "女神の交響曲TIME：ST100回、継続率約75%",
    "LT突入率：約40%",
    "通常時の大当たり振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが約60%、2R・実獲得約280個で女神の交響曲TIME(ST100回)が約40%",
    "女神の交響曲TIME・初回の当選振り分け（電チュー入賞時）：10R・実獲得約1400個が25%、10R×2・実獲得約2800個が50%、10R×3・実獲得約4200個が25%",
    "女神の交響曲TIME・2回目以降の当選振り分け（電チュー入賞時）：上記と同じ25/50/25をベースに、10R×3(4500個)時のみ25%で「まるっと爆乗せ」が発生し、成功する限り同じ25/50/25の抽選が上乗せされ続ける",
    "女神の交響曲TIMEは規定回数（100回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 348,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.6, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.4, rounds: 2, balls: 280, nextState: "ltFirst", tag: "toLtFirst" },
        ],
      },
      onExhausted: null,
    },

    ltFirst: {
      id: "ltFirst",
      label: "女神の交響曲TIME",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 73,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 10, balls: 1400, nextState: "ltRush", tag: "ltFirstTo1500" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ltRush",
            tag: "ltFirstTo3000",
            resultNote: "10R×2",
          },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "ltRush",
            tag: "ltFirstTo4500",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltFirstEnd", resultLabel: "女神の交響曲TIME終了" },
    },

    ltRush: {
      id: "ltRush",
      label: "女神の交響曲TIME",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 73,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.25, rounds: 10, displayRounds: 10, balls: 1400, nextState: "ltRush", tag: "ltRushX1" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "ltRush",
            tag: "ltRushX2",
            resultNote: "10R×2",
          },
          {
            weight: 0.1875,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "ltRush",
            tag: "ltRushX3",
            resultNote: "10R×3",
          },
          {
            weight: 0.015625,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "ltRush",
            tag: "ltRushX4",
            resultNote: "10R×4",
          },
          {
            weight: 0.03125,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "ltRush",
            tag: "ltRushX5",
            resultNote: "10R×5",
          },
          {
            weight: 0.01171875,
            rounds: 10,
            displayRounds: 60,
            balls: 8400,
            nextState: "ltRush",
            tag: "ltRushX6",
            resultNote: "10R×6",
          },
          {
            weight: 0.0009765625,
            rounds: 10,
            displayRounds: 70,
            balls: 9800,
            nextState: "ltRush",
            tag: "ltRushX7",
            resultNote: "10R×7",
          },
          {
            weight: 0.001953125,
            rounds: 10,
            displayRounds: 80,
            balls: 11200,
            nextState: "ltRush",
            tag: "ltRushX8",
            resultNote: "10R×8",
          },
          {
            weight: 0.0007324219,
            rounds: 10,
            displayRounds: 90,
            balls: 12600,
            nextState: "ltRush",
            tag: "ltRushX9",
            resultNote: "10R×9",
          },
          {
            weight: 0.0000610352,
            rounds: 10,
            displayRounds: 100,
            balls: 14000,
            nextState: "ltRush",
            tag: "ltRushX10",
            resultNote: "10R×10",
          },
          {
            weight: 0.0001220703,
            rounds: 10,
            displayRounds: 110,
            balls: 15400,
            nextState: "ltRush",
            tag: "ltRushX11",
            resultNote: "10R×11",
          },
          {
            weight: 0.0000610352,
            rounds: 10,
            displayRounds: 120,
            balls: 16800,
            nextState: "ltRush",
            tag: "ltRushX12",
            resultNote: "10R×12",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "ltRushEnd", resultLabel: "女神の交響曲TIME終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
