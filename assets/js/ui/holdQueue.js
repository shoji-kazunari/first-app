// 保留（○）が貯まって消化されていく共通アニメーション部品。
// 機種固有のアイコンや演出は持たず、全機種共通の円アイコンのみを使う。
//
// 1回の消化は2段階で表現する:
//   1. emphasizeFirst() - 先頭の保留が拡大し「これから消化される」ことを示す
//   2. resolveFirst(isHit) - 先頭がその場でバーストして消え、残りはまとめて
//      一瞬で左へスライドし、右へ1個補充される（当たりの場合は補充しない）
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.HoldQueue = (function () {
  const MAX_HOLD = 4;

  function HoldQueue(containerEl) {
    this.el = containerEl;
    this.slots = [];
  }

  HoldQueue.prototype.reset = function () {
    this.el.innerHTML = "";
    this.slots = [];
  };

  // 色予告の期待感が分散しないよう、キュー内に同時に見せる色保留は最大1個までにする。
  // （当たり/ハズレの抽選自体には触れず、見た目の色を付けるかどうかだけを制限する）
  HoldQueue.prototype._hasActiveColor = function () {
    return this.slots.some((el) =>
      Array.from(el.classList).some((c) => c.indexOf("hold-ball--color-") === 0)
    );
  };

  // 先頭（＝これから消化される保留）が色付きかどうか。リーチ演出の判定に使う。
  HoldQueue.prototype.isFirstColored = function () {
    const first = this.slots[0];
    if (!first) return false;
    return Array.from(first.classList).some((c) => c.indexOf("hold-ball--color-") === 0);
  };

  // color: "red"|"green"|"blue"|null|undefined - 保留色予告演出用（任意）
  HoldQueue.prototype._makeBall = function (color) {
    const ball = document.createElement("span");
    ball.className = "hold-ball hold-ball--enter";
    if (color && !this._hasActiveColor()) {
      ball.classList.add(`hold-ball--color-${color}`);
    }
    this.el.appendChild(ball);
    // 次フレームでenterクラスを外し、CSSトランジションで着地させる
    requestAnimationFrame(() => {
      ball.classList.remove("hold-ball--enter");
    });
    return ball;
  };

  // STARTを押した直後、0個→4個まで1個ずつ貯まる演出
  // colors: 各保留に割り当てる色の配列（任意・省略可）
  HoldQueue.prototype.fillInitial = function (colors) {
    this.reset();
    for (let i = 0; i < MAX_HOLD; i++) {
      this.slots.push(this._makeBall(colors && colors[i]));
    }
  };

  HoldQueue.prototype.emphasizeFirst = function () {
    const first = this.slots[0];
    if (first) first.classList.add("hold-ball--emphasize");
  };

  // refillColor: 補充される保留に割り当てる色（任意・省略可）
  HoldQueue.prototype.resolveFirst = function (isHit, refillColor) {
    const containerRect = this.el.getBoundingClientRect();
    const first = this.slots.shift();
    const remaining = this.slots.slice();
    const beforeRects = remaining.map((el) => el.getBoundingClientRect());

    if (first) {
      // firstをフローから外して現在位置に固定し、バーストさせる。
      // フローから抜けることで残りは即座に左へ詰まるので、その分を
      // FLIP（後述）で「まとめて一瞬でスライドする」ように見せる。
      const rect = first.getBoundingClientRect();
      first.style.position = "absolute";
      first.style.left = `${rect.left - containerRect.left}px`;
      first.style.top = `${rect.top - containerRect.top}px`;
      first.classList.remove("hold-ball--emphasize");
      first.classList.add(isHit ? "hold-ball--burst-hit" : "hold-ball--burst");
      const toRemove = first;
      setTimeout(() => toRemove.remove(), 260);
    }

    if (!isHit) {
      this.slots.push(this._makeBall(refillColor));
    }

    // FLIP: 詰まった後の位置(after)から詰まる前の位置(before)へ逆算した分だけ
    // 一旦アニメーションなしでずらし、次フレームで0へ戻すことで
    // 「まとめて一瞬で左にスライドする」動きを作る。
    remaining.forEach((el, idx) => {
      const afterRect = el.getBoundingClientRect();
      const dx = beforeRects[idx].left - afterRect.left;
      if (Math.abs(dx) > 0.5) {
        el.style.transition = "none";
        el.style.transform = `translateX(${dx}px)`;
        void el.offsetWidth; // 強制リフローでtransform適用を確定させる
        requestAnimationFrame(() => {
          el.style.transition = "";
          el.style.transform = "";
        });
      }
    });
  };

  return HoldQueue;
})();
