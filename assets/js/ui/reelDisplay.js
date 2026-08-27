// 保留を1つ消化するたびに再生される「3つの数字リール」演出。
// 実際の抽選結果には関与しない、見た目だけの共通演出。
// 数字は縦方向に流れる帯（reel-strip）をスクロールさせることで表現する。
window.PachiSim = window.PachiSim || {};
window.PachiSim.ui = window.PachiSim.ui || {};

PachiSim.ui.ReelDisplay = (function () {
  // ITEM_HEIGHTはCSS(.reel-viewport/.reel-item)側の高さと必ず一致させること。
  // CYCLE_HEIGHTはCSSの@keyframes reel-spin-loopのtranslateY量とも一致させること。
  //
  // 数字は「上から下」に流れて見せたいので、strip上のアイテムは
  // screenY = index*ITEM_HEIGHT + translateY で位置が決まる前提のもと、
  // translateYを大きくする(0に近づける/プラス方向)ほど、より小さいindexのアイテムが
  // 上から入ってくる＝下方向へ流れる見た目になる。つまり「先の停止位置」は
  // 現在位置より小さいindexを狙う必要がある。
  const ITEM_HEIGHT = 68;
  const CYCLE = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const CYCLE_LEN = CYCLE.length;
  const STRIP_CYCLES = 12; // 下方向に流すため、常に手前(小さいindex側)へ十分な余裕を持たせる
  const EXTRA_CYCLES_ON_STOP = 3; // 停止時、もう何周か回ってから減速して止まる感じを出す
  const SAFE_REBASE_CYCLES = 6; // indexが心もとなくなったら、見た目を変えずにここまで押し上げる
  const MIN_SAFE_INDEX = (EXTRA_CYCLES_ON_STOP + 1) * CYCLE_LEN; // これを下回ったら押し上げが必要

  function colorClassFor(digit) {
    if (digit === 7) return "reel-digit--gold";
    return digit % 2 === 0 ? "reel-digit--blue" : "reel-digit--green";
  }

  function buildStrip() {
    const strip = document.createElement("div");
    strip.className = "reel-strip";
    for (let c = 0; c < STRIP_CYCLES; c++) {
      CYCLE.forEach((d) => {
        const item = document.createElement("span");
        item.className = `reel-item ${colorClassFor(d)}`;
        item.textContent = String(d);
        strip.appendChild(item);
      });
    }
    return strip;
  }

  function ReelDisplay(containerEl) {
    this.el = containerEl;
    this.el.innerHTML = `
      <div class="reel-viewport is-idle" data-pos="left"><span class="reel-idle">-</span></div>
      <div class="reel-viewport is-idle" data-pos="middle"><span class="reel-idle">-</span></div>
      <div class="reel-viewport is-idle" data-pos="right"><span class="reel-idle">-</span></div>
    `;
    this._pos = {};
    ["left", "middle", "right"].forEach((pos) => {
      const viewport = this.el.querySelector(`[data-pos="${pos}"]`);
      const strip = buildStrip();
      viewport.appendChild(strip);
      // currentIndexは「いまtranslateYで何番目のアイテムを窓に揃えているか」の自前管理値。
      // getComputedStyleでCSS transition/animationの途中経過を読み取ろうとすると、
      // 直前に設定した値がまだ描画に反映されていない（特に呼び出し直後）ことがあり
      // 信頼できないため、必ずここで管理している値だけを真実とする。
      this._pos[pos] = { viewport, strip, currentIndex: 0 };
    });
    this._timers = [];
  }

  ReelDisplay.prototype._schedule = function (fn, delay) {
    const t = setTimeout(fn, delay);
    this._timers.push(t);
    return t;
  };

  ReelDisplay.prototype._clearTimers = function () {
    this._timers.forEach((t) => clearTimeout(t));
    this._timers = [];
  };

  // アイドル状態（3つとも「-」）に戻す
  ReelDisplay.prototype.reset = function () {
    this._clearTimers();
    ["left", "middle", "right"].forEach((pos) => {
      const state = this._pos[pos];
      state.viewport.classList.add("is-idle");
      state.viewport.classList.remove("reel-viewport--hit-glow");
      state.strip.classList.remove("reel-strip--spinning");
      state.strip.style.transition = "none";
      state.strip.style.transform = "translateY(0)";
      state.currentIndex = 0;
    });
  };

  // 数字が揃った（大当たりの）ときだけ、3つの枠をレインボーに光らせる。
  ReelDisplay.prototype._setHitGlow = function (active) {
    ["left", "middle", "right"].forEach((pos) => {
      this._pos[pos].viewport.classList.toggle("reel-viewport--hit-glow", active);
    });
  };

  // 「当たりまで」で演出をすっ飛ばした直後など、途中経過を見せずに
  // 結果だけを即座に反映したいときに使う（揃った状態＝3つとも同じ数字にする）。
  ReelDisplay.prototype.showResult = function (leftDigit, rightDigit, middleDigit) {
    this._clearTimers();
    ["left", "right", "middle"].forEach((pos) => {
      this._pos[pos].viewport.classList.remove("is-idle");
    });
    this.stopAt("left", leftDigit, 1);
    this.stopAt("right", rightDigit, 1);
    this.stopAt("middle", middleDigit, 1);
    this._setHitGlow(true); // showResultは常に大当たり確定時にしか呼ばれない（当たりまでスキップ時）
  };

  ReelDisplay.prototype.startSpin = function () {
    this._setHitGlow(false);
    ["left", "middle", "right"].forEach((pos) => {
      const state = this._pos[pos];
      state.viewport.classList.remove("is-idle");
      state.strip.style.transition = "none";
      state.strip.style.transform = "translateY(0)";
      void state.strip.offsetHeight; // 強制リフローでtransformのリセットを確定させる
      state.strip.classList.add("reel-strip--spinning");
      state.currentIndex = 0;
    });
  };

  // 指定位置の帯を、目的の数字が中央に来る位置までtransitionMs掛けて減速させながら止める。
  // 「上から下」に流したいので、狙うindexは必ず現在位置より小さい方向（手前）を探す。
  // 巡回コンテンツなので、indexが心もとなくなったら見た目を変えずに押し上げてから探す
  // （帯を無限に長くしなくて済む）。
  ReelDisplay.prototype.stopAt = function (pos, digit, transitionMs) {
    const duration = transitionMs || 320;
    const state = this._pos[pos];
    state.strip.classList.remove("reel-strip--spinning");

    // screenY = index*ITEM_HEIGHT + translateY = 0 (先頭アイテムが窓に揃う位置) という
    // 前提でindexを扱う。currentIndexは自前管理の値（DOMから読み戻さない）。
    let currentIndex = state.currentIndex;
    if (currentIndex < MIN_SAFE_INDEX) {
      currentIndex += SAFE_REBASE_CYCLES * CYCLE_LEN;
    }
    const freezeY = -(currentIndex * ITEM_HEIGHT);
    state.strip.style.transition = "none";
    state.strip.style.transform = `translateY(${freezeY}px)`;
    void state.strip.offsetHeight;

    const digitIndex = CYCLE.indexOf(digit);
    let targetIndex = Math.floor(currentIndex) - EXTRA_CYCLES_ON_STOP * CYCLE_LEN;
    while (((targetIndex % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN !== digitIndex) {
      targetIndex -= 1;
    }
    state.currentIndex = targetIndex; // 次回のstopAt呼び出しはこの値を起点にする
    const targetY = -(targetIndex * ITEM_HEIGHT);

    // 強制リフロー(上の offsetHeight 読み取り)によって「transitionなしでfreezeY」という
    // 状態が確定済みなので、続けて同期的にtransitionありの目標値を設定するだけでよい
    // （requestAnimationFrameは不要。むしろ古いheadless環境等でrAFが正しく発火しないケースがある）。
    state.strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.3, 1)`;
    state.strip.style.transform = `translateY(${targetY}px)`;
  };

  // plan: PachiSim.reelOmens.decide(...)の戻り値
  // timing: { leftDelay, rightDelay, middleDelay, reachStepDelays: [d0,d1,d2] }
  //
  // 左右は短くキビキビ止め、中央（リーチ時）だけは1本の長いtransitionで
  // 「だんだん減速して目的の数字に収まる」動きを表現する
  // （細切れにstopAtを何度も呼ぶと、前のtransitionが終わる前に次で上書きされてカクつくため）。
  ReelDisplay.prototype.play = function (plan, timing, onDone) {
    this._clearTimers();
    this.startSpin();

    const snapDuration = (delay) => Math.max(40, Math.min(280, Math.round(delay * 0.75)));

    this._schedule(() => {
      this.stopAt("left", plan.leftDigit, snapDuration(timing.leftDelay));

      this._schedule(() => {
        this.stopAt("right", plan.rightDigit, snapDuration(timing.rightDelay));

        if (plan.reach) {
          const reachTotal = timing.reachStepDelays.reduce((a, b) => a + b, 0);
          this.stopAt("middle", plan.finalMiddleDigit, reachTotal);
          this._schedule(() => {
            if (plan.match) this._setHitGlow(true); // 3つ揃った（大当たり）ときだけ枠を光らせる
            if (onDone) onDone();
          }, reachTotal);
        } else {
          this._schedule(() => {
            this.stopAt("middle", plan.middleDigit, snapDuration(timing.middleDelay));
            if (onDone) onDone();
          }, timing.middleDelay);
        }
      }, timing.rightDelay);
    }, timing.leftDelay);
  };

  return ReelDisplay;
})();
