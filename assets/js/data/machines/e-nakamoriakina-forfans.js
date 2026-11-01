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
// 【「スタンプラリーシステム」の実装について】
// 実機は「1回のST中に10R・7R・4Rの大当たり全種類を獲得すると、ST消化後に
// 時短100回へ移行する」という業界初システムを搭載している。1geki.jpの本文に
// 「一度のST中に10R・7R・4Rすべての大当たりを獲得することで、ST終了後に時短100回に
// 移行する」と明記されており、この移行自体は条件達成で確定（スタンプ3種が
// 揃えば100%）と判断し、stateEngine.jsに新設したstampCollection機構
// （ST状態に居続ける間だけ当たりtagを集め、規定回数消化時に全種類揃っていれば
// 通常のonExhaustedではなく時短100回へ振り替える）で再現した。
//
// ただし「時短100回」自体の中身は、以下の2点が1geki.jpに記載が無く確認できなかった。
// 依頼者に確認の上、次の仮定で実装している（将来1geki.jpに追記されたら差し替える）:
//   ・時短100回中の当選時の4R/7R/10R振り分け　→　確率が通常時と同じ1/319.7のため、
//     通常時と同じ振り分け（4R 50.0%／10R 24.0%／7R 26.0%）を仮置き
//   ・時短100回を1回も当たらず消化した場合の行き先　→　他機種と同じ慣例に合わせ、
//     通常へ戻る想定
// 時短100回中に当選した場合の移行先（STへ）は「消化後は必ずSTへと移行する」と
// 明記されており、これは確認済みの数値。
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

  highlights: "ST中も通常時も4R・7R・10Rの3種類の当りが毎回抽選され、どのラウンドを引くかで出玉のリズムが変わる。ST突入率100%で、継続率約70%の粘り強さも併せ持つ。業界初の「スタンプラリーシステム」で、1回のST中に3種類すべての大当たりを引き切れば時短100回のボーナスが待っている。",
  rules: [
    "通常時大当り確率：1/319.7",
    "ST中の当選確率：1/85.6",
    "ST：100回、継続率約70%（残保留4個での引き戻し込み）",
    "ST突入率：100%",
    "初当たり時の振り分け（いずれもST100回へ）：4R・実獲得約360個が50.0%、10R・実獲得約1400個が24.0%、7R・実獲得約630個が26.0%",
    "ST中の当選振り分け（いずれも継続）：4R・実獲得約360個が33.0%、10R・実獲得約1400個が34.0%、7R・実獲得約630個が33.0%",
    "1回のST中に4R・7R・10Rの大当たり全種類を獲得すると、ST消化後に時短100回へ移行（業界初スタンプラリーシステム）",
    "時短100回中の当選確率は通常時と同じ1/319.7。消化後は必ずSTへ移行し、1回も当たらず消化した場合は通常に戻る",
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
      stampCollection: {
        requiredTags: ["continue4R", "continue10R", "continue7R"],
        tagLabels: { continue4R: "4R", continue10R: "10R", continue7R: "7R" },
        completeNextState: "jitan100",
        completeTag: "stampComplete",
        completeResultLabel: "スタンプ達成！時短100突入",
      },
    },

    jitan100: {
      id: "jitan100",
      label: "時短100",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, balls: 360, nextState: "rush", tag: "jitanToRush4R", resultNote: "ST" },
          { weight: 0.24, rounds: 10, balls: 1400, nextState: "rush", tag: "jitanToRush10R", resultNote: "ST" },
          { weight: 0.26, rounds: 7, balls: 630, nextState: "rush", tag: "jitanToRush7R", resultNote: "ST" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitanEnd", resultLabel: "時短終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 7: 630, 4: 360 },
});
