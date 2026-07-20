// ============ Kinetic Grid Background ============
// Vanilla JS canvas port — reactive dot grid pulled toward the cursor,
// themed to the site's gold/green palette. Renders behind the content of
// every dark-background section: .page-hero, .section-dark, .cta-band,
// and .site-footer.
(function () {
  const THEME = {
    dotColor: "#e9c873",   // --gold-300
    lineColor: "#d4af37",  // --gold-500
    trailColor: "#3fae72", // --green-glow
  };

  const SPACING = 30;   // grid spacing in px
  const RADIUS = 260;   // cursor attraction radius in px
  const STRENGTH = 4;   // 1-10 attraction strength
  const SHOW_TRAIL = true;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function initGrid(host, canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GAP = Math.max(8, SPACING);
    const R = Math.max(1, RADIUS);
    const PULL = (Math.max(1, Math.min(10, STRENGTH)) / 10) * 4;

    let W = 1;
    let H = 1;
    let cols = [];
    let dots = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let trailPts = [];

    function build(mw, mh) {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.floor(mw ?? r.width));
      H = Math.max(1, Math.floor(mh ?? r.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = [];
      dots = [];
      const nCols = Math.floor(W / GAP) + 2;
      const nRows = Math.floor(H / GAP) + 2;
      for (let c = 0; c < nCols; c++) {
        const col = [];
        for (let rIdx = 0; rIdx < nRows; rIdx++) {
          const hx = c * GAP;
          const hy = rIdx * GAP;
          const d = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
          col.push(d);
          dots.push(d);
        }
        cols.push(col);
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = THEME.lineColor;
      ctx.lineWidth = 0.75;
      for (let c = 0; c < cols.length; c++) {
        for (let rIdx = 0; rIdx < cols[c].length; rIdx++) {
          const d = cols[c][rIdx];
          const right = cols[c + 1] && cols[c + 1][rIdx];
          const down = cols[c][rIdx + 1];
          if (right) {
            ctx.beginPath();
            ctx.moveTo(d.hx, d.hy);
            ctx.lineTo(right.hx, right.hy);
            ctx.stroke();
          }
          if (down) {
            ctx.beginPath();
            ctx.moveTo(d.hx, d.hy);
            ctx.lineTo(down.hx, down.hy);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = THEME.dotColor;
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.hx, d.hy, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    build();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver((entries) => {
            const cr = entries[0] && entries[0].contentRect;
            build(cr && cr.width, cr && cr.height);
            if (prefersReducedMotion) drawStatic();
          })
        : null;
    if (ro) ro.observe(host);

    if (prefersReducedMotion) {
      drawStatic();
      return () => ro && ro.disconnect();
    }

    function setMouse(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const mx = clientX - r.left;
      const my = clientY - r.top;
      mouse.x = mx;
      mouse.y = my;
      mouse.active = true;
      const now = performance.now();
      trailPts.push({ x: mx, y: my, t: now });
      if (trailPts.length > 80) trailPts.shift();
    }

    function onMove(e) {
      setMouse(e.clientX, e.clientY);
    }
    function onLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onTouch(e) {
      const t = e.touches[0];
      if (t) setMouse(t.clientX, t.clientY);
    }

    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    host.addEventListener("touchmove", onTouch, { passive: true });
    host.addEventListener("touchend", onLeave);

    let raf = 0;
    function frame() {
      ctx.clearRect(0, 0, W, H);

      for (const d of dots) {
        let ax = (d.hx - d.x) * 0.08;
        let ay = (d.hy - d.y) * 0.08;
        if (mouse.active) {
          const dx = mouse.x - d.x;
          const dy = mouse.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < R && dist > 0.001) {
            const f = (1 - dist / R) * PULL;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }
        d.vx = (d.vx + ax) * 0.82;
        d.vy = (d.vy + ay) * 0.82;
        d.x += d.vx;
        d.y += d.vy;
      }

      for (let c = 0; c < cols.length; c++) {
        for (let rIdx = 0; rIdx < cols[c].length; rIdx++) {
          const d = cols[c][rIdx];
          const right = cols[c + 1] && cols[c + 1][rIdx];
          const down = cols[c][rIdx + 1];
          const prox = mouse.active
            ? Math.max(
                0,
                1 - Math.sqrt((mouse.x - d.x) ** 2 + (mouse.y - d.y) ** 2) / R
              )
            : 0;
          if (right) {
            ctx.globalAlpha = 0.06 + prox * 0.7;
            ctx.strokeStyle = THEME.lineColor;
            ctx.lineWidth = 0.5 + prox * 1.5;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }
          if (down) {
            ctx.globalAlpha = 0.06 + prox * 0.7;
            ctx.strokeStyle = THEME.lineColor;
            ctx.lineWidth = 0.5 + prox * 1.5;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(down.x, down.y);
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        const prox = mouse.active
          ? Math.max(
              0,
              1 - Math.sqrt((mouse.x - d.x) ** 2 + (mouse.y - d.y) ** 2) / R
            )
          : 0;
        ctx.globalAlpha = 0.22 + prox * 0.78;
        ctx.fillStyle = THEME.dotColor;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.8 + prox * 2.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (SHOW_TRAIL) {
        const now = performance.now();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < trailPts.length; i++) {
          const a = trailPts[i - 1];
          const b = trailPts[i];
          const age = now - b.t;
          if (age > 260) continue;
          ctx.globalAlpha = Math.max(0, 1 - age / 260) * 0.85;
          ctx.strokeStyle = THEME.trailColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
      host.removeEventListener("touchmove", onTouch);
      host.removeEventListener("touchend", onLeave);
    };
  }

  function mount() {
    const hosts = document.querySelectorAll(
      ".page-hero, .section-dark, .cta-band, .site-footer"
    );
    hosts.forEach((host) => {
      if (host.classList.contains("kinetic-host")) return; // avoid double-mount
      host.classList.add("kinetic-host");
      const canvas = document.createElement("canvas");
      canvas.className = "kinetic-grid-canvas";
      host.insertBefore(canvas, host.firstChild);
      initGrid(host, canvas);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
