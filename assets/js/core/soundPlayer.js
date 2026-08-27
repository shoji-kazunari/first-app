// 演出の効果音。音声ファイルは1つも持たず、鳴らすたびにその場で波形を合成する。
//
// 音声ファイルを置かない理由:
// - ダウンロードが0バイトで済む。サイト全体が272KBしかないので、効果音を10種類
//   ファイルで持つと100〜300KB増えて、サイトの重さが倍近くになってしまう
// - 実機の音を使わない方針に対して、自前で合成した音なら出所の問題が起きない
//
// 音が物足りなくなったらRECIPESの中身を音声ファイルの再生に差し替えればよく、
// 鳴らす側（machine.js）は触らずに済む。
//
// 【重要】iOSのSafariはWeb Audioも本体の消音スイッチに従うため、マナーモードの
// iPhoneでは何をしても鳴らない。仕様なので回避策はない。したがって音は必ず画面の
// 演出に添えるだけにとどめ、「音でしか分からない情報」を作らないこと。
window.PachiSim = window.PachiSim || {};

PachiSim.soundPlayer = (function () {
  "use strict";

  const STORAGE_KEY = "pachisim.sound.enabled";
  const MASTER_GAIN = 0.5;

  // 同じ音が連射されたときに潰れて聞こえるのを防ぐ最小間隔。
  // 呼ぶ側（machine.js）が速度ごとに鳴らす音を絞っているが、それをすり抜けた
  // 呼び出しがあっても雑音にならないようにするための最後の砦。
  const MIN_REPEAT_MS = 55;

  // 同時に鳴らせる音の数。これを超えた呼び出しは捨てる（重なりすぎて割れるのを防ぐ）。
  const MAX_VOICES = 6;

  let ctx = null;
  let master = null;
  let enabled = readStoredEnabled();
  let voices = 0;
  const lastPlayedAt = Object.create(null);

  function readStoredEnabled() {
    // プライベートブラウズなどでlocalStorageが例外を投げることがある。
    // 音は無くても遊べるので、読めなければOFF扱いにして黙って続行する。
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function isSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  function ensureContext() {
    if (ctx) return ctx;
    if (!isSupported()) return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
    return ctx;
  }

  // --- 音の部品 ---------------------------------------------------------

  // 単音。freq→toFreqへ滑らせられる。
  // ゲインはexponentialRampで動かすので0を渡せない（0にすると無音のまま固まる）。
  // 立ち上がり(attack)を必ず少し取るのは、いきなり最大音量にするとプツッと鳴るため。
  function tone(c, dest, t0, spec) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const peak = spec.gain == null ? 0.2 : spec.gain;
    const attack = spec.attack == null ? 0.006 : spec.attack;

    osc.type = spec.type || "sine";
    osc.frequency.setValueAtTime(spec.freq, t0);
    if (spec.toFreq && spec.toFreq !== spec.freq) {
      osc.frequency.exponentialRampToValueAtTime(spec.toFreq, t0 + spec.dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(attack, spec.dur * 0.5));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.dur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t0 + spec.dur + 0.02);
  }

  // ホワイトノイズをバンドパスに通した「カチッ」「コッ」系の音。
  // 打撃音は倍音がばらけているので、単音を重ねるよりノイズを削る方が近くなる。
  function noiseBurst(c, dest, t0, spec) {
    const length = Math.max(1, Math.floor(c.sampleRate * spec.dur));
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(spec.filterHz || 2200, t0);
    filter.Q.setValueAtTime(spec.q == null ? 1.2 : spec.q, t0);

    const gain = c.createGain();
    gain.gain.setValueAtTime(spec.gain == null ? 0.2 : spec.gain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t0);
    src.stop(t0 + spec.dur + 0.02);
  }

  // --- 音の一覧 ---------------------------------------------------------
  //
  // 各レシピは「鳴り終わるまでの秒数」を返す（同時発音数の管理に使う）。
  // 音量はどれも控えめにしてある。1回転ごとに何度も鳴るものほど小さく、
  // 大当たり・RESULTのように滅多に鳴らないものほど大きくしている。
  const RECIPES = {
    // 保留が1個貯まる: 短く高い「ピッ」
    charge: function (c, dest, t0) {
      tone(c, dest, t0, { type: "triangle", freq: 880, toFreq: 1320, dur: 0.06, gain: 0.16 });
      return 0.06;
    },

    // 保留が当該位置へ滑る: 控えめな「コッ」
    slide: function (c, dest, t0) {
      noiseBurst(c, dest, t0, { dur: 0.05, filterHz: 1400, q: 1.0, gain: 0.09 });
      return 0.05;
    },

    // リールが回り出す: 短い上昇の「ヒュン」
    reelStart: function (c, dest, t0) {
      tone(c, dest, t0, { type: "sawtooth", freq: 200, toFreq: 720, dur: 0.13, gain: 0.06 });
      return 0.13;
    },

    // リールが1つ止まる: 「カチッ」。打撃のノイズに低い胴鳴りを重ねる
    reelStop: function (c, dest, t0) {
      noiseBurst(c, dest, t0, { dur: 0.045, filterHz: 2600, q: 2.0, gain: 0.2 });
      tone(c, dest, t0, { type: "sine", freq: 300, toFreq: 150, dur: 0.07, gain: 0.11 });
      return 0.07;
    },

    // テンパイ: 期待させたいので長めに上昇させる。2オクターブ重ねて厚くする
    reach: function (c, dest, t0) {
      tone(c, dest, t0, { type: "sawtooth", freq: 420, toFreq: 1180, dur: 0.55, gain: 0.1, attack: 0.05 });
      tone(c, dest, t0, { type: "square", freq: 840, toFreq: 2360, dur: 0.55, gain: 0.035, attack: 0.05 });
      return 0.55;
    },

    // ハズレ: 1回転ごとに鳴るので、低く短く、いちばん小さい音にする
    miss: function (c, dest, t0) {
      tone(c, dest, t0, { type: "sine", freq: 320, toFreq: 200, dur: 0.1, gain: 0.09 });
      return 0.1;
    },

    // 大当たり: ドミソドの駆け上がり
    hit: function (c, dest, t0) {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        const at = t0 + i * 0.085;
        tone(c, dest, at, { type: "triangle", freq: freq, dur: 0.42, gain: 0.24 });
        tone(c, dest, at, { type: "square", freq: freq * 2, dur: 0.42, gain: 0.05 });
      });
      return 0.085 * 3 + 0.42;
    },

    // ST・時短が当たらずに終わった: 下降させて終わりを示す
    exhausted: function (c, dest, t0) {
      [660, 494, 392].forEach(function (freq, i) {
        tone(c, dest, t0 + i * 0.13, { type: "sine", freq: freq, dur: 0.3, gain: 0.16 });
      });
      return 0.13 * 2 + 0.3;
    },

    // 連チャンが終わってRESULTが出る: 余韻の長いチャイム
    result: function (c, dest, t0) {
      tone(c, dest, t0, { type: "sine", freq: 1046.5, dur: 0.9, gain: 0.2, attack: 0.01 });
      tone(c, dest, t0 + 0.12, { type: "sine", freq: 1568, dur: 0.9, gain: 0.14, attack: 0.01 });
      return 1.02;
    },
  };

  // --- 外向きのAPI ------------------------------------------------------

  // ブラウザは「ユーザーが操作するまで音を出さない」制限を持つ。
  // 作られた直後のAudioContextはsuspendedなので、タップの延長線上でresumeする。
  // このサイトはSTARTを押して遊ぶ作りなので、最初のSTARTで解錠できる。
  function unlock() {
    if (!enabled) return;
    const c = ensureContext();
    if (c && c.state === "suspended") {
      const resumed = c.resume();
      if (resumed && resumed.catch) resumed.catch(function () {});
    }
  }

  // 鳴らせたらtrue、鳴らさなかったらfalseを返す（テストで使う）。
  //
  // delaySec: 同時に起きる2つの節目に別々の音を付けたいときに、後ろへずらす秒数。
  // setTimeoutでずらすとタイマーの誤差が乗るが、Web Audioは開始時刻を直接指定できる
  // ので、指定した間隔どおりに並ぶ。
  function play(name, delaySec) {
    if (!enabled) return false;
    const recipe = RECIPES[name];
    if (!recipe) return false;

    const c = ensureContext();
    if (!c) return false;
    if (voices >= MAX_VOICES) return false;

    const startAt = c.currentTime + (delaySec || 0);
    const last = lastPlayedAt[name];
    if (last != null && (startAt - last) * 1000 < MIN_REPEAT_MS) return false;
    lastPlayedAt[name] = startAt;

    let durationSec;
    try {
      durationSec = recipe(c, master, startAt);
    } catch (e) {
      // 端末側の都合で合成に失敗しても、遊べなくなる方が困る
      return false;
    }

    voices += 1;
    window.setTimeout(function () {
      voices -= 1;
    }, Math.round(((delaySec || 0) + (durationSec || 0.2)) * 1000) + 30);
    return true;
  }

  function setEnabled(next) {
    enabled = !!next;
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch (e) {
      // 保存できなくても、そのページの間は設定を反映できるので続行する
    }
    if (enabled) unlock();
  }

  function isEnabled() {
    return enabled;
  }

  return {
    play: play,
    unlock: unlock,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    isSupported: isSupported,
    soundNames: Object.keys(RECIPES),
  };
})();
