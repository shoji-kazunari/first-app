// 運営（サイト管理者）ログイン用の小さなウィジェット。
// 通常のプレイヤーには目立たない控えめな見た目にし、ログインするとランキングの
// 削除ボタンが使えるようになる（実際の削除権限はFirestoreのセキュリティルール側で
// 強制されるので、ここでのログイン有無はあくまで「削除ボタンを表示するかどうか」
// というUI都合のもの）。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

// containerEl: 表示先の要素。
// onChange（任意）: ログイン状態が変わるたびに呼ばれる（呼び出し側はこれを合図に
// ランキング表示を再描画し、削除ボタンの表示・非表示を切り替える）。
PachiSim.ui.renderAdminAuthBar = function (containerEl, onChange) {
  if (!window.PachiSim.fb) return;

  function renderLoggedIn() {
    containerEl.innerHTML = `
      <p class="admin-auth-bar__status">運営としてログイン中</p>
      <button class="admin-auth-bar__logout" type="button">ログアウト</button>
    `;
    containerEl.querySelector(".admin-auth-bar__logout").addEventListener("click", async () => {
      await PachiSim.fb.logout();
    });
  }

  function renderLoggedOut() {
    containerEl.innerHTML = `
      <button class="admin-auth-bar__toggle" type="button">運営ログイン</button>
      <form class="admin-auth-bar__form" hidden>
        <input type="email" name="email" class="admin-auth-bar__input" placeholder="メールアドレス" autocomplete="username" required>
        <input type="password" name="password" class="admin-auth-bar__input" placeholder="パスワード" autocomplete="current-password" required>
        <button type="submit" class="admin-auth-bar__submit btn btn-secondary btn-small">ログイン</button>
        <p class="admin-auth-bar__error" hidden>ログインに失敗しました。</p>
      </form>
    `;
    const toggleBtn = containerEl.querySelector(".admin-auth-bar__toggle");
    const form = containerEl.querySelector(".admin-auth-bar__form");
    const errorEl = containerEl.querySelector(".admin-auth-bar__error");
    toggleBtn.addEventListener("click", () => {
      form.hidden = !form.hidden;
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      try {
        await PachiSim.fb.login(form.email.value, form.password.value);
      } catch (err) {
        errorEl.hidden = false;
      }
    });
  }

  function render() {
    if (PachiSim.fb.isAdmin()) {
      renderLoggedIn();
    } else {
      renderLoggedOut();
    }
    if (onChange) onChange(PachiSim.fb.isAdmin());
  }

  PachiSim.fb.onAdminChange(render);
  PachiSim.fb.ready.then(render);
};
