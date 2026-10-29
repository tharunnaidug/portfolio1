(() => {
  const USERNAME = 'tharunnaidug';
  const ENDPOINT = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
  const COLORS = ['#191919', '#123d2b', '#17643c', '#239a58', '#57d68d'];
  const state = document.getElementById('github-state');
  const frame = document.getElementById('github-frame');
  const legend = document.getElementById('github-legend');
  const stats = document.getElementById('github-stats');
  const source = document.getElementById('github-source');
  if (!state || !frame) return;

  function validate(payload) {
    if (payload?.username && payload.username !== USERNAME) throw new Error('GitHub username mismatch');
    const raw = payload?.dailyContributions ?? payload?.contributions;
    if (!Array.isArray(raw) || raw.length < 365) throw new Error('GitHub activity is incomplete');
    const days = raw.map(day => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4) throw new Error('Invalid GitHub activity day');
      const date = new Date(`${day.date}T00:00:00Z`);
      if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== day.date) throw new Error('Invalid GitHub activity date');
      return { date: day.date, count: day.count, level: day.level };
    }).sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
    for (let i = 1; i < days.length; i++) {
      const prior = Date.parse(`${days[i - 1].date}T00:00:00Z`);
      const current = Date.parse(`${days[i].date}T00:00:00Z`);
      if (current - prior !== 86400000) throw new Error('GitHub activity dates are not contiguous');
    }
    return { days, updatedAt: payload?.updatedAt };
  }

  function render({ days, updatedAt }, label) {
    const cell = 11, gap = 3, top = 20, left = 27, columns = 53;
    const height = top + 7 * (cell + gap) + 3;
    const start = new Date(`${days[0].date}T00:00:00Z`);
    const offset = (start.getUTCDay() + 6) % 7;
    const firstMonth = days[0].date.slice(0, 7);
    const firstMonthDays = days.filter(day => day.date.slice(0, 7) === firstMonth).length;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'calendar-svg'); svg.setAttribute('viewBox', `0 0 ${left + columns * (cell + gap)} ${height}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `GitHub contributions for ${days.length} days`);
    ['Mon', 'Wed', 'Fri'].forEach((labelText, rowIndex) => {
      const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', '0'); text.setAttribute('y', String(top + (rowIndex * 2 + 1) * (cell + gap) - 2)); text.setAttribute('class', 'calendar-weekday'); text.textContent = labelText; svg.append(text);
    });
    let lastMonth = '';
    days.forEach((day, index) => {
      const date = new Date(`${day.date}T00:00:00Z`), col = Math.floor((index + offset) / 7), row = (index + offset) % 7;
      const month = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
      const skipTinyLeadingMonth = index === 0 && firstMonthDays < 4;
      if ((date.getUTCDate() === 1 || index === 0) && !skipTinyLeadingMonth && month !== lastMonth) {
        const monthLabel = document.createElementNS(svg.namespaceURI, 'text'); monthLabel.setAttribute('x', String(left + col * (cell + gap))); monthLabel.setAttribute('y', '11'); monthLabel.setAttribute('class', 'calendar-month'); monthLabel.textContent = month; svg.append(monthLabel); lastMonth = month;
      }
      const rect = document.createElementNS(svg.namespaceURI, 'rect'); rect.setAttribute('x', String(left + col * (cell + gap))); rect.setAttribute('y', String(top + row * (cell + gap))); rect.setAttribute('width', String(cell)); rect.setAttribute('height', String(cell)); rect.setAttribute('rx', '2'); rect.setAttribute('fill', COLORS[day.level]); rect.setAttribute('class', 'calendar-day'); rect.setAttribute('tabindex', '0'); rect.setAttribute('role', 'img'); rect.setAttribute('aria-label', `${day.date}: ${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`); rect.setAttribute('data-tip', `${day.date}: ${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`);
      const title = document.createElementNS(svg.namespaceURI, 'title'); title.textContent = rect.getAttribute('data-tip'); rect.append(title); svg.append(rect);
    });
    frame.replaceChildren(svg); frame.hidden = false; frame.setAttribute('aria-busy', 'false');
    state.hidden = true; legend.hidden = false; stats.hidden = false;
    stats.textContent = `${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} contributions in the last 365 days`;
    source.hidden = false; source.textContent = `${label}${updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleString()}` : ''}`;
  }

  async function getJson(url) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
    try { const response = await fetch(url, { signal: controller.signal, cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.json(); }
    finally { clearTimeout(timer); }
  }

  (async () => {
    try { render(validate(await getJson(ENDPOINT)), 'Live GitHub activity'); }
    catch {
      try { render(validate(await getJson('./activity/github.json')), 'Cached activity snapshot'); }
      catch {
        frame.hidden = true; frame.setAttribute('aria-busy', 'false'); state.className = 'leetcode-error'; state.hidden = false;
        state.textContent = 'GitHub activity is temporarily unavailable. ';
        const link = document.createElement('a'); link.href = `https://github.com/${USERNAME}`; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Open profile ↗'; state.append(link);
      }
    }
  })();
})();
