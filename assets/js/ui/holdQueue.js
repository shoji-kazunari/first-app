// 保留（○）が貯まって消化されていく共通アニメーション部品。
// 機種固有のアイコンや演出は持たず、全機種共通の円アイコンのみを使う。
//
// 土台（台座）を5つ常設し、玉はその上を移動していくだけの構成にしている：
//   ・小さい台×4＝待機列（1〜4番目）
//   ・大きい台×1＝これから消化される保留専用（左端）
// 台自体は常に表示されたまま動かない。玉の移動・拡大縮小はすべて
// FLIP（先に動かしてから、動く前の状態を装うtransformを当てて0へ戻す）で
// アニメーションする。土台という固定レイアウトの上で完結するため、
// 「拡大した拍子に隣の玉がずれる」ようなレイアウト起因のバグが起きない。
//
// 1回の消化は2段階で表現する:
//   1. emphasizeFirst() - 先頭の保留が大台へスライド移動しつつ拡大し、
//      「これから消化される」ことを示す。同時に、残りの待機列も1つずつ詰める。
//      このスライド一式が完全に終わった直後（ハズレなら）、待機列の空いた
//      4番目に新しい保留が補充される。
//   2. resolveFirst(isHit) - 大台の保留がその場でバーストして消える
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.HoldQueue = (function () {
  const SMALL_SLOT_COUNT = 4;
  // smallSlots[i]に対応する色パターンのキー（保留の色変化演出はこのキーで
  // 「今どの位置にいるか」を引く。データは保留4(一番奥)〜保留1(先頭)の順）
  const SLOT_POSITION_KEYS = ["1", "2", "3", "4"];
  // 移動・拡大縮小のトランジション設定。.hold-ballのデフォルト（burst/enter用）は
  // 跳ねる感じのcubic-bezier(0.34, 1.56, 0.64, 1)だが、これをそのまま移動にも
  // 使うと「動いた後、少し戻る」ような跳ね返りに見えてしまうため、
  // 移動中だけは跳ね返りのないイージングを明示的に指定する。
  // デフォルト値。実際の長さはemphasizeFirst()の引数で速度に応じて渡される
  // （「早い」速度の拡大フェーズ(約115ms)より長いままだと、移動しきる前に
  // バーストが割り込んで「移動中に大きくなる」ような不自然な見た目になるため）。
  const DEFAULT_MOVE_MS = 140;
  const MOVE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  function HoldQueue(containerEl) {
    this.el = containerEl;
    this._timers = [];
    this.el.innerHTML = `
      <div class="hold-slot hold-slot--big" data-slot="big"><span class="hold-base"></span></div>
      <div class="hold-slot hold-slot--small" data-slot="1"><span class="hold-base"></span></div>
      <div class="hold-slot hold-slot--small" data-slot="2"><span class="hold-base"></span></div>
      <div class="hold-slot hold-slot--small" data-slot="3"><span class="hold-base"></span></div>
      <div class="hold-slot hold-slot--small" data-slot="4"><span class="hold-base"></span></div>
    `;
    this.bigSlot = this.el.querySelector('[data-slot="big"]');
    this.smallSlots = [1, 2, 3, 4].map((n) => this.el.querySelector(`[data-slot="${n}"]`));
    this.queue = []; // 待機列（小台）に今いる玉。queue[0]が次に消化される
    this.processing = null; // 大台に今いる玉（消化中でなければnull）
  }

  HoldQueue.prototype._schedule = function (fn, delay) {
    const t = setTimeout(fn, delay);
    this._timers.push(t);
    return t;
  };

  HoldQueue.prototype._clearTimers = function () {
    this._timers.forEach((t) => clearTimeout(t));
    this._timers = [];
  };

  // 台自体はそのまま残し、玉だけをすべて取り除く
  HoldQueue.prototype.reset = function () {
    this._clearTimers();
    if (this.processing) {
      this.processing.remove();
      this.processing = null;
    }
    this.queue.forEach((b) => b.remove());
    this.queue = [];
  };

  // 先頭（＝これから消化される保留＝大台にいる保留）が色付きかどうか。
  // リーチ演出の判定に使う。emphasizeFirst()の後に呼ばれる想定。
  HoldQueue.prototype.isFirstColored = function () {
    const target = this.processing || this.queue[0];
    if (!target) return false;
    return Array.from(target.classList).some((c) => c.indexOf("hold-ball--color-") === 0);
  };

  // pattern: PachiSim.holdOmens.pickPattern()の戻り値（{4,3,2,1,big}の色推移パターン）。
  // 実際に画面へ反映するのは_applyColorForPositionの役目で、ここでは保持するだけ。
  HoldQueue.prototype._makeBall = function (pattern) {
    const ball = document.createElement("span");
    ball.className = "hold-ball hold-ball--enter";
    ball._pattern = pattern || null;
    return ball;
  };

  // ballの今いる位置(positionKey: "4"|"3"|"2"|"1"|"big")に応じて、
  // 割り当てられたパターンから色クラスを付け替える。
  HoldQueue.prototype._applyColorForPosition = function (ball, positionKey) {
    ["red", "green", "blue"].forEach((color) => {
      ball.classList.remove(`hold-ball--color-${color}`);
    });
    const color = ball._pattern && ball._pattern[positionKey];
    if (color) {
      ball.classList.add(`hold-ball--color-${color}`);
    }
  };

  // onLanded（任意）: 着地（enterアニメーション完了）を検知したい場合に渡す。
  // 実際の完了タイミングをtransitionendで正確に検知するが、バックグラウンドタブでの
  // スロットリングなど、万一発火しないケースに備えて保険のタイムアウトも併用する
  // （そうしないと、その後の消化が永久に始まらなくなってしまう）。
  HoldQueue.prototype._playEnter = function (ball, onLanded) {
    // enter状態が実際に1フレーム分描画されてからクラスを外さないと、
    // モバイル端末では2つのスタイル変更が同じフレームにまとめられてしまい
    // アニメーションなしで瞬間移動したように見えることがある（rAFを2重に
    // ネストして、間に確実にペイントを1回挟む）。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ball.classList.remove("hold-ball--enter");
        if (onLanded) {
          let fired = false;
          const done = () => {
            if (fired) return;
            fired = true;
            onLanded();
          };
          ball.addEventListener("transitionend", done, { once: true });
          this._schedule(done, 300); // enterのtransition(0.16s/0.14s)より十分長い保険
        }
      });
    });
  };

  // FLIP: ballを実際にtoSlotへ移してしまってから、移す前の見た目（位置・大きさ）を
  // 装うtransformを一旦当て、次フレームで0へ戻すことで「なめらかに移動・拡大縮小した」
  // ように見せる。位置だけでなく大きさの変化（小台→大台など）も同時に扱える。
  // onSettled（任意）: 移動が実際に完了した瞬間を検知したい場合に渡す
  // （transitionendを正確な合図にしつつ、万一発火しないケースへの保険で
  // タイムアウトも併用する）。
  // moveMs（任意）: 移動の所要時間。省略時はDEFAULT_MOVE_MS。
  HoldQueue.prototype._flipMove = function (ball, toSlot, onSettled, moveMs) {
    const duration = moveMs || DEFAULT_MOVE_MS;
    const before = ball.getBoundingClientRect();
    toSlot.appendChild(ball);
    const after = ball.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const scale = after.width > 0 ? before.width / after.width : 1;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.01) {
      if (onSettled) onSettled();
      return;
    }

    ball.style.transition = "none";
    ball.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    void ball.offsetWidth; // 強制リフローでtransform適用を確定させる
    // 強制リフローはレイアウトの確定であってペイントの確定ではないため、
    // モバイル端末ではこの直後の変更が同じフレームにまとめられ、瞬間移動して
    // 見えることがある。rAFを2重にして間にペイントを挟む。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ball.style.transition = `transform ${duration}ms ${MOVE_EASING}`;
        ball.style.transform = "";
        // 移動が終わったら、次にburst/enterが来たとき用に.hold-ballの
        // デフォルト（跳ねる方）のトランジションへ戻しておく。setTimeoutで
        // 見計らうと実際の完了タイミングと数msずれ、そのわずかな差分が
        // デフォルトの跳ねるイージングで埋められて「一瞬戻る」ように見える
        // バグになるため、実際の完了を検知できるtransitionendを使う
        // （発火しないケースへの保険としてタイムアウトも併用）。
        let fired = false;
        const done = () => {
          if (fired) return;
          fired = true;
          ball.style.transition = "";
          if (onSettled) onSettled();
        };
        ball.addEventListener("transitionend", done, { once: true });
        this._schedule(done, duration + 80);
      });
    });
  };

  // STARTを押した直後、0個→4個まで「1個ずつ順番に」小台へチャージされる演出。
  // 4個目が着地（enterアニメーション完了）してからonDoneを呼ぶので、
  // 呼び出し側はそれを合図に保留消化（emphasize/resolve）を開始すればよい
  // （着地しきる前に消化が始まると、縮んだ途中の状態のままスライドしていって
  // しまい不自然に見えるため）。
  // patterns: 各保留に割り当てる色推移パターンの配列（任意・省略可）。
  // patterns[i]は「保留4〜1」の色推移の一部として、smallSlots[i]の位置
  // （SLOT_POSITION_KEYS[i]）に対応する色をここで反映する。
  HoldQueue.prototype.fillInitial = function (patterns, onDone) {
    this.reset();
    const CHARGE_STAGGER_MS = 130;
    const addNext = (i) => {
      if (i >= SMALL_SLOT_COUNT) return;
      const ball = this._makeBall(patterns && patterns[i]);
      this.smallSlots[i].appendChild(ball);
      this._applyColorForPosition(ball, SLOT_POSITION_KEYS[i]);
      this.queue.push(ball);
      const isLast = i === SMALL_SLOT_COUNT - 1;
      if (isLast) {
        this._playEnter(ball, () => {
          if (onDone) onDone();
        });
      } else {
        this._playEnter(ball);
        this._schedule(() => addNext(i + 1), CHARGE_STAGGER_MS);
      }
    };
    addNext(0);
  };

  // 空いている待機列の末尾（通常は3=4番目）に新しい保留を1つ補充する
  HoldQueue.prototype._addRefill = function (pattern) {
    const slotIndex = this.queue.length;
    if (slotIndex >= SMALL_SLOT_COUNT) return;
    const ball = this._makeBall(pattern);
    this.smallSlots[slotIndex].appendChild(ball);
    this._applyColorForPosition(ball, SLOT_POSITION_KEYS[slotIndex]);
    this.queue.push(ball);
    this._playEnter(ball);
  };

  // 先頭の保留を大台へスライド移動＋拡大し、同時に残りの待機列も1つずつ詰める。
  // 移動先に応じて、それぞれの保留に割り当てられたパターンから色を反映し直す。
  // shouldRefill/refillPattern: trueなら、このスライド一式が完全に終わった直後に
  // 待機列の空いた4番目へ新しい保留を補充する（当たり時は補充しないのでfalse）。
  // 「スライドが終わったらすぐ」という体感を、固定の待ち時間で見計らうのではなく、
  // 実際にすべての移動が完了した瞬間（transitionend）を検知して行う。
  // moveMs（任意）: 移動の所要時間。呼び出し側（機種ページコントローラ）が
  // 現在の速度のテンポ（拡大フェーズの長さ）に応じて短くするために渡す
  // （「早い」速度のように拡大フェーズが短い場合、移動が終わりきる前に
  // バーストが割り込んで「移動中に大きくなる」ように見えてしまうため）。
  HoldQueue.prototype.emphasizeFirst = function (shouldRefill, refillPattern, moveMs) {
    const target = this.queue.shift();
    if (!target) return;
    this.processing = target;

    const movingBalls = [target, ...this.queue];
    let settledCount = 0;
    const onAnySettled = () => {
      settledCount++;
      if (settledCount === movingBalls.length && shouldRefill) {
        this._addRefill(refillPattern);
      }
    };

    this._flipMove(target, this.bigSlot, onAnySettled, moveMs);
    this._applyColorForPosition(target, "big");
    // 残りの待機列（今はslot2〜4にいる）を、1〜3番目へ詰める
    this.queue.forEach((ball, i) => {
      this._flipMove(ball, this.smallSlots[i], onAnySettled, moveMs);
      this._applyColorForPosition(ball, SLOT_POSITION_KEYS[i]);
    });
  };

  HoldQueue.prototype.resolveFirst = function (isHit) {
    const processing = this.processing;
    this.processing = null;
    if (processing) {
      processing.classList.add(isHit ? "hold-ball--burst-hit" : "hold-ball--burst");
      const toRemove = processing;
      setTimeout(() => toRemove.remove(), 160);
    }
  };

  return HoldQueue;
})();
