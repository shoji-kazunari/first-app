// データランプ風UI: 実機のデータランプを模した積み上げゲージで表示する。
//
// 「現在」列だけはライブで進行中の回転数（liveAttempts）に連動して伸び縮みする。
// 当たると、その回のゲージ+獲得R数がそのまま「1回前」側へスライドし、
// 「現在」は空の状態に戻る（＝呼び出し側がhistoryEntriesへ新しい履歴を積み、
// liveAttemptsを0に戻して再描画するだけで、この見た目になる）。
//
// ゲージ仕様（通常時・RUSH中共通）:
//   ・回転数 1〜99 で1段、100〜199で1段…と100回転ごとに1段積み上がる（最大10段）
//   ・1〜3段目=緑（1〜299回転）、4〜6段目=黄（300〜599回転）、7段目以降=赤（600回転〜）
//   ・1001回転以降は10段目（一番上）が点滅するだけで、それ以上は積み上がらない
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.renderDataLamp = function (containerEl, entries, liveAttempts) {
  const COLUMN_COUNT = 10; // 現在 + 9回前
  const historyCount = COLUMN_COUNT - 1;
  const recent = PachiSim.historyStore.recent(entries, historyCount);
  const historyDisplay = recent.slice().reverse(); // 新しい順（1回前が先頭）

  const columns = [
    { label: "現在", attempts: liveAttempts || 0, rounds: null, streakId: null, isLive: true },
  ];
  historyDisplay.forEach((e, idx) => {
    columns.push({
      label: `${idx + 1}回前`,
      attempts: e.spins,
      rounds: e.rounds,
      streakId: e.streakId,
      isLive: false,
    });
  });
  while (columns.length < COLUMN_COUNT) {
    columns.push({
      label: `${columns.length}回前`,
      attempts: 0,
      rounds: null,
      streakId: null,
      isLive: false,
    });
  }

  // 連チャンのまとめ（履歴列のみが対象。現在列・空列は対象外）
  const groups = [];
  columns.forEach((col, idx) => {
    if (idx === 0 || col.streakId == null) return;
    const last = groups[groups.length - 1];
    if (last && col.streakId === last.streakId && last.endIdx === idx - 1) {
      last.endIdx = idx;
      last.count += 1;
    } else {
      groups.push({ streakId: col.streakId, startIdx: idx, endIdx: idx, count: 1 });
    }
  });
  const banners = groups
    .filter((g) => g.count >= 2)
    .map(
      (g) =>
        `<div class="data-lamp__banner" style="grid-column:${g.startIdx + 1} / ${g.endIdx + 2}">${g.count}連</div>`
    )
    .join("");

  function segmentCountFor(n) {
    if (n <= 0) return 0;
    if (n <= 99) return 1;
    return Math.min(10, Math.floor(n / 100) + 1);
  }

  function tierOf(segNum) {
    if (segNum <= 3) return "green";
    if (segNum <= 6) return "yellow";
    return "red";
  }

  const cols = columns
    .map((col, idx) => {
      const n = col.attempts || 0;
      const segCount = segmentCountFor(n);
      const blinking = n >= 1001;
      const segmentsHtml = Array.from({ length: 10 }, (_, i) => {
        const segNum = 10 - i; // 上(10)から下(1)の順でDOMに並べる
        const filled = segNum <= segCount;
        const blinkClass = filled && segNum === 10 && blinking ? " data-lamp__segment--blink" : "";
        return `<div class="data-lamp__segment${
          filled ? ` data-lamp__segment--${tierOf(segNum)}` : ""
        }${blinkClass}"></div>`;
      }).join("");

      const gameText = col.isLive
        ? PachiSim.format.number(n)
        : n > 0
        ? PachiSim.format.number(n)
        : "-";

      return `
        <div class="data-lamp__col" style="grid-column:${idx + 1}">
          <div class="data-lamp__gauge">${segmentsHtml}</div>
          <span class="data-lamp__rounds">${col.rounds ? `${col.rounds}R` : ""}</span>
          <span class="data-lamp__game">${gameText}</span>
          <span class="data-lamp__collabel">${col.label}</span>
        </div>
      `;
    })
    .join("");

  containerEl.innerHTML = `
    <div class="data-lamp__chart" style="grid-template-columns: repeat(${COLUMN_COUNT}, 1fr)">
      ${banners}${cols}
    </div>
  `;
};
