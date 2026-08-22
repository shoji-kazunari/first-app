// データランプ用の大当たり履歴。内部にはHISTORY_LIMIT件まで保持し、
// 表示側（dataLamp.js）は直近7件だけを取り出して使う想定。
window.PachiSim = window.PachiSim || {};

PachiSim.historyStore = (function () {
  const PREFIX = "pachisim:history:";
  const HISTORY_LIMIT = 30; // 内部保持件数（表示は直近7件のみ）

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
      // no-op
    }
  }

  // 保存キーは統計と同じ「日付」に紐づける。日付を跨いだ履歴は本日の成績と一緒にリセットする。
  function load(slug, dateKey) {
    const raw = safeGetItem(PREFIX + slug);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== dateKey || !Array.isArray(parsed.entries)) {
        return [];
      }
      return parsed.entries;
    } catch (e) {
      return [];
    }
  }

  function save(slug, dateKey, entries) {
    safeSetItem(PREFIX + slug, JSON.stringify({ date: dateKey, entries }));
  }

  // entry: { spins, rounds, context: "normal"|"rush" }
  function append(slug, dateKey, entries, entry) {
    const next = entries.concat([entry]);
    const trimmed = next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    save(slug, dateKey, trimmed);
    return trimmed;
  }

  function reset(slug, dateKey) {
    save(slug, dateKey, []);
    return [];
  }

  function recent(entries, count) {
    return entries.slice(Math.max(0, entries.length - count));
  }

  return { load, save, append, reset, recent, HISTORY_LIMIT };
})();
