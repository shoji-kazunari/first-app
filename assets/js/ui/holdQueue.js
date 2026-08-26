// 保留（○）が貯まって消化されていく共通アニメーション部品。
// 機種固有のアイコンや演出は持たず、全機種共通の円アイコンのみを使う。
//
// 土台（台座）を5つ常設し、玉はその上を移動していくだけの構成にしている：
//   ・小さい台×4＝待機列（1〜4番目）
//   ・大きい台×1＝これから消化される保留専用（左端）
// 台自体は常に表示されたまま動かない。玉のスライドはFLIP（先に動かしてから、
// 動く前の位置を装うtransformを当てて0へ戻す）でアニメーションする。
// 土台という固定レイアウトの上で完結するため、「隣の玉がずれる」ような
// レイアウト起因のバグが起きない。
//
// 大台の玉だけ一回り大きくして光らせる（実機の保留表示と同じ考え方）。
// そこへ移る動きは、位置と大きさを1本のtransitionで同時に変える。
// 過去に別の見せ方を試して、いずれも指摘を受けている:
//   ・移動してから拡大 → 移動が早々に終わって間が空き「着いてからガコッ」
//   ・移動させず出し直す → 「一瞬消える」
//   ・大きさを揃えて動かさない → 当該保留が目立たない
// 加えて、以前は差が30px→40px(3割増)と大きく、どう動かしても不自然に見えていた。
// 今は36px(2割増)に抑えて、同時に変えている。
//
// 1回の消化は2段階で表現する:
//   1. emphasizeFirst() - 先頭の保留が大台へスライドしつつ一回り大きくなり、
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
  // スライドのトランジション設定。.hold-ballのデフォルト（burst/enter用）は
  // 跳ねる感じのcubic-bezier(0.34, 1.56, 0.64, 1)だが、これをそのまま移動にも
  // 使うと「動いた後、少し戻る」ような跳ね返りに見えてしまうため、
  // 移動中だけは跳ね返りのないイージングを明示的に指定する。
  // 実際の長さはemphasizeFirst()の引数で速度に応じて渡される。
  const DEFAULT_MOVE_MS = 140;
  const MOVE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
  // 新しい保留が上から落ちてくる動き。前寄りすぎるイージングだと、見えるように
  // なった時にはもう着地していて「落ちてきた」と分からないため、
  // 移動用より緩やかで、最後に軽く行き過ぎる程度のカーブにする。
  const DEFAULT_ENTER_MS = 200;
  const ENTER_EASING = "cubic-bezier(0.3, 0.75, 0.45, 1.2)";

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

  // 待機列または大台に、色が付く（途中から色が付くものも含む）保留が今いるか。
  // 色保留が同時に複数出ると、どれが何を示しているのか分かりづらくなるため、
  // 呼び出し側はこれがtrueの間、新しく出す保留に色を割り当てない。
  HoldQueue.prototype.hasColoredPattern = function () {
    const balls = this.processing ? [this.processing].concat(this.queue) : this.queue;
    return balls.some((ball) => PachiSim.holdOmens.isColoredPattern(ball._pattern));
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
  // enterMs（任意）: 落ちてくる動きの所要時間。省略時はDEFAULT_ENTER_MS。
  HoldQueue.prototype._playEnter = function (ball, onLanded, enterMs) {
    const duration = enterMs || DEFAULT_ENTER_MS;
    // 透明度は動きよりずっと早く立ち上げる。.hold-ballの既定値のままだと、
    // 玉がほとんど透明なうちに落ちきってしまい（透明度0.6に達する頃には
    // 着地点の2px手前まで来ている）、上から入ってくる動きが見えない。
    const fadeMs = Math.max(40, Math.round(duration * 0.28));
    // enter状態が実際に1フレーム分描画されてからクラスを外さないと、
    // モバイル端末では2つのスタイル変更が同じフレームにまとめられてしまい
    // アニメーションなしで瞬間移動したように見えることがある（rAFを2重に
    // ネストして、間に確実にペイントを1回挟む）。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ball.style.transition = `transform ${duration}ms ${ENTER_EASING}, opacity ${fadeMs}ms ease`;
        ball.classList.remove("hold-ball--enter");
        let fired = false;
        const done = () => {
          if (fired) return;
          fired = true;
          // 次のburst用に.hold-ballの既定のトランジションへ戻す
          ball.style.transition = "";
          if (onLanded) onLanded();
        };
        ball.addEventListener("transitionend", done, { once: true });
        this._schedule(done, duration + 100);
      });
    });
  };

  // transformを指定値へアニメーションさせ、完了した瞬間にonDoneを呼ぶ小さなヘルパー。
  // 呼んだ時点のtransformが開始値になるので、開始値が既に画面に描画済みである
  // ことを呼び出し側が保証すること（未描画のまま呼ぶと、2つのスタイル変更が同じ
  // フレームにまとめられ、アニメーションなしで瞬間移動して見える）。
  // 完了はtransitionendで正確に検知する（setTimeoutで見計らうと実際の完了と数msずれ、
  // そのわずかな差分がデフォルトの跳ねるイージングで埋められて「一瞬戻る」ように
  // 見えるため）。バックグラウンドタブ等で発火しない場合に備え、保険のタイムアウトも併用する。
  HoldQueue.prototype._transitionTransform = function (ball, toTransform, durationMs, onDone) {
    ball.style.transition = `transform ${durationMs}ms ${MOVE_EASING}`;
    ball.style.transform = toTransform;
    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      onDone();
    };
    ball.addEventListener("transitionend", done, { once: true });
    this._schedule(done, durationMs + 80);
  };

  // FLIP: ballを実際にtoSlotへ移してしまってから、移す前の位置を装うtransformを
  // 一旦当て、そこから0へ戻すことで「なめらかにスライドした」ように見せる。
  //
  // 位置と大きさの変化は「1本のtransitionで同時に」行う。実機の保留も、手前へ
  // 進みながら一回り大きくなる1つの動きになっている。
  // 過去に「移動してから拡大」の2段階にしたことがあるが、移動のイージングが
  // 前寄りで玉が早々に着いてしまい、そこから拡大が始まるまでの間が
  // 「着いてからガコッと大きくなる」と受け取られたため、分割はしない。
  //
  // onSettled（任意）: 動きが完全に終わった瞬間を検知したい場合に渡す。
  // moveMs（任意）: 所要時間。省略時はDEFAULT_MOVE_MS。
  HoldQueue.prototype._flipMove = function (ball, toSlot, onSettled, moveMs) {
    const moveDuration = moveMs || DEFAULT_MOVE_MS;

    // 直前の演出（落ちてくるenterや前回のスライド）がまだ途中の玉をそのまま測ると、
    // 「途中の位置・大きさ」を移動前の状態として拾ってしまい、動きがおかしくなる。
    // 測る前に必ず、今いる台での静止状態へ確定させる。
    ball.style.transition = "none";
    ball.classList.remove("hold-ball--enter");
    ball.style.transform = "";
    void ball.offsetWidth; // 強制リフローで確定させる

    const before = ball.getBoundingClientRect();
    toSlot.appendChild(ball);
    const after = ball.getBoundingClientRect();
    // ズレは中心同士で求める。左上同士で求めると、大きさが変わるときに
    // 半径の差（30px→36pxなら3px）だけ開始位置がずれてしまう。
    const dx = before.left + before.width / 2 - (after.left + after.width / 2);
    const dy = before.top + before.height / 2 - (after.top + after.height / 2);
    const scale = after.width > 0 ? before.width / after.width : 1;

    // 終わったら、次にburst/enterが来たとき用に.hold-ballのデフォルト
    // （跳ねる方）のトランジションへ戻しておく。
    const finish = () => {
      ball.style.transition = "";
      ball.style.transform = "";
      if (onSettled) onSettled();
    };

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.01) {
      finish();
      return;
    }

    ball.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    void ball.offsetWidth; // 強制リフローでtransform適用を確定させる

    // 強制リフローはレイアウトの確定であってペイントの確定ではないため、
    // モバイル端末ではこの直後の変更が同じフレームにまとめられ、瞬間移動して
    // 見えることがある。rAFを2重にしてペイントを1回挟む。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._transitionTransform(ball, "", moveDuration, finish);
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

  // 空いている待機列の末尾（通常は3=4番目）に新しい保留を1つ補充する。
  // moveMs（任意）: そのときの速度のスライド時間。落下もこれに合わせて
  // 長さを決めるので、テンポが変わっても浮いた速さにならない。
  HoldQueue.prototype._addRefill = function (pattern, moveMs) {
    const slotIndex = this.queue.length;
    if (slotIndex >= SMALL_SLOT_COUNT) return;
    const ball = this._makeBall(pattern);
    this.smallSlots[slotIndex].appendChild(ball);
    this._applyColorForPosition(ball, SLOT_POSITION_KEYS[slotIndex]);
    this.queue.push(ball);
    this._playEnter(ball, null, moveMs ? Math.round(moveMs * 1.4) : undefined);
  };

  // 先頭の保留を大台へスライドさせ、同時に残りの待機列も1つずつスライドさせて詰める。
  // どの台でも玉の大きさは同じなので、これは純粋な平行移動になる。
  // 移動先に応じて、それぞれの保留に割り当てられたパターンから色を反映し直す。
  // shouldRefill/refillPattern: trueなら、このスライド一式が完全に終わった直後に
  // 待機列の空いた4番目へ新しい保留を補充する（当たり時は補充しないのでfalse）。
  // 「スライドが終わったらすぐ」という体感を、固定の待ち時間で見計らうのではなく、
  // 実際にすべての移動が完了した瞬間（transitionend）を検知して行う。
  // moveMs（任意）: スライドの所要時間。呼び出し側（機種ページコントローラ）が
  // 現在の速度のテンポに応じて渡す。
  HoldQueue.prototype.emphasizeFirst = function (shouldRefill, refillPattern, moveMs) {
    const target = this.queue.shift();
    if (!target) return;
    // 前の消化のバースト玉がまだ残っていることがある（resolveFirstは少し遅れて
    // 取り除くため）。台に玉が2つ並ばないよう、先に片付ける。
    this.bigSlot.querySelectorAll(".hold-ball").forEach((old) => old.remove());
    this.processing = target;

    const movingBalls = [target].concat(this.queue);
    let settledCount = 0;
    const onAnySettled = () => {
      settledCount++;
      if (settledCount === movingBalls.length && shouldRefill) {
        this._addRefill(refillPattern, moveMs);
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
