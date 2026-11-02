// 第115号機: eプリンセス・プリンシパル（2026年 HEIWA（平和） スマパチ/ラッキートリガー3.0/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_pripri/）。導入日2026年11月2日（本日）。
// WebFetchでページ本文を取得した上で、大当り振り分けの円グラフ画像3枚
// （通常時／SPY RUSH 1〜10回転目／SPY RUSH 11〜14回転目）を
// https://images.1geki.jp/machines/pachinko/e_pripri/ からダウンロードし、
// Readツールで直接読み取って実数値を確認した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/319.6）の振り分け:
//   ・10R大当り(約1500個)→通常のまま（時短なし）：50.0%
//   ・10R大当り(約1500個)→SPY RUSH(ST14回)へ：50.0%
// （本文の「ST突入率50%」と完全一致）
//
// SPY RUSH 1〜10回転目（特図2・電チュー入賞時、当選確率1/10.6）の振り分け:
//   ・10R大当り(約1500個)→SPY RUSH(ST14回、最初から再抽選)：50.0%
//   ・10R×7大当り(約10500個、1500個×7)→SPY RUSH(ST14回)：25.0%
//   ・10R×4大当り(約6000個、1500個×4)→SPY RUSH(ST14回)：25.0%
// SPY RUSH 11〜14回転目（特図2・電チュー入賞時、同確率）の振り分け:
//   ・10R大当り(約1500個)→SPY RUSH(ST14回)：約34.0%
//   ・ST RESET（出玉無し）→SPY RUSH(ST14回)：約66.0%
//
// 【SPY RUSHを2状態に分けた理由】
// 1〜10回転目と11〜14回転目で当り時の振り分け円グラフが別に用意されており、
// 当選確率自体は共通（1/10.6）だが出玉の振り分け比率が異なる。そのため
// spyRush1（countDown 10）→（10回とも外れたら）spyRush2（countDown 4）という
// 2状態のチェーンにし、どちらで当っても出玉を払い出した上でspyRush1（14回の
// フルRUSH）へ戻す形にした。これはe-tokyorevengers.js・p-toaruindex2.jsで
// 既に使われている「ST回数リセットはnextStateを自身（または先頭の状態）に
// 戻すだけ」という手法の応用で、11〜14回転目の「ST RESET」（出玉無し）も
// balls:0の当り枝として素直に表現できる（e-akudamadrive.jsのstReset枝と同じ
// 扱い）。
//
// 【継続率の裏付け】
// この設計で理論継続率を計算すると、spyRush1（10回）を1発も当てずに抜ける確率が
// (1-1/10.6)^10≈37.1%、続くspyRush2（4回）も1発も当てずに抜ける確率が
// (1-1/10.6)^4≈67.3%。両方外れて通常に戻る確率は0.371×0.673≈25.0%となり、
// 継続率は1-0.250=75.0%で、スペック表の「ST継続率約75%」と完全に一致した。
// この一致により、「どちらのブロックで当ってもSPY RUSH(14回)の頭に戻る」という
// 読み取りが正しいと判断した。
//
// 【迷った点・未実装】
// ・1000円あたりの回転数は本文に記載が無いため既定値16を採用（「回ることを
//   ウリにしている」旨の記載も無い）。
// ・時短の有無は本文に記載が無く、スペック表にも数値が無いため実装していない
//   （通常時の大当りで時短に入らない前提で、50%はそのまま通常へ戻す）。
// ・ボーダー/交換率は「現在調査中」と明記されており、確定値が無いため未使用。
// ・出玉は「実獲得個数」の記載が無く、払い出し個数（約1500個）をそのまま採用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-pripri",
  slug: "e-pripri",
  name: "eプリンセス・プリンシパル",
  nameKana: "いーぷりんせすぷりんしぱる",
  aliases: ["プリプリ", "プリンセスプリンシパル", "プリプリパチンコ", "eプリプリ", "SPY RUSH"],
  manufacturer: { id: "heiwa", name: "HEIWA（平和）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・Lv.4・ラッキートリガー3.0・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "ヘソの大当りはちょうど五分でSPY RUSH（ST14回）へ突入する素直な構成。RUSH前半10回は当れば即10500個・6000個も狙える高配当枠、後半4回は出玉無しのリセットを挟みつつもほぼ必ずRUSHの頭に戻る粘り強さがあり、トータル継続率は約75%とかなり高水準。",
  rules: [
    "通常時大当り確率：1/319.6",
    "SPY RUSH中の当選確率：約1/10.6",
    "SPY RUSH：ST14回（1〜10回転目＋11〜14回転目の2ブロック）、継続率約75%",
    "SPY RUSH突入率：50%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・約1500個で通常のままが50.0%、10R・約1500個でSPY RUSHへが50.0%",
    "SPY RUSH 1〜10回転目の当選振り分け：10R・約1500個で継続が50.0%、10R×7・約10500個で継続が25.0%、10R×4・約6000個で継続が25.0%",
    "SPY RUSH 11〜14回転目の当選振り分け：10R・約1500個で継続が約34.0%、ST RESET（出玉無し）で継続が約66.0%",
    "SPY RUSH（1〜10回転目・11〜14回転目とも）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1500, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1500,
            nextState: "spyRush1",
            tag: "toSpyRush",
            resultNote: "SPY RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    spyRush1: {
      id: "spyRush1",
      label: "SPY RUSH",
      mode: "countDown",
      maxAttempts: 10,
      probability: 1 / 10.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1500, nextState: "spyRush1", tag: "continue1500" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 70,
            balls: 10500,
            nextState: "spyRush1",
            tag: "continue10500",
            resultNote: "10R×7",
          },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 40,
            balls: 6000,
            nextState: "spyRush1",
            tag: "continue6000",
            resultNote: "10R×4",
          },
        ],
      },
      onExhausted: { nextState: "spyRush2", tag: "spyRush1End" },
    },

    spyRush2: {
      id: "spyRush2",
      label: "SPY RUSH",
      mode: "countDown",
      maxAttempts: 4,
      probability: 1 / 10.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.34, rounds: 10, balls: 1500, nextState: "spyRush1", tag: "continue1500" },
          {
            weight: 0.66,
            rounds: 1,
            balls: 0,
            nextState: "spyRush1",
            tag: "stReset",
            resultNote: "ST RESET",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "spyRush2End", resultLabel: "SPY RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500 },
});
