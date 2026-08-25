// 一撃出玉ランキングの永続化（現状はこのブラウザのlocalStorageのみ）。
// 全機種・全期間の記録を1つの配列にまとめて持ち、表示側（rankingService.js）が
// 期間・機種で絞り込む。localStorageが使えない/壊れている環境でも例外を
// 投げずに空配列へフォールバックする。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingStore = (function () {
  const KEY = "pachisim:ranking:entries";
  const MAX_ENTRIES = 500; // 際限なく増え続けないよう、古いものから間引く上限

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

  function loadAll() {
    const raw = safeGetItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(entries) {
    safeSetItem(KEY, JSON.stringify(entries));
  }

  // entry: { machineSlug, machineName, manufacturerName, balls, renchan, achievedAt }
  function append(entry) {
    const entries = loadAll();
    const withId = Object.assign(
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      entry
    );
    entries.push(withId);
    const trimmed = entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
    saveAll(trimmed);
    return withId;
  }

  function remove(id) {
    const entries = loadAll().filter((e) => e.id !== id);
    saveAll(entries);
    return entries;
  }

  // ids: 削除したいエントリのidの配列（呼び出し側で絞り込み済みのもの）
  function removeMany(ids) {
    const idSet = new Set(ids);
    const entries = loadAll().filter((e) => !idSet.has(e.id));
    saveAll(entries);
    return entries;
  }

  return { loadAll, append, remove, removeMany };
})();
