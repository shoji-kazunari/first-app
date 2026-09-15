// 「私を構成する9台」ページのコントローラ。
//
// 好きな機種を9マス選んでカード画像を作り、URLで共有する遊びコンテンツ。
// 実機の筐体画像は一切使わない方針（CLAUDE.md／サイトの免責文）のため、
// 各マスは機種名・確率をCanvasで描いたグラフィカルなカードにする
// （色はメーカーIDのハッシュ値から決めるので、機種データを増やしても
// このファイルを直す必要はない）。
//
// 共有はサーバー保存なし。選択内容をURLのクエリ（slugs/name）に埋め込み、
// そのURLを開いた側は読み取り専用の「共有ビュー」として表示する。
// 編集中の内容はlocalStorageに保存し、ページ移動・再読み込みをまたいで残す
// （アカウントや他端末との同期はしない、あくまでこの端末・このブラウザ限定）。
(function () {
  "use strict";

  const MAX_SLOTS = 9;
  const GRID_COLS = 3;
  const STORAGE_KEY = "pachisim.my9dai.state";

  const TILE_SIZE = 280;
  const TILE_GAP = 16;
  const CARD_PADDING = 32;
  const HEADER_HEIGHT = 96;
  const FOOTER_HEIGHT = 56;

  function $(id) {
    return document.getElementById(id);
  }

  function machineHref(machine) {
    return `../machines/${machine.slug}/index.html`;
  }

  // メーカーIDの文字列から色相を1つ決める。ハッシュなので、機種データ側に
  // 手を入れずに新しいメーカーが増えても自動的に色が割り当たる。
  function hashHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 360;
    }
    return hash < 0 ? hash + 360 : hash;
  }

  function colorForMachine(machine) {
    const hue = hashHue(machine.manufacturer.id);
    return `hsl(${hue}, 52%, 42%)`;
  }

  // machine.js見出しと同じ考え方: displayProbability（任意）があれば
  // それを見た目の確率として使う。
  function probabilityLabel(machine) {
    const state = machine.states[machine.baseStateId];
    if (!state) return "";
    const probability = state.displayProbability != null ? state.displayProbability : state.probability;
    if (typeof probability !== "number") return "";
    const gate = state.displayProbability != null ? 1 : state.judgmentGate ? state.judgmentGate.probability : 1;
    return PachiSim.format.probabilityFraction(probability * gate);
  }

  function matchesQuery(machine, query) {
    if (!query) return false;
    return (
      PachiSim.kana.includesNormalized(machine.name, query) ||
      PachiSim.kana.includesNormalized(machine.nameKana, query) ||
      machine.aliases.some((a) => PachiSim.kana.includesNormalized(a, query))
    );
  }

  function emptySlots() {
    return new Array(MAX_SLOTS).fill(null);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { name: "", slugs: emptySlots() };
      const parsed = JSON.parse(raw);
      const slugs = Array.isArray(parsed.slugs) ? parsed.slugs.slice(0, MAX_SLOTS) : [];
      while (slugs.length < MAX_SLOTS) slugs.push(null);
      return { name: typeof parsed.name === "string" ? parsed.name : "", slugs };
    } catch (e) {
      return { name: "", slugs: emptySlots() };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // プライベートブラウズ等で保存できなくても、機能自体は続行する。
    }
  }

  function parseSharedFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("slugs")) return null;
    const slugs = params
      .get("slugs")
      .split(",")
      .map((s) => s || null)
      .slice(0, MAX_SLOTS);
    while (slugs.length < MAX_SLOTS) slugs.push(null);
    return { name: params.get("name") || "", slugs };
  }

  function buildShareUrl(state) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set("slugs", state.slugs.map((s) => s || "").join(","));
    if (state.name) params.set("name", state.name);
    url.search = params.toString();
    return url.toString();
  }

  // Canvasは文字列を自動改行しないので、日本語（単語区切りが無い）向けに
  // 1文字ずつ幅を測って折り返す。
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const ch of text) {
      const candidate = line + ch;
      if (line !== "" && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTile(ctx, x, y, size, machine) {
    ctx.save();
    roundRectPath(ctx, x, y, size, size, 18);
    ctx.clip();

    ctx.fillStyle = machine ? colorForMachine(machine) : "#e7dcc0";
    ctx.fillRect(x, y, size, size);

    if (machine) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 24px sans-serif";
      const lines = wrapText(ctx, machine.name, size - 36).slice(0, 4);
      const lineHeight = 28;
      const startY = y + size / 2 - ((lines.length - 1) * lineHeight) / 2 - 8;
      lines.forEach((line, idx) => {
        ctx.fillText(line, x + size / 2, startY + idx * lineHeight);
      });

      ctx.font = "18px sans-serif";
      ctx.fillText(probabilityLabel(machine), x + size / 2, y + size - 26);
    } else {
      ctx.fillStyle = "#a8987a";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("＋", x + size / 2, y + size / 2);
    }
    ctx.restore();
  }

  function cardSize() {
    const gridSize = TILE_SIZE * GRID_COLS + TILE_GAP * (GRID_COLS - 1);
    return {
      width: CARD_PADDING * 2 + gridSize,
      height: HEADER_HEIGHT + CARD_PADDING + gridSize + FOOTER_HEIGHT,
      gridSize,
    };
  }

  function renderCardCanvas(canvas, state) {
    const { width, height } = cardSize();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#2c1c0e";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const displayName = (state.name || "私").slice(0, 20);
    ctx.fillText(`${displayName}を構成する9台`, width / 2, HEADER_HEIGHT / 2 + 6);

    for (let i = 0; i < MAX_SLOTS; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = CARD_PADDING + col * (TILE_SIZE + TILE_GAP);
      const y = HEADER_HEIGHT + row * (TILE_SIZE + TILE_GAP);
      const machine = state.slugs[i] ? PachiSim.machineRegistry.getBySlug(state.slugs[i]) : null;
      drawTile(ctx, x, y, TILE_SIZE, machine);
    }

    ctx.fillStyle = "#8a7658";
    ctx.font = "18px sans-serif";
    ctx.fillText("gijipachi.jp/my9dai/", width / 2, height - FOOTER_HEIGHT / 2);
  }

  function renderTextList(container, state) {
    const picked = state.slugs
      .map((slug) => (slug ? PachiSim.machineRegistry.getBySlug(slug) : null))
      .filter(Boolean);
    if (picked.length === 0) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <ul class="my9dai-text-list">
        ${picked
          .map((m) => `<li><a href="${machineHref(m)}">${m.name}</a><span class="my9dai-text-list__prob">${probabilityLabel(m)}</span></li>`)
          .join("")}
      </ul>
    `;
  }

  function wireDownload(button, canvas) {
    button.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "my9dai.png";
      link.click();
    });
  }

  // 共有URLを開いた側の、読み取り専用ビュー。
  // 「リンクをコピー」は今開いているURLそのものなので出さないが、
  // カード画像の保存はここでも意味があるので使えるようにする。
  function initViewer(shared) {
    const canvas = $("my9daiCanvas");
    renderCardCanvas(canvas, shared);
    renderTextList($("my9daiTextList"), shared);
    $("my9daiEditor").hidden = true;
    $("my9daiViewerCta").hidden = false;
    $("my9daiCopyLink").hidden = true;
    wireDownload($("my9daiDownload"), canvas);
  }

  function initEditor(machines) {
    const els = {
      nameInput: $("my9daiName"),
      grid: $("my9daiGrid"),
      picker: $("my9daiPicker"),
      search: $("my9daiSearch"),
      searchResults: $("my9daiSearchResults"),
      pickerClear: $("my9daiPickerClear"),
      pickerClose: $("my9daiPickerClose"),
      canvas: $("my9daiCanvas"),
      textList: $("my9daiTextList"),
      download: $("my9daiDownload"),
      copyLink: $("my9daiCopyLink"),
      copyStatus: $("my9daiCopyStatus"),
    };

    let state = loadState();
    let activeSlotIndex = null;

    function persist() {
      saveState(state);
    }

    function renderGrid() {
      els.grid.innerHTML = state.slugs
        .map((slug, i) => {
          const machine = slug ? PachiSim.machineRegistry.getBySlug(slug) : null;
          if (machine) {
            return `
              <button type="button" class="my9dai-slot my9dai-slot--filled" data-index="${i}"
                style="background:${colorForMachine(machine)}">
                <span class="my9dai-slot__name">${machine.name}</span>
              </button>
            `;
          }
          return `<button type="button" class="my9dai-slot" data-index="${i}">＋<span class="my9dai-slot__index">${i + 1}</span></button>`;
        })
        .join("");
    }

    function renderCard() {
      renderCardCanvas(els.canvas, state);
      renderTextList(els.textList, state);
    }

    function renderSearchResults(query) {
      if (!query) {
        els.searchResults.innerHTML = "";
        return;
      }
      const matched = machines.filter((m) => matchesQuery(m, query)).slice(0, 20);
      els.searchResults.innerHTML = matched.length
        ? matched
            .map(
              (m) => `
                <li>
                  <button type="button" class="my9dai-picker__result" data-slug="${m.slug}">
                    ${m.name}<span class="my9dai-picker__result-maker">${m.manufacturer.name}</span>
                  </button>
                </li>
              `
            )
            .join("")
        : '<li class="my9dai-picker__empty">該当する機種が見つかりませんでした。</li>';
    }

    function openPicker(index) {
      activeSlotIndex = index;
      els.picker.hidden = false;
      els.search.value = "";
      els.searchResults.innerHTML = "";
      els.search.focus();
    }

    function closePicker() {
      activeSlotIndex = null;
      els.picker.hidden = true;
    }

    els.grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".my9dai-slot");
      if (!btn) return;
      openPicker(Number(btn.dataset.index));
    });

    els.search.addEventListener("input", (e) => {
      renderSearchResults(e.target.value.trim());
    });

    els.searchResults.addEventListener("click", (e) => {
      const btn = e.target.closest(".my9dai-picker__result");
      if (!btn || activeSlotIndex === null) return;
      state.slugs[activeSlotIndex] = btn.dataset.slug;
      persist();
      renderGrid();
      renderCard();
      closePicker();
    });

    els.pickerClear.addEventListener("click", () => {
      if (activeSlotIndex === null) return;
      state.slugs[activeSlotIndex] = null;
      persist();
      renderGrid();
      renderCard();
      closePicker();
    });

    els.pickerClose.addEventListener("click", closePicker);

    els.nameInput.value = state.name;
    els.nameInput.addEventListener("input", (e) => {
      state.name = e.target.value;
      persist();
      renderCard();
    });

    wireDownload(els.download, els.canvas);

    els.copyLink.addEventListener("click", async () => {
      const url = buildShareUrl(state);
      try {
        await navigator.clipboard.writeText(url);
        showCopyStatus("リンクをコピーしました。");
      } catch (e) {
        // クリップボードAPIが使えない環境（権限拒否・非対応ブラウザ）向けの手動フォールバック。
        window.prompt("このURLをコピーしてください", url);
      }
    });

    let copyStatusTimer = null;
    function showCopyStatus(text) {
      els.copyStatus.textContent = text;
      els.copyStatus.hidden = false;
      clearTimeout(copyStatusTimer);
      copyStatusTimer = setTimeout(() => {
        els.copyStatus.hidden = true;
      }, 2500);
    }

    renderGrid();
    renderCard();
  }

  function init() {
    const machines = PachiSim.machineRegistry.getAll();
    const shared = parseSharedFromUrl();
    if (shared) {
      initViewer(shared);
    } else {
      initEditor(machines);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
