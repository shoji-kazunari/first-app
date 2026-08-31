// 第6号機: eソードアート・オンライン アリシゼーション 夜空（2026年 KYORAKU スマパチ/LT機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_sao_alicization/）。
// 大当たり振り分けは、同ページに掲載されている3枚の円グラフ画像をダウンロードして
// Readツールで直接読み取った実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・2R大当り(約300個)→通常（時短なし）：約50.0%
//   ・2R大当り(約300個)→SWORD RUSH(ST53回)：約48.5%
//   ・Epilogue BONUS「ぼくの英雄」→War of Underworld(ST70回)：約1.5%
// 電チュー入賞時（特図2・SWORD RUSH中）の振り分け:
//   ・10R大当り(約1500個)→SWORD RUSH継続：約45.0%
//   ・10R大当り(約1500個)→SWORD RUSH継続（決意の刃 失敗）：約33.0%
//   ・10R大当り(約1500個)→War of Underworld（決意の刃 成功）：約11.0%
//   ・「咲け、花たち」→War of Underworld：約11.0%
// 電チュー入賞時（特図2・War of Underworld中）の振り分け:
//   ・10R大当り(約1500個)→War of Underworld継続：約60.0%
//   ・「神器解放 SWORD DRIVE」→War of Underworld継続：約40.0%
// 状態遷移: SWORD RUSH全弾外れ（53回転消化）→通常、War of Underworld全弾外れ
// （70回転消化）→通常（いずれも1geki.jpのスペック表・ゲームフロー説明に明記）。
//
// War of Underworldは「#α→#β→#γ→#Ω」と演出面だけが変化する上位RUSHだが、
// 1geki.jp自身が「RUSH中の性能に変化はない」と明記しているため、確率・出玉は
// すべて同一の1状態（warOfUnderworld）としてまとめている（演出面の違いは
// このシミュレーターの対象外）。
//
// 【SWORD DRIVEの上乗せ（DRIVE in DRIVE）について・独自ルールで実装した理由】
// 「Epilogue BONUSぼくの英雄」「咲け、花たち」「神器解放SWORD DRIVE」はいずれも
// 「約1500個～約7500個+α（一部でDRIVE in DRIVEとなり再発動する可能性あり）」という
// 結果の範囲だけが1geki.jpに書かれており、上乗せが何%で継続するかという数値は
// 同ページのどこにも公開されていなかった（依頼者と一緒にページ全文・関連画像を
// 確認し、他の解析サイトもあたったが、この作業環境のネットワークポリシーで1geki.jp
// 以外のパチンコ情報サイトへの接続がすべてブロックされており確認できなかった）。
//
// 裏取りできない数値をそのまま埋めるとCLAUDE.mdの方針に反するため、依頼者と相談し、
// 依頼者の推測をもとにした「このシミュレーター独自のルール」として次を採用した
// （e-kyokousuiri.jsの琴子のご褒美RUSHと同じ扱い）:
//   ・SWORD DRIVE発動時、まず確定で1500個（払い出し基準。以下同じ）
//   ・続けて独立した4つの抽選を行い、それぞれ40%で+1500個
//     （4つとも成功なら1500+4×1500=7500個。※1「1500個×5」と一致）
//   ・4つの抽選が終わったあと、11%で「もう一周」（確定1500個＋4つの抽選を
//     まるごとやり直す）。これが「+α」（7500個を超える上振れ、DRIVE in DRIVE）の
//     正体だとみなした
// この分布を厳密に計算し（二項分布B(4,0.4)を11%の継続率で畳み込み、6周目以降の
// 極小確率［合計約0.0017%］は最後の枠に丸めて吸収）、payoutTableのballs個別指定で
// 11段階の分布として実装している（合計balls = 1500×(周回数+成功数)）。
// 計算に使ったPythonスクリプトはこのコメントには残していないが、各周の重みは
// 「0.89×0.11^(周回数-1)」、周内の成功数kの重みは二項分布B(4×周回数, 0.4)から
// 直接導出できる。
//
// 【出玉は「実獲得個数」を採用】
// スペック表は払い出し個数と実獲得個数の両方を載せている（2R: 約300個/実獲得280個、
// 10R: 約1500個/実獲得1400個、SWORD DRIVE: 約3000個～約9000個+α/実獲得約2800個～
// 約8400個+α）。実獲得と払い出しの比率がどれも14/15で一定だったため、SWORD DRIVEの
// 上記11段階（払い出し基準）にもすべて14/15を掛けて実獲得個数に揃えている。
window.PachiSim = window.PachiSim || {};

