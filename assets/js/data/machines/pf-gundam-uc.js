// 第3号機: PF機動戦士ガンダムユニコーン（SANKYO 1/319.7 転落抽選型）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/p_gundamuc/1/）。
// 実行環境のネットワークポリシーで1geki.jpへ到達できなかったため、依頼者に
// スクリーンショットを撮ってもらい、スペック表・振り分け表を画像として読み取った。
//
// 基本スペック（スペック表より）:
//   大当り確率  低確率時 1/319.7 / 右打ち中 約1/41.1（※1,2）
//   RUSH突入率  60%  ／  RUSH継続率 約81%  ／  転落小当り確率 約1/153.7（※1,3）
//   ラウンド 10R/3R ／ 時短・電サポ 0回or10000回
//   払い出し個数（実獲得個数） 10R=約1500個(約1400個) / 3R=約450個(約420個)
//   ※1 特図2に限る ／ ※2 特図当り、図柄揃い小当りの合算 ／ ※3 転落小当り当選時は出玉0個
//
// ヘソ入賞時（特図1）の振り分け:
//   ・10R大当り×2回（約3000個）電サポ10000回or転落まで … 20.0%
//   ・3R大当り（約450個）電サポ10000回or転落まで        … 40.0%
//   ・3R大当り（約450個）電サポ0回                      … 40.0%
//   20.0+40.0=60.0% がRUSH突入率と一致する。残り40%は電サポが付かず通常へ戻る。
// 電チュー入賞時（特図2）の振り分け:
//   ・10R大当り（約1500個）電サポ10000回or転落まで … 100%
//
// 【この機種がこれまでと違う点】
// RUSHが規定回数で終わらない。「次の大当り(約1/41.1)か転落小当り(約1/153.7)を
// 引くまでループ」する転落抽選型なので、countUp/countDownでは表現できない。
// このためエンジンに onFall を足した（core/stateEngine.js を参照）。
// 電サポ10000回は事実上の無制限なので、maxAttemptsではなくonFallで表現している。
//
// 【継続率が公表値と1.7ポイントずれる件・要注意】
// 上記の確率どおりに実装すると、RUSH継続率は 79.3% になる（200万回試行で79.31%）。
// 1geki.jp掲載の「約81%」とは一致しない。
//   1回転あたり 大当り2.4338% / 転落0.6342%（大当りを外した回転でのみ転落抽選）
//   79.3% = 2.4338 / (2.4338 + 0.6342)
// ※3を確認しても説明が付かなかった（※3は「転落小当り当選時は出玉0個」という
// 出玉の話で、確率とは無関係）。ページ末尾に「※数値等自社調査」とあるため、
// 約81%は一撃側の独自計算値で、丸めか計算方法の違いと考えられる。
// 公表されていない値を逆算して81%に合わせることはしない（推測値を入れないため）。
// 一次情報に当たれる環境で確認が取れたら、ここを更新すること。
//
// 【出玉は「払い出し個数」を採用】
// 1geki.jpは払い出し個数と実獲得個数の両方を載せている（10R: 約1500個/約1400個）。
// ここでは払い出し個数を採る。既存2機種（シンフォギア・エヴァ17）が払い出し基準で
// 入っており、機種をまたぐ一撃出玉ランキングで基準が混ざるのを避けるため。
// 全機種を実獲得基準へ揃える場合は、3機種まとめて直すこと。
//
// 【入れなかった項目】
// 導入年・カテゴリは、もらったスクリーンショットに写っておらず確認できなかったため
// 書いていない（どちらも画面表示には使われていない）。
// 正式名称の表記ゆれ（「PF」と「Pフィーバー」）も未確認。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "pf-gundam-uc",
  slug: "pf-gundam-uc",
  name: "PF機動戦士ガンダムユニコーン",
  nameKana: "ぴーえふきどうせんしがんだむゆにこーん",
  aliases: [
    "ユニコーン",
    "ガンダムユニコーン",
    "ユニコーンガンダム",
    "ガンダムUC",
    "UC",
    "ユニコーン319",
  ],
  manufacturer: { id: "sankyo", name: "SANKYO" },

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  rules: [
    "通常時大当たり確率：1/319.7",
    "RUSH中大当たり確率：約1/41.1",
    "RUSH突入率：60%（通常時の大当たりのうち、電サポが付くのが60%）",
    "RUSHは回転数で終わらない。次の大当たりか転落小当り（約1/153.7）を引くまで続く",
    "RUSH継続率：約81%（本シミュレーターは公表の確率どおりに抽選するため約79%になります）",
    "通常時の大当たり振り分け（ヘソ入賞時）：10R×2回・約3000個でRUSHが20%、3R・約450個でRUSHが40%、3R・約450個で電サポ無し（通常へ戻る）が40%",
    "RUSH中の大当たり振り分け（電チュー入賞時）：10R・約1500個が100%",
    "転落小当りを引くと出玉0個でRUSHが終わり、通常へ戻る",
  ],

  states: {
    normal: {
      id: "normal",
      label: "通常",
      mode: "countUp",
      maxAttempts: null,
      probability: 1 / 319.7,
      actionLabel: "START",
      theme: "normal",
      accruesInvestment: true,
      isBaseState: true,
      isRushEntry: false,
      onHit: {
        outcomes: [
          {
            weight: 0.2,
            rounds: 10,
            balls: 3000, // 10R大当り×2回ぶんの合計。payoutTable[10]=1500の2回分
            nextState: "rush",
            tag: "toRushDouble",
            resultNote: "10R×2回",
          },
          { weight: 0.4, rounds: 3, nextState: "rush", tag: "toRush" },
          {
            // 電サポ0回。大当たりして出玉は得るが、RUSHには入らず通常へ戻る
            weight: 0.4,
            rounds: 3,
            nextState: "normal",
            tag: "noRush",
            resultNote: "電サポなし",
          },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "RUSH",
      mode: "countUp", // 規定回数が無いのでcountUp。終わりはonFall（転落）が決める
      maxAttempts: null,
      probability: 1 / 41.1,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [{ weight: 1, rounds: 10, nextState: "rush", tag: "rushLoop" }],
      },
      onExhausted: null,
      onFall: {
        probability: 1 / 153.7,
        nextState: "normal",
        tag: "rushFell",
        resultLabel: "転落（RUSH終了）",
      },
    },
  },

  payoutTable: { 3: 450, 10: 1500 },
});
