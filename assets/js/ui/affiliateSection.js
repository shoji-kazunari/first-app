// 関連商品（Amazonアフィリエイト等）の共通コンポーネント。
// 現時点ではAmazon PA-APIやアフィリエイトIDが未設定のため、架空の商品は表示しない。
// items が空配列の場合は空状態を表示し、後からmachine.relatedProductsにデータを
// 追加するだけで表示されるようにしてある。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.renderAffiliateSection = function (containerEl, items) {
  if (!items || items.length === 0) {
    containerEl.innerHTML = `
      <p class="affiliate-section__empty">関連商品は準備中です。</p>
    `;
    return;
  }

  const cards = items
    .map(
      (item) => `
        <a class="affiliate-card" href="${item.url}" target="_blank" rel="noopener sponsored">
          <span class="affiliate-card__title">${item.title}</span>
        </a>
      `
    )
    .join("");

  containerEl.innerHTML = `<div class="affiliate-section__grid">${cards}</div>`;
};
