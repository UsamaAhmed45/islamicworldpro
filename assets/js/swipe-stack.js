// About-app swipe card stack — drag the top card away to cycle to the next screenshot.
(function () {
  const TILT = 6;         // deg, base tilt magnitude for peeking cards
  const X_OFFSET = 16;     // px, base horizontal peek magnitude
  const Y_STEP = 8;        // px, vertical stack offset per card
  const SWIPE_THRESHOLD = 70; // px

  function init(stackEl) {
    const cards = Array.from(stackEl.querySelectorAll(".swipe-card"));
    if (!cards.length) return;

    let order = cards.slice(); // order[0] is the top/active card

    function layout(instant) {
      const total = order.length;
      order.forEach((card, i) => {
        const side = i % 2 === 0 ? 1 : -1; // alternate right/left so cards peek both sides
        const rotate = i === 0 ? 0 : side * (TILT + i * 1.2);
        const x = i === 0 ? 0 : side * (X_OFFSET + i * 3);
        const y = -(i * Y_STEP);
        const scale = 1 - i * 0.025;
        card.style.zIndex = String(total - i);
        if (instant) card.style.transition = "none";
        card.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`;
        card.style.opacity = "1";
        if (instant) {
          void card.offsetWidth; // force reflow
          card.style.transition = "";
        }
      });
    }

    layout(true);

    let dragging = false, startX = 0, startY = 0, curX = 0, curY = 0, activePointerId = null;

    function onPointerDown(e) {
      const top = order[0];
      if (e.currentTarget !== top) return;
      dragging = true;
      activePointerId = e.pointerId;
      top.setPointerCapture(activePointerId);
      top.classList.add("dragging");
      startX = e.clientX; startY = e.clientY;
      curX = 0; curY = 0;
      top.addEventListener("pointermove", onPointerMove);
      top.addEventListener("pointerup", onPointerUp);
      top.addEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      const top = order[0];
      curX = e.clientX - startX;
      curY = e.clientY - startY;
      const rotate = curX * 0.05;
      top.style.transform = `translate(${curX}px, ${curY}px) rotate(${rotate}deg)`;
    }

    function onPointerUp(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      dragging = false;
      const top = order[0];
      top.classList.remove("dragging");
      top.removeEventListener("pointermove", onPointerMove);
      top.removeEventListener("pointerup", onPointerUp);
      top.removeEventListener("pointercancel", onPointerUp);
      try { top.releasePointerCapture(activePointerId); } catch (err) {}

      const distance = Math.sqrt(curX * curX + curY * curY);
      if (distance > SWIPE_THRESHOLD) {
        const flownX = curX >= 0 ? 480 : -480;
        top.style.transition = "transform .35s ease-in, opacity .35s ease-in";
        top.style.transform = `translate(${flownX}px, ${curY}px) rotate(${curX * 0.12}deg)`;
        top.style.opacity = "0";
        setTimeout(() => {
          order.push(order.shift());
          layout(true);
        }, 260);
      } else {
        top.style.transition = "";
        layout(false);
      }
    }

    cards.forEach((card) => {
      card.style.touchAction = "none";
      card.addEventListener("pointerdown", onPointerDown);
    });

    window.addEventListener("resize", () => layout(true));
  }

  function boot() {
    document.querySelectorAll(".swipe-stack").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
