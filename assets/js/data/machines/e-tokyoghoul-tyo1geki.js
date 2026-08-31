// 第7号機: e 東京喰種 超デカ超一撃ver.（2026年 ビスティ スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_tokyoghoul_tyo1geki/）。
// 大当り振り分けは、同ページに掲載されている2枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時、図柄揃い）の大当り振り分け:
//   ・10R大当り×2(約3000個)→通常（時短なし）：約50%
//   ・10R大当り×5(約7500個)→HYPER喰種RUSH(ST5回)：約50%
// 電チュー入賞時（特図2・HYPER喰種RUSH中）の振り分け:
//   ・10R×2(約3000個)を基準に、「上乗せ3000ジャッジ」（成功率約50%、
//     1geki.jpのテキストに明記）に成功する限り約3000個ずつ上乗せし続けるループ。
//     円グラフの内訳（3000個50%・6000個25%・9000個12.5%・9000個超12.5%）は
//     50%の等比数列（0.5^0, 0.5^1, 0.5^2, 0.5^2...）と完全に一致するため、
//     stateEngineのbonusLoopプリミティブ（成功する限り繰り返し上乗せ）で
//     そのまま正確に再現できる。SWORD DRIVE（SAO夜空）のような非公開の
//     継続率を推測する必要はなかった。
// 状態遷移: HYPER喰種RUSH全弾外れ（5回転消化）→通常
// （継続率約50%は、大当り確率1/7.7・ST5回から自然に導かれる値と一致 [1-(1-1/7.7)^5≈50%]
// なので、継続率の裏取りにも1geki.jp発表の1/7.7をそのまま使っている）。
//
// 【喰種チャージについて】
// スペック表には、ヘソ入賞時のもう1つの当選契機として「喰種チャージ」（約1/538.8、
// 2R・約300個、消化中に昇格演出が発生すれば約7500個獲得してHYPER喰種RUSHへ）が
// 説明されている。ただし円グラフ（通常時の図柄揃い時の出玉振り分け確率）は
// 「10R大当り×2＝約3000個(50%)／10R大当り×5＝約7500個(50%)」の2択のみで、
// 喰種チャージ単体の出現率・昇格率は数値として公開されていない。
// このシミュレーターでは、数値の裏取りができるこの円グラフの2択をそのまま実装し、
// 喰種チャージは「通常時大当りの一部がそう見える」という演出上の呼び分けとして
// 扱う（e-gundamseed-climax.jsのSEEDチャージと同じ扱い）。
//
// 【出玉は「実獲得個数」を採用】
// スペック表は払い出し個数と実獲得個数の両方を載せている（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、HYPER喰種BONUS各種も比率14/15で統一）。
//
// 【1000円あたりの回転数（spinsPer1000Yen）について・要確認】
// 機種概要に「超デカSTARTとスマートスタートの同時搭載でストレスフリーなヘソ入賞を
// 実現」との記載があり、CLAUDE.mdのいう「回ることをウリにしている台」に該当する
// 可能性が高い（実際、ボーダーが約31～34回/1000円と、既存の16回転想定の機種
// [ガンダムSEED・SAO夜空は約17～18回/1000円]のほぼ倍で、地の確率・出玉水準は
// 近いのにボーダーだけ突出している）。ただし1geki.jpは実際の「回転数」自体を
// 公表しておらず、この値は依頼者の実感でしか決められない（e-kyokousuiriの24が
// 依頼者の実感による値だったのと同じ）。判断がつくまで既定値16のまま実装し、
// 依頼者に要確認として残す。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-tokyoghoul-tyo1geki",
  slug: "e-tokyoghoul-tyo1geki",
  name: "e 東京喰種 超デカ超一撃ver.",
  nameKana: "いーとうきょうぐーるちょうでかちょういちげきばーじょん",
  aliases: [
    "東京喰種",
    "東京グール",
    "東京グール999",
    "トーキョーグール",
    "超デカ超一撃",
    "喰種",
    "東京喰種999",
    "東京喰種超デカ",
  ],
  manufacturer: { id: "besty", name: "ビスティ" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  // 要確認: 「超デカSTART」を売りにする台だが、実測値が無いため既定値のまま。
  // 詳細はファイル冒頭のコメント参照。
  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：約1/349.9（図柄揃い大当りとチャージからの突入大当りの合算）",
    "HYPER喰種RUSH中の当選確率：約1/7.7",
    "HYPER喰種RUSH：ST5回、継続率約50%",
    "RUSH突入率：約50%（通常時の大当りのうち、HYPER喰種RUSHへ直行するのが約50%）",
    "通常時の大当り振り分け（ヘソ入賞時）：10R×2・実獲得約2800個で通常のままが約50%、10R×5・実獲得約7000個でHYPER喰種RUSH(ST5回)が約50%",
    "HYPER喰種RUSH中の当選振り分け（電チュー入賞時）：10R×2・実獲得約2800個を基準に、「上乗せ3000ジャッジ」成功率約50%に成功する限り約2800個ずつ上乗せし続ける（喰MAXループ）",
    "HYPER喰種RUSHは規定回数（5回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 349.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "normal",
            tag: "toNormal",
            resultNote: "10R×2",
          },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "hyperRush",
            tag: "toHyperRush",
            resultNote: "10R×5",
          },
        ],
      },
      onExhausted: null,
    },

    hyperRush: {
      id: "hyperRush",
      label: "HYPER喰種RUSH",
      mode: "countDown",
      maxAttempts: 5,
      probability: 1 / 7.7,
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
            displayRounds: 20,
            balls: 2800,
            nextState: "hyperRush",
            tag: "hyperRushContinue",
            resultNote: "10R×2",
            bonusLoop: { probability: 0.5, balls: 2800 },
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "hyperRushEnd", resultLabel: "HYPER喰種RUSH終了" },
    },
  },

  distributionTables: {},

  // 10Rには2800/7000個の2種類があるため、代表値のみ置き、実際の出玉は
  // 各onHit.outcomesのballsで上書きする。
  payoutTable: { 10: 2800 },
});
