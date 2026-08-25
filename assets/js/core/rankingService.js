// 一撃出玉ランキングの抽象化レイヤー。
//
// 現時点ではrankingStore.js（このブラウザのlocalStorage）のみを見ており、
// サイト訪問者全員を横断した本当の意味での「全体」ランキングにはなっていない
// （あくまで「このブラウザで記録した結果」の集計）。将来Supabase等の
// バックエンドに接続する際は、この中身だけを実際のAPI呼び出しに差し替えれば、
// 呼び出し側（top.js/machine.js）のコードは変更不要になる想定。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingService = (function () {
  const BACKEND_CONNECTED = false;

  function isBackendConnected() {
    return BACKEND_CONNECTED;
  }

  // ローカルタイムゾーンでの日付キー（YYYY-MM-DD）を返す。
  // achievedAtはtoISOString()（UTC）で保存されているため、文字列を単純にslice(0,10)すると
  // 日本時間の深夜0時〜9時台でUTCの日付がずれて「本日」判定を誤る。必ずDateに変換してから
  // ローカルの年月日を取り出すこと。
  function localDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayKey() {
    return localDateKey(new Date());
  }

  function sortAndLimit(entries, limit) {
    return entries
      .slice()
      .sort((a, b) => b.balls - a.balls)
      .slice(0, limit);
  }

  // period: "today" | "allTime"
  // machineSlug（任意）: 指定すると、その機種の記録だけに絞る（機種別ランキング用）
  // 戻り値: { period, machineSlug, entries: [{id,machineSlug,machineName,manufacturerName,balls,achievedAt}], backendConnected }
  async function fetchRanking(period, machineSlug) {
    let entries = PachiSim.rankingStore.loadAll();
    if (machineSlug) {
      entries = entries.filter((e) => e.machineSlug === machineSlug);
    }
    if (period === "today") {
      const key = todayKey();
      entries = entries.filter((e) => e.achievedAt && localDateKey(new Date(e.achievedAt)) === key);
    }
    return {
      period,
      machineSlug: machineSlug || null,
      entries: sortAndLimit(entries, 10),
      backendConnected: BACKEND_CONNECTED,
    };
  }

  // シミュレーション結果を記録する
  function submitResult(entry) {
    return PachiSim.rankingStore.append(entry);
  }

  // 運営（サイト管理者）用: 記録の削除（1件）
  function removeEntry(id) {
    return PachiSim.rankingStore.remove(id);
  }

  // 運営（サイト管理者）用: 表示中のスコープ（period・machineSlugの組み合わせ）に
  // 該当する記録をすべて削除する。「本日のランキングを全削除」しても全期間の
  // 過去分までは消えない・「機種別ランキングを全削除」しても他機種は残る、
  // というように、押したランキングのスコープ内だけに影響を限定する。
  function clearScope(period, machineSlug) {
    const entries = PachiSim.rankingStore.loadAll();
    const idsToRemove = entries
      .filter((e) => {
        if (machineSlug && e.machineSlug !== machineSlug) return false;
        if (period === "today" && (!e.achievedAt || localDateKey(new Date(e.achievedAt)) !== todayKey())) return false;
        return true;
      })
      .map((e) => e.id);
    return PachiSim.rankingStore.removeMany(idsToRemove);
  }

  return {
    isBackendConnected,
    fetchRanking,
    submitResult,
    removeEntry,
    clearScope,
  };
})();
