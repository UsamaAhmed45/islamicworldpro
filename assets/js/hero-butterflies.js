/* Islamic World Pro — hero background: "Butterfly Drift" (WebGL).
   Vanilla-JS port of the Originkit ButterflyDrift component, tuned for the
   emerald & gold palette. Butterflies wander, flap and scatter away from the
   pointer. Pauses when the hero is off-screen or the tab is hidden, uses fewer
   butterflies on phones, and stays still for reduced-motion users.
   Usage: <canvas class="hero-bf" data-base="#FAF3DF" data-accent="#D4AF37"></canvas> */
(function () {
  'use strict';
  var canvas = document.querySelector('canvas.hero-bf');
  if (!canvas) return;

  var MAX_DPR = 2, MAX_COUNT = 140, VERTS = 6, FPV = 12, STRIDE = FPV * 4, TAU = Math.PI * 2;
  var SPAN = 0.042, CRUISE = 0.075, FLAP_HZ = 5.5, PUSH = 2.6, BOB = 0.55, WRAP = 600;
  var CORNERS = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];

  var VERT = [
    'attribute vec2 a_corner;attribute vec2 a_center;attribute vec2 a_dir;attribute vec4 a_ext;attribute vec2 a_shade;',
    'uniform vec2 uHalf;uniform float uPxUnit;',
    'varying vec2 v_local;varying float v_fold;varying float v_seed;varying float v_aa;varying vec2 v_shade;',
    'void main(){v_local=a_corner;v_fold=a_ext.y;v_seed=a_ext.z;v_shade=a_shade;',
    'vec2 right=vec2(a_dir.y,-a_dir.x);vec2 world=a_center+(a_corner.x*right+a_corner.y*a_dir)*a_ext.x;',
    'float px=max(a_ext.x*uPxUnit,1.0);v_aa=(1.0+a_ext.w)/px;gl_Position=vec4(world/uHalf,0.0,1.0);}'
  ].join('\n');

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec3 uBase;uniform vec3 uAccent;',
    'varying vec2 v_local;varying float v_fold;varying float v_seed;varying float v_aa;varying vec2 v_shade;',
    'float hash11(float n){return fract(sin(n*78.233)*43758.5453123);}',
    'vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}',
    'float sdEllipse(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return (length(q)-1.0)*min(r.x,r.y);}',
    'float sdLobe(vec2 p,vec2 c,vec2 r,float ang,float e){vec2 q=abs(rot(p-c,-ang)/r)+1e-4;return (pow(pow(q.x,e)+pow(q.y,e),1.0/e)-1.0)*min(r.x,r.y);}',
    'float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h);}',
    'float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}',
    'void main(){vec2 p=v_local;float fold=max(v_fold,0.08);vec2 w=vec2(abs(p.x)/fold,p.y);',
    'float dFore=sdLobe(w,vec2(0.40,0.28),vec2(0.46,0.21),0.60,1.38);',
    'float dHind=sdLobe(w,vec2(0.26,-0.24),vec2(0.32,0.22),-0.80,2.0);',
    'float dRoot=sdLobe(w,vec2(0.16,0.01),vec2(0.23,0.29),0.0,2.0);',
    'float dWing=smin(smin(dFore,dHind,0.03),dRoot,0.05);',
    'float dBody=sdEllipse(p,vec2(0.0,-0.16),vec2(0.030,0.28));',
    'dBody=smin(dBody,sdEllipse(p,vec2(0.0,0.17),vec2(0.048,0.14)),0.04);',
    'dBody=smin(dBody,length(p-vec2(0.0,0.33))-0.042,0.03);',
    'vec2 ap=vec2(abs(p.x),p.y);float dAnt=sdSeg(ap,vec2(0.02,0.36),vec2(0.12,0.57))-0.008;',
    'dAnt=min(dAnt,length(ap-vec2(0.131,0.593))-0.018);',
    'float aa=v_aa;float wingA=1.0-smoothstep(-aa,aa,dWing);float bodyA=1.0-smoothstep(-aa,aa,dBody);float antA=1.0-smoothstep(-aa,aa,dAnt);',
    'float cover=max(max(wingA,bodyA),antA*0.9);if(cover<0.004)discard;',
    'vec3 ink=uBase*0.38;vec3 bodyInk=uBase*0.20;',
    'vec2 hq=w-vec2(0.04,0.05);float rad=length(hq);float t=smoothstep(0.16,0.74,rad);',
    'vec3 wing=mix(uBase,uAccent,clamp(t*0.95+v_shade.y*0.25-0.12,0.0,1.0));',
    'float va=atan(hq.y,max(hq.x,1e-4));float vein=1.0-smoothstep(0.0,0.06,abs(fract(va*1.45+0.5)-0.5)*2.0);',
    'wing=mix(wing,ink,vein*0.30*smoothstep(0.12,0.45,rad));',
    'float rim=smoothstep(-0.055,-0.004,dWing);',
    'vec2 qf=rot(w-vec2(0.40,0.28),-0.60)/vec2(0.46,0.21);float spots=0.0;',
    'for(int i=0;i<2;i++){float fi=float(i);float sd=v_seed*97.0+fi*11.0;vec2 sc=vec2(-0.30+1.05*hash11(sd),-0.55+1.10*hash11(sd+4.7));spots=max(spots,1.0-smoothstep(0.0,0.06,length(qf-sc)-0.13));}',
    'spots*=step(dWing,0.0);',
    'vec3 col=mix(wing,ink,clamp(rim*0.9+spots*0.5,0.0,1.0));col*=1.0+0.12*p.x;col*=mix(0.72,1.0,fold);',
    'col=mix(col,bodyInk,bodyA);col=mix(col,bodyInk,antA*0.9);',
    'float a=cover*v_shade.x;gl_FragColor=vec4(clamp(col,0.0,1.0)*a,a);}'
  ].join('\n');

  function hex(c, fb) {
    var m = /^#?([0-9a-f]{6})$/i.exec((c || '').trim());
    if (!m) return fb;
    var n = parseInt(m[1], 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, depth: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return; // no WebGL: the hero's gradient background still looks complete

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var data = new Float32Array(MAX_COUNT * VERTS * FPV);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  [['a_corner', 2, 0], ['a_center', 2, 2], ['a_dir', 2, 4], ['a_ext', 4, 6], ['a_shade', 2, 10]].forEach(function (a) {
    var loc = gl.getAttribLocation(prog, a[0]);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, a[1], gl.FLOAT, false, STRIDE, a[2] * 4);
  });
  var uHalf = gl.getUniformLocation(prog, 'uHalf'), uPx = gl.getUniformLocation(prog, 'uPxUnit');
  var uBase = gl.getUniformLocation(prog, 'uBase'), uAccent = gl.getUniformLocation(prog, 'uAccent');
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);

  /* ---- settings (data-* attributes, same scale as the original props) ---- */
  var ds = canvas.dataset;
  var small = window.matchMedia('(max-width:760px)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function n(v, fb) { v = parseFloat(v); return isFinite(v) ? v : fb; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  var V = {
    count: Math.round(cl(n(small ? ds.densityMobile : ds.density, small ? 26 : 60), 4, MAX_COUNT)),
    span: SPAN * (cl(n(small ? ds.sizeMobile : ds.size, small ? 34 : 70), 20, 400) / 100),
    speed: cl(n(ds.speed, 60), 0, 100) / 50,
    flap: cl(n(ds.flap, 40), 0, 100) / 50,
    wander: cl(n(ds.wander, 30), 0, 100) / 100,
    depth: cl(n(ds.depth, 100), 0, 100) / 100,
    blur: cl(n(ds.blur, 60), 0, 300) / 100,
    hover: cl(n(ds.hover, 140), 0, 200) / 100,
    reach: cl(n(ds.reach, 22), 0, 100) / 100
  };
  var BASE = hex(ds.base, [0.98, 0.95, 0.87]), ACCENT = hex(ds.accent, [0.83, 0.69, 0.22]);
  window.IWPBF = { setColors: function (b, a) { BASE = hex(b, BASE); ACCENT = hex(a, ACCENT); if (!running) requestAnimationFrame(function (t) { last = t - 16; frame(t); }); } };

  /* ---- swarm ---- */
  var F = function () { return new Float32Array(MAX_COUNT); };
  var S = { x: F(), y: F(), vx: F(), vy: F(), dx: F(), dy: F(), th: F(), ph: F(), k1: F(), k2: F(), rate: F(), spd: F(), seed: F(), z: F(), panic: F(), order: new Int32Array(MAX_COUNT), bx: 0, by: 0 };
  var rs = 0x2f6e2b1 >>> 0;
  function rnd() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; }
  for (var i = 0; i < MAX_COUNT; i++) {
    S.th[i] = rnd() * TAU; S.ph[i] = rnd() * TAU; S.k1[i] = rnd() * TAU; S.k2[i] = rnd() * TAU;
    S.rate[i] = rnd(); S.spd[i] = 0.75 + rnd() * 0.5; S.seed[i] = rnd();
    S.z[i] = ((i + 1) * 0.7320508075688772) % 1;
    S.dx[i] = Math.cos(S.th[i]); S.dy[i] = Math.sin(S.th[i]);
  }
  var idx = []; for (i = 0; i < V.count; i++) idx.push(i);
  idx.sort(function (a, b) { return S.z[a] - S.z[b]; });
  for (i = 0; i < V.count; i++) S.order[i] = idx[i];

  var ptr = { x: 0, y: 0, on: 0, target: 0 };
  var raf = 0, last = performance.now(), clock = 0, visible = true, running = false;

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
    var cw = canvas.clientWidth || 1200, ch = canvas.clientHeight || 700;
    var bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; gl.viewport(0, 0, bw, bh); }

    var halfW = bw / bh * 0.5, margin = V.span * 1.4, bx = halfW + margin, by = 0.5 + margin;
    if (S.bx === 0) {
      for (var j = 0; j < MAX_COUNT; j++) {
        S.x[j] = (((j + 1) * 0.6180339887498949) % 1) * 2 * bx - bx;
        S.y[j] = (((j + 1) * 0.41421356237309503) % 1) * 2 * by - by;
      }
      S.bx = bx;
    } else if (Math.abs(bx - S.bx) > S.bx * 0.02) {
      var kk = bx / S.bx; for (j = 0; j < MAX_COUNT; j++) S.x[j] *= kk; S.bx = bx;
    }
    S.by = by;

    var dts = dt * V.speed; clock = (clock + dts) % WRAP;
    ptr.on += (ptr.target - ptr.on) * (1 - Math.exp(-6 * dt));
    var reachW = Math.max(1e-4, V.reach), spread = V.depth, cruise = CRUISE * V.speed, flapRate = FLAP_HZ * V.flap * V.speed;
    var o = 0;
    for (var k = 0; k < V.count; k++) {
      i = S.order[k];
      var z = S.z[i], par = 0.65 + 0.55 * z;
      S.th[i] += (Math.sin(clock * 0.9 + S.k1[i]) * 0.85 + Math.sin(clock * 2.3 + S.k2[i]) * 0.5) * V.wander * 3.0 * dts;
      S.ph[i] += flapRate * (1 + S.panic[i] * 1.5) * (0.85 + 0.3 * S.rate[i]) * TAU * dt;
      if (S.ph[i] > TAU * 1024) S.ph[i] -= TAU * 1024;
      var cs = Math.cos(S.th[i]), sn = Math.sin(S.th[i]);
      var drive = cruise * S.spd[i] * par, thrust = 0.55 + 0.75 * Math.max(0, Math.sin(S.ph[i]));
      var sway = Math.cos(S.ph[i]) * drive * BOB;
      var kv = 1 - Math.exp(-3.5 * dt);
      S.vx[i] += (cs * drive * thrust - sn * sway - S.vx[i]) * kv;
      S.vy[i] += (sn * drive * thrust + cs * sway - S.vy[i]) * kv;
      if (ptr.on > 0.001 && V.hover > 0) {
        var ddx = S.x[i] - ptr.x, ddy = S.y[i] - ptr.y, d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < reachW) {
          var f0 = 1 - d / reachW, f = f0 * f0 * ptr.on, inv = 1 / Math.max(d, 1e-4);
          S.vx[i] += ddx * inv * PUSH * V.hover * f * dt;
          S.vy[i] += ddy * inv * PUSH * V.hover * f * dt;
          var diff = Math.atan2(ddy, ddx) - S.th[i];
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          S.th[i] += diff * Math.min(1, f * 7 * dt);
          if (f > S.panic[i]) S.panic[i] = f;
        }
      }
      S.panic[i] *= Math.exp(-1.2 * dt);
      var sp = Math.sqrt(S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i]), mx = drive * (1.8 + 6 * S.panic[i]) + 1e-6;
      if (sp > mx) { S.vx[i] *= mx / sp; S.vy[i] *= mx / sp; }
      S.x[i] += S.vx[i] * dt; S.y[i] += S.vy[i] * dt;
      if (S.x[i] > bx) S.x[i] -= 2 * bx; else if (S.x[i] < -bx) S.x[i] += 2 * bx;
      if (S.y[i] > by) S.y[i] -= 2 * by; else if (S.y[i] < -by) S.y[i] += 2 * by;
      var vl = Math.sqrt(S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i]);
      var tx = vl > 1e-5 ? S.vx[i] / vl : cs, ty = vl > 1e-5 ? S.vy[i] / vl : sn, kd = 1 - Math.exp(-9 * dt);
      S.dx[i] += (tx - S.dx[i]) * kd; S.dy[i] += (ty - S.dy[i]) * kd;
      var dl = Math.sqrt(S.dx[i] * S.dx[i] + S.dy[i] * S.dy[i]) || 1; S.dx[i] /= dl; S.dy[i] /= dl;
      var fold = 0.24 + 0.76 * Math.pow(0.5 + 0.5 * Math.cos(S.ph[i]), 0.62);
      var half = V.span * (1 + (z - 0.5) * spread * 0.9), far = 1 - z;
      var alpha = 1 - spread * 0.6 * far, blurPx = V.blur * 4 * far * far * spread;
      for (var c = 0; c < VERTS; c++) {
        data[o] = CORNERS[c * 2]; data[o + 1] = CORNERS[c * 2 + 1];
        data[o + 2] = S.x[i]; data[o + 3] = S.y[i]; data[o + 4] = S.dx[i]; data[o + 5] = S.dy[i];
        data[o + 6] = half; data[o + 7] = fold; data[o + 8] = S.seed[i]; data[o + 9] = blurPx;
        data[o + 10] = alpha; data[o + 11] = S.seed[i];
        o += FPV;
      }
    }
    gl.uniform2f(uHalf, halfW, 0.5); gl.uniform1f(uPx, bh);
    gl.uniform3f(uBase, BASE[0], BASE[1], BASE[2]); gl.uniform3f(uAccent, ACCENT[0], ACCENT[1], ACCENT[2]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, o));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, V.count * VERTS);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() { if (running || reduce) return; running = true; last = performance.now(); canvas.classList.add('is-live'); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* pointer: the hero section (not just the canvas) scares the butterflies */
  var host = canvas.closest('section') || canvas.parentNode;
  function track(e) {
    var r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    var fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    var fy = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    ptr.x = (fx - 0.5) * (canvas.width / Math.max(1, canvas.height)); ptr.y = 0.5 - fy; ptr.target = 1;
  }
  host.addEventListener('pointermove', track, { passive: true });
  host.addEventListener('pointerdown', track, { passive: true });
  host.addEventListener('pointerleave', function () { ptr.target = 0; });
  host.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') ptr.target = 0; });

  if (reduce) { requestAnimationFrame(function (t) { last = t - 16; frame(t); canvas.classList.add('is-live'); }); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }, { threshold: 0 }).observe(canvas);
  } else start();
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (visible && start()); });
})();
