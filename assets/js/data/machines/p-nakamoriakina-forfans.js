// 第111号機: P中森明菜・歌姫伝説～FORFANS～（2026年 D-light（ディ・ライト）
// ST機/ミドル）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_nakamoriakina_forfans/）。
// e中森明菜・歌姫伝説～FORFANS～（e-nakamoriakina-forfans.js）と同日導入の姉妹機で、
// 確率・ラウンド構成・振り分け・ST仕様はすべて同一（型式名・検定番号のみ別、
// カテゴリはスマパチ表記が無い通常ぱちんこ）。振り分けの円グラフ画像
// （初当たり時・ST/時短中）もダウンロードしてReadツールで直接確認し、e版と
// 完全に一致することを確認済み。詳しい出典・計算根拠はe版のコメントを参照。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 1/319.7 ／ 高確率時（ST中） 1/85.6
//   ST突入率  100%  ／  ST継続率 約70%（残保留4個での引き戻しを含む、ST100回）
//   ラウンド 10R/7R/4R ／ 賞球数 2&1&3&10&15
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個) / 7R=約700個(約630個) /
//                              4R=約400個(約360個)
//
// 【「スタンプラリーシステム」は実装していない】e版と同じ理由（達成率非公開）。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダーライン」は「現在調査中」で未公開のため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-nakamoriakina-forfans",
  slug: "p-nakamoriakina-forfans",
  name: "P中森明菜・歌姫伝説～FORFANS～",
  nameKana: "ぴーなかもりあきなうたひめでんせつふぉーふぁんず",
  aliases: ["中森明菜パチンコ", "歌姫伝説", "FORFANS", "中森明菜 FORFANS"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（ST機・ミドル）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/319.7",
    "ST中の当選確率：1/85.6",
    "ST：100回、継続率約70%（残保留4個での引き戻し込み）",
    "ST突入率：100%",
    "初当たり時の振り分け（いずれもST100回へ）：4R・実獲得約360個が50.0%、10R・実獲得約1400個が24.0%、7R・実獲得約630個が26.0%",
    "ST中の当選振り分け（いずれも継続）：4R・実獲得約360個が33.0%、10R・実獲得約1400個が34.0%、7R・実獲得約630個が33.0%",
    "実機は1回のST中に全種類の大当たりを獲得すると時短100回を獲得できるが、達成率が非公開のためこのシミュレーターでは未実装",
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
          { weight: 0.5, rounds: 4, balls: 360, nextState: "rush", tag: "toRush4R", resultNote: "ST" },
          { weight: 0.24, rounds: 10, balls: 1400, nextState: "rush", tag: "toRush10R", resultNote: "ST" },
          { weight: 0.26, rounds: 7, balls: 630, nextState: "rush", tag: "toRush7R", resultNote: "ST" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "ST",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 85.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.33, rounds: 4, balls: 360, nextState: "rush", tag: "continue4R" },
          { weight: 0.34, rounds: 10, balls: 1400, nextState: "rush", tag: "continue10R" },
          { weight: 0.33, rounds: 7, balls: 630, nextState: "rush", tag: "continue7R" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "ST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 7: 630, 4: 360 },
});
