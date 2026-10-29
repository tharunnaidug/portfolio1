(() => {
  const tooltip = document.createElement('div');
  tooltip.className = 'calendar-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  let touchTimer;

  function show(cell, x, y) {
    tooltip.textContent = cell.dataset.tip;
    tooltip.hidden = false;
    const left = Math.min(x + 12, window.innerWidth - tooltip.offsetWidth - 10);
    const top = Math.max(8, Math.min(y + 14, window.innerHeight - tooltip.offsetHeight - 8));
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${top}px`;
  }

  document.addEventListener('pointerover', event => {
    const cell = event.target.closest?.('.calendar-day');
    if (cell) show(cell, event.clientX, event.clientY);
  });
  document.addEventListener('pointermove', event => {
    const cell = event.target.closest?.('.calendar-day');
    if (cell && !tooltip.hidden) show(cell, event.clientX, event.clientY);
  });
  document.addEventListener('pointerout', event => {
    if (event.target.closest?.('.calendar-day') && !event.relatedTarget?.closest?.('.calendar-day')) tooltip.hidden = true;
  });
  document.addEventListener('pointerdown', event => {
    const cell = event.target.closest?.('.calendar-day');
    if (!cell) return;
    show(cell, event.clientX, event.clientY);
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => { tooltip.hidden = true; }, 2600);
  });
  document.addEventListener('focusin', event => {
    const cell = event.target.closest?.('.calendar-day');
    if (cell) { const rect = cell.getBoundingClientRect(); show(cell, rect.left + rect.width / 2, rect.top); }
  });
  document.addEventListener('focusout', event => {
    if (event.target.closest?.('.calendar-day') && !event.relatedTarget?.closest?.('.calendar-day')) tooltip.hidden = true;
  });
})();
