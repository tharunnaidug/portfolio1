(() => {
  const USERNAME = 'tarunnaidug';
  const ENDPOINT = `https://leetcode-stats.tashif.codes/${USERNAME}/heatmap?view=last_365`;
  const COLORS = ['#191919', '#123d2b', '#17643c', '#239a58', '#57d68d'];
  const state = document.getElementById('leetcode-state');
  const frame = document.getElementById('leetcode-frame');
  const legend = document.getElementById('leetcode-legend');
  const stats = document.getElementById('leetcode-stats');
  const source = document.getElementById('leetcode-source');
  if (!state || !frame) return;
  function validate(payload) {
    const data = payload?.data ?? payload;
    let days = data?.dailyContributions;
    if ((payload?.status && payload.status !== 'success') || data?.username !== USERNAME || !Array.isArray(days) || days.length !== 365) throw new Error('Invalid or incomplete activity data');
    let previous = '';
    for (const day of days) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4) throw new Error('Invalid activity day');
      const date = new Date(`${day.date}T00:00:00Z`);
      if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== day.date || (previous && date.valueOf() - Date.parse(`${previous}T00:00:00Z`) !== 86400000)) throw new Error('Activity dates are not contiguous');
      previous = day.date;
    }
    if (data.startDate !== days[0].date || data.endDate !== days[days.length - 1].date) throw new Error('Activity date range does not match');
    const sourceTotal = days.reduce((sum, day) => sum + day.count, 0);
    if (!data.stats || data.stats.totalSubmissions !== sourceTotal || !Number.isInteger(data.stats.activeDays) || !Number.isInteger(data.stats.currentStreak) || !Number.isInteger(data.stats.longestStreak)) throw new Error('Activity statistics are invalid');
    let summary = data.stats;
    if (!data.countNormalization) {
      if (sourceTotal % 2 || days.some(day => day.count % 2)) throw new Error('LeetCode count normalization could not be verified');
      days = days.map(day => ({ ...day, count: day.count / 2 }));
      summary = { ...data.stats, totalSubmissions: sourceTotal / 2 };
    }
    return { days, stats: summary, updatedAt: data.updatedAt };
  }

  function render({ days, stats: summary, updatedAt }, label) {
    const cell = 11, gap = 3, top = 20, left = 27, columns = 53, rows = 7;
    const width = left + columns * (cell + gap), height = top + rows * (cell + gap) + 3;
    const start = new Date(`${days[0].date}T00:00:00Z`);
    const offset = (start.getUTCDay() + 6) % 7;
    const firstMonth = days[0].date.slice(0, 7);
    const firstMonthDays = days.filter(day => day.date.slice(0, 7) === firstMonth).length;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'calendar-svg'); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `LeetCode submissions for ${days.length} days`);
    ['Mon', 'Wed', 'Fri'].forEach((name, rowIndex) => {
      const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', '0'); text.setAttribute('y', String(top + (rowIndex * 2 + 1) * (cell + gap) - 2)); text.setAttribute('class', 'calendar-weekday'); text.textContent = name; svg.append(text);
    });
    let lastMonth = '';
    days.forEach((day, index) => {
      const date = new Date(`${day.date}T00:00:00Z`), col = Math.floor((index + offset) / 7), row = (index + offset) % 7;
      const month = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
      const skipTinyLeadingMonth = index === 0 && firstMonthDays < 4;
      if ((date.getUTCDate() === 1 || index === 0) && !skipTinyLeadingMonth) {
        if (month !== lastMonth) { const labelNode = document.createElementNS(svg.namespaceURI, 'text'); labelNode.setAttribute('x', String(left + col * (cell + gap))); labelNode.setAttribute('y', '11'); labelNode.setAttribute('class', 'calendar-month'); labelNode.textContent = month; svg.append(labelNode); lastMonth = month; }
      }
      const rect = document.createElementNS(svg.namespaceURI, 'rect'); rect.setAttribute('x', String(left + col * (cell + gap))); rect.setAttribute('y', String(top + row * (cell + gap))); rect.setAttribute('width', String(cell)); rect.setAttribute('height', String(cell)); rect.setAttribute('rx', '2'); rect.setAttribute('fill', COLORS[day.level]); rect.setAttribute('class', 'calendar-day'); rect.setAttribute('tabindex', '0'); rect.setAttribute('role', 'img'); rect.setAttribute('aria-label', `${day.date}: ${day.count} submissions`); rect.setAttribute('data-tip', `${day.date}: ${day.count} ${day.count === 1 ? 'submission' : 'submissions'}`);
      const title = document.createElementNS(svg.namespaceURI, 'title'); title.textContent = rect.getAttribute('data-tip'); rect.append(title); svg.append(rect);
    });
    frame.replaceChildren(svg); frame.hidden = false; frame.setAttribute('aria-busy', 'false');
    state.hidden = true; legend.hidden = false;
    stats.hidden = false; stats.textContent = `${summary.totalSubmissions.toLocaleString()} submissions · ${summary.activeDays} active days · ${summary.currentStreak} day current streak · ${summary.longestStreak} day longest streak`;
    source.hidden = false; source.textContent = `${label}${updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleString()}` : ''}`;
  }

  async function getJson(url, timeout = 8000) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
    try { const response = await fetch(url, { signal: controller.signal, cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.json(); }
    finally { clearTimeout(timer); }
  }

  (async () => {
    try { render(validate(await getJson(ENDPOINT)), 'Live LeetCode activity'); }
    catch (liveError) {
      try { render(validate(await getJson('./activity/leetcode.json')), 'Cached activity snapshot'); }
      catch (snapshotError) {
        frame.hidden = true; frame.setAttribute('aria-busy', 'false'); state.className = 'leetcode-error'; state.hidden = false;
        state.textContent = 'LeetCode activity is temporarily unavailable. ';
        const link = document.createElement('a'); link.href = `https://leetcode.com/u/${USERNAME}/`; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Open profile ↗'; state.append(link);
      }
    }
  })();
})();
