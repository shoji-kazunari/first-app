// eワンパンマン2～正義執行 99ver.（2026年11月2日導入 newgin スマパチ/Lv.2/甘デジ/ST機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_onepanman2_99/）。型式名 eワンパンマン2～正義執行N5
// （検定番号610458）。スペック表と注記はWebFetchで本文から取得し、振り分けは同ページの
// 画像3枚（通常時の円グラフ e_onepanman2_99-gazou3、HERO RUSH中の円グラフ gazou4、
// ゲームフロー図 gazou78）を images.1geki.jp からダウンロードし、Readツールで直接読み取った。
//
// 基本スペック:
//   大当り確率 通常時 1/99.9 ／ HERO RUSH中（SHOW DOWN確率） 1/96.5
//   HERO RUSH: ST66回、継続率約50%、突入率は通常時大当りの40%
//   出玉（払い出し） 6R=約840個 / 5R=約252個 / 4R=約560個
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou3）:
//   ・6R+4R×3大当り(約2520個、必殺マジBONUS2500)→HERO RUSH（ST66回）：0.5%
//   ・5R大当り(約252個、HERO BONUS＋ヒーローラッシュチャレンジ成功)→HERO RUSH：39.5%
//   ・5R大当り(約252個)→通常時（時短なし）：60.0%
//   （0.5%＋39.5%＝40%で、公表のRUSH突入率40%と一致。ガロウバトルは「必殺マジ
//   BONUS2500への昇格濃厚」とあり、この0.5%側に含まれると判断した）
// 電チュー入賞時（特図2・HERO RUSH中）の振り分け（gazou4、すべてHERO RUSH ST66回へ）:
//   ・4R大当り×9(約5040個、正義執行5000 BONUS)：約22%
//   ・4R大当り×2(約1120個、SUPER HERO BONUS)：約56%
//   ・STリセット（REVERSE、出玉無し。ST残り回数が66回に戻る）：約22%
//   （本文「約22%で約5040個、約56%で約1120個、残り約22%はSTリセット」と一致）
//
// 【検算】
//   ST66回 1-(1-1/96.5)^66 ≈ 49.7% → 公表の継続率約50%と一致。1/96.5はSTリセットを
//   含めたSHOW DOWN確率で、STリセットも「RUSH継続」の扱いになるため、
//   SHOW DOWN全体を当選として66回のcountDownにすれば公表値が再現できる。
//
// 【迷った箇所】
// ・本文の別セクション（リーチ信頼度の表）に「5000個大当たり割合・1120個大当たり割合は、
//   出玉あり時の振り分け」という注記があるが、これはリーチごとの表の列に付いた注記で、
//   RUSH中の円グラフ（22%/56%/22%で合計100%）には関係しないことをWebFetchで確認した。
// ・HERO RUSH（ST66回）消化後の移行先は本文に記載が無いが、ゲームフロー図で
//   HERO RUSHから通常時へ戻る矢印があるため通常時とした。
//
// 【出玉は払い出し個数を採用】
// 1geki.jpに「実獲得」の記載が無いため、e-toaruindex3.jsと同じく払い出し個数をそのまま使った。
// 必殺マジBONUS2500は6R+4R×3＝840＋560×3＝2520、正義執行5000 BONUSは560×9＝5040、
// SUPER HERO BONUSは560×2＝1120で、いずれもスペック表の個数と一致する。
// 【spinsPer1000Yen】デカヘソ等の記載もボーダーの記載も無いため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-onepanman2-99",
  slug: "e-onepanman2-99",
  name: "eワンパンマン2～正義執行 99ver.",
  nameKana: "いーわんぱんまんつーせいぎしっこうきゅうきゅうばーじょん",
  aliases: ["ワンパンマン", "ワンパンマン2", "ワンパンマン2甘", "ワンパンマン99", "正義執行", "HERO RUSH"],
  manufacturer: { id: "newgin", name: "newgin（ニューギン）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・Lv.2・甘デジ・ST機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "甘デジながらHERO RUSH中の当りの約22%が4R×9の「正義執行5000 BONUS」で、約5040個を一気に獲得できる。さらに約22%は出玉の代わりにST66回を丸ごと回復する「REVERSE」で、RUSHが仕切り直しになる。",
  rules: [
    "通常時大当り確率：1/99.9",
    "HERO RUSH中のSHOW DOWN確率：1/96.5（STリセットを含む）",
    "HERO RUSH：ST66回、継続率約50%",
    "HERO RUSH突入率：通常時大当りの40%",
    "通常時の振り分け（ヘソ入賞時）：6R+4R×3・約2520個でHERO RUSH直行が0.5%、5R・約252個でHERO RUSHが39.5%、5R・約252個で通常のままが60.0%",
    "HERO RUSH中の振り分け（電チュー入賞時）：4R×9・約5040個が約22%、4R×2・約1120個が約56%、STリセット（出玉無し・ST66回に回復）が約22%",
    "HERO RUSHを全弾外すと通常へ",
    "出玉は払い出し個数（実獲得の公表値なし）",
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
          {
            weight: 0.005,
            rounds: 6,
            displayRounds: 18,
            balls: 2520,
            nextState: "rush",
            tag: "toRushMaji",
            resultNote: "必殺マジBONUS2500",
          },
          { weight: 0.395, rounds: 5, balls: 252, nextState: "rush", tag: "toRush", resultNote: "HERO RUSH" },
          { weight: 0.6, rounds: 5, balls: 252, nextState: "normal", tag: "toNormal" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "HERO RUSH",
      mode: "countDown",
      maxAttempts: 66,
      probability: 1 / 96.5,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.22,
            rounds: 4,
            displayRounds: 36,
            balls: 5040,
            nextState: "rush",
            tag: "rush5000",
            resultNote: "正義執行5000 BONUS",
          },
          {
            weight: 0.56,
            rounds: 4,
            displayRounds: 8,
            balls: 1120,
            nextState: "rush",
            tag: "rush1120",
            resultNote: "SUPER HERO BONUS",
          },
          {
            weight: 0.22,
            rounds: 1,
            balls: 0,
            nextState: "rush",
            tag: "rushReverse",
            resultNote: "REVERSE（STリセット）",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "HERO RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 6: 840, 5: 252, 4: 560 },
});
