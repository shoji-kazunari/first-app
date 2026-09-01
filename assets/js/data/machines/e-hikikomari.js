// 第24号機: eひきこまり吸血姫の悶々（2026年 FUJI スマパチ/CZ機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_hikikomari/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像（CZ成功時・
// 超孤紅の恤RUSH中・孤紅の恤BONUS中）をダウンロードしてReadツールで直接
// 読み取った実数値。
//
// 【ゲーム構造】通常時はCZ（烈核解放CZ）を目指す。CZ確率は約1/129で、
// 「※1 c時短当選からのCZ突入率と、大当たりからのCZ突入率の合算値/大当たり
// 確率:1/348」とあり、実際には2種類の契機が合算された数値。個々の内訳
// （c時短経由・大当たり経由それぞれの単独確率）は1geki.jpに数値の記載が無く
// 分解できないため、このシミュレーターでは合算値1/129をそのまま「通常状態の
// 当選確率」として実装した。CZ自体には出玉の記載が無いが、同ページには類似の
// 「コマリチャージ300」（アイコン停止・約300個・20%でCZ突入）という別契機が
// 存在し、他機種同様パチンコの入賞構造上ごく少額の出玉は必ず発生することから、
// 他機種の最小単位と同じ約300個（実獲得280個）をCZ突入時の出玉として採用した。
//
// 烈核解放CZ（抽選回数10回、成功期待度約33%）は、10回のうち1回でも成功すれば
// クリアという構造。1回あたりの成功確率pは1-(1-p)^10=0.33を満たす値として
// p=1-0.67^(1/10)≈1/25.5を算出し、1-(1-1/25.5)^10≈33.0%で公表値と一致する
// ことを確認した。CZ成功時の内訳（円グラフ）:
//   ・49.0%：約1500個→通常（時短なし）
//   ・43.7%：約1500個→超孤紅の恤RUSH(ST144回)
//   ・7.3%：約1800個(特図1大当たり1回+特図2大当たり1回の合算)→超孤紅の恤RUSH(ST144回)
// （43.7%+7.3%=51.0%＝公表の「超孤紅の恤RUSH突入率約51%」と一致）
//
// 【コマリチャージ300は実装していない】
// アイコン停止で当選する約1/? のチャージ演出（2R・約300個、20%でCZ突入、
// 残り80%は通常へ）。本体のCZ突入率（約1/129）にはこの契機も合算されている
// 可能性があるが、コマリチャージ300自体の出現率は1geki.jpに数値の記載が無く
// 分離できないため、他機種のガロチャージ・悪魔CHARGE等と同じ理由で実装して
// いない（通常状態の1/129に暗黙に含まれているものとして扱う）。
//
// 超孤紅の恤RUSH（ST144回、当選確率約1/99）は規定回数消化型（転落式ではない）。
// 素の計算1-(1-1/99)^144≈76.8%は公表の「継続率約77%」とほぼ一致しており、
// 引き戻し等の大きなギャップは無い。RUSH中の当りは50%で約1500個そのまま
// 継続、50%で孤紅の恤BONUSへ。孤紅の恤BONUSの内訳（円グラフ）は12.5%/1500個・
// 37.5%/3000個・37.5%/4500個・12.5%/6000個+1G連（いずれもRUSH継続）で、
// BONUS自体に出玉以外の分岐が無いためRUSHのonHit.outcomesに合成して実装した
// （50%+50%×12.5%=56.25%が1500個、50%×37.5%=18.75%が3000個、同37.5%が
// 4500個、50%×12.5%=6.25%が6000個。「+1G連」の上乗せ分は数値の記載が無いため
// 含めていない）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R相当: 約1500個/実獲得1400個、
// 比率14/15）。明記の無い3000/4500/6000/1800個にも同じ比率をそのまま適用した
// （3000→2800、4500→4200、6000→5600、1800→1680。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-hikikomari",
  slug: "e-hikikomari",
  name: "eひきこまり吸血姫の悶々",
  nameKana: "いーひきこまりきゅうけつきのもんもん",
  aliases: ["ひきこまり", "ひきこまり吸血姫", "eひきこまり", "ひきこまり吸血姫の悶々パチンコ"],
  manufacturer: { id: "fuji", name: "FUJI" },
  releaseYear: 2026,
  category: "スマパチ（ライトミドル・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時のCZ確率：約1/129（c時短経由・大当たり経由の合算値）",
    "烈核解放CZ：抽選回数10回、成功期待度約33%",
    "超孤紅の恤RUSH：ST144回、当選確率約1/99、継続率約77%",
    "超孤紅の恤RUSH突入率：CZ成功の約51%",
    "CZ成功時の振り分け：約1500個で通常のままが49.0%、約1500個でRUSHが43.7%、約1800個でRUSHが7.3%",
    "超孤紅の恤RUSH中の当選振り分け（電チュー入賞時）：約1500個が56.25%、約3000個が18.75%、約4500個が18.75%、約6000個が6.25%（いずれも継続。孤紅の恤BONUS経由を含む）",
    "烈核解放CZは10回を全弾外すと通常へ、超孤紅の恤RUSHは規定回数（144回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 129,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 2,
            balls: 280,
            nextState: "cz",
            tag: "toCz",
            resultNote: "烈核解放CZ",
          },
        ],
      },
      onExhausted: null,
    },

    cz: {
      id: "cz",
      label: "烈核解放CZ",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 25.5,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 10, balls: 1400, nextState: "normal", tag: "czToNormal" },
          {
            weight: 0.437,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "czToRush1500",
            resultNote: "超孤紅の恤RUSH",
          },
          {
            weight: 0.073,
            rounds: 10,
            displayRounds: 12,
            balls: 1680,
            nextState: "rush",
            tag: "czToRush1800",
            resultNote: "超孤紅の恤RUSH（特図1+特図2合算）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "czFail", resultLabel: "烈核解放CZ失敗" },
    },

    rush: {
      id: "rush",
      label: "超孤紅の恤RUSH",
      mode: "countDown",
      maxAttempts: 144,
      probability: 1 / 99,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5625, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.1875,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushBonus3000",
            resultNote: "孤紅の恤BONUS",
          },
          {
            weight: 0.1875,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "rushBonus4500",
            resultNote: "孤紅の恤BONUS",
          },
          {
            weight: 0.0625,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushBonus6000",
            resultNote: "孤紅の恤BONUS",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "超孤紅の恤RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
