// 効果音のON/OFFボタン。設定はlocalStorageに残るので、次に開いたときも維持される。
//
// 初期値はOFF。ページを開いた人が意図せず音を出してしまう（電車の中など）方が、
// 音が鳴らないことより困るため。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.soundToggle = (function () {
  "use strict";

  // buttonEl: ボタン本体 / hintEl: マナーモードの注意書き（ONのときだけ出す）
  function init(buttonEl, hintEl) {
    if (!buttonEl) return;
    const player = PachiSim.soundPlayer;

    if (!player || !player.isSupported()) {
      // 音を出せない環境では、押せないボタンを見せるより隠す
      buttonEl.hidden = true;
      if (hintEl) hintEl.hidden = true;
      return;
    }

    function render() {
      const on = player.isEnabled();
      buttonEl.setAttribute("aria-pressed", on ? "true" : "false");
      buttonEl.querySelector(".sound-toggle__icon").textContent = on ? "🔊" : "🔇";
      buttonEl.querySelector(".sound-toggle__label").textContent = on ? "音：ON" : "音：OFF";
      if (hintEl) hintEl.hidden = !on;
    }

    buttonEl.addEventListener("click", function () {
      // クリックの延長線上でsetEnabled→unlockまで済ませる。
      // ブラウザの自動再生制限は「ユーザー操作の中で解錠したか」を見ているので、
      // ここを非同期にまたぐと解錠に失敗する。
      player.setEnabled(!player.isEnabled());
      render();
    });

    render();
  }

  return { init: init };
})();
