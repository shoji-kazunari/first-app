// e 獣王 獅子の一撃（2026年11月2日導入 Sammy スマパチ/Lv.4/ラッキートリガー3.0/一種二種混合機）
//
// 情報源: 1geki.jp（https://1geki.jp/pachinko/e_juuou_sisi/）。型式名 e獣王SFEA
// （検定番号610663）。スペック表と注記はWebFetchで本文から取得し、振り分けは同ページの
// 画像4枚（通常時の円グラフ e_juuou_sisi_gazou2、獣王RUSH中の円グラフ gazou3、
// サバンナチャンスの獲得出玉内訳 gazou65、ゲームフロー図 gazou4）を images.1geki.jp から
// ダウンロードし、Readツールで直接読み取った。
//
// 基本スペック:
//   大当り確率 通常時 約1/319.7 ／ 獣王RUSH中 約1/144.7
//   獣王RUSH: ST100回、継続率約50%、突入率は通常時大当りの50%（獣王RUSHチャレンジ成功）
//   出玉 10R=約1500個(実獲得約1400個) / 2R=約300個(約280個)
//
// ヘソ入賞時（特図1・通常時）の振り分け（gazou2）:
//   ・約300個→通常（時短なし）：50.0%
//   ・約300個→獣王RUSH（ST100回）：50.0%
//   （本文のスペック表で約300個＝2R、実獲得約280個）
// 電チュー入賞時（特図2・獣王RUSH中）の振り分け（gazou3、すべて獣王RUSH ST100回へ）:
//   ・サバンナチャンス（平均約9800個、最低保証4500個＝10R×3）：約50.0%
//   ・約3000個（1500個×2）：約17.0%
//   ・約1500個（10R）：約33.0%
// サバンナチャンスの獲得出玉内訳（gazou65）:
//   約4500個 16.0% ／ 約6000個 22.0% ／ 約7500個 14.0% ／ 約9000個 11.0% ／ 約10000個OVER 37.0%
//   （画像内に「X.X%」という数値の入っていないラベルが1つ残っているが、5区分の合計が
//   ちょうど100%になるため、作図上の消し忘れと判断して無視した）
//
// 【検算】
//   ST100回 1-(1-1/144.7)^100 ≈ 50.0% → 公表の継続率約50%と一致（残保留の上乗せ等は不要）
//
// 【仮定を置いた箇所（確証のある数値ではない）】
// ・サバンナチャンスの「約10000個OVER」（37%）の中身は公開されていない。そこで
//   公表の平均約9800個から逆算した。OVER以外の4区分の寄与は
//   0.16×4500＋0.22×6000＋0.14×7500＋0.11×9000＝4080個なので、OVER区分の平均は
//   (9800−4080)/0.37 ≈ 15,460個。「上乗せが続く限り継続」という本文の仕組みに合わせ、
//   OVER区分を「1500個×7＝10500個から、確率pで1500個上乗せを外すまで繰り返す」と置くと
//   10500＋1500×p/(1−p)＝15,460 → p ≈ 0.768。内訳の7500→9000以上（48/62≈0.774）、
//   9000→OVER（37/48≈0.771）の継続割合ともほぼ同じなので p＝0.77 とした
//   （このときサバンナチャンス全体の平均は約9,820個で公表の約9800個とほぼ一致）。
//   実獲得換算（×14/15）で、OVER区分は 9800個＋bonusLoop(0.77, 1400個)。
// ・獣王RUSH（ST100回）を外し切ったあとの移行先は本文に明記が無いが、ゲームフロー図・
//   円グラフとも時短の記載が無いため通常時へ戻ると解釈した。
//
// 【実装していないもの】
// ・獣王RUSHチャレンジの2モード（最終決戦／バトカバチャンス）は演出選択で、突入率は
//   どちらも円グラフの50%に含まれる
// ・遊タイムの記載は無い
//
// 【出玉は「実獲得個数」を採用】10R→1400個、10R×2→2800個、10R×3→4200個、
// 10R×4→5600個、10R×5→7000個、10R×6→8400個、10R×7→9800個、2R→280個。
// 【spinsPer1000Yen】「ドデカSTRAIGHT」（釘の並び）の記載はあるが、デカヘソではなく
// 具体的な回転数やボーダーも「現在調査中」のため既定値16のまま。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry.register({
  id: "e-juuou-shishi",
  slug: "e-juuou-shishi",
  name: "e 獣王 獅子の一撃",
  nameKana: "いーじゅうおうししのいちげき",
  aliases: ["獣王", "獣王パチンコ", "e獣王", "獅子の一撃", "獣王RUSH", "サバンナチャンス"],
  manufacturer: { id: "sammy", name: "Sammy（サミー）" },
  releaseYear: 2026,
  releaseDate: "2026-11-02",
  category: "パチンコ（スマパチ・Lv.4・ラッキートリガー3.0・一種二種混合機）",

  spinsPer1000Yen: 16,
  baseStateId: "normal",

  highlights:
    "獣王RUSHはST100回・継続率約50%と控えめだが、RUSH中の当りの半分が最低4500個保証の「サバンナチャンス」。上乗せが続く限り終わらず、平均は約9800個、37%は10000個オーバーに届く。1回の当りで一撃の差がつく荒波仕様。",
  rules: [
    "通常時大当り確率：約1/319.7",
    "獣王RUSH中の大当り確率：約1/144.7",
    "獣王RUSH：ST100回、継続率約50%",
    "獣王RUSH突入率：通常時大当りの50%（獣王RUSHチャレンジ成功）",
    "通常時の振り分け（ヘソ入賞時）：2R・実獲得約280個で通常のままが50.0%、2R・実獲得約280個で獣王RUSHが50.0%",
    "獣王RUSH中の振り分け（電チュー入賞時）：サバンナチャンス（最低4500個保証・平均約9800個）が約50.0%、約3000個（実獲得約2800個）が約17.0%、約1500個（実獲得約1400個）が約33.0%",
    "サバンナチャンスの内訳：約4500個16.0%、約6000個22.0%、約7500個14.0%、約9000個11.0%、約10000個OVER37.0%（OVER部分の中身は公表平均から逆算した仮定値）",
    "獣王RUSHを全弾外すと通常へ",
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
          { weight: 0.5, rounds: 2, balls: 280, nextState: "normal", tag: "toNormal" },
          { weight: 0.5, rounds: 2, balls: 280, nextState: "rush", tag: "toRush", resultNote: "獣王RUSH" },
        ],
      },
      onExhausted: null,
    },

    rush: {
      id: "rush",
      label: "獣王RUSH",
      mode: "countDown",
      maxAttempts: 100,
      probability: 1 / 144.7,
      actionLabel: "START",
      theme: "rush",
      accruesInvestment: false,
      isBaseState: false,
      isRushEntry: true,
      onHit: {
        outcomes: [
          {
            weight: 0.5 * 0.16,
            rounds: 10,
            displayRounds: 30,
            balls: 4200,
            nextState: "rush",
            tag: "savanna4500",
            resultNote: "サバンナチャンス",
          },
          {
            weight: 0.5 * 0.22,
            rounds: 10,
            displayRounds: 40,
            balls: 5600,
            nextState: "rush",
            tag: "savanna6000",
            resultNote: "サバンナチャンス",
          },
          {
            weight: 0.5 * 0.14,
            rounds: 10,
            displayRounds: 50,
            balls: 7000,
            nextState: "rush",
            tag: "savanna7500",
            resultNote: "サバンナチャンス",
          },
          {
            weight: 0.5 * 0.11,
            rounds: 10,
            displayRounds: 60,
            balls: 8400,
            nextState: "rush",
            tag: "savanna9000",
            resultNote: "サバンナチャンス",
          },
          {
            weight: 0.5 * 0.37,
            rounds: 10,
            displayRounds: 70,
            balls: 9800,
            nextState: "rush",
            tag: "savannaOver",
            resultNote: "サバンナチャンス",
            bonusLoop: { probability: 0.77, balls: 1400 },
          },
          {
            weight: 0.17,
            rounds: 10,
            displayRounds: 20,
            balls: 2800,
            nextState: "rush",
            tag: "rush3000",
            resultNote: "3000BONUS",
          },
          { weight: 0.33, rounds: 10, balls: 1400, nextState: "rush", tag: "rush1500", resultNote: "1500BONUS" },
        ],
      },
      onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "獣王RUSH終了" },
    },
  },

  distributionTables: {},

  payoutTable: { 10: 1400, 2: 280 },
});
