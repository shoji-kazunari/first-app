// 第63号機: eアズールレーン2 THE ANIMATION 超次元（2025年 KYORAKU パチンコ/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_azuren2/）。
// 大当り振り分けは、同ページに掲載されている3枚の円グラフ画像（ATTACK時・
// 決戦BIG BONUS中・共同戦線RUSH中）をダウンロードしてReadツールで直接読み取った実数値、
// および「大海戦ATTACK」の個別解説表（当選契機・ラウンド数・移行先）を突き合わせて構造化した。
//
// 【ゲーム構造】
// ヘソ入賞（当選確率1/169.9、ページ上は「ATTACK確率」と呼称）で大当りすると、必ず
// 「大海戦ATTACK」（2～5R、約320～約790個）に突入し、出玉を獲得したうえで演出成功/失敗の
// 抽選（成功率約30%）に進む。成功すれば「決戦BIG BONUS」（10R・約1500個）を追加で獲得し、
// その50%で「共同戦線RUSH」（電サポ次回まで＝転落式）へ突入する。失敗すれば大海戦ATTACKの
// 出玉だけを得て通常へ戻る。
//
// ヘソ入賞時（特図1）の大海戦ATTACK出玉振り分け（円グラフ「ATTACK時」、5パターン合計100%）:
//   ・5R(約790個)：4.1%　・4R(約620個)：11.1%　・3R(約470個)：22.1%
//   ・2R(約360個)：36.7%　・2R(約320個)：26.0%（上/下アタッカーの違いによる2種の2R）
// 大海戦ATTACK終了後の演出成功/失敗（個別解説表に記載、成功率約30%、必ず成立する演出）:
//   ・演出成功→決戦BIG BONUSへ：約30%　・演出失敗→通常時へ：約70%
// 決戦BIG BONUS中（電チュー入賞時・特図2、必ず成立する演出）の振り分け:
//   ・10R大当り(約1500個)→通常（時短なし）：50.0%
//   ・10R大当り(約1500個)→共同戦線RUSHへ：50.0%
// 共同戦線RUSH中（電チュー入賞時・特図2、当選確率約1/21.9、転落確率約1/71.7）の振り分け:
//   ・図柄揃いのたび必ず「OVERSHOT BIGBONUS」(10R×2、平均約3000個)を獲得し、RUSH継続
// （共同戦線RUSHは転落小当り（約1/71.7）を引くと終了。「残保留4個による引き戻し約17.0%を
// 含む」との記載があり、転落を引いた瞬間に確定させず残保留4回転ぶん追加で当落を見る
// pf-gundam-uc.js等と同じ構造と判断し、onFall.residualAttempts: 4で実装した。素の比率
// (1/21.9)/((1/21.9)+(1/71.7))≈78.6%に対し、residualAttempts:4を加えた計算値は約82.2%と
// なり、公表の「約81%」にほぼ一致する）
//
// 【ATTACK・決戦BIG BONUS・演出成功判定をprobability:1の状態として実装】
// 大海戦ATTACKの出玉（5パターン）は必ず発生するため通常状態のonHitに直接持たせ、その後の
// 「演出成功/失敗」判定と、成功時の決戦BIG BONUS自体（さらにその50/50の行き先判定）は、
// いずれも外れの無い演出のため、e-accelerator-saikyo.jsのsaikyoJudgmentと同じ
// 「probability:1、mode:countUp」で表現した。演出成功/失敗の判定自体には出玉が
// 付随しない（大海戦ATTACKで既に出玉を得ている）ため、rounds:1・balls:0の明示的な
// オーバーライドで表現した（e-nanatai3.js等と同じ扱い）。
//
// 【OVERSHOT BIGBONUS中の「倍乗せ」（獲得出玉が倍になる、最大12000個）は未実装】
// ラウンド中の「ブルーアウトから倍乗せ」演出の発生率が公開されておらず、通常は
// 平均約3000個で確定という基本値のみを採用した。
//
// 【出玉について】
// このページには他の多くの機種にある「実獲得個数」の記載が無く（「大当たり出玉
// （実獲得）」の欄も「約」表記のみで同じ値）、払い出し個数をそのまま採用した
// （e-accelerator-saikyo.jsと同じ扱い）。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-azuren2",
  slug: "e-azuren2",
  name: "eアズールレーン2 THE ANIMATION 超次元",
  nameKana: "いーあずーるれーんつーじあにめーしょんちょうじげん",
  aliases: ["アズールレーン2", "アズレン2", "eアズールレーン2", "アズールレーンパチンコ2"],
  manufacturer: { id: "kyoraku", name: "KYORAKU（京楽）" },
  releaseYear: 2025,
  category: "パチンコ（ライトミドル・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当り確率（ATTACK確率）：1/169.9",
    "共同戦線RUSH中の当選確率：約1/21.9、転落確率：約1/71.7",
    "共同戦線RUSH（LT）：電サポ次回まで（転落式）、継続率約81%（残保留4個の引き戻し込み）",
    "大海戦ATTACK演出成功率：約30%（決戦BIG BONUSへ）",
    "通常時の大当り振り分け（大海戦ATTACK出玉）：5R・約790個が4.1%、4R・約620個が11.1%、3R・約470個が22.1%、2R・約360個が36.7%、2R・約320個が26.0%",
    "大海戦ATTACK終了後の演出成功/失敗（必ず成立）：成功で決戦BIG BONUSへが約30%、失敗で通常時へが約70%",
    "決戦BIG BONUS中の振り分け（必ず成立）：10R・約1500個で通常のままが50.0%、10R・約1500個で共同戦線RUSHへが50.0%",
    "共同戦線RUSH中の当選振り分け：図柄揃いのたび10R×2・約3000個（OVERSHOT BIGBONUS）を獲得しRUSH継続",
    "共同戦線RUSHは転落小当り（約1/71.7）を引くと終了（残保留4個の引き戻しあり）",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 169.9,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.041,
            rounds: 5,
            balls: 790,
            nextState: "attackResult",
            tag: "attack5r",
            resultNote: "大海戦ATTACK",
          },
          {
            weight: 0.111,
            rounds: 4,
            balls: 620,
            nextState: "attackResult",
            tag: "attack4r",
            resultNote: "大海戦ATTACK",
          },
          {
            weight: 0.221,
            rounds: 3,
            balls: 470,
            nextState: "attackResult",
            tag: "attack3r",
            resultNote: "大海戦ATTACK",
          },
          {
            weight: 0.367,
            rounds: 2,
            balls: 360,
            nextState: "attackResult",
            tag: "attack2ra",
            resultNote: "大海戦ATTACK",
          },
          {
            weight: 0.26,
            rounds: 2,
            balls: 320,
            nextState: "attackResult",
            tag: "attack2rb",
            resultNote: "大海戦ATTACK",
          },
        ],
      },
      onExhausted: null,
    },

    attackResult: {
      id: "attackResult",
      label: "大海戦ATTACK演出",
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
            weight: 0.3,
            rounds: 1,
            balls: 0,
            nextState: "kessenBonus",
            tag: "toBonus",
            resultNote: "決戦BIG BONUS",
          },
          {
            weight: 0.7,
            rounds: 1,
            balls: 0,
            nextState: "normal",
            tag: "attackFail",
            resultNote: "通常時へ",
          },
        ],
      },
      onExhausted: null,
    },

    kessenBonus: {
      id: "kessenBonus",
      label: "決戦BIG BONUS",
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
            weight: 0.5,
            rounds: 10,
            balls: 1500,
            nextState: "normal",
            tag: "bonusToNormal",
            resultNote: "通常（時短なし）",
          },
          {
            weight: 0.5,
            rounds: 10,
            balls: 1500,
            nextState: "kyoudousenRush",
            tag: "toRush",
            resultNote: "共同戦線RUSH",
          },
        ],
      },
      onExhausted: null,
    },

    kyoudousenRush: {
      id: "kyoudousenRush",
      label: "共同戦線RUSH",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 21.9,
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
            nextState: "kyoudousenRush",
            tag: "continue",
            resultNote: "OVERSHOT BIGBONUS",
          },
        ],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 71.7,
        nextState: "normal",
        tag: "rushFall",
        resultLabel: "共同戦線RUSH終了（転落）",
        residualAttempts: 4,
      },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1500, 5: 790, 4: 620, 3: 470, 2: 360 },
});
