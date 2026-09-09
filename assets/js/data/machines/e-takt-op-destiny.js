// 第51号機: eタクトオーパス デスティニー（2026年9月7日導入予定 newgin スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_takt_op_destiny/）。導入開始日
// 2026年9月7日の新台で、導入前だが1geki.jpにスペック・円グラフとも掲載済みのため
// 先取りで追加した。大当り振り分けは、同ページに掲載されている2枚の円グラフ画像
// （図柄揃い時・DESTINY RUSH中）をダウンロードしてReadツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当り振り分け（詳細は下の【チャージについて】節）:
//   ・図柄揃い(約1/1394.3)：10R大当り(約1500個)→通常が50.0%、10R大当り(約1500個)
//     →DESTINY RUSH（DC+LT、ST144回）が50.0%（円グラフ「図柄揃い時」に明記）
//   ・チャージ(約1/464.7)：2R大当り(約300個)→通常が99.5%、昇格して10R大当り
//     (約1500個)→DESTINY RUSHが0.5%（昇格率は依頼者の決めうち。根拠は下の節）
// （通常時大当り確率約1/348.5は、図柄揃い確率約1/1394.3とチャージ確率約1/464.7の
// 合算値。1/1394.3+1/464.7≈1/348.5で計算も一致する）
//
// 【チャージについて・昇格率0.5%の根拠】
// スペック表には「チャージ確率：約1/464.7」との記載があるが、e-tokyoghoul-tyo1geki.js
// の喰種チャージのような単独の詳細表（2R個数・昇格率の説明等）が本ページには無く、
// チャージ自体の出玉・LT突入率が分からない。「DESTINY RUSH突入率50%」の円グラフも
// 見出しが「図柄揃い時」であり、チャージ分がどう扱われるかは非公開のまま。
//
// 当初はチャージを図柄揃いと区別せず、合算確率1/348.5に対して円グラフの50/50を
// そのまま適用する簡略化をしていたが、チャージ（1/464.7）は図柄揃い（1/1394.3）
// より約3倍出現頻度が高いため、この簡略化だと「本来チャージにしか効かないはずの
// 低い昇格率」まで一律50%になってしまい、シミュレーター全体のRUSH突入率が
// 実態よりはるかに高くなる（依頼者から「勝てすぎる」との指摘）。
//
// e-tokyoghoul-tyo1geki.jsの喰種チャージ（同じく単独の昇格率が非公開）で
// 依頼者が下した判断と同じく、このシミュレーターでもチャージ単体の昇格率は
// 依頼者の決めうちで0.5%とする。図柄揃い(1/1394.3)とチャージ(1/464.7)の
// 出現比率（25.0%:75.0%）に、それぞれの昇格率（図柄揃い50%、チャージ0.5%）を
// 掛け合わせた重みを、states.normal.onHit.outcomesの4分岐（図柄揃い→通常/
// 図柄揃い→RUSH/チャージ→通常/チャージ→RUSH）のweightとして使う
// （0.125/0.125/0.74625/0.00375）。この結果、シミュレーター全体のRUSH突入率は
// 約12.9%となり、1geki.jp公表の合算値50%とは異なるが、これは実装ミスではなく
// 依頼者の判断（東京喰種と同じ扱い）である。
//
// チャージ単体の払い出し（2R・約300個）も1geki.jpに直接の記載は無いが、
// スペック表がラウンドの選択肢として「10R/2R」の2つだけを挙げており、
// 図柄揃いの円グラフは両方の枝とも10Rであることから、残る「2R」はチャージ用と
// 推測した（東京喰種のチャージが2R・約300個だったのと同じ構造）。
//
// 電チュー入賞時（特図2・DESTINY RUSH中、当選確率1/99.9）の振り分け:
//   ・約1500個→RUSH継続：25.9%
//   ・約2700個(1500個×1回+300個×4回)→RUSH継続：40.2%
//   ・約3900個(1500個×2回+300個×3回)→RUSH継続：24.9%
//   ・約5100個(1500個×3回+300個×2回)→RUSH継続：7.7%
//   ・約6300個(1500個×4回+300個×1回)→RUSH継続：1.2%
//   ・約7500個→RUSH継続：0.1%
// （RUSHは規定回数（144回）を全弾外すと通常へ。継続率約77%は、素の
// 1-(1-1/99.9)^144≈76.5%とほぼ一致しており、残保留等の引き戻しは無い）
//
// 【出玉は「実獲得個数」を採用】
// スペック表の実獲得個数をそのまま使用（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個、比率14/15）。RUSH中の合算出玉も同じ比率で換算
// （約2700個→2520個、約3900個→3640個、約5100個→4760個、約6300個→5880個、
// 約7500個→7000個）。
//
// 【spinsPer1000Yenについて】
// 1geki.jpの「ボーダーと期待値」欄には、通常時のボーダーラインが「概ね42回～45回
// /1000円を超えるとプラス」と記載されており、標準の16回転よりはるかに高速な
// デカヘソ寄りの機種であることが読み取れる。加えて依頼者から「1時間に777回転回る
// ことが売り」「1万円が約30分」との情報提供があり、777回転/時間÷2＝約388.5回転/
// 1万円≒約38.85回転/1000円と、この2つの情報から独立に近い値が導けるため、
// 39を採用した（既定の16のままでは持ち玉の減りが実感より大幅に遅くなってしまう）。
//
// 【displayProbabilityについて】
// 抽選自体は上記の合算値1/348.5で行うが、依頼者から「この台はインパクトが大事な
// ので表示は図柄揃い単体の1/1394.3を使ってほしい」との指示があったため、
// e-tokyoghoul-tyo1geki.js（図柄揃い単体1/999を表示、抽選はチャージ込み合算値）
// と同じ考え方でdisplayProbability: 1/1394.3を設定した。TOPページの確率表示
// （assets/js/pages/top.js）もdisplayProbabilityを見るように合わせて対応した。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-takt-op-destiny",
  slug: "e-takt-op-destiny",
  name: "eタクトオーパス デスティニー",
  nameKana: "いーたくとおーぱすですてぃにー",
  aliases: ["タクトオーパス", "タクトオーパスデスティニー", "eタクトオーパス", "TACT OP. Destiny"],
  manufacturer: { id: "newgin", name: "newgin" },
  releaseYear: 2026,
  category: "スマパチ（ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 39,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率：図柄揃い約1/1394.3（この機種の売り）、チャージ約1/464.7（合算では約1/348.5）",
    "DESTINY RUSH中の当選確率：1/99.9",
    "DESTINY RUSH（DC+LT）：ST144回、継続率約77%",
    "RUSH突入率：図柄揃いは50%でRUSH直行、チャージは0.5%で昇格してRUSH突入（チャージの方が出現頻度が高いため、シミュレーター全体のRUSH突入率は約12.9%。1geki.jp公表の合算値50%とは異なる。詳細はコメント）",
    "通常時の大当り振り分け（ヘソ入賞時・図柄揃い）：10R・実獲得約1400個で通常のままが約12.5%、10R・実獲得約1400個でDESTINY RUSHが約12.5%",
    "通常時の大当り振り分け（ヘソ入賞時・チャージ）：2R・実獲得約280個で通常のままが約74.6%、昇格して10R・実獲得約1400個でDESTINY RUSHが約0.4%",
    "DESTINY RUSH中の当選振り分け（電チュー入賞時）：実獲得約1400個が25.9%、約2520個が40.2%、約3640個が24.9%、約4760個が7.7%、約5880個が1.2%、約7000個が0.1%（いずれも継続）",
    "DESTINY RUSHは規定回数（144回）を全弾外すと通常へ",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 348.5,
      // displayProbability: 見出し・TOPページの確率表示は、この機種の売り文句である
      // 図柄揃い単体の確率(約1/1394.3)を出す（依頼者の指定。詳細はファイル冒頭の
      // コメント参照）。抽選自体は上のprobability(チャージ込み合算値1/348.5)で行う。
      displayProbability: 1 / 1394.3,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.125, rounds: 10, balls: 1400, nextState: "normal", tag: "zuToNormal" },
          {
            weight: 0.125,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "zuToRush",
            resultNote: "DC+LT",
          },
          { weight: 0.74625, rounds: 2, balls: 280, nextState: "normal", tag: "chargeToNormal" },
          {
            weight: 0.00375,
            rounds: 10,
            balls: 1400,
            nextState: "rush",
            tag: "chargeToRush",
            resultNote: "チャージ昇格、DC+LT",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "DESTINY RUSH",
      mode: "countDown",
      maxAttempts: 144,
      probability: 1 / 99.9,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.259, rounds: 10, balls: 1400, nextState: "rush", tag: "continue1500" },
          {
            weight: 0.402,
            rounds: 10,
            balls: 2520,
            nextState: "rush",
            tag: "continue2700",
            resultNote: "1500個×1回+300個×4回",
          },
          {
            weight: 0.249,
            rounds: 10,
            balls: 3640,
            nextState: "rush",
            tag: "continue3900",
            resultNote: "1500個×2回+300個×3回",
          },
          {
            weight: 0.077,
            rounds: 10,
            balls: 4760,
            nextState: "rush",
            tag: "continue5100",
            resultNote: "1500個×3回+300個×2回",
          },
          {
            weight: 0.012,
            rounds: 10,
            balls: 5880,
            nextState: "rush",
            tag: "continue6300",
            resultNote: "1500個×4回+300個×1回",
          },
          {
            weight: 0.001,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "rush",
            tag: "continue7500",
            resultNote: "7500個",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "DESTINY RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
