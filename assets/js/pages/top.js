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
                <a href="${machineHref(m)}">
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
                    <li><a href="${machineHref(m)}">${m.name}</a></li>
                  `
                )
                .join("")}
            </ul>
          </details>
        `
      )
      .join("");
  }

  function renderRanking(container, result) {
    if (result.entries.length === 0) {
      container.innerHTML = `
        <p class="ranking__empty">
          ${result.backendConnected ? "本日の記録はまだありません。" : "ランキング機能は準備中です。実装が完了すると、ここに一撃出玉ランキングが表示されます。"}
        </p>
      `;
      return;
    }
    container.innerHTML = `
      <ol class="ranking__list">
        ${result.entries
          .map(
            (e, i) => `
              <li>
                <span class="ranking__rank">${i + 1}位</span>
                <span class="ranking__name">${e.machineName}</span>
                <span class="ranking__balls">${PachiSim.format.ball(e.balls)}</span>
              </li>
            `
          )
          .join("")}
      </ol>
    `;
  }

  async function init() {
    const els = {
      siteTitle: $("siteTitle"),
      siteTagline: $("siteTagline"),
      searchInput: $("searchInput"),
      searchResults: $("searchResults"),
      manufacturerList: $("manufacturerList"),
      ranking: $("rankingToday"),
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

    const rankingResult = await PachiSim.rankingService.fetchRanking("today");
    renderRanking(els.ranking, rankingResult);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
