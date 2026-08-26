// 一撃出玉ランキングの永続化。Firestore（core/firebase.js）を実体に持ち、
// 全機種・全期間の記録を1つのコレクションにまとめて持つ。表示側（rankingService.js）が
// 期間・機種で絞り込む。core/firebase.jsの読み込みに失敗した環境（広告ブロッカーや
// ネットワーク不調など）でも、ランキングだけが機能しないだけでシミュレーター本体の
// プレイは止まらないよう、例外を投げず空配列へフォールバックする。
window.PachiSim = window.PachiSim || {};

PachiSim.rankingStore = (function () {
  // Firestoreは書き込み件数に応じた課金/割り当てがあるため、上限を超えた古い記録を
  // 間引く処理はここでは行わない（localStorage時代のtrimEntries/MAX_ENTRIES相当の
  // 仕組みが必要になった場合は、別途サーバー側の定期処理として実装する）。

  function achievedTime(entry) {
    const t = new Date(entry && entry.achievedAt).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  // machineSlug（任意）: 指定すると、その機種の記録だけをFirestore側で絞り込んで取得する
  async function loadAll(machineSlug) {
    if (!window.PachiSim.fb) return [];
    try {
      await PachiSim.fb.ready;
      return await PachiSim.fb.fetchAllEntries(machineSlug);
    } catch (e) {
      return [];
    }
  }

  // entry: { machineSlug, machineName, manufacturerName, balls, renchan, achievedAt }
  async function append(entry) {
    if (!window.PachiSim.fb) return null;
    await PachiSim.fb.ready;
    return PachiSim.fb.addEntry(entry);
  }

  async function remove(id) {
    if (!window.PachiSim.fb) return [];
    await PachiSim.fb.ready;
    await PachiSim.fb.deleteEntry(id);
    return loadAll();
  }

  // ids: 削除したいエントリのidの配列（呼び出し側で絞り込み済みのもの）
  async function removeMany(ids) {
    if (!window.PachiSim.fb) return [];
    await PachiSim.fb.ready;
    await PachiSim.fb.deleteEntries(ids);
    return loadAll();
  }

  return { loadAll, append, remove, removeMany, achievedTime };
})();
