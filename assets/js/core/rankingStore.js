// 一撃出玉ランキングの永続化（現状はこのブラウザのlocalStorageのみ）。
// 全機種・全期間の記録を1つの配列にまとめて持ち、表示側（rankingService.js）が
// 期間・機種で絞り込む。localStorageが使えない/壊れている環境でも例外を
// 投げずに空配列へフォールバックする。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingStore = (function () {
  const KEY = "pachisim:ranking:entries";
  const MAX_ENTRIES = 500; // 際限なく増え続けないよう間引く上限
  const TOP_KEEP = 250; // 上限超過時、出玉上位から残す件数
  const RECENT_KEEP = 250; // 上限超過時、新しい順に残す件数

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

  function achievedTime(entry) {
    const t = new Date(entry && entry.achievedAt).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  // 上限を超えた分を間引く純関数。
  // 単純に古い順で切ると、記録が溜まったときに「全期間ランキング」の自己ベストまで
  // 消えてしまうため、出玉上位と直近の両方を残す。これで全期間・本日のどちらの
  // ランキングも壊れない。
  function trimEntries(entries) {
    if (entries.length <= MAX_ENTRIES) return entries;

    const topByBalls = entries
      .slice()
      .sort((a, b) => b.balls - a.balls)
      .slice(0, TOP_KEEP);
    const newest = entries
      .slice()
      .sort((a, b) => achievedTime(b) - achievedTime(a))
      .slice(0, RECENT_KEEP);
    const keep = new Set(topByBalls.concat(newest));
    return entries.filter((e) => keep.has(e)); // 元の並び順は維持する
  }

  // entry: { machineSlug, machineName, manufacturerName, balls, renchan, achievedAt }
  function append(entry) {
    const entries = loadAll();
    const withId = Object.assign(
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      entry
    );
    entries.push(withId);
    const trimmed = trimEntries(entries);
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

  // trimEntries/MAX_ENTRIES は tests/ranking.tests.js から検証するために公開している
  return { loadAll, append, remove, removeMany, trimEntries, MAX_ENTRIES };
})();
