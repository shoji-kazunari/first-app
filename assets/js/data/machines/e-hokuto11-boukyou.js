// 第25号機: e 北斗の拳11 暴凶星（2025年 Sammy スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_hokuto11_boukyou/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・
// 拳王RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い確率約1/399.8）の振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：39%
//   ・10R大当り(約1500個)→拳王RUSH：52%
//   ・10R×3大当り(約4500個)→拳王RUSH：5%
//   ・2R+10R大当り(約1800個)→拳王RUSH：4%
// （合計61%＝公表の「RUSH突入率約61%」と一致。円グラフ自体に「図柄揃い演出と
// 拳王覚醒チャンス成功の合算値」との注記があり、拳王覚醒チャンス（チャージ、
// 2R・約300個、undisclosedな確率で「拳王覚醒」すれば+1500個上乗せしてRUSH
// 突入）の寄与もこの39/52/5/4%に織り込み済みと判断し、別状態には分けていない）
//
// 拳王RUSH（電チュー入賞時、大当り確率約1/10.7）は規定回数消化型（ST10回+
// 残保留4個）。円グラフの内訳:
//   ・20%：ST回数リセット（出玉の記載無し、STを10回+残保留4個に再セットするのみ）
//   ・30%：10R大当り(約1500個)→継続
//   ・40%：10R×3大当り(約4500個)→継続
//   ・10%：10R×4大当り(約6000個)→継続
// 「ST回数リセット」は出玉0個の枝を表現できない（machineValidatorはballsが
// 正の数であることを要求）ため、e-kinnikuman.jsのSTリセットと同じ理由で
// 最小の出玉枝（10R・約1500個）に合算した（20%+30%=50%）。
//
// 【残保留4個の引き戻しは実装していない】
// 素の計算1-(1-1/10.7)^10≈62.5%は公表の「継続率約75%（c時短込み、時短10回+
// 残保留4個の合算値）」を大きく下回る。差の大部分は残保留4個の引き戻し分と
// 考えられるが、p-madokamagica3.js / e-sao-senko.js等と同じ理由（stateEngine
// のresidualAttemptsはonFall専用で、規定回数消化型には流用できない）で
// このシミュレーターでは実装していない。ギャップは他機種より大きい
// （62.5%→75%、約12.5pt）ため、体感との差が気になる場合は要調整。
//
// 【「極闘 EXTREME BATTLE」は実装していない】
// 拳王RUSH中に発生する上乗せバトルで、発生すれば約6000個～約12000個獲得濃厚と
// あるが、発生率・出玉の内訳とも1geki.jpに数値の記載が無いため実装していない。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 比率14/15）。明記の無い4500/1800/6000個にも同じ比率をそのまま適用した
// （4500→4200、1800→1680、6000→5600。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-hokuto11-boukyou",
  slug: "e-hokuto11-boukyou",
  name: "e 北斗の拳11 暴凶星",
  nameKana: "いーほくとのけんじゅういちぼうきょうせい",
  aliases: ["北斗の拳11", "暴凶星", "北斗の拳11暴凶星", "e北斗の拳11", "北斗の拳暴凶星2"],
  manufacturer: { id: "sammy", name: "Sammy" },
  releaseYear: 2025,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：約1/399.8",
    "拳王RUSH中の大当り確率：約1/10.7",
    "拳王RUSH：ST10回+残保留4個、継続率約75%（このシミュレーターでは残保留の引き戻しは未実装。詳細はコメント）",
    "RUSH突入率：61%",
    "通常時の大当り振り分け（ヘソ入賞時・図柄揃い）：10R・実獲得約1400個で通常のままが39%、10R・実獲得約1400個で拳王RUSHが52%、10R×3・実獲得約4200個で拳王RUSHが5%、2R+10R・実獲得約1680個で拳王RUSHが4%",
    "拳王RUSH中の当選振り分け（電チュー入賞時）：約1400個が50%（STリセット含む）、約4200個が40%、約5600個が10%（いずれも継続）",
    "拳王RUSHは規定回数（10回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.8,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.39, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.52, rounds: 10, balls: 1400, nextState: "rush", tag: "toRush1500" },
          {
            weight: 0.05,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "toRush4500",
            resultNote: "10R×3",
          },
          {
            weight: 0.04,
            rounds: 10,
            displayRounds: 12,
            balls: 1680,
            nextState: "rush",
            tag: "toRush1800",
            resultNote: "2R+10R",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "拳王RUSH",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 10.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1500" },
          {
            weight: 0.4,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "rushContinue4500",
            resultNote: "10R×3",
          },
          {
            weight: 0.1,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushContinue6000",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "拳王RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400 },
});
