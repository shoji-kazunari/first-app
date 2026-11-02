// 第116号機: eとある魔術の禁書目録3（2026年 orange(オレンジ)/藤商事グループ スマパチ/ラッキートリガー3.0/二種）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_toaruindex3/）。導入日2026年11月2日（本日）。
// WebFetchでページ本文を取得した上で、大当り振り分けの円グラフ画像4枚
// （通常時／前半ST:LIMIT BREAK CHANCE／後半ST:とある魔術の最強激突／
// ST最終回転:LAST CHANCE）を
// https://images.1geki.jp/machines/pachinko/e_toaruindex3/ からダウンロードし、
// Readツールで直接読み取って実数値を確認した。
//
// ヘソ入賞時（特図1・通常時、大当り確率1/348）の振り分け:
//   ・10R大当り(約1500個)→通常のまま（時短なし）：50.0%
//   ・10R大当り(約1500個)→ST（前半 LIMIT BREAK CHANCE）へ：50.0%
// （本文の「ST突入率は通常時大当りの50%」と完全一致）
//
// 前半ST:LIMIT BREAK CHANCE（30回、特図2・電チュー入賞時、当選確率1/99）の振り分け:
//   ・10R大当り(約1500個、V入賞が条件)→ST最初（前半）に戻る：50.0%
//   ・10R×2大当り(約3000個+α、V入賞が条件)→ST最初（前半）に戻る：50.0%
//     （円グラフ注記「大当り2回分の出玉の合計」＝1500個×2。さらに別途本文に
//     「50%で約1500個の上乗せループが発生する可能性があり、平均約4500個」と
//     あり、bonusLoop（probability:0.5, balls:1500）を足すと
//     3000＋1500×(0.5/0.5)=4500で平均値と完全一致する）
// 後半ST:とある魔術の最強激突（100回、特図2・電チュー入賞時、当選確率1/128）の振り分け:
//   ・10R×2大当り(約3000個、V入賞が条件)→ST最初（前半）に戻る：100%
//     （円グラフは「約3000個」1本のみで上乗せループの記載は無い）
// ST最終回転:LAST CHANCE（1回、特図2・電チュー入賞時、当選確率1/4）の振り分け:
//   ・ReSTART（出玉無し）→ST最初（前半）に戻る：成功率1/4（円グラフ注記）
//   （本文の「最終回転のLAST CHANCEで当選するとST回数がリセットされる」
//   「約25%でSTリセット」と一致。外れた場合（3/4）はそのままST全体が終了し
//   通常へ戻る）
//
// 【3状態チェーンにした理由・TOTAL継続率の裏付け】
// 「ST TOTAL 131回＝前半30回＋後半100回＋最終1回」という構成で、各フェーズの
// 当りは全て「終了後はSTへ」（＝前半の頭に戻る）という記載・円グラフのため、
// stPhase1（countDown30・前半）→（全弾外れたら）stPhase2（countDown100・後半）
// →（全弾外れたら）stPhase3（countDown1・LAST CHANCE）→（外れたら通常）という
// 3状態のチェーンで表現した。理論値を計算すると、
// 前半を1発も当てずに抜ける確率 (1-1/99)^30≈73.7%、
// 後半も1発も当てずに抜ける確率 (1-1/128)^100≈45.7%、
// 最終回転も外す確率 3/4=75%。
// 3つとも外れて通常へ落ちる確率は0.737×0.457×0.75≈25.3%となり、
// 継続率は1-0.253≈74.7%で、スペック表の「TOTAL継続率約75%」とほぼ完全に
// 一致した。この一致により、各フェーズの当りが全てST最初（前半）へ戻る、
// という読み取りが正しいと判断した。
//
// 【迷った点・未実装】
// ・スペック概要欄にある「約7500個+α(5回分以上の合計)」「約6000個(4回分以上)」
//   「約4500個(3回分以上)」等は、1回のRUSH内で複数回の当りが積み上がった
//   場合の累計出玉の目安表であり、1回ごとの振り分け円グラフ（前半/後半/最終）
//   とは別物と判断し、個別のoutcomeとしては実装していない（複数回当りが続けば
//   シミュレーター上も自然に積み上がる）。
// ・1000円あたりの回転数は本文に記載が無いため既定値16を採用。
// ・時短の有無は本文に記載が無く、通常時の大当りでSTに入らなかった場合は
//   そのまま通常へ戻る前提とした。
// ・ボーダー/交換率は「現在調査中」と明記されており、確定値が無いため未使用。
// ・出玉は「実獲得個数」の記載が無く、払い出し個数（約1500個単位）をそのまま採用。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-toaruindex3",
  slug: "e-toaruindex3",
  name: "eとある魔術の禁書目録3",
  nameKana: "いーとあるまじゅつのきんしょもくろくすりー",
  aliases: ["とあるインデックス3", "インデックス3", "とある3", "eとあるインデックス3", "LIMIT BREAK CHANCE"],
  manufacturer: { id: "orange-fuji", name: "orange(オレンジ)/藤商事グループ" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・Lv.4・ラッキートリガー3.0・二種）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "ヘソの大当りはちょうど五分でST（LIMIT BREAK CHANCE）へ突入する素直な構成。STは前半30回・後半100回・最終回転の3段構えで、どのフェーズで当ってもST最初へ戻るため、全弾外すまで粘り強く出玉を伸ばせる。最終回転のLAST CHANCEまで辿り着けば、1/4を引き当てて土俵際から復活する一発逆転もある。",
  rules: [
    "通常時大当り確率：1/348",
    "前半ST（LIMIT BREAK CHANCE・30回）の当選確率：1/99",
    "後半ST（とある魔術の最強激突・100回）の当選確率：1/128",
    "ST最終回転（LAST CHANCE・1回）の当選確率：1/4",
    "ST：TOTAL131回（前半30回＋後半100回＋最終1回）、継続率約75%",
    "ST突入率：通常時大当りの50%",
    "通常時の大当り振り分け（ヘソ入賞時）：10R・約1500個で通常のままが50.0%、10R・約1500個でSTへが50.0%",
    "前半STの当選振り分け：10R・約1500個でST最初に戻るが50.0%、10R×2・約3000個+α（平均約4500個）でST最初に戻るが50.0%",
    "後半STの当選振り分け：10R×2・約3000個でST最初に戻るが100%",
    "最終回転（LAST CHANCE）の当選振り分け：出玉無しでST最初に戻るが成功率1/4（外れるとST終了で通常へ）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 348,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1500, nextState: "normal", tag: "toNormal" },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1500,
            nextState: "stPhase1",
            tag: "toSt",
            resultNote: "LIMIT BREAK CHANCE",
          },
        ],
      },
      onExhausted: null,
    },

    stPhase1: {
      id: "stPhase1",
      label: "前半ST：LIMIT BREAK CHANCE",
      mode: "countDown",
      maxAttempts: 30,
      probability: 1 / 99,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 10, balls: 1500, nextState: "stPhase1", tag: "continue1500" },
          {
            weight: 0.5,
            rounds: 10,
            displayRounds: 20,
            balls: 3000,
            nextState: "stPhase1",
            tag: "continue3000Loop",
            resultNote: "10R×2",
            bonusLoop: { probability: 0.5, balls: 1500 },
          },
        ],
      },
      onExhausted: { nextState: "stPhase2", tag: "stPhase1End" },
    },

    stPhase2: {
      id: "stPhase2",
      label: "後半ST：とある魔術の最強激突",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 128,
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
            balls: 3000,
            nextState: "stPhase1",
            tag: "backToPhase1",
            resultNote: "10R×2",
          },
        ],
      },
      onExhausted: { nextState: "stPhase3", tag: "stPhase2End" },
    },

    stPhase3: {
      id: "stPhase3",
      label: "ST最終回転：LAST CHANCE",
      mode: "countDown",
      maxAttempts: 1,
      probability: 1 / 4,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 1,
            rounds: 1,
            balls: 0,
            nextState: "stPhase1",
            tag: "lastChanceReset",
            resultNote: "ReSTART",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "stEnd", resultLabel: "ST終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500 },
});
