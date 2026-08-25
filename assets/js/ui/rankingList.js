// 一撃出玉ランキングの汎用表示コンポーネント。
// 機種別(①)・全体全期間(②)・全体本日(③)、3種類のランキングすべてで
// 同じ見た目・挙動（1位のみ表示→「もっと見る」で開閉、削除ボタン）を使う。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

// entries: [{id, machineName, balls, achievedAt}, ...]（呼び出し側で既に上位10件へ絞り込み済み想定）
// options:
//   showMachine: true なら各行に機種名も表示する（②③用。①では不要）
//   emptyText: 記録が1件もないときの文言
//   onDelete(id): 運営用の削除ボタンを表示する場合に渡す（1件削除）
//   onClearAll(): 運営用の全削除ボタンを表示する場合に渡す
PachiSim.ui.renderRankingList = function (containerEl, entries, options) {
  const opts = options || {};
  const showMachine = !!opts.showMachine;

  if (!entries.length) {
    containerEl.innerHTML = `<p class="ranking-list__empty">${
      opts.emptyText || "まだ記録がありません。"
    }</p>`;
    return;
  }

  const rows = entries
    .map((e, idx) => {
      const rank = idx + 1;
      const isExtra = rank > 1;
      const dateLabel = PachiSim.format.dateTimeLabel(e.achievedAt);
      const machinePart = showMachine
        ? `<span class="ranking-list__machine">${e.machineName}</span>`
        : "";
      const deleteBtn = opts.onDelete
        ? `<button class="ranking-list__delete" type="button" data-id="${e.id}" aria-label="この記録を削除">×</button>`
        : "";
      return `
        <li class="ranking-list__item${isExtra ? " ranking-list__item--extra" : ""}"${
        isExtra ? " hidden" : ""
      }>
          <span class="ranking-list__rank">${rank}位</span>
          <span class="ranking-list__entry">
            <span class="ranking-list__balls">${PachiSim.format.ball(e.balls)}</span>
            ${machinePart}
            <span class="ranking-list__date">${dateLabel}</span>
          </span>
          ${deleteBtn}
        </li>
      `;
    })
    .join("");

  const hasExtra = entries.length > 1;

  containerEl.innerHTML = `
    <ol class="ranking-list__items">${rows}</ol>
    ${hasExtra ? `<button class="ranking-list__toggle btn btn-secondary" type="button">もっと見る</button>` : ""}
    ${opts.onClearAll ? `<button class="ranking-list__clear-all btn btn-secondary" type="button">記録を全て削除</button>` : ""}
  `;

  if (hasExtra) {
    const toggleBtn = containerEl.querySelector(".ranking-list__toggle");
    let expanded = false;
    toggleBtn.addEventListener("click", () => {
      expanded = !expanded;
      containerEl.querySelectorAll(".ranking-list__item--extra").forEach((li) => {
        li.hidden = !expanded;
      });
      toggleBtn.textContent = expanded ? "閉じる" : "もっと見る";
    });
  }

  if (opts.onDelete) {
    containerEl.querySelectorAll(".ranking-list__delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!window.confirm("この記録を削除します。よろしいですか？")) return;
        opts.onDelete(btn.dataset.id);
      });
    });
  }

  if (opts.onClearAll) {
    const clearBtn = containerEl.querySelector(".ranking-list__clear-all");
    clearBtn.addEventListener("click", () => {
      if (!window.confirm("この記録をすべて削除します。よろしいですか？")) return;
      opts.onClearAll();
    });
  }
};
