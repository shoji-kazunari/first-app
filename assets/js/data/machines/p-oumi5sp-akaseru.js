// P大海物語5スペシャル 赤セルver.
// （2026年12月7日導入 SANYO ミドル/確変ループ/遊タイム）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_oumi5sp_akaseru/、最終更新日2026年11月18日）。
// 型式名 P大海物語5スペシャルALTA2（検定番号6P0107）。スペック表と本文はWebFetchで取得した。
// このページが表示している円グラフとゲームフロー図は、画像のパスがe版と同じ
// （images.1geki.jp/machines/pachinko/e_oumi5sp_yutime/ 配下の e_oumi5sp_yutime_en と
// e_oumi5sp_yutime_gameflow3）で、ダウンロードしてReadツールで直接読み取った。
// 本文も「ヘソ入賞時（特図１）と電チュー入賞時（特図２）で出玉振り分けは共通」「確変割合約54%」
// とe版と同じ記載で、スペック表（確率・ラウンド・時短・遊タイム）もe版と一致する。
// ※e大海物語5スペシャル 319遊タイムver.（e-oumi5sp-yutime.js）と数値は同一。
//
// 基本スペック（本文のスペック表）:
//   大当たり確率 通常時 約1/319.6 ／ 右打ち中 約1/31.9
//   確変割合 約54%（確変は次回まで）
//   ラウンド 10R ／ 払い出し(実獲得) 10R 約1500個(約1400個)
//   時短・電サポ 100回 or 200回※1 or 次回まで（※1 時短中の通常大当たり後は時短200回）
//   遊タイム 350回【低確率950回消化で発動】（遊タイムの発動は大当たり間で1回のみ）
//
// 振り分け（円グラフ en、ヘソ入賞時 特図1／電チュー入賞時 特図2 共通、通常時・時短中・確変中で共通）:
//   ・10R 約1500個 → 確率変動（次回まで）：54%
//   ・10R 約1500個 → 通常（時短100回 or 200回）：46%
//     （円グラフの注記「時短中の通常大当たり時は時短200回」＝BIGアシストシステム）
// ゲームフロー図より: 奇数図柄揃いは10R確変、偶数図柄揃いは10R通常or確変。
// 確変の継続率は64%、大当たり出玉はオール1500個。
//
// 【状態の組み立て】
//   通常（1/319.6）→ 54%確変 / 46%時短100回
//   確変（次回まで、1/31.9）→ 54%確変 / 46%時短100回
//   時短100回（1/319.6）→ 当たれば 54%確変 / 46%時短200回、外しきれば通常
//   時短200回（1/319.6）→ 当たれば 54%確変 / 46%時短200回、外しきれば通常
//   時短の回数による引き戻し: 1-(1-1/319.6)^100 ≈ 26.9%、^200 ≈ 46.6%
//
// 【迷った箇所】
// ・遊タイム（低確率950回消化で時短350回、発動は大当たり間で1回のみ）は、
//   状態エンジンのyutime機能で実装した。通常・時短100回・時短200回（いずれも低確率）を
//   countsTowardYutimeにして回転数を状態をまたいで積算し、950回に達したら遊タイム
//   （時短350回、1/319.6）へ移る。950回まで当たらない確率は(1-1/319.6)^950 ≈ 5.1%。
//   検算: 遊タイム350回で当たる確率 1-(1-1/319.6)^350 ≈ 66.6%（公表の「遊タイム発動時の
//   大当たり期待値 約66.6%」と一致）。
//   遊タイム中の当たりの振り分けは、円グラフ（通常時・時短中・確変中で共通）の54%/46%。
//   遊タイムは時短なので、通常当たりの後はスペック表の注記「時短中の通常大当たり後は
//   時短200回」に従って時短200回へ移す。
// ・ゲームフロー図の「継続率64%」は、上記の素直な組み立てから計算すると
//   確変→確変の直接継続54%、時短100回の引き戻し込みで約66%、最終的に確変へ戻る確率で
//   約62.5%となり、どの定義でも64%ちょうどにはならなかった。1gekiに継続率の定義の
//   記載が無いため、数値は円グラフ・スペック表の値をそのまま使い、64%はrulesに
//   公表値として載せるだけにした。
//
// 【出玉は「実獲得個数」を採用】10R 約1500個 → 実獲得約1400個。
// 【spinsPer1000Yen】デカヘソ等の記載が無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-oumi5sp-akaseru",
  slug: "p-oumi5sp-akaseru",
  name: "P大海物語5スペシャル 赤セルver.",
  nameKana: "ぴーおおうみものがたりふぁいぶすぺしゃる あかせるばーじょん",
  aliases: ["大海5SP赤セル", "大海5赤セル", "大海物語5スペシャル", "大海5スペシャル", "大海5", "海物語", "赤セル"],
  manufacturer: { id: "sanyo", name: "SANYO（三洋物産）" },
  releaseYear: 2026,
  releaseDate: "2026-12-07",
  category: "パチンコ（ミドル・確変ループ・遊タイム）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "『大海物語5スペシャル』を受け継ぎ、遊タイムを加えた赤セル版。当たりはすべて10R約1500個で、その54%が次回まで続く確変。通常当たりでも時短100回が付き、時短中に通常当たりを引くと時短200回にアップするBIGアシストシステムも健在で、引き戻しのチャンスが厚い。低確率で950回ハマると遊タイム（時短350回）が発動し、約66.6%で救済される。",
  rules: [
    "通常時大当たり確率：約1/319.6",
    "右打ち中（確変中）大当たり確率：約1/31.9",
    "確変割合：約54%（確変は次回まで）",
    "大当たりはすべて10R・実獲得約1400個（払い出し約1500個）",
    "大当たり振り分け（通常時・時短中・確変中で共通）：確変（次回まで）が54%、通常（時短付き）が46%",
    "通常大当たり後は時短100回。時短中に通常大当たりを引いた場合は時短200回（BIGアシストシステム）",
    "確変継続率：約64%（ゲームフロー図の公表値）",
    "遊タイム：低確率状態（通常・時短）を950回消化すると時短350回（大当たり間で1回のみ）。遊タイム中に当たる確率は約66.6%",
    "遊タイム中の通常大当たり後も時短200回（時短中の通常大当たりと同じ扱い）",
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
      countsTowardYutime: true,
      onHit: {
        outcomes: [
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "kakuhen", tag: "toKakuhen", resultNote: "確変" },
          { weight: 0.46, rounds: 10, balls: 1400, nextState: "jitan100", tag: "toJitan100", resultNote: "時短100回" },
        ],
      },
      onExhausted: null,
    },

    kakuhen: {
      id: "kakuhen",
      label: "確変",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 31.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "kakuhen", tag: "kakuhenContinue", resultNote: "確変" },
          { weight: 0.46, rounds: 10, balls: 1400, nextState: "jitan100", tag: "kakuhenToJitan", resultNote: "時短100回" },
        ],
      },
      onExhausted: null,
    },

    jitan100: {
      id: "jitan100",
      label: "時短100回",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      countsTowardYutime: true,
      onHit: {
        outcomes: [
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "kakuhen", tag: "jitan100ToKakuhen", resultNote: "引き戻し・確変" },
          { weight: 0.46, rounds: 10, balls: 1400, nextState: "jitan200", tag: "jitan100ToJitan200", resultNote: "引き戻し・時短200回" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitan100End", resultLabel: "時短終了" },
    },

    jitan200: {
      id: "jitan200",
      label: "時短200回",
      mode: "countDown",
      maxAttempts: 200,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      countsTowardYutime: true,
      onHit: {
        outcomes: [
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "kakuhen", tag: "jitan200ToKakuhen", resultNote: "引き戻し・確変" },
          { weight: 0.46, rounds: 10, balls: 1400, nextState: "jitan200", tag: "jitan200Again", resultNote: "引き戻し・時短200回" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "jitan200End", resultLabel: "時短終了" },
    },

    yutime: {
      id: "yutime",
      label: "遊タイム（時短350回）",
      mode: "countDown",
      maxAttempts: 350,
      probability: 1 / 319.6,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.54, rounds: 10, balls: 1400, nextState: "kakuhen", tag: "yutimeToKakuhen", resultNote: "遊タイムで当選・確変" },
          { weight: 0.46, rounds: 10, balls: 1400, nextState: "jitan200", tag: "yutimeToJitan200", resultNote: "遊タイムで当選・時短200回" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "yutimeEnd", resultLabel: "遊タイム終了" },
    },
  },

  // 遊タイム: 低確率状態を950回消化で時短350回（大当たり間で1回のみ）
  yutime: { triggerSpins: 950, nextState: "yutime", tag: "yutimeStart", resultLabel: "遊タイム突入（時短350回）" },

  distributionTables: {},

  payoutTable: { 10: 1400 },
});
