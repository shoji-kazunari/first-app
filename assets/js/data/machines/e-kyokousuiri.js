// 第3号機: e虚構推理（2026年 大一 1種2種混合/ラッキートリガー）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_kyokousuiri/）。通常時・裏モード・
// 鋼人攻略戦の3状態は、円グラフ画像・テキスト仕様表を直接確認した実数値。
//
// ヘソ入賞時（特図1・通常時）の大当たり振り分け:
//   ・2R大当り(約300個)→鋼人攻略戦(ST36回+残保留)：50.5%
//   ・2R大当り(約300個)→裏モード(20回転)：49.5%
//   （※「知恵の神BONUS」「怪異BONUS」「ファイナルチャンス」は上記の内訳を見せる
//   　演出上の呼び分けであり、最終的な振り分け先はこの2択のみ）
// 電チュー入賞時（特図2・鋼人攻略戦中）:
//   ・10R大当り(約1500個)→鋼人攻略戦継続：50.0%
//   ・10R大当り(約1500個)→琴子のご褒美RUSH(お願い玉4個)：50.0%
//
// 琴子のご褒美RUSH・裏ご褒美RUSHについては、1geki.jpに当選確率の明記が無く、
// 別サイトの記述をもとに補って実装を試みたが、最終的にユーザー指示により実機の
// 数値追求はやめ、以下を「このシミュレーター独自のルール」として採用した:
//
//   ・毎回転が当落判定になるわけではなく、まず約1/11.6でリーチ（当落ジャッジ）が発生。
//     発生しなかった回転は素通り（保留は消化するが、何も起きず・お願い玉も減らない）。
//   ・リーチが発生した回だけ25%で当たり・75%でハズレてお願い玉を1個消費。
//   ・保留の色変化予告は無し（このRUSH中は常に無色）。
//   ・お願い玉が残り2個以下での当たり: 残り＋4個で琴子のご褒美RUSH継続（1500個）。
//   ・お願い玉が残り3個以上での当たり: 3000個。82%で琴子のご褒美RUSHへ戻る、
//     18%でお願い玉がVストック化し裏ご褒美RUSHへ。※82/18の比率は1geki.jp由来の
//     実機データをそのまま採用。
//     このときの次のRUSHは、どちらへ行っても【お願い玉が無制限】になる
//     （次の当たりを引くまで減らない。画面では お願い玉 ♾️）。
//     無制限中に当たったら、そこで無制限は終わり、通常どおり4個で再開する。
//     ―― 無制限を配り続けると、無制限中の残りは常に「3個以上」に当てはまるため
//     再び無制限が配られ、連チャンが終わらなくなる（試算で平均1285連・上限張り付き）。
//     そのため「無制限中に使う表」を whenUnlimited として別に持たせ、そこでは
//     4個に戻すようにしている。この作りはmachineValidatorが強制する
//     （無制限を配るのにwhenUnlimitedの表が無いと、読み込み時に例外になる）。
//     依頼者の指示による仕様変更。変更前は3個以上でも4個固定だった
//     （平均連チャン2.32回 → 4.80回）。
//   ・裏ご褒美RUSHは常にストック4個固定（持ち越し無し）。抽選方法は琴子のご褒美RUSHと
//     同じ（1/11.6でリーチ→25%/75%）。87%で3000個、13%で4500個。さらに4500個側は
//     「13%で+1500個」を成功する限り繰り返し上乗せするループボーナス付き。
window.PachiSim = window.PachiSim || {};

