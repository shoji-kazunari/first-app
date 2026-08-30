// 第5号機: eフィーバー機動戦士ガンダムSEED クライマックス（2026年 SANKYO スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_gundamseed/）。
//
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値（WebFetchはテキストしか読めず%を拾えなかったが、
// 画像ファイルとしてダウンロードしてReadツールで直接見れば読み取れた）。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：約48%
//   ・10R大当り(約1500個)→FULLBURST RUSH CLIMAX(ST130回)：約52%
// 電チュー入賞時（特図2・FULLBURST RUSH CLIMAX中）の振り分け:
//   ・10R×2大当り(約3000個)→FULLBURST RUSH(ST130回)：約49%
//   ・10R×3大当り(約4500個)→FULLBURST RUSH CLIMAX継続(ST130回)：約51%
// 電チュー入賞時（特図2・FULLBURST RUSH中）の振り分け:
//   ・10R大当り(約1500個)→FULLBURST RUSH継続(ST130回)：約50%
//   ・10R×2大当り(約3000個)→FULLBURST RUSH CLIMAX昇格(ST130回)：約47%
//   ・10R×3大当り(約4500個)→FULLBURST RUSH CLIMAX昇格(ST130回)：約3%
// 状態遷移: FULLBURST RUSH CLIMAX全弾外れ（130回転消化）→通常、
//           FULLBURST RUSH全弾外れ（130回転消化）→通常
// （いずれも1geki.jpのゲームフロー説明・スペック表に明記。ST中の大当たり確率は
// CLIMAX・RUSHとも共通で約1/95.6）。
//
// 【SEEDチャージについて・数値を入れなかった理由】
// スペック表・機種概要のテキストには、ヘソ入賞時の当選契機として「FEVER（金）」
// 「FEVER」「SEEDチャージ（2R・約300個、失敗時通常へ・成功時FULLBURST RUSH
// CLIMAXへ）」の3パターンが説明されている。ただし、同ページが数値付きで公開している
// 円グラフ（通常時の大当たり時の出玉振り分け確率）は「10R大当り約1500個→通常48%／
// 10R大当り約1500個→CLIMAX52%」の2択のみで、SEEDチャージ単体の出現率・成功率は
// 数値として公開されていない。裏取りできない数値を埋めるとCLAUDE.mdの方針に反する
// ため、ここでは数値の出どころが明確なこの円グラフの2択をそのまま実装し、
// SEEDチャージは「通常時大当たりの一部がそう見える」という演出上の呼び分けとして
// 扱う（機械的には48%/52%の2パターンに集約）。
//
// 【出玉は「実獲得個数」を採用（払い出し基準からの変更）】
// スペック表は払い出し個数と実獲得個数の両方を載せている（10R: 約1500個/実獲得1400個、
// 2R: 約300個/実獲得280個）。全機種を実獲得基準へ揃えることにしたため、payoutTable・
// 各onHit.outcomesのballsは実獲得個数（1400/2800/4200）で入れてある
// （経緯はpf-gundam-uc.jsのコメント参照）。上のコメント中の「約1500個」等は
// スペック表に載っていた払い出し個数の表記のまま残している。
//
// 導入日: 2026年8月3日。型式名・検定番号はスペック表のとおり（2機種構成:
// 6P0051 / 610473）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-gundamseed-climax",
  slug: "e-gundamseed-climax",
  name: "eフィーバー機動戦士ガンダムSEED クライマックス",
  nameKana: "いーふぃーばーきどうせんしがんだむしーどくらいまっくす",
  aliases: [
    "ガンダムSEED",
    "ガンダムシード",
    "ガンダムSEEDクライマックス",
    "SEEDクライマックス",
    "シードクライマックス",
    "eガンダムSEED",
    "eガンダムSEEDクライマックス",
    "機動戦士ガンダムSEED クライマックス",
  ],
  manufacturer: { id: "sankyo", name: "SANKYO" },
  releaseYear: 2026,
  category: "スマパチ（ST機/ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：約1/399.9",
    "FULLBURST RUSH CLIMAX・FULLBURST RUSH中の大当たり確率：ともに約1/95.6",
    "ST（FULLBURST RUSH CLIMAX/FULLBURST RUSH）：130回転",
    "RUSH（LT）突入率：約52%（通常時の大当たりのうち、CLIMAXへ直行するのが約52%）",
    "RUSH（LT）継続率：約75%",
    "通常時の大当たり振り分け（ヘソ入賞時）：10R・実獲得約1400個で時短なし（通常のまま）が約48%、10R・実獲得約1400個でFULLBURST RUSH CLIMAX(ST130回)が約52%",
    "FULLBURST RUSH CLIMAX中の当選振り分け（電チュー入賞時）：10R×2・実獲得約2800個でFULLBURST RUSHへが約49%、10R×3・実獲得約4200個でCLIMAX継続が約51%",
    "FULLBURST RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個でRUSH継続が約50%、10R×2・実獲得約2800個でCLIMAX昇格が約47%、10R×3・実獲得約4200個でCLIMAX昇格が約3%",
    "FULLBURST RUSH CLIMAX・FULLBURST RUSHとも130回転を全弾外すと通常へ",
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
          { weight: 0.48, rounds: 10, balls: 1400, nextState: "normal", tag: "toNormal" },
          { weight: 0.52, rounds: 10, balls: 1400, nextState: "climax", tag: "toClimax" },
        ],
      },
      onExhausted: null,
    },

    climax: {
      id: "climax",
      label: "FULLBURST RUSH CLIMAX",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 95.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.49,
            rounds: 10,
            balls: 2800,
            nextState: "rush",
            tag: "climaxToRush",
            resultNote: "10R×2",
          },
          {
            weight: 0.51,
            rounds: 10,
            balls: 4200,
            nextState: "climax",
            tag: "climaxContinue",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: {
        nextState: "normal",
        tag: "climaxEnd",
        resultLabel: "FULLBURST RUSH CLIMAX終了",
      },
    },

    rush: {
      id: "rush",
      label: "FULLBURST RUSH",
      mode: "countDown",
      maxAttempts: 130,
      probability: 1 / 95.6,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1400, nextState: "rush", tag: "rushContinue" },
          {
            weight: 0.47,
            rounds: 10,
            balls: 2800,
            nextState: "climax",
            tag: "rushToClimax",
            resultNote: "10R×2",
          },
          {
            weight: 0.03,
            rounds: 10,
            balls: 4200,
            nextState: "climax",
            tag: "rushToClimaxMega",
            resultNote: "10R×3",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "FULLBURST RUSH終了" },
    },
  },

  distributionTables: {},

  // 10Rには1400/2800/4200個の3種類があるため、代表値のみ置き、実際の出玉は
  // 各onHit.outcomesのballsで上書きする。
  payoutTable: { 10: 1400 },
});
