// 一撃出玉ランキングの抽象化レイヤー。
//
// 現時点ではバックエンド/DBが未接続なので、常に空のランキングを返す。
// 将来Supabase等に接続する際は、この中身（特にfetchRanking/submitResult）だけを
// 実際のAPI呼び出しに差し替えれば、TOPページ側のコードは変更不要になる想定。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingService = (function () {
  const BACKEND_CONNECTED = false;

  function isBackendConnected() {
    return BACKEND_CONNECTED;
  }

  // period: "today" | "week" | "allTime"
  // 戻り値: { period, entries: [{machineName, manufacturerName, balls, achievedAt}], backendConnected }
  async function fetchRanking(period) {
    if (!BACKEND_CONNECTED) {
      return { period, entries: [], backendConnected: false };
    }
    // 将来: 実バックエンドへのfetch呼び出しをここに実装する
    return { period, entries: [], backendConnected: false };
  }

  // シミュレーション結果を記録する（将来バックエンドへ送信するためのフック）。
  // 現状は何もしない（バックエンド未接続のため）。
  function submitResult(entry) {
    if (!BACKEND_CONNECTED) return;
    // 将来: 実バックエンドへのPOST等をここに実装する
  }

  return { isBackendConnected, fetchRanking, submitResult };
})();