// 1ファイル1機種。IIFEで包み、共通の振り分け定数がグローバルへ漏れないようにする。
(function () {
  "use strict";

  // 裏ご褒美RUSHの当選時の振り分け。残りお願い玉が有限でも無制限でも同じ内容なので、
  // 1つ書いて両方の表から参照する（書き写す際のズレを防ぐため）。
  const URA_GOHOBI_OUTCOMES = [
    {
      weight: 0.87,
      rounds: 10,
      balls: 3000,
      nextState: "uraGohobiRush",
      tag: "uraGohobiContinue",
      stockSet: 4,
    },
    {
      weight: 0.13,
      rounds: 10,
      balls: 4500,
      nextState: "uraGohobiRush",
      tag: "uraGohobiContinueMega",
      stockSet: 4,
      resultNote: "上乗せ",
      // 成功する限り13%で+1500個を繰り返し上乗せするループボーナス。
      bonusLoop: { probability: 0.13, balls: 1500 },
    },
  ];

  PachiSim.machineRegistry.register({
    id: "e-kyokousuiri",
    slug: "e-kyokousuiri",
    name: "e虚構推理",
    nameKana: "いーきょこうすいり",
    aliases: ["虚構推理", "きょこうすいり", "e虚構推理パチンコ"],
    manufacturer: { id: "daiichi", name: "大一商会" },
    releaseYear: 2026,
    category: "1種2種混合（ラッキートリガー）",

    spinsPer1000Yen: 16,
    baseStateId: "normal",

    rules: [
      "通常時大当たり確率：約1/319",
      "鋼人攻略戦の大当たり確率：約1/44",
      "通常時の大当たり振り分け：2R・約300個で鋼人攻略戦(ST36回+残保留)が50.5%、2R・約300個で裏モード(20回転)が49.5%",
      "鋼人攻略戦：50%で継続(10R・約1500個)、50%で琴子のご褒美RUSH(お願い玉4個)へ",
      "裏モード：当たれば裏ご褒美RUSHへ直行",
      "琴子のご褒美RUSH・裏ご褒美RUSHは固定回転数ではなく「お願い玉」を使うストック制（このシミュレーター独自仕様）。毎回転ではなく約1/11.6でリーチ（当落ジャッジ）が発生し、発生した回だけ25%で当たり・75%で外れてお願い玉を1個消費。0個で終了し通常へ",
      "琴子のご褒美RUSH中、お願い玉が残り2個以下での当たりは、残り＋4個で継続（約1500個）",
      "琴子のご褒美RUSH中、お願い玉が残り3個以上での当たりは、次のRUSHのお願い玉が無制限（♾️）になり、次の当たりまで減らない。82%で琴子のご褒美RUSH継続（約3000個）、18%でVストック化し裏ご褒美RUSHへ（約3000個）",
    "無制限（♾️）中に当たると、そこで無制限は終わり、お願い玉4個で再開する",
      "裏ご褒美RUSHはストック常に4個固定。87%で継続（約3000個）、13%で継続（約4500個。さらに13%成功ごとに+1500個を上乗せ）",
    ],

    states: {
      normal: {
        id: "normal",
        label: "通常",
        mode: "countUp",
        maxAttempts: null,
        probability: 1 / 319,
        actionLabel: "START",
        theme: "normal",
        accruesInvestment: true,
        isBaseState: true,
        isRushEntry: false,
        onHit: {
          outcomes: [
            { weight: 0.505, rounds: 2, balls: 300, nextState: "koujin", tag: "toKoujin" },
            { weight: 0.495, rounds: 2, balls: 300, nextState: "uraMode", tag: "toUraMode" },
          ],
        },
        onExhausted: null,
      },

      koujin: {
        id: "koujin",
        label: "鋼人攻略戦",
        mode: "countDown",
        maxAttempts: 36,
        probability: 1 / 44,
        actionLabel: "START",
        theme: "rush",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: true,
        onHit: {
          outcomes: [
            { weight: 0.5, rounds: 10, balls: 1500, nextState: "koujin", tag: "koujinContinue" },
            {
              weight: 0.5,
              rounds: 10,
              balls: 1500,
              nextState: "kotokoRush",
              tag: "toKotokoRush",
              stockSet: 4,
            },
          ],
        },
        onExhausted: { nextState: "normal", tag: "koujinEnd", resultLabel: "鋼人攻略戦終了" },
      },

      uraMode: {
        id: "uraMode",
        label: "裏モード",
        mode: "countDown",
        maxAttempts: 20,
        probability: 1 / 319,
        actionLabel: "START",
        theme: "chance",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: false,
        onHit: {
          // 裏モード中の当たりは裏ご褒美RUSHへ直行（1geki.jp記載）。この遷移自体の
          // 振り分け表は無いため、直行先の裏ご褒美RUSH自身の振り分け（87%/13%、
          // 13%側は上乗せループつき）をそのまま使う。
          outcomes: [
            {
              weight: 0.87,
              rounds: 10,
              balls: 3000,
              nextState: "uraGohobiRush",
              tag: "uraModeToUraGohobi",
              stockSet: 4,
            },
            {
              weight: 0.13,
              rounds: 10,
              balls: 4500,
              nextState: "uraGohobiRush",
              tag: "uraModeToUraGohobiMega",
              stockSet: 4,
              resultNote: "上乗せ",
              bonusLoop: { probability: 0.13, balls: 1500 },
            },
          ],
        },
        onExhausted: { nextState: "normal", tag: "uraModeEnd", resultLabel: "裏モード終了" },
      },

      // 固定回転数を持たないストック制（お願い玉）状態。当落判定は毎回転ではなく
      // judgmentGateで「そもそもリーチが発生するか」を先に抽選する（詳細はファイル
      // 冒頭のコメント、およびcore/stateEngine.jsのコメントを参照）。
      // 残りストックが2個以下か3個以上かで当選時の振り分け先・出玉が変わる
      // （onHit.stockOutcomes）。保留の色変化予告は出さない（machine.js側でこの
      // 状態にいる間は色抽選自体をスキップする）。
      kotokoRush: {
        id: "kotokoRush",
        label: "琴子のご褒美RUSH",
        mode: "countDown",
        maxAttempts: null,
        stockMode: true,
        judgmentGate: { probability: 1 / 11.6 },
        remainingLabel: "お願い玉",
        remainingUnit: "個",
        probability: 0.25,
        actionLabel: "START",
        theme: "rush",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: true,
        onHit: {
          stockOutcomes: [
            {
              maxStock: 2,
              outcomes: [
                {
                  weight: 1,
                  rounds: 10,
                  balls: 1500,
                  nextState: "kotokoRush",
                  tag: "kotokoContinueLow",
                  stockAdd: 4,
                },
              ],
            },
            {
              // 残り3個以上での当選は、次のRUSHが「次の当たりまでお願い玉が減らない」。
              // 画面では お願い玉 ♾️ と出る。
              minStock: 3,
              outcomes: [
                {
                  weight: 0.82,
                  rounds: 10,
                  balls: 3000,
                  nextState: "kotokoRush",
                  tag: "kotokoContinueHigh",
                  stockUnlimited: true,
                },
                {
                  weight: 0.18,
                  rounds: 10,
                  balls: 3000,
                  nextState: "uraGohobiRush",
                  tag: "kotokoToUraGohobi",
                  stockUnlimited: true,
                  resultNote: "Vストック",
                },
              ],
            },
            {
              // ♾️中の当たり。ここで無制限は終わり、通常どおり4個で再開する。
              // 無制限を配り続けると連チャンが終わらなくなる（試算で平均1285連）。
              whenUnlimited: true,
              outcomes: [
                {
                  weight: 0.82,
                  rounds: 10,
                  balls: 3000,
                  nextState: "kotokoRush",
                  tag: "kotokoContinueHigh",
                  stockSet: 4,
                },
                {
                  weight: 0.18,
                  rounds: 10,
                  balls: 3000,
                  nextState: "uraGohobiRush",
                  tag: "kotokoToUraGohobi",
                  stockSet: 4,
                  resultNote: "Vストック",
                },
              ],
            },
          ],
        },
        onExhausted: {
          nextState: "normal",
          tag: "kotokoRushEnd",
          resultLabel: "琴子のご褒美RUSH終了",
        },
      },

      // 裏ご褒美RUSHはストック常に4個固定（持ち越し無し、stockSetのみ使用）。
      uraGohobiRush: {
        id: "uraGohobiRush",
        label: "裏ご褒美RUSH",
        mode: "countDown",
        maxAttempts: null,
        stockMode: true,
        judgmentGate: { probability: 1 / 11.6 },
        remainingLabel: "お願い玉",
        remainingUnit: "個",
        probability: 0.25,
        actionLabel: "START",
        theme: "rush",
        accruesInvestment: false,
        isBaseState: false,
        isRushEntry: true,
        onHit: {
          // 振り分けの中身は残りストックによらず同じ（87%/13%、ストック4個で再開）。
          // それでも表を2つに分けるのは、無制限中かどうかで表を切り替える仕組みだから。
          // 中身が同じでも、無制限の表を用意しておかないとRUSHが終わらなくなる。
          stockOutcomes: [
            { minStock: 1, outcomes: URA_GOHOBI_OUTCOMES },
            { whenUnlimited: true, outcomes: URA_GOHOBI_OUTCOMES },
          ],
        },
        onExhausted: {
          nextState: "normal",
          tag: "uraGohobiRushEnd",
          resultLabel: "裏ご褒美RUSH終了",
        },
      },
    },

    distributionTables: {},

    // 10Rには1500/3000/4500個の3種類があるため、代表値のみ置き、実際の出玉は
    // 各onHit.outcomesのballsで上書きする。
    payoutTable: { 2: 300, 10: 1500 },
  });
})();
