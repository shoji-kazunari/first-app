// 第83号機: P緋弾のアリア～緋緋神降臨～88Ver.（2025年 FUJI（藤商事） 甘デジ/ラッキートリガー/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_hidannoaria_lt88/）。大当り振り分けは、
// 同ページに掲載されている3枚の円グラフ画像（通常時・強襲任務／LBR中・超LBR中）を
// ダウンロードしてReadツールで直接読み取った実数値。ラウンド数（○R）の表記が
// スペック表に無く、払い出し個数（約300個/約1000個）のみが公開されているため、
// 追加の換算をせず、その数値をそのまま採用した（e-accelerator-saikyo.jsと同じ扱い）。
//
// ヘソ入賞時（特図1・通常時、当選確率1/88.2＝大当り1/129.7とc時短1/275.3の合算値）の
// 振り分け（円グラフ「通常時」）:
//   ・約300個→強襲任務(アサルトクエスト、50回)へ：67.3%
//   ・c時短(出玉無し)→強襲任務(アサルトクエスト、50回)へ：32.0%
//   ・約300個→LBR(ライトニングバレットラッシュ、80回)へ直行：0.7%
// 強襲任務中（特図2・電チュー入賞時、当選確率1/129.9）／LBR中（特図2・電チュー入賞時、
// 当選確率1/67.8）で共通の出玉振り分け（円グラフ「強襲任務／LBR中」）:
//   ・約300個→LBRへ：66.4%
//   ・約1000個→LBRへ：20.9%
//   ・約1000個→超LBR(175回)へ：12.7%
// 超LBR中（特図2・電チュー入賞時、当選確率1/67.8）の振り分け:
//   ・約300個→継続：66.4%
//   ・約1000個→継続：33.6%
// （強襲任務の当選期待度約32%は、素の1-(1-1/129.9)^50≈32.0%と完全に一致し、
// LBR継続率約70%は、素の1-(1-1/67.8)^80≈69.5%とほぼ一致し、超LBR継続率約93%も、
// 素の1-(1-1/67.8)^175≈92.6%とほぼ一致するため、いずれも残保留等の引き戻しの無い
// シンプルな規定回数countDownで再現できる。強襲任務とLBRは当選確率こそ異なるが、
// 電チュー入賞時のヒット後の出玉振り分け比率（66.4%/20.9%/12.7%）は共通と判断した）
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "p-hidannoaria-lt88",
  slug: "p-hidannoaria-lt88",
  name: "P緋弾のアリア～緋緋神降臨～88Ver.",
  nameKana: "ぴーひだんのありあひひがみこうりんはちじゅうはちばー",
  aliases: ["緋弾のアリア88", "緋弾のアリアパチンコ", "LBR", "ライトニングバレットラッシュ"],
  manufacturer: { id: "fuji", name: "FUJI（藤商事）" },
  releaseYear: 2025,
  category: "パチンコ（甘デジ・ラッキートリガー・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時当選確率：1/88.2（大当り1/129.7とc時短1/275.3の合算値）",
    "強襲任務（アサルトクエスト）中の当選確率：1/129.9",
    "LBR・超LBR中の当選確率：1/67.8",
    "強襲任務：50回、当選期待度約32%",
    "LBR（ライトニングバレットラッシュ）：80回、継続率約70%",
    "超LBR：175回、継続率約93%",
    "強襲任務突入率：100%（LBR直行を含む）",
    "通常時の大当り振り分け（ヘソ入賞時）：約300個で強襲任務へが67.3%、c時短で強襲任務へが32.0%、約300個でLBRへ直行が0.7%",
    "強襲任務・LBR中の当選振り分け：約300個でLBRへが66.4%、約1000個でLBRへが20.9%、約1000個で超LBRへが12.7%",
    "超LBR中の当選振り分け：約300個で継続が66.4%、約1000個で継続が33.6%",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 88.2,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.673,
            rounds: 1,
            balls: 300,
            nextState: "assaultQuest",
            tag: "toAssault",
            resultNote: "強襲任務",
          },
          {
            weight: 0.32,
            rounds: 1,
            balls: 0,
            nextState: "assaultQuest",
            tag: "toAssaultViaCJitan",
            resultNote: "強襲任務（c時短）",
          },
          {
            weight: 0.007,
            rounds: 1,
            balls: 1000,
            nextState: "lbr",
            tag: "toLbrDirect",
            resultNote: "LBR",
          },
        ],
      },
      onExhausted: null,
    },

    assaultQuest: {
      id: "assaultQuest",
      label: "強襲任務（アサルトクエスト）",
      mode: "countDown",
      maxAttempts: 50,
      probability: 1 / 129.9,
      actionLabel: "START",
      theme: "chance",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.664,
            rounds: 1,
            balls: 300,
            nextState: "lbr",
            tag: "toLbr300",
            resultNote: "LBR",
          },
          {
            weight: 0.209,
            rounds: 1,
            balls: 1000,
            nextState: "lbr",
            tag: "toLbr1000",
            resultNote: "LBR",
          },
          {
            weight: 0.127,
            rounds: 1,
            balls: 1000,
            nextState: "superLbr",
            tag: "toSuperLbr",
            resultNote: "超LBR",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "assaultEnd", resultLabel: "強襲任務終了" },
    },

    lbr: {
      id: "lbr",
      label: "LBR（ライトニングバレットラッシュ）",
      mode: "countDown",
      maxAttempts: 80,
      probability: 1 / 67.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.664, rounds: 1, balls: 300, nextState: "lbr", tag: "continue300" },
          { weight: 0.209, rounds: 1, balls: 1000, nextState: "lbr", tag: "continue1000" },
          {
            weight: 0.127,
            rounds: 1,
            balls: 1000,
            nextState: "superLbr",
            tag: "toSuperLbr",
            resultNote: "超LBR",
          },
        ],
      },
      onExhausted: { nextState: "normal", tag: "lbrEnd", resultLabel: "LBR終了" },
    },

    superLbr: {
      id: "superLbr",
      label: "超LBR（ライトニングバレットラッシュ）",
      mode: "countDown",
      maxAttempts: 175,
      probability: 1 / 67.8,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          { weight: 0.664, rounds: 1, balls: 300, nextState: "superLbr", tag: "continue300" },
          { weight: 0.336, rounds: 1, balls: 1000, nextState: "superLbr", tag: "continue1000" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "superLbrEnd", resultLabel: "超LBR終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 1: 300 },
});
