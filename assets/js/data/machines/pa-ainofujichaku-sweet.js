// 第39号機: PA愛の不時着 99スイート ver.（2026年9月7日導入予定 MACY 甘デジ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/pa_ainofujichaku_sweet/）。導入開始日
// 2026年9月7日の新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため
// 先取りで追加した。大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像
// （通常時・愛の降臨RUSH中・愛の燦然RUSH中）をダウンロードしてReadツールで
// 直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/99.9）の振り分け:
//   ・3R大当り(約300個)→通常（時短なし）：49.0%
//   ・3R大当り(約300個)→愛の降臨RUSH(ST60回)：51.0%
//
// 【「RUSH非突入の初当たり2連続後は100%」の実装】
// 通常時の当りが2回連続で愛の降臨RUSHへ突入しなかった場合、3回目の当りは
// 必ず愛の降臨RUSHへ突入する仕様。stateEngineには「連続失敗回数」を単独で
// 保持する仕組みが無いため、normal（1回目）→normal2（2回目）→normal3
// （3回目、100%でRUSHへ）という3つの通常相当の状態をリレーする形で表現した
// （normal2・normal3はaccruesInvestment:trueのまま、通常と同じ左打ち状態）。
//
// 【一撃/連チャン集計へのresetsStreak対応（2026-09-03修正）】
// normal2・normal3はisBaseState:false（machineValidatorが1機種1つしか許さない
// ため）だが、これをそのままにするとstreakTracker.jsが「一撃の区切り」を
// isBaseStateだけで判定してしまい、非突入時の3R(270個)がRUSH本編の連チャン数・
// 出玉に合算されてしまう不具合があった（実機なら非突入の3Rはその場で完結する
// 別の一撃のはず）。normal2・normal3にresetsStreak: trueを立てて、
// isBaseStateに準じる「一撃の区切り」として扱われるよう修正した。
//
// 電チュー入賞時（特図2・愛の降臨RUSH中、大当り確率1/54.3）の振り分け:
//   ・3R大当り(約300個)→継続：50.0%
//   ・10R大当り(約1000個)→継続：50.0%
// （愛の降臨RUSHは規定回数消化型。素の計算1-(1-1/54.3)^60≈67.2%は公表の
// 「継続率約70%（ST60回と残保留4個の合算値）」に近く、大きなギャップは無い）
//
// 【「1000個大当たり3回獲得でLT突入」の実装】
// 愛の降臨RUSH中に10R(1000個)大当たりを3回重ねると、LT「愛の燦然RUSH」
// （ST130回）へ突入する仕様（時短状態終了で累計回数リセット）。これも
// 「1000個を何回引いたか」を単独で保持する仕組みが無いため、rush0（0回）→
// rush1（1回）→rush2（2回）→愛の燦然RUSH（3回目）という状態のリレーで
// 表現した。ST60回を1000個抜きで全弾外した場合は通常へ戻り、カウンタは
// 自然にリセットされる（次に愛の降臨RUSHへ入るときは必ずrush0から）。
//
// 電チュー入賞時（特図2・愛の燦然RUSH中、大当り確率1/54.3）の振り分け:
//   ・3R大当り(約300個)→継続：50.0%
//   ・10R大当り(約1000個)→継続：50.0%
// （素の計算1-(1-1/54.3)^130≈91.1%は公表の「継続率約92%（ST130回と残保留
// 4個の合算値）」とほぼ一致しており、大きなギャップは無い）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1000個/実獲得900個、
// 3R: 約300個/実獲得270個、比率9/10）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pa-ainofujichaku-sweet",
  slug: "pa-ainofujichaku-sweet",
  name: "PA愛の不時着 99スイート ver.",
  nameKana: "ぴーえーあいのふじちゃくきゅうじゅうきゅうすいーとばー",
  aliases: ["愛の不時着甘デジ", "愛の不時着99", "愛の不時着スイート", "PA愛の不時着"],
  manufacturer: { id: "macy", name: "MACY" },
  releaseYear: 2026,
  category: "ラッキートリガー（二種・甘デジ）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/99.9",
    "愛の降臨RUSH・愛の燦然RUSH中の大当り確率：1/54.3",
    "愛の降臨RUSH：ST60回、継続率約70%（残保留込み）",
    "愛の燦然RUSH：ST130回、継続率約92%（残保留込み）",
    "愛の降臨RUSH突入率：51%（RUSH非突入の初当たりが2連続した場合、3回目は必ず突入）",
    "愛の降臨RUSH中に1000個大当たりを3回重ねると愛の燦然RUSH（LT）へ突入",
    "通常時の大当り振り分け（ヘソ入賞時）：3R・実獲得約270個で通常のままが49.0%、3R・実獲得約270個で愛の降臨RUSHが51.0%",
    "愛の降臨RUSH・愛の燦然RUSH中の当選振り分け（電チュー入賞時、共通）：3R・実獲得約270個で継続が50.0%、10R・実獲得約900個で継続が50.0%",
    "愛の降臨RUSH・愛の燦然RUSHとも規定回数を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 3, balls: 270, nextState: "normal2", tag: "toNormal2" },
          { weight: 0.51, rounds: 3, balls: 270, nextState: "rush0", tag: "toRush0" },
        ],
      },
      onExhausted: null,
    },

    normal2: {
      id: "normal2",
      label: "通常（RUSH非突入1回目）",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: false,
      resetsStreak: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 3, balls: 270, nextState: "normal3", tag: "toNormal3" },
          { weight: 0.51, rounds: 3, balls: 270, nextState: "rush0", tag: "toRush0FromN2" },
        ],
      },
      onExhausted: null,
    },

    normal3: {
      id: "normal3",
      label: "通常（RUSH非突入2回目）",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: false,
      resetsStreak: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 3,
            balls: 270,
            nextState: "rush0",
            tag: "toRush0Guaranteed",
            resultNote: "愛の降臨RUSH濃厚",
          },
        ],
      },
      onExhausted: null,
    },

    rush0: {
      id: "rush0",
      label: "愛の降臨RUSH",
      mode: "countDown",
      maxAttempts: 60,
      probability: 1 / 54.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 270, nextState: "rush0", tag: "rush0Continue300" },
          { weight: 0.5, rounds: 10, balls: 900, nextState: "rush1", tag: "rush0To1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rush0End", resultLabel: "愛の降臨RUSH終了" },
    },

    rush1: {
      id: "rush1",
      label: "愛の降臨RUSH（1000個1回目）",
      mode: "countDown",
      maxAttempts: 60,
      probability: 1 / 54.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 270, nextState: "rush1", tag: "rush1Continue300" },
          { weight: 0.5, rounds: 10, balls: 900, nextState: "rush2", tag: "rush1To1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rush1End", resultLabel: "愛の降臨RUSH終了" },
    },

    rush2: {
      id: "rush2",
      label: "愛の降臨RUSH（1000個2回目）",
      mode: "countDown",
      maxAttempts: 60,
      probability: 1 / 54.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 270, nextState: "rush2", tag: "rush2Continue300" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 900,
            nextState: "sanzenRush",
            tag: "rush2To1000Sanzen",
            resultNote: "愛の燦然RUSH",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rush2End", resultLabel: "愛の降臨RUSH終了" },
    },

    sanzenRush: {
      id: "sanzenRush",
      label: "愛の燦然RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 54.3,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 3, balls: 270, nextState: "sanzenRush", tag: "sanzenContinue300" },
          { weight: 0.5, rounds: 10, balls: 900, nextState: "sanzenRush", tag: "sanzenContinue1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "sanzenEnd", resultLabel: "愛の燦然RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 3: 270, 10: 900 },
});
