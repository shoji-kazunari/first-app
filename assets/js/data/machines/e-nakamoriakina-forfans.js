// 第110号機: e中森明菜・歌姫伝説～FORFANS～（2026年 D-light（ディ・ライト）
// ST機/スマパチ/ミドル）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_nakamoriakina_forfans/）。当選時の
// 振り分けは、同ページに掲載されている2枚の円グラフ画像（初当たり時・ST/時短中）を
// ダウンロードしてReadツールで直接読み取った実数値。
//
// 基本スペック（スペック表より）:
//   大当り確率  通常時 1/319.7 ／ 高確率時（ST中） 1/85.6
//   ST突入率  100%  ／  ST継続率 約70%（残保留4個での引き戻しを含む、ST100回）
//   ラウンド 10R/7R/4R ／ 賞球数 2&1&3&10&15
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個) / 7R=約700個(約630個) /
//                              4R=約400個(約360個)
//
// 初当たり時（特図1・特図2合算、確率1/319.7）の振り分け（いずれもST100回へ、
// ST突入率100%と一致）:
//   ・4R大当り(約400個)：50.0%
//   ・10R大当り(約1500個)：24.0%
//   ・7R大当り(約700個)：26.0%
// ST・時短中（右打ち中、確率1/85.6）の振り分け（いずれもST継続・ST100回）:
//   ・4R大当り(約400個)：33.0%
//   ・10R大当り(約1500個)：34.0%
//   ・7R大当り(約700個)：33.0%
//   継続率約70%は、素の1-(1-1/85.6)^100≈69.1%とほぼ一致するため、残保留等の
//   引き戻しの無いシンプルな規定回数countDownで再現できる。
//
// 【「スタンプラリーシステム」は実装していない】
// 実機は「1回のST中に10R・7R・4Rの大当たり全種類を獲得すると、ST消化後に
// 時短100回へ移行する」という業界初システムを搭載している。ただし振り分け
// 円グラフにはこの移行自体の確率が出ておらず（全種類獲得は複数回の大当たりに
// またがる条件のため、1回の抽選の重みでは表現できない）、全種類獲得の
// 達成率も1geki.jpに掲載が無い。達成率を推測で埋めることはせず、この
// シミュレーターでは「ST消化後は通常へ戻る」のみを実装し、時短100回ボーナスは
// 再現していない（確認でき次第、追加を検討する）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R→1400個、7R→630個、4R→360個。
// 7R・4Rは9/10、10Rは14/15とラウンドにより比率が異なる点に注意）。
//
// 【spinsPer1000Yenについて】
// ページの「ボーダーライン」は「現在調査中」で未公開のため、既定値の16を使用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-nakamoriakina-forfans",
  slug: "e-nakamoriakina-forfans",
  name: "e中森明菜・歌姫伝説～FORFANS～",
  nameKana: "いーなかもりあきなうたひめでんせつふぉーふぁんず",
  aliases: ["中森明菜パチンコ", "歌姫伝説", "FORFANS", "中森明菜 FORFANS"],
  manufacturer: { id: "dlight", name: "D-light（ディ・ライト）" },
  releaseYear: 2026,
  releaseDate: "2026-10-05",
  category: "パチンコ（ST機・スマパチ・ミドル）",

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
