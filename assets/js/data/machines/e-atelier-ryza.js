// 第70号機: eライザのアトリエ 常闇の女王と秘密の隠れ家（2026年 KYORAKU（京楽） スマパチ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_atelier_ryza/）。大当り振り分けは、同ページに
// 掲載されている3枚の円グラフ画像（通常時・ひと夏の冒険モード中・最終決戦BATTLE4500中）と、
// 個別解説表（翼竜決戦BONUS・蝕みの女王BATTLE3000・冒険BONUS・Ending Bonus・運命の
// 錬金術・究極連鎖BONUS）の数値を突き合わせて構造化した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/239.7）の振り分け（円グラフ「通常時」）:
//   ・2R大当り(約300個/実獲得280個)→通常（時短なし）：49%
//   ・翼竜決戦BONUS(2R+10R、約1800個/実獲得1680個)→敗北、通常（時短なし）：25%
//   ・翼竜決戦BONUS(約1800個)→勝利、ひと夏の冒険モード(ST100回)へ：26%
// （25%+26%＝51%が「翼竜決戦突入率51%」と一致し、勝利側26%/(25%+26%)≈51.0%が
// 「翼竜決戦勝率約51%」と一致する）
// ひと夏の冒険モード中（特図2・電チュー入賞時、当選確率1/69.5）の振り分け:
//   ・冒険BONUS(10R、約1500個/実獲得1400個)→継続：45%
//   ・蝕みの女王BATTLE3000(10R×2、約3000個/実獲得2800個)→敗北、継続：11%
//   ・蝕みの女王BATTLE3000(約3000個)→勝利、最終決戦BATTLE4500(ST100回)へ：44%
// （11%+44%＝55%が「大当たり時の約55%で女王バトルへ突入」と一致し、勝利側
// 44%/55%＝80.0%が「女王BATTLE勝率は約80%」と一致する）
// 最終決戦BATTLE4500中（特図2・電チュー入賞時、当選確率1/69.5）の振り分け:
//   ・Ending Bonus(10R×3、約4500個/実獲得4200個)→運命の錬金術へ：100%（必ず成立）
// （ひと夏の冒険モード・最終決戦BATTLE4500とも継続率約77%は、素の
// 1-(1-1/69.5)^100≈76.5%とほぼ一致するため、残保留等の引き戻しの無いシンプルな
// 規定回数countDownで再現できる）
//
// 【運命の錬金術・究極連鎖BONUSをprobability:1の即時解決状態＋bonusLoopで実装】
// 「運命の錬金術 突破率約64%」は、Ending Bonusで既に獲得済みの4200個とは別枠の、
// 追加ボーナス突入をかけた演出成功/失敗の判定。成功すれば約4500個(実獲得4200個)を
// 獲得し「究極連鎖BONUS」に突入、以降は同じ約64%の確率で4200個ずつ上乗せし続ける
// （「継続率約64%の究極連鎖BONUS」の文言どおり、初回成功時の確率と以降のループ確率が
// 同じ64%であることを利用し、bonusLoopのprobabilityにそのまま流用した）。
// 失敗時（36%）は追加のボーナス無しで通常時へ戻る。
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率いずれも14/15）。翼竜決戦BONUS・蝕みの女王
// BATTLE3000・Ending Bonusの複合払い出しも同じ比率で換算した実獲得個数を採用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-atelier-ryza",
  slug: "e-atelier-ryza",
  name: "eライザのアトリエ 常闇の女王と秘密の隠れ家",
  nameKana: "いーらいざのあとりえとこやみのじょおうとひみつのかくれが",
  aliases: ["ライザのアトリエ パチンコ", "ライザのアトリエ2", "eライザのアトリエ", "ライザパチンコ"],
  manufacturer: { id: "kyoraku", name: "KYORAKU（京楽）" },
  releaseYear: 2026,
  category: "パチンコ（スマパチ・ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：1/239.7",
    "ひと夏の冒険モード・最終決戦BATTLE4500中の当選確率：1/69.5",
    "ひと夏の冒険モード・最終決戦BATTLE4500：ST100回、継続率約77%",
    "翼竜決戦突入率：51%、翼竜決戦勝率：約51%",
    "通常時の大当り振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが49%、翼竜決戦BONUS・実獲得約1680個で敗北（通常のまま）が25%、翼竜決戦BONUSで勝利（ひと夏の冒険モードへ）が26%",
    "ひと夏の冒険モード中の当選振り分け：10R・実獲得約1400個で継続が45%、蝕みの女王BATTLE3000・実獲得約2800個で敗北（継続）が11%、蝕みの女王BATTLE3000で勝利（最終決戦BATTLE4500へ）が44%",
    "最終決戦BATTLE4500中の当選振り分け：Ending Bonus・実獲得約4200個で運命の錬金術へが100%",
    "運命の錬金術：突破率約64%、成功時は約4200個獲得+究極連鎖BONUS突入（以降約64%で4200個ずつループ）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 239.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.25,
            rounds: 10,
            displayRounds: 12,
            balls: 1680,
            nextState: "normal",
            tag: "toNormalCombo",
            resultNote: "翼竜決戦BONUS敗北",
          },
          {
            weight: 0.26,
            rounds: 10,
            displayRounds: 12,
            balls: 1680,
            nextState: "hitonatsuBouken",
            tag: "toHitonatsu",
            resultNote: "翼竜決戦BONUS勝利、ひと夏の冒険モード",
          },
        ],
      },
      onExhausted: null,
    },

    hitonatsuBouken: {
      id: "hitonatsuBouken",
      label: "ひと夏の冒険モード",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 69.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.45,
            rounds: 10,
            balls: 1400,
            nextState: "hitonatsuBouken",
            tag: "continue10r",
            resultNote: "冒険BONUS",
          },
          {
            weight: 0.11,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "hitonatsuBouken",
            tag: "queenBattleLose",
            resultNote: "蝕みの女王BATTLE3000敗北",
          },
          {
            weight: 0.44,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "saishuKessenBattle",
            tag: "queenBattleWin",
            resultNote: "蝕みの女王BATTLE3000勝利、最終決戦BATTLE4500",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hitonatsuEnd", resultLabel: "ひと夏の冒険モード終了" },
    },

    saishuKessenBattle: {
      id: "saishuKessenBattle",
      label: "最終決戦BATTLE4500",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 69.5,
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
            displayRounds: 30,
            balls: 4200,
            nextState: "unmeiRenkinjutsu",
            tag: "toRenkinjutsu",
            resultNote: "Ending Bonus、運命の錬金術",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "battleEnd", resultLabel: "最終決戦BATTLE4500終了" },
    },

    unmeiRenkinjutsu: {
      id: "unmeiRenkinjutsu",
      label: "運命の錬金術",
      mode: "countUp",
      maxAttempts: null,
      probability: 1,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.64,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "normal",
            tag: "success",
            resultNote: "究極連鎖BONUS",
            bonusLoop: { probability: 0.64, balls: 4200 },
          },
          {
            weight: 0.36,
            rounds: 1,
            balls: 0,
            nextState: "normal",
            tag: "fail",
          },
        ],
      },
      onExhausted: null,
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
