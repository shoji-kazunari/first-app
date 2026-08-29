// TOPページのコントローラ: 検索・メーカー一覧・一撃出玉ランキング（枠のみ）
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function machineHref(machine) {
    return `machines/${machine.slug}/index.html`;
  }

  function matchesQuery(machine, query) {
    if (!query) return false;
    return (
      PachiSim.kana.includesNormalized(machine.name, query) ||
      PachiSim.kana.includesNormalized(machine.nameKana, query) ||
      machine.aliases.some((a) => PachiSim.kana.includesNormalized(a, query))
    );
  }

  function renderSearchResults(container, machines, query) {
    if (!query) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }
    const matched = machines.filter((m) => matchesQuery(m, query));
    container.hidden = false;
    if (matched.length === 0) {
      container.innerHTML = '<p class="search-results__empty">該当する機種が見つかりませんでした。</p>';
      return;
    }
    container.innerHTML = `
      <ul class="search-results__list">
        ${matched
          .map(
            (m) => `
              <li>
                <a class="machine-link" href="${machineHref(m)}">
                  <span class="search-results__name">${m.name}</span>
                  <span class="search-results__maker">${m.manufacturer.name}</span>
                </a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderManufacturers(container, manufacturers) {
    if (manufacturers.length === 0) {
      container.innerHTML = '<p class="manufacturer-list__empty">掲載機種は準備中です。</p>';
      return;
    }
    container.innerHTML = manufacturers
      .map(
        (group) => `
          <details class="manufacturer-group" open>
            <summary class="manufacturer-group__name">${group.name}<span class="manufacturer-group__count">${group.machines.length}機種</span></summary>
            <ul class="manufacturer-group__machines">
              ${group.machines
                .map(
                  (m) => `
                    <li><a class="machine-link" href="${machineHref(m)}">${m.name}</a></li>
                  `
                )
                .join("")}
            </ul>
          </details>
        `
      )
      .join("");
  }

  // period: "allTime"|"today" - 空表示時の文言だけ変える
  // 削除ボタン（onDelete/onClearAll）は運営ログイン中のみ表示する。実際の削除権限は
  // Firestore側のセキュリティルールで強制されるので、これはあくまで見た目の制御。
  async function renderRankingSection(container, period) {
    if (window.PachiSim.fb) await PachiSim.fb.ready;
    const isAdmin = window.PachiSim.fb && PachiSim.fb.isAdmin();
    const result = await PachiSim.rankingService.fetchRanking(period);
    PachiSim.ui.renderRankingList(container, result.entries, {
      showMachine: true,
      emptyText: period === "today" ? "本日の記録はまだありません。" : "まだ記録がありません。",
      onDelete: isAdmin
        ? async (id) => {
            await PachiSim.rankingService.removeEntry(id);
            renderRankingSection(container, period);
          }
        : null,
      onClearAll: isAdmin
        ? async () => {
            await PachiSim.rankingService.clearScope(period);
            renderRankingSection(container, period);
          }
        : null,
    });
  }

  async function init() {
    const els = {
      siteTitle: $("siteTitle"),
      siteTagline: $("siteTagline"),
      searchInput: $("searchInput"),
      searchResults: $("searchResults"),
      manufacturerList: $("manufacturerList"),
      rankingAllTime: $("rankingAllTime"),
      rankingToday: $("rankingToday"),
      adminAuthBar: $("adminAuthBar"),
    };

    els.siteTitle.textContent = PachiSim.config.siteTitle;
    els.siteTagline.textContent = PachiSim.config.siteTagline;
    document.title = PachiSim.config.siteTitle;

    const machines = PachiSim.machineRegistry.getAll();
    const manufacturers = PachiSim.machineRegistry.getManufacturers();

    renderManufacturers(els.manufacturerList, manufacturers);

    els.searchInput.addEventListener("input", (e) => {
      renderSearchResults(els.searchResults, machines, e.target.value.trim());
    });

    renderRankingSection(els.rankingAllTime, "allTime");
    renderRankingSection(els.rankingToday, "today");

    if (window.PachiSim.ui.renderAdminAuthBar) {
      PachiSim.ui.renderAdminAuthBar(els.adminAuthBar, () => {
        renderRankingSection(els.rankingAllTime, "allTime");
        renderRankingSection(els.rankingToday, "today");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
