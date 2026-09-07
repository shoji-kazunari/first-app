// TOPページのコントローラ: 検索・メーカー一覧・一撃出玉ランキング（枠のみ）
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function machineHref(machine) {
    return `machines/${machine.slug}/index.html`;
  }

  // 一覧上でどの機種か見分けやすいよう、基本状態（baseStateId）の確率を
  // 「1/319.6」のように添える。judgmentGate（リーチ発生率×当選率の2段構え）を
  // 持つ状態は、core/stateEngine.jsのeffectiveHitProbabilityと同じ考え方で
  // 掛け合わせる（TOPページはstateEngine.js自体は読み込んでいないため、
  // ここでは同じ計算をその場で行っている）。
  function baseProbabilityLabel(machine) {
    const state = machine.states[machine.baseStateId];
    if (!state || typeof state.probability !== "number") return "";
    const gate = state.judgmentGate ? state.judgmentGate.probability : 1;
    return PachiSim.format.probabilityFraction(state.probability * gate);
  }

  // メーカー名・機種名をひらがな正規化した上での五十音順比較。
  function byKana(a, b) {
    return PachiSim.kana.normalize(a).localeCompare(PachiSim.kana.normalize(b), "ja");
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
                  <span class="search-results__name">${m.name}<span class="machine-link__prob">${baseProbabilityLabel(
                    m
                  )}</span></span>
                  <span class="search-results__maker">${m.manufacturer.name}</span>
                </a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  // メーカー数・機種数が増えるほど、全メーカーを開いたまま並べる一覧は
  // ページが縦に伸びきってしまい探しづらくなる。五十音順に並べ替えたうえで
  // <details>を閉じた状態にし、目的のメーカーだけを開いて探せるようにする
  // （目的の機種そのものが分かっているときは、上の検索を使う方が早い）。
  function renderManufacturers(container, manufacturers) {
    if (manufacturers.length === 0) {
      container.innerHTML = '<p class="manufacturer-list__empty">掲載機種は準備中です。</p>';
      return;
    }
    const sortedGroups = manufacturers
      .map((group) => ({
        ...group,
        machines: [...group.machines].sort((a, b) => byKana(a.nameKana, b.nameKana)),
      }))
      .sort((a, b) => byKana(a.name, b.name));

    container.innerHTML = sortedGroups
      .map(
        (group) => `
          <details class="manufacturer-group">
            <summary class="manufacturer-group__name">${group.name}<span class="manufacturer-group__count">${group.machines.length}機種</span></summary>
            <ul class="manufacturer-group__machines">
              ${group.machines
                .map(
                  (m) => `
                    <li>
                      <a class="machine-link" href="${machineHref(m)}">
                        <span class="machine-link__name">${m.name}<span class="machine-link__prob">${baseProbabilityLabel(
                          m
                        )}</span></span>
                      </a>
                    </li>
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
  // 削除ボタン（onDelete）は運営ログイン中のみ表示する。実際の削除権限は
  // Firestore側のセキュリティルールで強制されるので、これはあくまで見た目の制御。
  //
  // このランキングは全機種横断の集計なので、あえて「全て削除」は用意しない
  // （どこかの機種の記録がおかしいと思って押したら、無関係な他機種の記録まで
  // まとめて消えてしまう事故があったため）。全削除したい場合は、その機種の
  // ページ（machine.jsのrenderMachineRanking）から機種単位で行う。
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
    });
  }

  async function init() {
    const els = {
      searchInput: $("searchInput"),
      searchResults: $("searchResults"),
      manufacturerList: $("manufacturerList"),
      manufacturerListCount: $("manufacturerListCount"),
      rankingAllTime: $("rankingAllTime"),
      rankingToday: $("rankingToday"),
      adminAuthBar: $("adminAuthBar"),
    };

    document.title = PachiSim.config.siteTitle;

    const machines = PachiSim.machineRegistry.getAll();
    const manufacturers = PachiSim.machineRegistry.getManufacturers();

    renderManufacturers(els.manufacturerList, manufacturers);
    if (els.manufacturerListCount) {
      els.manufacturerListCount.textContent = `（全${machines.length}機種）`;
    }

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
