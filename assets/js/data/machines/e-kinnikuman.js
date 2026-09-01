// 第20号機: eフィーバーキン肉マン（2026年 SANKYO スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kinnikuman/）。
// 大当たり振り分けは、同ページに掲載されている2枚の円グラフ画像（通常時・RUSH中）を
// ダウンロードしてReadツールで直接読み取った実数値。RUSH中の内訳は本文にも
// 「約4%でSTリセット、約33.1%で約1500個、約36.5%で約3000個、約20.2%で約4500個、
// 約5.6%で約6000個、約0.6%で約7500個」と数値がそのまま書かれており、円グラフと
// 一致することを確認済み。
//
// 【通常時の確率は「図柄揃い確率」を採用し、悪魔CHARGEは実装していない】
// スペック表には「図柄揃い確率(通常時)1/399.9」「大当たり確率1/349.9」の2つの値が
// 併記されている（※1「特図1 1500個大当たりと300個RUSH突入大当たりの合算/大当たり
// 確率1/349.9」）。詳細ページには通常時の当り契機として
//   ・全回転経由（7図柄揃い、10R・約1500個→RUSH直行）
//   ・BONUS（7以外の図柄揃い、10R・約1500個→RUSHジャッジ演出成功でRUSH/失敗で通常）
//   ・悪魔CHARGE（アイコン停止、2R・約300個→ブラックアウト発生でRUSH/非発生で通常）
// の3契機があるが、「通常時の図柄揃い時の出玉振り分け確率」の円グラフ（49%/50%/1%の
// 3択）は前2つ（＝「図柄揃い」）だけの結果を集計したもので、悪魔CHARGE自体の出現率も
// ブラックアウト発生率も1geki.jpに数値の記載が無い。またRUSH突入率の公式値「約51%※2」
// も「特図1 1500個大当たりと300個RUSH突入大当たりの合算に対するトータル突入率」＝
// この円グラフの50%+1%そのものであり、悪魔CHARGE経由のRUSH直行分は最初から含まれて
// いない。そのため、このシミュレーターも同じ範囲（図柄揃いの49%/50%/1%）だけを実装し、
// 悪魔CHARGEは確認できる数値が無いため実装しない（e-garo12.jsのガロチャージと同じ扱い）。
//
// 【RUSH中「STリセット」（出玉の記載無し）の扱い】
// RUSH中の当り6択のうち「STリセット」（約4.0%）だけは出玉個数の記載が無く、ST145回の
// カウンタをリセットして継続するだけの当りとみなせる。stateEngineのonHit.outcomesは
// 出玉（balls）が正の数であることが前提（0を許すとmachineValidatorに弾かれる）ため、
// 出玉0個の枝をそのままは表現できない。継続先はいずれも同じ「RUSH ST145回」であり
// 出玉が無いだけなので、出玉のある枝のうち最小の「10R・実獲得1400個」枝に合算した
// （33.1%+4.0%=37.1%）。RUSH継続そのものの確率には影響しない。
//
// 【RUSH中の当選確率について】
// スペック表は「リーチ確率（RUSH中）1/92.3」を掲載しているが、これは大当たり確率
// そのものではなく「リーチ（当落を賭ける変動）が発生する確率」で、別途「成功率
// （特図2 5回転の引き戻し期待度）：約89%」がある。素の当選確率をリーチ確率だけで
// 計算すると1-(1-1/92.3)^145≈79.4%となり、公表の「時短145回継続率約77%」を上回って
// しまう（他機種の「引き戻しを含む数値」は素の計算より高くなるのが通例で、逆転する
// のは不自然）。一方、リーチ確率×成功率(1/92.3×0.89≈1/103.7)を素の当選確率とすると
// 1-(1-1/103.7)^145≈75.5%となり、公表の約77%よりわずかに低い（＝5回転の引き戻しで
// 底上げされた数値、という説明と整合する）。そのためRUSH状態の`probability`は
// 1/103.7（1/92.3×0.89の合成値）を採用し、5回転の引き戻し（p-madokamagica3.js /
// e-sao-senko.js / e-accel-world.jsと同じ理由でstateEngineでは表現できない）による
// 底上げ分は実装せず、コメントに明記するに留めた。
//
// 【出玉は「実獲得個数」を採用】
// スペック表に明記されている基準（10R: 約1500個/実獲得1400個、2R: 約300個/実獲得
// 280個、比率14/15）を、明記の無い10R×2～×5にもそのまま適用した
// （3000→2800、4500→4200、6000→5600、7500→7000。いずれも割り切れる）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-kinnikuman",
  slug: "e-kinnikuman",
  name: "eフィーバーキン肉マン",
  nameKana: "いーふぃーばーきんにくまん",
  aliases: ["キン肉マン", "キン肉マンパチンコ", "eキン肉マン", "フィーバーキン肉マン"],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時の図柄揃い確率：約1/399.9",
    "RUSH中の当選確率：約1/103.7（リーチ確率約1/92.3×成功率約89%の合成値。詳細はコメント）",
    "RUSH：ST145回、継続率約77%（このシミュレーターでは素の確率のみ実装。詳細はコメント）",
    "RUSH突入率：約51%（図柄揃いの大当たりに対して）",
    "通常時の大当たり振り分け（ヘソ入賞時・図柄揃い）：10R・実獲得約1400個で通常のままが49.0%、10R・実獲得約1400個でRUSH(ST145回)が50.0%、2R・実獲得約280個でRUSH(ST145回)が1.0%",
    "RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個が37.1%（STリセット4.0%を含む。詳細はコメント）、10R×2・実獲得約2800個が36.5%、10R×3・実獲得約4200個が20.2%、10R×4・実獲得約5600個が5.6%、10R×5・実獲得約7000個が0.6%（いずれも継続）",
    "RUSHは規定回数（145回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 399.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.49, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "toRush10R",
            resultNote: "RUSH(ST145回)",
          },
          {
            weight: 0.01,
            rounds: 2,
            balls: 280,
            nextState: "rush",
            tag: "toRush2R",
            resultNote: "RUSH(ST145回)",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countDown",
      maxAttempts: 145,
      probability: 1 / 103.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.371, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue1" },
          {
            weight: 0.365,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rushContinue2",
            resultNote: "10R×2",
          },
          {
            weight: 0.202,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "rushContinue3",
            resultNote: "10R×3",
          },
          {
            weight: 0.056,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "rushContinue4",
            resultNote: "10R×4",
          },
          {
            weight: 0.006,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "rush",
            tag: "rushContinue5",
            resultNote: "10R×5",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 2: 280, 10: 1400 },
});