(function () {
  "use strict";

  PachiSim.machineRegistry.register({
    id: "e-sao-yozora",
    slug: "e-sao-yozora",
    name: "eソードアート・オンライン アリシゼーション 夜空",
    nameKana: "いーそーどあーとおんらいんありしぜーしょんよぞら",
    aliases: [
      "SAO",
      "SAO夜空",
      "ソードアート・オンライン",
      "ソードアートオンライン",
      "アリシゼーション",
      "夜空",
      "SAOアリシゼーション",
      "ソードアート・オンライン アリシゼーション",
    ],
    manufacturer: { id: "kyoraku", name: "KYORAKU" },
    releaseYear: 2026,
    category: "スマパチ（ライトミドル・ラッキートリガー・一種二種混合機）",

    spinsPer1000Yen: 16,
    baseStateId: "normal",

    rules: [
      "通常時大当たり確率：約1/199.9",
      "SWORD RUSH・War of Underworld中の大当たり確率：ともに約1/51.6",
      "SWORD RUSH：ST53回、継続率約65%",
      "War of Underworld：ST70回、継続率約75%",
      "RUSH突入率：約50%（通常時の大当たりのうち、SWORD RUSHへ突入するのが約48.5%、War of Underworldへ直行するのが約1.5%）",
      "通常時の大当たり振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが約50.0%、2R・実獲得約280個でSWORD RUSH(ST53回)が約48.5%、Epilogue BONUS「ぼくの英雄」でWar of Underworld(ST70回)直行が約1.5%",
      "SWORD RUSH中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個でRUSH継続が合計約78%（決意の刃なし45.0%、決意の刃失敗33.0%）、決意の刃成功でWar of Underworldへが約11.0%、「咲け、花たち」でWar of Underworldへが約11.0%",
      "War of Underworld中の当選振り分け（電チュー入賞時）：10R・実獲得約1400個で継続が約60.0%、「神器解放 SWORD DRIVE」で継続が約40.0%",
      "SWORD RUSH・War of Underworldとも規定回数を全弾外すと通常へ",
      "SWORD DRIVE（ぼくの英雄・咲け花たち・神器解放）の上乗せ幅は非公開のため、依頼者の推測にもとづく独自ルールで実装（詳細はファイル冒頭のコメント）：確定1500個＋4抽選(各40%で+1500個)＋11%で丸ごと再抽選（DRIVE in DRIVE）",
    ],

    states: {
      normal: {
        id: "normal",
        label: "通常",
        mode: "countUp",
        maxAttempts: null,
        probability: 1 / 199.9,
        actionLabel: "START",
        theme: "normal",
        accruesInvestment: true,
        isBaseState: true,
        isRushEntry: false,
        onHit: {
          outcomes: [
            { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
            { weight: 0.485, rounds: 2, balls: 280, nextState: "swordRush", tag: "toSwordRush" },
            { weight: 0.00173016, rounds: 10, displayRounds: 10, balls: 1400, nextState: "warOfUnderworld", tag: "bokunoEiyuX1", resultNote: "SWORD DRIVE 10R×1" },
            { weight: 0.00463843, rounds: 10, displayRounds: 20, balls: 2800, nextState: "warOfUnderworld", tag: "bokunoEiyuX2", resultNote: "SWORD DRIVE 10R×2" },
            { weight: 0.00474566, rounds: 10, displayRounds: 30, balls: 4200, nextState: "warOfUnderworld", tag: "bokunoEiyuX3", resultNote: "SWORD DRIVE 10R×3" },
            { weight: 0.00236032, rounds: 10, displayRounds: 40, balls: 5600, nextState: "warOfUnderworld", tag: "bokunoEiyuX4", resultNote: "SWORD DRIVE 10R×4" },
            { weight: 0.00076139, rounds: 10, displayRounds: 50, balls: 7000, nextState: "warOfUnderworld", tag: "bokunoEiyuX5", resultNote: "SWORD DRIVE 10R×5" },
            { weight: 0.00036424, rounds: 10, displayRounds: 60, balls: 8400, nextState: "warOfUnderworld", tag: "bokunoEiyuX6", resultNote: "SWORD DRIVE 10R×6" },
            { weight: 0.00021711, rounds: 10, displayRounds: 70, balls: 9800, nextState: "warOfUnderworld", tag: "bokunoEiyuX7", resultNote: "SWORD DRIVE 10R×7" },
            { weight: 0.00009913, rounds: 10, displayRounds: 80, balls: 11200, nextState: "warOfUnderworld", tag: "bokunoEiyuX8", resultNote: "SWORD DRIVE 10R×8" },
            { weight: 0.00004302, rounds: 10, displayRounds: 90, balls: 12600, nextState: "warOfUnderworld", tag: "bokunoEiyuX9", resultNote: "SWORD DRIVE 10R×9" },
            { weight: 0.00002093, rounds: 10, displayRounds: 100, balls: 14000, nextState: "warOfUnderworld", tag: "bokunoEiyuX10", resultNote: "SWORD DRIVE 10R×10" },
            { weight: 0.00001961, rounds: 10, displayRounds: 110, balls: 15400, nextState: "warOfUnderworld", tag: "bokunoEiyuX11", resultNote: "SWORD DRIVE 10R×11" },
          ],
        },
        onExhausted: null,
      },

      swordRush: {
        id: "swordRush",
        label: "SWORD RUSH",
        mode: "countDown",
        maxAttempts: 53,
        probability: 1 / 51.6,
        actionLabel: "START",
        theme: "rush",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: true,
        onHit: {
          outcomes: [
            { weight: 0.45, rounds: 10, balls: 1400, nextState: "swordRush", tag: "rushContinue" },
            {
              weight: 0.33,
              rounds: 10,
              balls: 1400,
              nextState: "swordRush",
              tag: "rushContinueFail",
              resultNote: "決意の刃 失敗",
            },
            {
              weight: 0.11,
              rounds: 10,
              balls: 1400,
              nextState: "warOfUnderworld",
              tag: "rushToWoU",
              resultNote: "決意の刃 成功",
            },
            { weight: 0.01268784, rounds: 10, displayRounds: 10, balls: 1400, nextState: "warOfUnderworld", tag: "sakeHanatachiX1", resultNote: "SWORD DRIVE 10R×1" },
            { weight: 0.03401512, rounds: 10, displayRounds: 20, balls: 2800, nextState: "warOfUnderworld", tag: "sakeHanatachiX2", resultNote: "SWORD DRIVE 10R×2" },
            { weight: 0.03480150, rounds: 10, displayRounds: 30, balls: 4200, nextState: "warOfUnderworld", tag: "sakeHanatachiX3", resultNote: "SWORD DRIVE 10R×3" },
            { weight: 0.01730903, rounds: 10, displayRounds: 40, balls: 5600, nextState: "warOfUnderworld", tag: "sakeHanatachiX4", resultNote: "SWORD DRIVE 10R×4" },
            { weight: 0.00558350, rounds: 10, displayRounds: 50, balls: 7000, nextState: "warOfUnderworld", tag: "sakeHanatachiX5", resultNote: "SWORD DRIVE 10R×5" },
            { weight: 0.00267108, rounds: 10, displayRounds: 60, balls: 8400, nextState: "warOfUnderworld", tag: "sakeHanatachiX6", resultNote: "SWORD DRIVE 10R×6" },
            { weight: 0.00159215, rounds: 10, displayRounds: 70, balls: 9800, nextState: "warOfUnderworld", tag: "sakeHanatachiX7", resultNote: "SWORD DRIVE 10R×7" },
            { weight: 0.00072696, rounds: 10, displayRounds: 80, balls: 11200, nextState: "warOfUnderworld", tag: "sakeHanatachiX8", resultNote: "SWORD DRIVE 10R×8" },
            { weight: 0.00031552, rounds: 10, displayRounds: 90, balls: 12600, nextState: "warOfUnderworld", tag: "sakeHanatachiX9", resultNote: "SWORD DRIVE 10R×9" },
            { weight: 0.00015352, rounds: 10, displayRounds: 100, balls: 14000, nextState: "warOfUnderworld", tag: "sakeHanatachiX10", resultNote: "SWORD DRIVE 10R×10" },
            { weight: 0.00014378, rounds: 10, displayRounds: 110, balls: 15400, nextState: "warOfUnderworld", tag: "sakeHanatachiX11", resultNote: "SWORD DRIVE 10R×11" },
          ],
        },
        onExhausted: { nextState: "normal", tag: "swordRushEnd", resultLabel: "SWORD RUSH終了" },
      },

      warOfUnderworld: {
        id: "warOfUnderworld",
        label: "War of Underworld",
        mode: "countDown",
        maxAttempts: 70,
        probability: 1 / 51.6,
        actionLabel: "START",
        theme: "rush",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: true,
        onHit: {
          outcomes: [
            { weight: 0.6, rounds: 10, balls: 1400, nextState: "warOfUnderworld", tag: "wouContinue" },
            { weight: 0.04613760, rounds: 10, displayRounds: 10, balls: 1400, nextState: "warOfUnderworld", tag: "swordDriveX1", resultNote: "SWORD DRIVE 10R×1" },
            { weight: 0.12369134, rounds: 10, displayRounds: 20, balls: 2800, nextState: "warOfUnderworld", tag: "swordDriveX2", resultNote: "SWORD DRIVE 10R×2" },
            { weight: 0.12655091, rounds: 10, displayRounds: 30, balls: 4200, nextState: "warOfUnderworld", tag: "swordDriveX3", resultNote: "SWORD DRIVE 10R×3" },
            { weight: 0.06294193, rounds: 10, displayRounds: 40, balls: 5600, nextState: "warOfUnderworld", tag: "swordDriveX4", resultNote: "SWORD DRIVE 10R×4" },
            { weight: 0.02030365, rounds: 10, displayRounds: 50, balls: 7000, nextState: "warOfUnderworld", tag: "swordDriveX5", resultNote: "SWORD DRIVE 10R×5" },
            { weight: 0.00971302, rounds: 10, displayRounds: 60, balls: 8400, nextState: "warOfUnderworld", tag: "swordDriveX6", resultNote: "SWORD DRIVE 10R×6" },
            { weight: 0.00578965, rounds: 10, displayRounds: 70, balls: 9800, nextState: "warOfUnderworld", tag: "swordDriveX7", resultNote: "SWORD DRIVE 10R×7" },
            { weight: 0.00264349, rounds: 10, displayRounds: 80, balls: 11200, nextState: "warOfUnderworld", tag: "swordDriveX8", resultNote: "SWORD DRIVE 10R×8" },
            { weight: 0.00114733, rounds: 10, displayRounds: 90, balls: 12600, nextState: "warOfUnderworld", tag: "swordDriveX9", resultNote: "SWORD DRIVE 10R×9" },
            { weight: 0.00055824, rounds: 10, displayRounds: 100, balls: 14000, nextState: "warOfUnderworld", tag: "swordDriveX10", resultNote: "SWORD DRIVE 10R×10" },
            { weight: 0.00052284, rounds: 10, displayRounds: 110, balls: 15400, nextState: "warOfUnderworld", tag: "swordDriveX11", resultNote: "SWORD DRIVE 10R×11" },
          ],
        },
        onExhausted: { nextState: "normal", tag: "wouEnd", resultLabel: "War of Underworld終了" },
      },
    },

    distributionTables: {},

    // 2R=280個、10R=1400個が代表値。SWORD DRIVE分岐は各onHit.outcomesのballsで上書きする。
    payoutTable: { 2: 280, 10: 1400 },
  });
})();
