// 第22号機: eフィーバーブルーロック（2025年 SANKYO スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_bluelock/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// エゴイストBATTLE中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/399.9）の振り分け:
//   ・7R大当り(約1050個)→通常（時短なし）：45.3%
//   ・7R大当り(約1050個)→エゴイストBATTLE：50.0%
//   ・2R大当り(約300個)→エゴイストBATTLE：4.6%
//   ・10R大当り(約1500個)→エゴイストBATTLE：0.1%
// （合計54.7%＝公表の「RUSH突入率約55%」と一致）
// 電チュー入賞時（特図2・エゴイストBATTLE中）の振り分け:
//   ・10R大当り(約1500個)→継続：36.5%
//   ・10R×2大当り(約3000個)→継続：38.0%
//   ・10R×3大当り(約4500個)→継続：19.8%
//   ・10R×4大当り(約6000個)→継続：5.2%
//   ・10R×6大当り+α(約9000個+α)→継続：0.5%
//
// 【エゴイストBATTLEは転落式（時短10000回は形式上の上限）】
// スペック表の「RUSH回数10000回※4」は「※4 普電ショート開放（発生率：約1/108）
// 当選で終了」とあり、実際の終了条件は規定回数の消化ではなく並行して抽選される
// 転落（普電ショート開放）。大当たり確率（右打ち中）は約1/33.2（普電ロング開放
// 発生率約1/29、成功率（5回転の引き戻し期待度）約88%を経て当選、との記載があるが、
// 合成せず公表値1/33.2をそのまま採用）。素の計算(1/33.2)/((1/33.2)+(1/108))≈76.5%は
// 公表の「RUSH継続率約77%」とほぼ一致しており、他機種のような大きな引き戻しギャップは
// 無い。そのためonFall（probability 1/108）で実装し、リーチ演出・色保留予告は
// stateEngine側の転落式ルールにより自動的に出さない扱いになる。
//
// 【「記者会見（チャージ）」は実装していない】
// 図柄以外の契機として「記者会見」（約1/2110、2R・約300個、「消化後の大半は通常時へ
// 移行するが、一部でエゴイストBATTLEに突入する」）がある。ただし「通常時の大当たり時の
// 出玉振り分け確率」の円グラフは図柄揃いの4パターン（45.3%/50.0%/4.6%/0.1%）のみで
// 合計100%になっており、記者会見自体の出現率もエゴイストBATTLEへの突入率も
// 1geki.jpに数値の記載が無い。そのためe-garo12.jsのガロチャージ、e-kinnikuman.jsの
// 悪魔CHARGEと同じ理由でこのシミュレーターには実装していない。
//
// 【「約9000個+α」の“+α”について】
// 円グラフに「10R×6大当り+α」とだけ表記され、+αの内訳・上乗せ量は1geki.jpに数値の
// 記載が無い。実獲得個数の記載も無いため、+αを含めない「約9000個」（実獲得約8400個、
// 14/15の比率のまま）で実装した（出玉はやや少なめに出る可能性がある）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 7R: 約1050個/実獲得980個、2R: 約300個/実獲得280個、比率14/15）。
// 明記の無い10R×2～×6にも同じ比率をそのまま適用した
// （3000→2800、4500→4200、6000→5600、9000→8400。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-bluelock",
  slug: "e-bluelock",
  name: "eフィーバーブルーロック",
  nameKana: "いーふぃーばーぶるーろっく",
  aliases: ["ブルーロック", "ブルロ", "eブルーロック", "ブルーロックパチンコ"],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2025,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：約1/399.9",
    "エゴイストBATTLE中の大当り確率：約1/33.2",
    "エゴイストBATTLE：転落式（転落確率約1/108）。継続率約77%",
    "RUSH突入率：約55%（図柄揃いの大当たりに対して）",
    "通常時の大当たり振り分け（ヘソ入賞時・図柄揃い）：7R・実獲得約980個で通常のままが45.3%、7R・実獲得約980個でエゴイストBATTLEが50.0%、2R・実獲得約280個でエゴイストBATTLEが4.6%、10R・実獲得約1400個でエゴイストBATTLEが0.1%",
    "エゴイストBATTLE中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個が36.5%、10R×2・実獲得約2800個が38.0%、10R×3・実獲得約4200個が19.8%、10R×4・実獲得約5600個が5.2%、10R×6・実獲得約8400個(+α未実装)が0.5%（いずれも継続）",
    "エゴイストBATTLEは転落小当たりを引くと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.453,
            rounds: 7,
            balls: 980,
            nextState: "normal",
            tag: "toNormal",
            resultNote: "7R",
          },
          {
            weight: 0.5,
            rounds: 7,
            balls: 980,
            nextState: "rush",
            tag: "toRush7R",
            resultNote: "7R・エゴイストBATTLE",
          },
          {
            weight: 0.046,
            rounds: 2,
            balls: 280,
            nextState: "rush",
            tag: "toRush2R",
            resultNote: "エゴイストBATTLE",
          },
          {
            weight: 0.001,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "toRush10R",
            resultNote: "エゴイストBATTLE",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "エゴイストBATTLE",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 33.2,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.365, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1" },
          {
            weight: 0.38,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue2",
            resultNote: "10R×2",
          },
          {
            weight: 0.198,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "rushContinue3",
            resultNote: "10R×3",
          },
          {
            weight: 0.052,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushContinue4",
            resultNote: "10R×4",
          },
          {
            weight: 0.005,
            rounds: 10,
            displayRounds: 60,
            balls: 8400,
            nextState: "rush",
            tag: "rushContinue6",
            resultNote: "10R×6",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 108,
        nextState: "normal",
        tag: "rushFall",
        resultLabel: "エゴイストBATTLE終了（転落）",
      },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 7: 980, 10: 1400 },
});
