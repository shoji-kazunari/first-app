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
  // デフォルト値。実際の長さはemphasizeFirst()の引数で速度に応じて渡される。
  const DEFAULT_MOVE_MS = 140; // 位置を動かすフェーズ
  const DEFAULT_GROW_MS = 120; // 着いてから大きさが変わるフェーズ
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

  // FLIP: ballを実際にtoSlotへ移してしまってから、移す前の見た目（位置・大きさ）を
  // 装うtransformを一旦当て、そこから元へ戻すことで「なめらかに移動・拡大縮小した」
  // ように見せる。
  //
  // 大きさが変わる移動（小台→大台）は、移動と拡大を1本のtransformで同時にやると
  // 「膨らみながら滑っていく」不自然な見た目になる。特に「早い」速度では拡大フェーズが
  // 短く、大きくなりきった直後にバーストするため、膨らみながら滑る姿しか見えない。
  // そこで必ず2段階に分ける:
  //   1. 移動前の大きさを保ったまま、位置だけを動かす（moveMs）
  //   2. 着いてからその場で大きさを変える（growMs）
  // 呼び出し側は、この2つの合計が現在の速度の拡大フェーズに収まる長さを渡すこと。
  //
  // onSettled（任意）: 上記2段階が完全に終わった瞬間を検知したい場合に渡す。
  // moveMs/growMs（任意）: 各フェーズの所要時間。省略時はDEFAULT_*_MS。
  HoldQueue.prototype._flipMove = function (ball, toSlot, onSettled, moveMs, growMs) {
    const moveDuration = moveMs || DEFAULT_MOVE_MS;
    const growDuration = typeof growMs === "number" ? growMs : DEFAULT_GROW_MS;

    // 直前の演出（落ちてくるenterや前回の移動）がまだ途中の玉をそのまま測ると、
    // 「途中の小さい状態」を移動前の大きさとして拾ってしまい、やはり移動中に
    // 伸び縮みして見える。測る前に必ず、今いる台での静止状態へ確定させる。
    ball.style.transition = "none";
    ball.classList.remove("hold-ball--enter");
    ball.style.transform = "";
    void ball.offsetWidth; // 強制リフローで確定させる

    const before = ball.getBoundingClientRect();
    toSlot.appendChild(ball);
    const after = ball.getBoundingClientRect();
    // ズレは中心同士で求める。左上同士で求めると、大きさが変わるときに
    // 半径の差（小台30px→大台40pxなら5px）だけ位置がずれてしまう。
    const dx = before.left + before.width / 2 - (after.left + after.width / 2);
    const dy = before.top + before.height / 2 - (after.top + after.height / 2);
    const scale = after.width > 0 ? before.width / after.width : 1;
    const moved = Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5;
    const resized = Math.abs(scale - 1) >= 0.01;

    // 終わったら、次にburst/enterが来たとき用に.hold-ballのデフォルト
    // （跳ねる方）のトランジションへ戻しておく。
    const finish = () => {
      ball.style.transition = "";
      ball.style.transform = "";
      if (onSettled) onSettled();
    };

    if (!moved && !resized) {
      finish();
      return;
    }

    // 第2段階: その場で大きさだけを変える。
    // 第1段階の完了時点（transitionend）で今の姿は既に描画済みなので、
    // ここでは待たずにそのまま次のtransitionを始めてよい。
    const grow = () => {
      if (!resized) {
        finish();
        return;
      }
      this._transitionTransform(ball, "scale(1)", growDuration, finish);
    };

    ball.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    void ball.offsetWidth; // 強制リフローでtransform適用を確定させる

    // 強制リフローはレイアウトの確定であってペイントの確定ではないため、
    // モバイル端末ではこの直後の変更が同じフレームにまとめられ、瞬間移動して
    // 見えることがある。第1段階の開始前だけはrAFを2重にしてペイントを1回挟む。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!moved) {
          grow();
          return;
        }
        // 第1段階: 大きさは移動前のまま、位置だけを動かす
        this._transitionTransform(ball, `scale(${scale})`, moveDuration, grow);
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
  // moveMs/growMs（任意）: 「移動」と「着いてから拡大」の各所要時間。呼び出し側
  // （機種ページコントローラ）が現在の速度のテンポに応じて渡す。2つの合計が
  // 拡大フェーズを超えると、拡大しきる前にバーストが割り込んでしまう。
  HoldQueue.prototype.emphasizeFirst = function (shouldRefill, refillPattern, moveMs, growMs) {
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

    this._flipMove(target, this.bigSlot, onAnySettled, moveMs, growMs);
    this._applyColorForPosition(target, "big");
    // 残りの待機列（今はslot2〜4にいる）を、1〜3番目へ詰める
    // （こちらは大きさが変わらないので、実際には移動フェーズのみ行われる）
    this.queue.forEach((ball, i) => {
      this._flipMove(ball, this.smallSlots[i], onAnySettled, moveMs, growMs);
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
