// eフィーバー妖怪ウォッチ（2026年11月2日導入 SANKYO スマパチ/Lv.4/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_youkai_watch/）。型式名 eフィーバー妖怪ウォッチR
// （検定番号610769）。スペック表と注記はWebFetchで本文から取得し、振り分けは同ページの
// 画像5枚（通常時の円グラフ e_youkai_watch_gazou70、ヨーデルSONIC怪闘中の円グラフ gazou71、
// コマチャレンジ／最終決戦の円グラフ gazou72、ウバウネ決戦出玉内訳 gazou69、
// ゲームフロー図 gazou65）を images.1geki.jp からダウンロードし、Readツールで直接読み取った。
//
// 基本スペック:
//   大当り確率 通常時 約1/319.7 ／ ヨーデルSONIC怪闘中の図柄揃い 約1/41.9 ／
//   コマチャレンジ中の図柄揃い 約1/399
//   出玉 10R=約1500個(実獲得約1400個) / 2R=約300個(約280個)
//   ヨーデルSONIC怪闘（RUSH）: 時短10000回の転落タイプ。最終決戦発展 約1/88.0、最終決戦勝率 約1/4.0
//   コマチャレンジ: 時短100回（引き戻し率約22%）
//   RUSH継続率約74%＋コマチャレンジ引き戻し約22%＝トータル継続率約80%
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou70）:
//   ・10R大当り×2(約3000個)→ヨーデルSONIC怪闘：約0.5%（7図柄揃い）
//   ・2R大当り(約300個)→ヨーデルSONIC怪闘：約49.5%（真打FEVER＋妖怪ガシャチャレンジ成功）
//   ・2R大当り(約300個)→コマチャレンジ（時短100回）：約50.0%（ガシャチャレンジ失敗）
// 電チュー入賞時（特図2・ヨーデルSONIC怪闘中）の振り分け（gazou71、すべてSONIC怪闘継続）:
//   ・10R大当り(約1500個)：約49.3%
//   ・10R大当り(約1500個)・ピン刺しチャンス失敗：約22.3%
//   ・10R大当り×2(約3000個)・ピン刺しチャンス成功：約19.2%
//   ・10R大当り×2(約3000個)・エンマインパクト：約3.5%
//   ・10R大当り×2＋α(約3000個＋α)・ウバウネ決戦：約5.7%
// ウバウネ決戦の出玉内訳（gazou69）:
//   約3000個 50.0% ／ 約4500個 25.0% ／ 約6000個 12.5% ／ 約7500個 6.25% ／ 約9000個以上 6.25%
//   本文「勝利で1500個上乗せし継続、敗北でヨーデルSONIC怪闘」とあわせ、これは
//   「3000個確定＋50%で1500個上乗せを外すまで繰り返す」幾何分布そのもの
//   （P(3000)=0.5、P(4500)=0.25、…、P(9000以上)=0.5^4=6.25%）。そのため
//   bonusLoop（probability 0.5、+1400個）で表した。9000個以上の部分も含めて内訳と一致する。
// 電チュー入賞時（特図2・コマチャレンジ／最終決戦）の振り分け（gazou72）:
//   ・10R大当り(約1500個)→ヨーデルSONIC怪闘：100%
//
// 【検算・RUSHの組み立て方】
// 注記※2: 「普電ロング開放①発生率（約1/47.6）と、②発生率（約1/88.0）からの引き戻し率
// （特図2 1回転の引き戻し期待度 約25%）の合算」。①は大当りへ、②は最終決戦（1回転の
// ガチ抽選）へつながる。
//   図柄揃い確率: 1/47.6＋(1/88.0)×0.25 ≈ 1/41.93 → 公表の約1/41.9と一致
//   RUSH継続率: (1/47.6)/((1/47.6)+(1/88.0)) ≈ 64.9%、＋35.1%×25% ≈ 73.7% → 公表約74%
//   コマチャレンジ: 1-(1-1/399)^100 ≈ 22.2% → 公表約22%
//   トータル: 73.7%＋26.3%×22.2% ≈ 79.5% → 公表約80%
// よって、SONIC怪闘は「当り1/47.6・転落（最終決戦発展）1/88.0」のonFall状態、
// 最終決戦は「1回転・当選1/4」の状態、外れたらコマチャレンジ（時短100回・1/399）とした。
// stateEngineは大当りを外した回転でのみ転落を抽選するため、実際の比率は
// (1/47.6)/((1/47.6)+(1-1/47.6)/88.0) ≈ 65.4%（継続率≈74.0%）となり、公表値の範囲内。
//
// 【仮定を置いた箇所（確証のある数値ではない）】
// ・コマチャレンジ（時短100回）を外し切ったあとの移行先は本文・フロー図とも明記が無い。
//   時短が尽きれば通常時へ戻ると解釈した。
// ・スペック表の時短回数「100回 or 10000回」のうち10000回はSONIC怪闘（転落で終わる
//   ため実質上限なし）と解釈した。
//
// 【実装していないもの】
// ・レジェンドヨーデルエクストラ（SONICバトル後のピン刺しチャンス成功）は、上の
//   「ピン刺しチャンス成功 10R×2」に含まれていると判断し、別枠にはしていない
// ・遊タイム、デカヘソの記載は無い
//
// 【出玉は「実獲得個数」を採用】10R→1400個、10R×2→2800個、2R→280個、
// ウバウネ決戦の上乗せ1500個→1400個。
// 【spinsPer1000Yen】ボーダー・デカヘソ等の記載が無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-youkai-watch",
  slug: "e-youkai-watch",
  name: "eフィーバー妖怪ウォッチ",
  nameKana: "いーふぃーばーようかいうぉっち",
  aliases: ["妖怪ウォッチ", "妖怪ウォッチパチンコ", "e妖怪ウォッチ", "ヨーデルSONIC怪闘", "コマチャレンジ", "ウバウネ決戦"],
  manufacturer: { id: "sankyo", name: "SANKYO（三共）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・Lv.4・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "RUSH「ヨーデルSONIC怪闘」は転落タイプで、転落を引いても1回転だけの最終決戦（勝率1/4）で踏みとどまれる。負けても時短100回のコマチャレンジで引き戻しを狙える二重の救済付き。RUSH中の当りの5.7%は、勝つたびに1500個を上乗せし続けるウバウネ決戦。",
  rules: [
    "通常時大当り確率：約1/319.7",
    "ヨーデルSONIC怪闘中の図柄揃い確率：約1/41.9（大当り直結の普電ロング開放①約1/47.6＋最終決戦からの勝利分）",
    "ヨーデルSONIC怪闘：転落タイプ。最終決戦発展約1/88.0、最終決戦（1回転）の勝率約1/4、RUSH継続率約74%",
    "コマチャレンジ：時短100回（図柄揃い約1/399）、引き戻し率約22%。トータル継続率約80%",
    "通常時の振り分け（ヘソ入賞時）：10R×2・実獲得約2800個でSONIC怪闘が約0.5%、2R・実獲得約280個でSONIC怪闘が約49.5%、2R・実獲得約280個でコマチャレンジが約50.0%",
    "SONIC怪闘中の振り分け（電チュー入賞時）：10R・実獲得約1400個が約49.3%、10R（ピン刺し失敗）が約22.3%、10R×2・実獲得約2800個（ピン刺し成功）が約19.2%、10R×2（エンマインパクト）が約3.5%、ウバウネ決戦（10R×2＋α）が約5.7%",
    "ウバウネ決戦：約2800個＋50%で約1400個上乗せを外すまで繰り返す（約3000個50%・約4500個25%・約6000個12.5%・約7500個6.25%・約9000個以上6.25%）",
    "コマチャレンジ・最終決戦中の当りは10R・実獲得約1400個でSONIC怪闘へ",
    "最終決戦に敗北するとコマチャレンジへ、コマチャレンジを外し切ると通常へ",
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
          {
            weight: 0.005,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "sonic",
            tag: "toSonic7",
            resultNote: "7図柄揃い・ヨーデルSONIC怪闘",
          },
          { weight: 0.495, rounds: 2, balls: 280, nextState: "sonic", tag: "toSonic2R", resultNote: "ヨーデルSONIC怪闘" },
          { weight: 0.5, rounds: 2, balls: 280, nextState: "komaChallenge", tag: "toKoma", resultNote: "コマチャレンジ" },
        ],
      },
      onExhausted: null,
    },

    sonic: {
      id: "sonic",
      label: "ヨーデルSONIC怪闘",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 47.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.493, rounds: 10, balls: 1400, nextState: "sonic", tag: "sonic1500" },
          { weight: 0.223, rounds: 10, balls: 1400, nextState: "sonic", tag: "sonicPinFail", resultNote: "ピン刺しチャンス失敗" },
          {
            weight: 0.192,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "sonic",
            tag: "sonicPinSuccess",
            resultNote: "ピン刺しチャンス成功",
          },
          {
            weight: 0.035,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "sonic",
            tag: "sonicEnma",
            resultNote: "エンマインパクト",
          },
          {
            weight: 0.057,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "sonic",
            tag: "sonicUbaune",
            resultNote: "ウバウネ決戦",
            bonusLoop: { probability: 0.5, balls: 1400 },
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 88.0,
        nextState: "finalBattle",
        tag: "sonicFall",
        resultLabel: "最終決戦へ",
      },
    },

    finalBattle: {
      id: "finalBattle",
      label: "最終決戦",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 4.0,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 10, balls: 1400, nextState: "sonic", tag: "finalWin", resultNote: "最終決戦勝利・ヨーデルSONIC怪闘" },
        ],
      },
      onExhausted: { nextState: "komaChallenge", tag: "finalLose", resultLabel: "最終決戦敗北・コマチャレンジへ" },
    },

    komaChallenge: {
      id: "komaChallenge",
      label: "コマチャレンジ",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 399,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 1, rounds: 10, balls: 1400, nextState: "sonic", tag: "komaWin", resultNote: "ヨーデルSONIC怪闘" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "komaEnd", resultLabel: "コマチャレンジ終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
