// 「ナニ打つくん」ページのコントローラ。
//
// 入力した金額（3桁までの数字×1000円）と、直近3ヶ月以内に導入された機種
// （ギジパチに掲載済みのものに限る）からランダムに選んだ1台を組み合わせて、
// 「その金額でどれだけ勝負になるか」の寸評コメントを添える。演出目的の遊び
// コンテンツで、実際の抽選ロジック（core/stateEngine.js）は使わない。
// yosou.jsと違い機種データ（PachiSim.machineRegistry）に依存する。
(function () {
  "use strict";

  const RECENT_MONTHS = 3;

  function $(id) {
    return document.getElementById(id);
  }

  function machineHref(machine) {
    return `../machines/${machine.slug}/index.html`;
  }

  function isoDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // 「導入から3ヶ月以内」の下限日（3ヶ月前の同日、当日を含む）。
  // 閲覧者のローカル日時を基準にする（実行環境の時刻ではない）。
  function recentCutoffIso() {
    const now = new Date();
    return isoDate(new Date(now.getFullYear(), now.getMonth() - RECENT_MONTHS, now.getDate()));
  }

  function pickRecentMachine(machines) {
    const cutoff = recentCutoffIso();
    const today = isoDate(new Date());
    const candidates = machines.filter(
      (m) => typeof m.releaseDate === "string" && m.releaseDate >= cutoff && m.releaseDate <= today
    );
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 3桁までの数字のみ。0や空欄は不可。
  function parseAmountUnits(raw) {
    const trimmed = String(raw).trim();
    if (!/^[0-9]{1,3}$/.test(trimmed)) return null;
    const units = Number(trimmed);
    return units > 0 ? units : null;
  }

  // machine.js見出しと同じ考え方: displayProbability（任意）があれば
  // それを見た目の確率として使う。無ければprobability×judgmentGateの実効値。
  function displayProbabilityLabel(machine) {
    const state = machine.states[machine.baseStateId];
    if (!state) return "";
    const probability = state.displayProbability != null ? state.displayProbability : state.probability;
    if (typeof probability !== "number") return "";
    const gate = state.displayProbability != null ? 1 : state.judgmentGate ? state.judgmentGate.probability : 1;
    return PachiSim.format.probabilityFraction(probability * gate);
  }

  // コメントの判定には見た目の確率ではなく、実際の抽選で使う実効確率を使う
  // （displayProbabilityは売り文句用の単体確率で、実際の当選しやすさとは
  // ずれる機種があるため）。
  function effectiveProbability(machine) {
    const state = machine.states[machine.baseStateId];
    if (!state || typeof state.probability !== "number") return null;
    const gate = state.judgmentGate ? state.judgmentGate.probability : 1;
    return state.probability * gate;
  }

  // 入力金額でその機種を回したとき、大当たり1回分の期待回転数の何倍
  // 回せそうか（ratio）を出す。1より大きいほど「回転数に余裕がある」。
  function estimateRatio(machine, yen) {
    const probability = effectiveProbability(machine);
    if (!probability) return null;
    const denom = 1 / probability;
    const totalSpins = Math.floor(yen / 1000) * machine.spinsPer1000Yen;
    return totalSpins / denom;
  }

  function pickComment(ratio) {
    if (ratio == null) return "";
    if (ratio >= 2.5) {
      return "この金額なら大当たりを何度も狙えるスペック。結果を気にせず、楽しむ重視でゆったり回そう！";
    }
    if (ratio >= 1.2) {
      return "無理のない範囲で大当たりを狙える組み合わせ。落ち着いて仕留めにいこう。";
    }
    if (ratio >= 0.5) {
      return "五分五分、駆け引きの分かれ目。気合を入れて挑もう。";
    }
    return "正直、厳しい戦いになりそう。勇気のワンチャンス！ダメなら潔く帰ろう！";
  }

  function init() {
    const els = {
      form: $("naniutsuForm"),
      amount: $("naniutsuAmount"),
      error: $("naniutsuError"),
      result: $("naniutsuResult"),
      resultText: $("naniutsuResultText"),
      comment: $("naniutsuComment"),
      tryLink: $("naniutsuTryLink"),
    };

    const machines = PachiSim.machineRegistry.getAll();

    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      els.error.hidden = true;
      els.result.hidden = true;

      const units = parseAmountUnits(els.amount.value);
      if (units === null) {
        els.error.hidden = false;
        return;
      }
      const yen = units * 1000;

      const machine = pickRecentMachine(machines);
      if (!machine) {
        els.resultText.textContent = "直近3ヶ月以内に導入された機種が、まだギジパチに掲載されていません。";
        els.comment.textContent = "";
        els.tryLink.hidden = true;
        els.result.hidden = false;
        return;
      }

      const ratio = estimateRatio(machine, yen);
      els.resultText.textContent = `${yen.toLocaleString(
        "ja-JP"
      )}円なら、「${machine.name}」（${displayProbabilityLabel(machine)}）を打とう！`;
      els.comment.textContent = pickComment(ratio);
      els.tryLink.hidden = false;
      els.tryLink.href = machineHref(machine);
      els.result.hidden = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
