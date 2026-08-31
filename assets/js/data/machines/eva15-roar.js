// 第10号機: 新世紀エヴァンゲリオン～未来への咆哮～（2021年 ビスティ V-ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_eva15roar/）。
// 「当選時の振り分け」の表（ヘソ入賞時・電チュー入賞時）に数値がそのまま
// 明記されていたため、円グラフ画像の読み取りは不要だった。
//
// 2021年導入の旧機種で、既に追加済みのeva17-hajimari.js（e新世紀エヴァンゲリオン
// ～はじまりの記憶～）の前作にあたる（1geki.jp自身が「シリーズ最新機種（後継機）へ」
// と本機のページから誘導している）。ただし今週のアクセスランキング6位に入っており
// まだ実働しているため別機種として追加した。
//
// ヘソ入賞時（特図1・通常時、低確率1/319.7）の大当り振り分け:
//   ・10R確変(約1500個)→IMPACT MODE(ST163回)：3.0%
//   ・3R確変(約450個)→IMPACT MODE(ST163回)：56.0%
//   ・3R通常(約450個)→チャンスタイム(時短100回)：41.0%
// 電チュー入賞時（特図2・IMPACT MODE中、高確率1/99.4）の振り分け:
//   ・10R確変(約1500個)→IMPACT MODE継続：100%
//
// 【チャンスタイム中の当選振り分けについて】
// 1geki.jpの表には「電サポ100回での引き戻し率約26.9%」という記載があり、
// チャンスタイム中にも当選が起こり、その一部がIMPACT MODEへの引き戻しになる
// ことが分かる。ただしチャンスタイム専用の振り分け表は無く、チャンスタイム中の
// 確率は通常時と同じ低確率（1/319.7）と明記されているため、このシミュレーターでは
// チャンスタイム中の当選もヘソ入賞時と同じ3.0%/56.0%/41.0%の振り分けを流用した
// （「3R通常」側は通常へは戻らずチャンスタイム自身を継続、という扱い）。
//
// 【入れなかった項目】
// ※4「3R通常はST中に当選した場合は500回」という注記があるが、どの遷移がこれに
// 該当するのか1geki.jpの表からは特定できなかった（電チュー入賞時の表はIMPACT MODE
// 継続100%のみで「3R通常」への分岐が無い）。このシミュレーターの状態遷移グラフでは
// 到達しない経路のため、チャンスタイムの規定回数は表に明記された100回のみを実装し、
// 500回のケースは実装していない。
//
// ※1「ST突入率約70%」・※2「ST継続率約81%」は、上記の直当り分（59%・約80.7%）に
// チャンスタイム中の引き戻し・残保留の引き戻しを加算した合算値。このシミュレーターは
// 状態遷移をそのままシミュレーションするため、これらの合算値を別途使う必要はない
// （実際に回せば結果として同じ水準の突入率・継続率になるはず）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "eva15-roar",
  slug: "eva15-roar",
  name: "新世紀エヴァンゲリオン～未来への咆哮～",
  nameKana: "しんせいきえゔぁんげりおんみらいえのほうこう",
  aliases: ["エヴァ15", "エヴァ", "エヴァンゲリオン", "未来への咆哮", "新世紀エヴァンゲリオン", "エヴァ未来への咆哮"],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2021,
  category: "V-ST機（ミドル）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率（低確率）：約1/319.7",
    "IMPACT MODE中の大当り確率（高確率）：約1/99.4",
    "IMPACT MODE：ST163回、継続率約81%（残保留の引き戻し込み）",
    "チャンスタイム：時短100回。当選確率は通常時と同じ約1/319.7",
    "ST突入率：約70%（直当り59%＋チャンスタイム中の引き戻し等の合算値）",
    "通常時の大当り振り分け（ヘソ入賞時）：10R確変・実獲得約1400個でIMPACT MODEが3.0%、3R確変・実獲得約420個でIMPACT MODEが56.0%、3R通常・実獲得約420個でチャンスタイムが41.0%",
    "IMPACT MODE中の当選振り分け（電チュー入賞時）：10R確変・実獲得約1400個で継続100%",
    "チャンスタイム中の当選は通常時と同じ振り分け（3.0%/56.0%/41.0%）を使用し、「3R通常」側はチャンスタイム継続として扱う",
    "IMPACT MODE・チャンスタイムとも規定回数を全弾外すと通常へ",
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
            weight: 0.03,
            rounds: 10,
            balls: 1400,
            nextState: "impactMode",
            tag: "toImpactMode10R",
            resultNote: "10R確変",
          },
          {
            weight: 0.56,
            rounds: 3,
            balls: 420,
            nextState: "impactMode",
            tag: "toImpactMode3R",
            resultNote: "3R確変",
          },
          {
            weight: 0.41,
            rounds: 3,
            balls: 420,
            nextState: "chanceTime",
            tag: "toChanceTime",
            resultNote: "3R通常",
          },
        ],
      },
      onExhausted: null,
    },

    chanceTime: {
      id: "chanceTime",
      label: "チャンスタイム",
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
          {
            weight: 0.03,
            rounds: 10,
            balls: 1400,
            nextState: "impactMode",
            tag: "chanceToImpact10R",
            resultNote: "10R確変",
          },
          {
            weight: 0.56,
            rounds: 3,
            balls: 420,
            nextState: "impactMode",
            tag: "chanceToImpact3R",
            resultNote: "3R確変",
          },
          {
            weight: 0.41,
            rounds: 3,
            balls: 420,
            nextState: "chanceTime",
            tag: "chanceContinue",
            resultNote: "3R通常",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "chanceTimeEnd", resultLabel: "チャンスタイム終了" },
    },

    impactMode: {
      id: "impactMode",
      label: "IMPACT MODE",
      mode: "countDown",
      maxAttempts: 163,
      probability: 1 / 99.4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 10,
            balls: 1400,
            nextState: "impactMode",
            tag: "impactContinue",
            resultNote: "10R確変",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "impactModeEnd", resultLabel: "IMPACT MODE終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 3: 420 },
});
