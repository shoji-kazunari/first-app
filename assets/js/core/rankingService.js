// 一撃出玉ランキングの抽象化レイヤー。
//
// rankingStore.js（core/firebase.js経由のFirestore）を実体に持ち、サイト訪問者
// 全員を横断した本当の意味での「全体」ランキングになっている。呼び出し側
// （top.js/machine.js）はfetchRanking/submitResult等のインターフェースだけを見ればよく、
// 裏側の永続化先が変わってもこのファイルの中身を差し替えるだけで済む想定。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingService = (function () {
  const BACKEND_CONNECTED = true;
  const DISPLAY_LIMIT = 10; // 各ランキングに載せる最大件数
  // どの機種でも現実的にありえない出玉数を弾くための簡易な上限。実際の強制力は
  // Firestore側のセキュリティルール（開発者ツール経由の直接書き込み対策）にあり、
  // ここでのチェックは通常のプレイでは絶対に超えない値の早期リジェクトにすぎない。
  const BALLS_CAP = 50000;

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

  // 記録一覧を期間・機種で絞り込んで並べ替える純関数（localStorageを触らない）。
  // 基準時刻nowを引数に取るので、tests/ranking.tests.jsから任意の日時で検証できる。
  function selectRanking(allEntries, period, machineSlug, now) {
    let entries = Array.isArray(allEntries) ? allEntries : [];
    if (machineSlug) {
      entries = entries.filter((e) => e.machineSlug === machineSlug);
    }
    if (period === "today") {
      const key = localDateKey(now ? new Date(now) : new Date());
      entries = entries.filter((e) => e.achievedAt && localDateKey(new Date(e.achievedAt)) === key);
    }
    return sortAndLimit(entries, DISPLAY_LIMIT);
  }

  // period: "today" | "allTime"
  // machineSlug（任意）: 指定すると、その機種の記録だけに絞る（機種別ランキング用）
  // 戻り値: { period, machineSlug, entries: [{id,machineSlug,machineName,manufacturerName,balls,achievedAt}], backendConnected }
  async function fetchRanking(period, machineSlug) {
    const all = await PachiSim.rankingStore.loadAll(machineSlug);
    return {
      period,
      machineSlug: machineSlug || null,
      entries: selectRanking(all, period, machineSlug, Date.now()),
      backendConnected: BACKEND_CONNECTED,
    };
  }

  // シミュレーション結果を記録する
  async function submitResult(entry) {
    if (!entry || typeof entry.balls !== "number" || entry.balls <= 0 || entry.balls > BALLS_CAP) {
      return null;
    }
    return PachiSim.rankingStore.append(entry);
  }

  // 運営（サイト管理者）用: 記録の削除（1件）。Firestore側のセキュリティルールにより、
  // 実際に運営としてログインしていない場合はここで例外を投げる（呼び出し側で捕まえること）。
  async function removeEntry(id) {
    return PachiSim.rankingStore.remove(id);
  }

  // 運営（サイト管理者）用: 表示中のスコープ（period・machineSlugの組み合わせ）に
  // 該当する記録をすべて削除する。「本日のランキングを全削除」しても全期間の
  // 過去分までは消えない・「機種別ランキングを全削除」しても他機種は残る、
  // というように、押したランキングのスコープ内だけに影響を限定する。
  async function clearScope(period, machineSlug) {
    const entries = await PachiSim.rankingStore.loadAll(machineSlug);
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
    // 以下はtests/ranking.tests.jsから検証するために公開している純関数
    selectRanking,
    localDateKey,
    DISPLAY_LIMIT,
  };
})();
