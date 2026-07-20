// ============ Expanding feature cards ============
// Desktop: cards expand into columns. Mobile: cards expand into rows.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expanding-cards').forEach(initExpandingCards);
});

function initExpandingCards(list) {
  const cards = Array.from(list.querySelectorAll('.expanding-card'));
  if (!cards.length) return;

  let activeIndex = 0;
  let isDesktop = window.innerWidth >= 768;

  function render() {
    const template = cards.map((_, i) => (i === activeIndex ? '5fr' : '1fr')).join(' ');
    if (isDesktop) {
      list.style.gridTemplateColumns = template;
      list.style.gridTemplateRows = '1fr';
    } else {
      list.style.gridTemplateRows = template;
      list.style.gridTemplateColumns = '1fr';
    }
    cards.forEach((card, i) => {
      card.setAttribute('data-active', i === activeIndex ? 'true' : 'false');
    });
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    render();
  }

  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => setActive(i));
    card.addEventListener('focus', () => setActive(i));
    card.addEventListener('click', () => setActive(i));
    card.setAttribute('tabindex', '0');
  });

  window.addEventListener('resize', () => {
    const nowDesktop = window.innerWidth >= 768;
    if (nowDesktop !== isDesktop) {
      isDesktop = nowDesktop;
      render();
    }
  });

  render();
}
