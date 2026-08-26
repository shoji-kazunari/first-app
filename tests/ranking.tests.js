// core/rankingService.js・rankingStore.js のテスト。
// localStorageを触る関数（fetchRanking/submitResult/remove系）ではなく、
// 純関数の selectRanking()/localDateKey()/trimEntries() を直接検証するので、
// テストを開いても実際に貯めた記録は汚れない。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const service = PachiSim.rankingService;
  const store = PachiSim.rankingStore;

  // 基準時刻: ローカル時刻の2026-01-15 12:00
  const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();

  // ローカル時刻で日時を組み立ててからISO文字列にする。
  // 実際の保存形式（toISOString()＝UTC）と同じ経路を通るので、
  // 「保存はUTC・判定はローカル」のズレをテストでも再現できる。
  function localIso(y, m, d, h, min) {
    return new Date(y, m - 1, d, h, min || 0, 0).toISOString();
  }

  function entry(id, balls, achievedAt, slug) {
    return {
      id,
      machineSlug: slug || "cr-fever-symphogear",
      machineName: "テスト機種",
      manufacturerName: "テストメーカー",
      balls,
      renchan: 1,
      achievedAt,
    };
  }

  test("rankingService: 出玉の多い順に並ぶ", () => {
    const entries = [
      entry("a", 1000, localIso(2026, 1, 15, 10)),
      entry("b", 9000, localIso(2026, 1, 15, 11)),
      entry("c", 5000, localIso(2026, 1, 15, 9)),
    ];
    const ranked = service.selectRanking(entries, "allTime", null, NOW);
    assertEqual(ranked.length, 3);
    assertEqual(ranked[0].id, "b");
    assertEqual(ranked[1].id, "c");
    assertEqual(ranked[2].id, "a");
  });

  test("rankingService: todayは当日の記録だけを含む", () => {
    const entries = [
      entry("today1", 3000, localIso(2026, 1, 15, 12)),
      entry("yesterday", 8000, localIso(2026, 1, 14, 23)),
      entry("tomorrow", 9000, localIso(2026, 1, 16, 1)),
    ];
    const ranked = service.selectRanking(entries, "today", null, NOW);
    assertEqual(ranked.length, 1, "当日以外が混ざってはいけない");
    assertEqual(ranked[0].id, "today1");
  });

  test("rankingService: 深夜0時台の記録も『本日』として扱われる（UTC混同の回帰テスト）", () => {
    // JSTなど東側のタイムゾーンでは、ローカル00:30の記録はUTCだと前日になる。
    // achievedAtの文字列をそのままslice(0,10)すると前日扱いになってしまうため、
    // 必ずDateへ変換してローカル日付で比較すること。
    const midnight = localIso(2026, 1, 15, 0, 30);
    assertEqual(service.localDateKey(new Date(midnight)), "2026-01-15");

    const ranked = service.selectRanking([entry("midnight", 4000, midnight)], "today", null, NOW);
    assertEqual(ranked.length, 1, "深夜帯の記録が本日ランキングから漏れてはいけない");
  });

  test("rankingService: allTimeは日付で絞り込まない", () => {
    const entries = [
      entry("old", 9000, localIso(2024, 5, 1, 12)),
      entry("new", 3000, localIso(2026, 1, 15, 12)),
    ];
    const ranked = service.selectRanking(entries, "allTime", null, NOW);
    assertEqual(ranked.length, 2);
    assertEqual(ranked[0].id, "old");
  });

  test("rankingService: machineSlugを渡すとその機種だけに絞られる", () => {
    const entries = [
      entry("sym", 5000, localIso(2026, 1, 15, 10), "cr-fever-symphogear"),
      entry("eva", 9000, localIso(2026, 1, 15, 11), "eva17-hajimari"),
    ];
    const ranked = service.selectRanking(entries, "allTime", "eva17-hajimari", NOW);
    assertEqual(ranked.length, 1);
    assertEqual(ranked[0].id, "eva");
  });

  test("rankingService: 表示は10件までに制限される", () => {
    const entries = [];
    for (let i = 0; i < 25; i++) entries.push(entry(`e${i}`, 1000 + i, localIso(2026, 1, 15, 10)));
    const ranked = service.selectRanking(entries, "today", null, NOW);
    assertEqual(ranked.length, service.DISPLAY_LIMIT);
    assertEqual(ranked[0].balls, 1024, "最上位は最大出玉であるべき");
  });

  test("rankingService: achievedAtが不正な記録は本日ランキングに出ない", () => {
    const entries = [
      entry("broken", 9000, "not-a-date"),
      entry("missing", 9000, undefined),
      entry("ok", 3000, localIso(2026, 1, 15, 12)),
    ];
    const ranked = service.selectRanking(entries, "today", null, NOW);
    assertEqual(ranked.length, 1);
    assertEqual(ranked[0].id, "ok");
  });

  test("rankingService: selectRankingは渡された配列を書き換えない", () => {
    const entries = [
      entry("a", 1000, localIso(2026, 1, 15, 10)),
      entry("b", 9000, localIso(2026, 1, 15, 11)),
    ];
    service.selectRanking(entries, "allTime", null, NOW);
    assertEqual(entries[0].id, "a", "元配列の並び順が変わってはいけない");
    assertEqual(entries.length, 2);
  });

  test("rankingStore: 上限以下なら間引かれない", () => {
    const entries = [entry("a", 1000, localIso(2026, 1, 15, 10))];
    assertEqual(store.trimEntries(entries).length, 1);
  });

  test("rankingStore: 上限を超えても全期間トップと直近の記録は残る", () => {
    const entries = [];
    // 一番古いが最高記録。古い順で切る実装だとここが真っ先に消える。
    entries.push(entry("allTimeBest", 999999, localIso(2024, 1, 1, 12)));
    for (let i = 0; i < store.MAX_ENTRIES; i++) {
      entries.push(entry(`e${i}`, 1000 + i, localIso(2025, 1, 1, 0, i)));
    }
    entries.push(entry("newest", 2500, localIso(2026, 1, 15, 12)));

    const trimmed = store.trimEntries(entries);
    const ids = trimmed.map((e) => e.id);

    assertTrue(trimmed.length <= store.MAX_ENTRIES, `上限超過 (${trimmed.length})`);
    assertTrue(ids.indexOf("allTimeBest") >= 0, "全期間トップが消えてはいけない");
    assertTrue(ids.indexOf("newest") >= 0, "最新の記録が消えてはいけない");
    assertEqual(service.selectRanking(trimmed, "allTime", null, NOW)[0].id, "allTimeBest");
  });
})();
