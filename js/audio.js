/* 钢铁之门 · 程序化战术音效
   全部由 Web Audio 合成，不依赖外部音频文件。
   首次点击/按键时解锁 AudioContext。 */
(function () {
  'use strict';

  var A = {};
  var ctx = null;
  var master = null;
  var noiseBuf = null;
  var last = {};
  var MASTER_HEADROOM = 0.72;
  function clampVol(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

  A.muted = false;
  try { A.muted = localStorage.getItem('steel_muted') === '1'; } catch (e) {}
  A.volumes = (window.SL && SL.SETTINGS && SL.SETTINGS.audio) || { master: 1, artillery: 1, explosion: 1, ui: 1 };
  A.volume = function (kind) {
    return kind === 'master' ? (A.volumes.master == null ? 1 : A.volumes.master)
      : (A.volumes[kind] == null ? 1 : A.volumes[kind]);
  };
  A.setVolumes = function (vals) {
    if (!vals) return;
    A.volumes.master = vals.master == null ? A.volumes.master : clampVol(vals.master);
    A.volumes.artillery = vals.artillery == null ? A.volumes.artillery : clampVol(vals.artillery);
    A.volumes.explosion = vals.explosion == null ? A.volumes.explosion : clampVol(vals.explosion);
    A.volumes.ui = vals.ui == null ? A.volumes.ui : clampVol(vals.ui);
    if (master) { try { master.gain.setTargetAtTime(A.muted ? 0 : MASTER_HEADROOM * A.volume('master'), ctx.currentTime, 0.03); } catch (e) {} }
  };

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      return ctx;
    }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try {
      ctx = new C({ latencyHint: 'interactive' });
      master = ctx.createGain();
      master.gain.value = A.muted ? 0 : MASTER_HEADROOM * A.volume('master');
      // 给合成音效留足动态余量，避免多个爆炸/炮声叠加时数字削波
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 28;
      hp.Q.value = 0.7;
      var limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.knee.value = 8;
      limiter.ratio.value = 16;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.18;
      // 软削波兜底：只处理峰值，正常音量保持线性
      var shaper = ctx.createWaveShaper();
      var curve = new Float32Array(1024);
      for (var ci = 0; ci < curve.length; ci++) {
        var x = ci * 2 / (curve.length - 1) - 1;
        curve[ci] = Math.tanh(x * 1.15) / Math.tanh(1.15);
      }
      shaper.curve = curve;
      shaper.oversample = '4x';
      master.connect(hp);
      hp.connect(limiter);
      limiter.connect(shaper);
      shaper.connect(ctx.destination);
      var len = Math.floor(ctx.sampleRate * 0.7);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {
      ctx = null;
      master = null;
    }
    return ctx;
  }

  function unlock() {
    if (!A.muted) ensure();
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  function gate(name, gap) {
    if (!ctx) return false;
    var t = ctx.currentTime;
    if (last[name] && t - last[name] < gap) return false;
    last[name] = t;
    return true;
  }

  // 以屏幕中心为听点：中心最响；己方武器使用更大的世界传播范围
  A.gainAt = function (x, y, side) {
    if (x == null || y == null) return 1;
    var R = SL.Render;
    if (!R || !R.proj || !R.proj.w || !R.proj.h) return 1;
    var w = R.proj.w, h = R.proj.h;
    var sx = R.proj.x(x), sy = R.proj.y(y);
    var onScreen = sx >= 0 && sx <= w && sy >= 0 && sy <= h;
    var maxD = Math.sqrt(w * w + h * h) / 2;
    var d = Math.sqrt((sx - w / 2) * (sx - w / 2) + (sy - h / 2) * (sy - h / 2));
    var g = onScreen ? Math.pow(Math.max(0, 1 - d / maxD), 1.15) : 0;
    if (side === 'blue' && R.cam) {
      // 己方火炮/舰炮传播范围大幅提高，屏幕外也保留清晰可闻的炮声
      var wd = Math.sqrt((x - R.cam.x) * (x - R.cam.x) + (y - R.cam.y) * (y - R.cam.y));
      var longRange = Math.max(0, 1 - wd / 5200);
      g = Math.max(g, Math.pow(longRange, 0.62) * 0.95);
    }
    return g;
  };

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || !master) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slideTo) {
      try { o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur); } catch (e) {}
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise(dur, vol, freq, type, q) {
    if (!ctx || !master || !noiseBuf) return;
    var t = ctx.currentTime;
    var src = ctx.createBufferSource();
    var f = ctx.createBiquadFilter();
    var g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = type || 'lowpass';
    f.frequency.setValueAtTime(freq || 600, t);
    f.Q.value = q == null ? 0.7 : q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  A.click = function () {
    if (!ensure() || A.muted) return;
    if (!gate('click', 0.035)) return;
    tone(980, 0.035, 'triangle', 0.045 * A.volume('ui'), 720);
  };

  A.shot = function (w, u, secondary, x, y) {
    if (x == null && u && u.x != null) { x = u.x; y = u.y; }
    var g = A.gainAt(x, y, u && u.side) * A.volume('artillery');
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('shot', 0.028)) return;
    var dmg = (w && w.dmg) || 10;
    var label = (w && w.label) || '';
    if (w && w.kind === 'shell') {
      tone(70, 0.3, 'sine', 0.66 * g, 36);
      noise(0.24, 0.4 * g, 460, 'lowpass');
      return;
    }
    if (dmg >= 45 || label.indexOf('KwK') >= 0 || label.indexOf('Pak') >= 0 || label.indexOf('88') >= 0) {
      tone(92, 0.24, 'sawtooth', 0.4 * g, 40);
      noise(0.2, 0.34 * g, 820, 'lowpass');
    } else if (label.indexOf('MG') >= 0 || (w && w.mg)) {
      noise(0.055, 0.16 * g, 1500, 'bandpass', 0.9);
      tone(190, 0.045, 'square', 0.07 * g, 90);
    } else {
      noise(0.07, 0.14 * g, 850, 'bandpass', 0.8);
      tone(150, 0.06, 'sawtooth', 0.07 * g, 80);
    }
  };

  A.explosion = function (radius, x, y) {
    var g = A.gainAt(x, y) * A.volume('explosion');
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('boom', 0.06)) return;
    var r = Math.max(15, radius || 30);
    var v = Math.min(0.38, 0.18 + r / 360) * g;
    noise(0.42, v, 340, 'lowpass', 0.6);
    tone(62, 0.4, 'sine', v * 0.7, 24);
  };

  A.card = function () {
    if (!ensure() || A.muted) return;
    if (!gate('card', 0.08)) return;
    tone(640, 0.075, 'sine', 0.07 * A.volume('ui'), 820);
    setTimeout(function () { if (!A.muted) tone(880, 0.09, 'sine', 0.055, 1040); }, 55);
  };

  A.level = function () {
    if (!ensure() || A.muted) return;
    if (!gate('level', 0.5)) return;
    tone(523, 0.16, 'triangle', 0.09 * A.volume('ui'));
    setTimeout(function () { if (!A.muted) tone(659, 0.16, 'triangle', 0.09); }, 120);
    setTimeout(function () { if (!A.muted) tone(784, 0.26, 'triangle', 0.1); }, 240);
  };

  A.build = function (x, y) {
    var g = A.gainAt(x, y);
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('build', 0.25)) return;
    noise(0.18, 0.13 * g, 420, 'lowpass');
    tone(105, 0.18, 'square', 0.08 * g, 65);
  };

  A.repair = function (x, y) {
    var g = A.gainAt(x, y);
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('repair', 0.5)) return;
    tone(440, 0.12, 'triangle', 0.07 * g, 620);
    setTimeout(function () { if (!A.muted) tone(660, 0.14, 'triangle', 0.07 * g, 880); }, 110);
  };

  A.capture = function (x, y) {
    var g = A.gainAt(x, y);
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('capture', 0.25)) return;
    tone(330, 0.14, 'triangle', 0.08 * g, 440);
    setTimeout(function () { if (!A.muted) tone(494, 0.2, 'triangle', 0.08 * g, 660); }, 130);
    noise(0.1, 0.055 * g, 1100, 'bandpass', 1.1);
  };

  A.plane = function (x, y) {
    var g = A.gainAt(x, y);
    if (g <= 0 || !ensure() || A.muted) return;
    if (!gate('plane', 0.8)) return;
    noise(0.85, 0.11 * g, 700, 'bandpass', 1.2);
    tone(120, 0.7, 'sawtooth', 0.035 * g, 180);
  };

  A.win = function () {
    if (!ensure() || A.muted) return;
    if (!gate('win', 1.5)) return;
    var notes = [392, 523, 659, 784];
    notes.forEach(function (f, i) {
      setTimeout(function () { if (!A.muted) tone(f, 0.38, 'triangle', 0.1); }, i * 180);
    });
  };

  A.toggle = function () {
    A.muted = !A.muted;
    try { localStorage.setItem('steel_muted', A.muted ? '1' : '0'); } catch (e) {}
    if (!A.muted) {
      ensure();
      A.click();
    }
    if (master) {
      try { master.gain.setTargetAtTime(A.muted ? 0 : MASTER_HEADROOM * A.volume('master'), ctx.currentTime, 0.03); } catch (e) {}
    }
    return A.muted;
  };

  A.toggleLabel = function () { return A.muted ? '静' : '♪'; };
  SL.Audio = A;
})();
