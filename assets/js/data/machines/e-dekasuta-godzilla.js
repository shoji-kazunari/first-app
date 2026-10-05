// 第113号機: デカスタeGODZILLA7 超震撼ver.（2026年 newgin（ニューギン）
// スマパチ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_dekasuta_godzilla/）。当選時の振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（図柄揃い時・UG-RUSH中・UC期待出玉）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 約1/229.9（震撼ジャッジメント経由＋Gチャージの合算値）
//               ／ UG-RUSH(ST)中 1/84.1 ／ UG-RUSH(時短)中 1/399.61
//   UG-RUSH回数  いずれも120回
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個)
//
// 【震撼ジャッジメント／Gチャージの内部機構は再現していない】
// 通常時の確率は「震撼ジャッジメント出現率1/58.9→成功率約42%」という内部の
// 2段階抽選と、別経路の「Gチャージ（約1/275）」の2系統を合算した値として
// 公表されている。ただしページの説明文に「ヘソ入賞時（特図1）の場合は、
// 約76.5%でUG-RUSH(ST)に突入」と明記されており、プレイヤーから見た実質的な
// 抽選は「1/229.9で当たり、当たった後の振り分けで行き先が決まる」という
// 構造と等価なため、本実装ではjudgmentGateを使わず、合算値1/229.9をそのまま
// 1段の確率として扱った。
//
// ヘソ入賞時（特図1・通常時）の振り分け（図柄揃い時の円グラフより）:
//   ・約1500個→UG-RUSH(時短、120回、確率1/399.61)：23.5%
//   ・約1500個→UG-RUSH(ST、120回、確率1/84.1)：6.5%
//   ・約1500個＋UC（アルティメットチャージ）の獲得分→UG-RUSH(ST)：70.0%
// 6.5+70.0=76.5%が「図柄揃い時LT(=UG-RUSH(ST))突入率」と一致する。
// 「約3000個～約9000個」という表示の70.0%枠は、脚注「9000個=初当たり時の
// 1500個とUCでの最大獲得個数7500個（1500個×5回の合算）」の通り、必ず1500個の
// 初当たりに続けてUC（下記）へ突入し、その結果を加算した合計値だと分かる。
//
// UG-RUSH(ST)中（電チュー入賞時・特図2、確率1/84.1）の振り分け:
//   ・約1500個→継続：50.0%
//   ・UC（アルティメットチャージ）の獲得分そのもの→継続：50.0%
// UC期待出玉（電チュー入賞時・特図2、確率1/2）の内訳は、円グラフでは
// 約1500個(6.25%)・約3000個(25.0%)・約4500個(37.5%)・約6000個(25.0%)・
// 約7500個(6.25%)という二項分布型の表示になっている。実機は「1/2を4回試行し
// 成功回数で獲得個数が決まる」仕組みと推測されるが、エンジンには複数回試行の
// 成功数で後から出玉を決めるプリミティブが無いため、e-danberu2.js等と同じ
// 考え方で、最終的な出玉分布をそのまま1回のonHit outcomeとして扱った
// （統計的な結果は実機と一致する）。
// UG-RUSH(ST)の継続率約76.2%は、素の1-(1-1/84.1)^120≈76.2%と完全に一致する
// ため、残保留等の引き戻しの無いシンプルな規定回数countDownで再現できる。
//
// 【UG-RUSH(時短)中の当選時の出玉は未公開のため、1500個を仮定】
// この機種のあらゆる公表された当たりが1500個の整数倍（1500/3000/4500/6000/7500/9000）
// になっているため、時短中の当選もこの「1単位＝1500個」に従うと考え、最小単位の
// 1500個を割り当てた（他の値を示す情報が無いため、確証のある推測ではなく
// 整合性に基づく仮定である点に注意）。時短での引き戻し率（約26%、UG-RUSH(ST)へ
// 移行）は、素の1-(1-1/399.61)^120≈26.0%とほぼ一致するため、countDownの
// onHitで直接UG-RUSH(ST)へ遷移させる形でそのまま再現できる。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（比率14/15。1500→1400、3000→2800、
// 4500→4200、6000→5600、7500→7000、9000→8400）。
//
// 【2Rについて】
// スペック表には「ラウンド 10R/2R」とあるが、確認できた3枚の円グラフは
// いずれも10R（1500個）単位の当たりのみで、2R（300個）が使われる場面を
// 見つけられなかった。payoutTableには記録として残すが、onHitでは使用していない。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダーライン」は「現在調査中」で未公開のため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-dekasuta-godzilla",
  slug: "e-dekasuta-godzilla",
  name: "デカスタeGODZILLA7 超震撼ver.",
  nameKana: "でかすたいーごじらせぶんちょうしんかんばー",
  aliases: ["デカスタゴジラ", "eGODZILLA7", "ゴジラパチンコ", "UG-RUSH"],
  manufacturer: { id: "newgin", name: "newgin（ニューギン）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（スマパチ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/229.9（震撼ジャッジメント経由＋Gチャージの合算値）",
    "UG-RUSH(ST)中の当選確率：1/84.1、UG-RUSH(時短)中の当選確率：1/399.61",
    "UG-RUSH：いずれも120回、ST継続率約76.2%",
    "図柄揃い時のUG-RUSH(ST)突入率：約76.5%",
    "通常時の振り分け：実獲得約1400個でUG-RUSH(時短)へが23.5%、実獲得約1400個でUG-RUSH(ST)へが6.5%、実獲得約1400個＋UC獲得分でUG-RUSH(ST)へが70.0%",
    "UG-RUSH(ST)中の振り分け：実獲得約1400個で継続が50.0%、UC（アルティメットチャージ）獲得分で継続が50.0%",
    "UCの獲得分（期待出玉）：実獲得約1400個が6.25%、約2800個が25.0%、約4200個が37.5%、約5600個が25.0%、約7000個が6.25%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 229.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.235,
            rounds: 10,
            balls: 1400,
            nextState: "jitan",
            tag: "toJitan",
            resultNote: "UG-RUSH(時短)",
          },
          {
            weight: 0.065,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "toRushDirect",
            resultNote: "UG-RUSH(ST)",
          },
          {
            weight: 0.04375,
            rounds: 10,
            balls: 2800,
            displayRounds: 20,
            nextState: "rush",
            tag: "toRushUc1500",
            resultNote: "UG-RUSH(ST)＋UC",
          },
          {
            weight: 0.175,
            rounds: 10,
            balls: 4200,
            displayRounds: 30,
            nextState: "rush",
            tag: "toRushUc3000",
            resultNote: "UG-RUSH(ST)＋UC",
          },
          {
            weight: 0.2625,
            rounds: 10,
            balls: 5600,
            displayRounds: 40,
            nextState: "rush",
            tag: "toRushUc4500",
            resultNote: "UG-RUSH(ST)＋UC",
          },
          {
            weight: 0.175,
            rounds: 10,
            balls: 7000,
            displayRounds: 50,
            nextState: "rush",
            tag: "toRushUc6000",
            resultNote: "UG-RUSH(ST)＋UC",
          },
          {
            weight: 0.04375,
            rounds: 10,
            balls: 8400,
            displayRounds: 60,
            nextState: "rush",
            tag: "toRushUc7500",
            resultNote: "UG-RUSH(ST)＋UC",
          },
        ],
      },
      onExhausted: null,
    },

    jitan: {
      id: "jitan",
      label: "UG-RUSH(時短)",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 399.61,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "jitanPullback",
            resultNote: "UG-RUSH(ST)",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanEnd", resultLabel: "UG-RUSH(時短)終了" },
    },

    rush: {
      id: "rush",
      label: "UG-RUSH(ST)",
      mode: "countDown",
      maxAttempts: 120,
      probability: 1 / 84.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "rush", tag: "continueDirect" },
          {
            weight: 0.03125,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "continueUc1500",
            resultNote: "UC",
          },
          {
            weight: 0.125,
            rounds: 10,
            balls: 2800,
            displayRounds: 20,
            nextState: "rush",
            tag: "continueUc3000",
            resultNote: "UC",
          },
          {
            weight: 0.1875,
            rounds: 10,
            balls: 4200,
            displayRounds: 30,
            nextState: "rush",
            tag: "continueUc4500",
            resultNote: "UC",
          },
          {
            weight: 0.125,
            rounds: 10,
            balls: 5600,
            displayRounds: 40,
            nextState: "rush",
            tag: "continueUc6000",
            resultNote: "UC",
          },
          {
            weight: 0.03125,
            rounds: 10,
            balls: 7000,
            displayRounds: 50,
            nextState: "rush",
            tag: "continueUc7500",
            resultNote: "UC",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "UG-RUSH(ST)終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
