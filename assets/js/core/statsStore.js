// 「本日の成績」の永続化。機種(slug)ごとに独立し、日付が変わったら自動リセットする。
// localStorageが使えない/壊れている場合でも例外を投げずに空の成績へフォールバックする。
window.PachiSim = window.PachiSim || {};

PachiSim.statsStore = (function () {
  const PREFIX = "pachisim:stats:";

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function emptyStats() {
    return {
      date: todayKey(),
      totalNormalSpins: 0, // 総通常回転数（投資額計算にも使用）
      initialHitCount: 0, // 初当たり回数
      totalHitCount: 0, // 総大当たり回数
      rushEntryCount: 0, // RUSH突入回数
      maxRenchan: 0, // 最大連チャン
      totalBalls: 0, // 総獲得出玉
      maxIkkiBalls: 0, // 最大一撃出玉
    };
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // 保存できない環境（プライベートモード等）ではメモリ上の状態のみで続行する
    }
  }

  function load(slug) {
    const raw = safeGetItem(PREFIX + slug);
    if (!raw) return emptyStats();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || parsed.date !== todayKey()) {
        return emptyStats();
      }
      return Object.assign(emptyStats(), parsed, { date: todayKey() });
    } catch (e) {
      return emptyStats();
    }
  }

  function save(slug, stats) {
    safeSetItem(PREFIX + slug, JSON.stringify(stats));
  }

  function reset(slug) {
    const stats = emptyStats();
    save(slug, stats);
    return stats;
  }

  return { load, save, reset, emptyStats, todayKey };
})();
