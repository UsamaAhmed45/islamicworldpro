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
    // Fixed widths, not fr units: with 23 panels a collapsed fr column
    // would be ~40px, too narrow for the vertical label.
    const open = isDesktop ? '420px' : '260px';
    const shut = isDesktop ? '66px' : '54px';
    const template = cards.map((_, i) => (i === activeIndex ? open : shut)).join(' ');
    list.style.gridTemplateColumns = template;
    list.style.gridTemplateRows = '1fr';
    cards.forEach((card, i) => {
      card.setAttribute('data-active', i === activeIndex ? 'true' : 'false');
    });
  }

  function scrollActiveIntoView() {
    const card = cards[activeIndex];
    if (!card) return;
    const l = list.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    if (c.left < l.left || c.right > l.right) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    render();
    scrollActiveIntoView();
  }

  cards.forEach((card, i) => {
    if (window.matchMedia('(hover:hover)').matches) card.addEventListener('mouseenter', () => setActive(i));
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
