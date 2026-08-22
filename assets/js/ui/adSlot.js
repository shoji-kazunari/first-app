// 広告枠の共通コンポーネント。
// 現時点ではAdSense等のIDが未設定のため、開発中と分かるプレースホルダーを表示する。
// 将来AdSenseを導入する際は、この関数の中身だけを実際の広告タグに差し替えればよい。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.renderAdSlot = function (containerEl, label) {
  containerEl.classList.add("ad-slot");
  containerEl.innerHTML = `
    <p class="ad-slot__label">広告${label ? `（${label}）` : ""}</p>
    <p class="ad-slot__placeholder">広告枠（準備中）</p>
  `;
};
