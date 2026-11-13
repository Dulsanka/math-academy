(function () {
  const WORKBOOKS = [['arithmetic','Arithmetic & Division'],['year6','Year 6 NZ'],['year7','Year 7 NZ'],['year8','Year 8 NZ'],['year9','Year 9 NZ'],['year10','Year 10 NZ'],['year11','Year 11 NZ'],['year12','Year 12 NZ'],['year13','Year 13 NZ']];
  const list = document.getElementById('children-list');
  const status = document.getElementById('parent-status');
  const addForm = document.getElementById('add-child-form');
  let dashboardChildren = [];

  async function request(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'Request could not be completed.');
    return data;
  }

  function setStatus(message, success) {
    status.textContent = message || '';
    status.classList.toggle('success', Boolean(success));
  }

  function displayName(child) {
    return (child.firstName + ' ' + child.surname).trim() || child.username || 'Child';
  }

  function topicTotals(sessions) {
    const topics = new Map();
    sessions.forEach(function (session) {
      (session.topics || []).forEach(function (topic) {
        const entry = topics.get(topic.name) || { name: topic.name, total: 0, completed: 0, errors: 0, sessions: 0, children: new Set() };
        entry.total += topic.totalQuestions;
        entry.completed += topic.completedQuestions;
        entry.errors += topic.errorCount;
        entry.sessions += 1;
        if (session.childName) entry.children.add(session.childName);
        topics.set(topic.name, entry);
      });
    });
    return Array.from(topics.values());
  }

  function selectedData() {
    const childId = document.getElementById('filter-child').value;
    const workbook = document.getElementById('filter-workbook').value;
    const days = Number(document.getElementById('filter-period').value) || 0;
    const search = document.getElementById('filter-topic').value.trim().toLowerCase();
    const since = days ? Date.now() - days * 86400000 : 0;
    const children = dashboardChildren.filter(function (child) { return childId === 'all' || child.id === childId; });
    const sessions = children.flatMap(function (child) {
      return (child.sessions || []).filter(function (item) {
        return (!workbook || workbook === 'all' || item.workbookKey === workbook) && item.lastActivity >= since &&
          (!search || item.title.toLowerCase().includes(search) || (item.topics || []).some(function (topic) { return topic.name.toLowerCase().includes(search); }));
      }).map(function (item) { return Object.assign({ childId: child.id, childName: displayName(child) }, item); });
    }).sort(function (a, b) { return b.lastActivity - a.lastActivity; });
    return { children: children, sessions: sessions };
  }

  function metric(labelText, valueText, hintText, icon) {
    const card = document.createElement('article'); card.className = 'metric-card';
    const top = document.createElement('div'); top.className = 'metric-top';
    const iconNode = document.createElement('span'); iconNode.className = 'metric-icon'; iconNode.setAttribute('aria-hidden', 'true'); iconNode.textContent = icon;
    const label = document.createElement('span'); label.textContent = labelText; top.append(iconNode, label);
    const value = document.createElement('strong'); value.textContent = valueText;
    const hint = document.createElement('small'); hint.textContent = hintText;
    card.append(top, value, hint); return card;
  }

  function formatTime(seconds) {
    return Math.floor(seconds / 3600) + 'h ' + Math.floor(seconds % 3600 / 60) + 'm';
  }

  function renderSummary(children, sessions) {
    const box = document.getElementById('dashboard-summary'); box.replaceChildren();
    const totals = sessions.reduce(function (sum, item) {
      sum.completed += item.completedQuestions; sum.total += item.totalQuestions; sum.seconds += item.elapsedSeconds; sum.errors += item.errorCount;
      return sum;
    }, { completed: 0, total: 0, seconds: 0, errors: 0 });
    const activeDays = new Set(sessions.map(function (item) { return new Date(item.lastActivity).toLocaleDateString(); })).size;
    const completion = totals.total ? Math.round(100 * totals.completed / totals.total) : 0;
    box.append(
      metric('Children', String(children.length), 'In this dashboard view', '👨‍👩‍👧'),
      metric('Questions completed', String(totals.completed), 'Across ' + totals.total + ' recorded questions', '✓'),
      metric('Completion rate', completion + '%', 'Completed ÷ recorded questions; not an accuracy score', '◔'),
      metric('Practice time', formatTime(totals.seconds), 'Time recorded in workbook sessions', '◷'),
      metric('Practice sessions', String(sessions.length), 'Matching the filters above', '▤'),
      metric('Active days', String(activeDays), 'Days with at least one saved session', '✦')
    );
  }

  function renderChildOverview(children, sessions) {
    const box = document.getElementById('child-overview'); box.replaceChildren();
    if (!children.length) { box.textContent = 'No child profiles are linked to this parent account yet.'; return; }
    children.forEach(function (child) {
      const rows = sessions.filter(function (item) { return item.childId === child.id; });
      const completed = rows.reduce(function (sum, item) { return sum + item.completedQuestions; }, 0);
      const total = rows.reduce(function (sum, item) { return sum + item.totalQuestions; }, 0);
      const seconds = rows.reduce(function (sum, item) { return sum + item.elapsedSeconds; }, 0);
      const rate = total ? Math.round(100 * completed / total) : 0;
      const card = document.createElement('article'); card.className = 'child-snapshot';
      const head = document.createElement('div'); head.className = 'snapshot-head';
      const avatar = document.createElement('span'); avatar.className = 'child-avatar'; avatar.textContent = (displayName(child).match(/[A-Za-zÀ-ÿ]/) || ['?'])[0].toUpperCase();
      const nameWrap = document.createElement('div');
      const name = document.createElement('h4'); name.textContent = displayName(child);
      const year = document.createElement('p'); year.textContent = child.schoolYear || 'School year not set'; nameWrap.append(name, year);
      const state = document.createElement('span'); state.className = 'status-pill' + (child.approvalStatus === 'approved' ? ' approved' : '');
      state.textContent = child.active === false ? 'Sign-in disabled' : child.approvalStatus === 'approved' ? 'Account approved' : 'Awaiting admin approval';
      head.append(avatar, nameWrap, state);
      const barLabel = document.createElement('div'); barLabel.className = 'snapshot-progress-label';
      const progressLabel = document.createElement('span'); progressLabel.textContent = 'Recorded question completion';
      const progressValue = document.createElement('strong'); progressValue.textContent = total ? rate + '%' : 'No data'; barLabel.append(progressLabel, progressValue);
      const bar = document.createElement('progress'); bar.max = 100; bar.value = rate; bar.setAttribute('aria-label', displayName(child) + ' recorded question completion');
      const detail = document.createElement('div'); detail.className = 'snapshot-stats';
      [[String(rows.length), 'sessions'], [String(completed), 'questions completed'], [formatTime(seconds), 'practice time']].forEach(function (pair) {
        const stat = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = pair[0]; const small = document.createElement('span'); small.textContent = pair[1]; stat.append(strong, small); detail.appendChild(stat);
      });
      const workbookInfo = document.createElement('p'); workbookInfo.className = 'snapshot-workbooks';
      const granted = child.entitlements || [];
      workbookInfo.textContent = granted.length ? granted.map(function (key) { const match = WORKBOOKS.find(function (item) { return item[0] === key; }); return match ? match[1] : key; }).join(' · ') : 'No workbooks granted yet';
      card.append(head, barLabel, bar, detail, workbookInfo); box.appendChild(card);
    });
  }

  function renderWeeklyChart(sessions) {
    const container = document.getElementById('weekly-chart'); container.replaceChildren();
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg'); svg.setAttribute('viewBox', '0 0 620 230'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Bar chart of questions completed per week over the last eight weeks');
    const now = new Date(); const mondayOffset = (now.getUTCDay() + 6) % 7;
    const currentMonday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset);
    const weekMs = 7 * 86400000; const counts = Array(8).fill(0);
    sessions.forEach(function (item) {
      const activity = new Date(item.lastActivity);
      const activityMonday = Date.UTC(activity.getUTCFullYear(), activity.getUTCMonth(), activity.getUTCDate() - (activity.getUTCDay() + 6) % 7);
      const age = Math.floor((currentMonday - activityMonday) / weekMs);
      const bucket = 7 - age;
      if (bucket >= 0 && bucket < 8) counts[bucket] += item.completedQuestions;
    });
    const max = Math.max(1, ...counts); const baseline = 178; const left = 48; const step = 70; const barWidth = 34;
    [0, 0.5, 1].forEach(function (fraction) {
      const y = baseline - fraction * 130; const line = document.createElementNS(svgNs, 'line'); line.setAttribute('x1', String(left - 8)); line.setAttribute('x2', '600'); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'chart-gridline'); svg.appendChild(line);
      const label = document.createElementNS(svgNs, 'text'); label.setAttribute('x', '5'); label.setAttribute('y', String(y + 4)); label.setAttribute('class', 'chart-axis-label'); label.textContent = String(Math.round(max * fraction)); svg.appendChild(label);
    });
    counts.forEach(function (value, index) {
      const height = value ? Math.max(4, value / max * 130) : 2; const x = left + index * step; const y = baseline - height;
      const rect = document.createElementNS(svgNs, 'rect'); rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(barWidth)); rect.setAttribute('height', String(height)); rect.setAttribute('rx', '8'); rect.setAttribute('class', value ? 'chart-bar' : 'chart-bar empty');
      const title = document.createElementNS(svgNs, 'title'); title.textContent = value + ' questions completed'; rect.appendChild(title); svg.appendChild(rect);
      const valueLabel = document.createElementNS(svgNs, 'text'); valueLabel.setAttribute('x', String(x + barWidth / 2)); valueLabel.setAttribute('y', String(Math.max(23, y - 8))); valueLabel.setAttribute('text-anchor', 'middle'); valueLabel.setAttribute('class', 'chart-value-label'); valueLabel.textContent = String(value); svg.appendChild(valueLabel);
      const weekStart = new Date(currentMonday - (7 - index) * weekMs); const weekLabel = document.createElementNS(svgNs, 'text'); weekLabel.setAttribute('x', String(x + barWidth / 2)); weekLabel.setAttribute('y', '202'); weekLabel.setAttribute('text-anchor', 'middle'); weekLabel.setAttribute('class', 'chart-axis-label'); weekLabel.textContent = weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }); svg.appendChild(weekLabel);
    });
    container.appendChild(svg);
    const text = document.createElement('p'); text.className = 'chart-summary';
    const total = counts.reduce(function (sum, count) { return sum + count; }, 0);
    text.textContent = total ? total + ' questions completed in the displayed weeks. A zero may mean no saved session for that week.' : 'No sessions with completed questions match this view yet.';
    container.appendChild(text);
  }

  function renderCoach(children, sessions) {
    const box = document.getElementById('coach-insight'); box.replaceChildren();
    if (!sessions.length) {
      const p = document.createElement('p'); p.textContent = 'There is not enough matching practice data to suggest a next step yet. After a child completes a workbook session, this panel will offer a small, practical idea.'; box.appendChild(p); return;
    }
    const childSessions = children.map(function (child) {
      return { child: child, sessions: sessions.filter(function (session) { return session.childId === child.id; }) };
    }).filter(function (item) { return item.sessions.length; });
    childSessions.forEach(function (item) {
      const childTopics = topicTotals(item.sessions).filter(function (topic) { return topic.total >= 8 && topic.sessions >= 2; });
      const best = childTopics.slice().sort(function (a, b) { return (b.completed / b.total) - (a.completed / a.total); })[0];
      const needsSupport = childTopics.filter(function (topic) { return topic.completed / topic.total < 0.5; }).sort(function (a, b) { return (a.completed / a.total) - (b.completed / b.total); })[0];
      let message; let action;
      if (needsSupport) {
        message = 'The saved sessions show a lower question-completion rate in ' + needsSupport.name + ' (' + Math.round(100 * needsSupport.completed / needsSupport.total) + '% across ' + needsSupport.sessions + ' topic records). The data cannot tell whether this reflects difficulty, pacing, or interruptions.';
        action = 'Try one worked example together, then invite your child to choose a single step to practise. Ask what felt clear and what felt confusing.';
      } else if (best) {
        message = 'In ' + best.name + ', ' + displayName(item.child) + ' completed ' + Math.round(100 * best.completed / best.total) + '% of the questions recorded across ' + best.sessions + ' topic records. This is a sign of practice follow-through, not a measure of mastery.';
        action = 'Celebrate the strategy or persistence you noticed. Ask your child to explain one solution, then choose a small next challenge together.';
      } else {
        message = 'There are ' + item.sessions.length + ' saved sessions for ' + displayName(item.child) + ', but not enough repeated topic activity to identify a reliable pattern yet.';
        action = 'Keep sessions short and regular. Afterwards, ask which part felt easiest and which part they would like to practise next.';
      }
      const card = document.createElement('article'); card.className = 'coach-child-insight';
      const heading = document.createElement('h4'); heading.textContent = 'For ' + displayName(item.child);
      const summary = document.createElement('p'); summary.textContent = message;
      const suggestion = document.createElement('p'); suggestion.className = 'coach-action'; suggestion.textContent = 'Try together: ' + action;
      card.append(heading, summary, suggestion); box.appendChild(card);
    });
  }

  function renderTopics(sessions) {
    const topicBox = document.getElementById('topic-overview'); topicBox.replaceChildren();
    const topics = topicTotals(sessions).sort(function (a, b) { return (b.completed / Math.max(1, b.total)) - (a.completed / Math.max(1, a.total)); });
    topics.forEach(function (topic) {
      const rate = Math.round(100 * topic.completed / Math.max(1, topic.total));
      const enoughEvidence = topic.total >= 8 && topic.sessions >= 2;
      const category = enoughEvidence && rate >= 75 ? 'strength' : enoughEvidence && rate < 50 ? 'practice' : 'developing';
      const row = document.createElement('article'); row.className = 'topic-row';
      const head = document.createElement('div'); head.className = 'topic-row-head';
      const name = document.createElement('strong'); name.textContent = topic.name;
      const pct = document.createElement('span'); pct.textContent = rate + '% completed'; head.append(name, pct);
      const bar = document.createElement('progress'); bar.max = 100; bar.value = rate; bar.setAttribute('aria-label', topic.name + ' question completion rate');
      const detail = document.createElement('small'); detail.textContent = topic.completed + ' of ' + topic.total + ' questions completed · ' + topic.errors + ' recorded errors · ' + topic.sessions + ' topic records';
      const badge = document.createElement('span'); badge.className = 'topic-indicator ' + category;
      badge.textContent = category === 'strength' ? 'Practice follow-through' : category === 'practice' ? 'Consider a guided revisit' : 'Developing evidence';
      row.append(head, bar, detail, badge); topicBox.appendChild(row);
    });
    if (!topics.length) topicBox.textContent = 'Progress will appear after a child signs in and practises an enabled workbook.';
  }

  function renderActivity(sessions) {
    const activity = document.getElementById('practice-activity'); activity.replaceChildren();
    sessions.slice(0, 40).forEach(function (item) {
      const row = document.createElement('article'); row.className = 'activity-row';
      const title = document.createElement('strong'); title.textContent = item.childName + ' · ' + item.title;
      const detail = document.createElement('p'); const workbook = WORKBOOKS.find(function (entry) { return entry[0] === item.workbookKey; });
      detail.textContent = (workbook ? workbook[1] : item.workbookKey) + ' · ' + item.completedQuestions + '/' + item.totalQuestions + ' completed · ' + Math.round(item.elapsedSeconds / 60) + ' min · ' + new Date(item.lastActivity).toLocaleString();
      row.append(title, detail); activity.appendChild(row);
    });
    if (!sessions.length) activity.textContent = 'No practice sessions match these filters yet.';
  }

  function renderDashboard() {
    const data = selectedData();
    renderSummary(data.children, data.sessions);
    renderChildOverview(data.children, data.sessions);
    renderWeeklyChart(data.sessions);
    renderCoach(data.children, data.sessions);
    renderTopics(data.sessions);
    renderActivity(data.sessions);
  }

  async function loadDashboard() {
    const results = await Promise.all([request('/api/parent/dashboard'), request('/api/parent/children')]);
    const profiles = new Map((results[1].children || []).map(function (child) { return [child.id, child]; }));
    dashboardChildren = (results[0].children || []).map(function (child) { return Object.assign({}, child, profiles.get(child.id) || {}); });
    const childSelect = document.getElementById('filter-child'); const prior = childSelect.value;
    childSelect.replaceChildren(new Option('All children', 'all'));
    dashboardChildren.forEach(function (child) { childSelect.add(new Option(displayName(child), child.id)); });
    childSelect.value = dashboardChildren.some(function (child) { return child.id === prior; }) ? prior : 'all';
    renderDashboard();
  }

  function entitlementChecks(selected, prefix) {
    const box = document.createElement('div'); box.className = 'choice-grid';
    WORKBOOKS.forEach(function (entry) {
      const label = document.createElement('label'); label.className = 'choice';
      const input = document.createElement('input'); input.type = 'checkbox'; input.name = prefix; input.value = entry[0]; input.checked = selected.includes(entry[0]);
      label.append(input, document.createTextNode(entry[1])); box.appendChild(label);
    });
    return box;
  }

  function values(box) { return Array.from(box.querySelectorAll('input:checked')).map(function (input) { return input.value; }); }
  function addField(parent, title, value) {
    const item = document.createElement('p'); item.className = 'child-meta'; const strong = document.createElement('strong'); strong.textContent = title + ': ';
    item.append(strong, document.createTextNode(value || '—')); parent.appendChild(item);
  }

  function renderChild(child) {
    const card = document.createElement('article'); card.className = 'child-card';
    const heading = document.createElement('h3'); heading.textContent = displayName(child); card.appendChild(heading);
    const pill = document.createElement('span'); pill.className = 'status-pill' + (child.approvalStatus === 'approved' ? ' approved' : '') + (!child.enabled ? ' disabled' : '');
    pill.textContent = !child.enabled ? 'Disabled by parent' : child.approvalStatus !== 'approved' ? 'Waiting for admin approval' : child.accessRequestStatus === 'pending' ? 'Workbook request pending' : 'Account approved'; heading.append(' ', pill);
    addField(card, 'Username', child.username); addField(card, 'School year', child.schoolYear);
    addField(card, 'Granted workbooks', (child.entitlements || []).map(function (key) { const item = WORKBOOKS.find(function (entry) { return entry[0] === key; }); return item ? item[1] : key; }).join(', ') || 'None yet');
    const requested = entitlementChecks(child.requestedEntitlements || [], 'requested-' + child.id);
    const fieldset = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = 'Request workbook access'; const note = document.createElement('p'); note.textContent = 'Changing these selections sends a request. It does not grant access.'; fieldset.append(legend, note, requested); card.appendChild(fieldset);
    const enabledLabel = document.createElement('label'); enabledLabel.className = 'choice'; const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = child.enabled; enabledLabel.append(enabled, document.createTextNode('Child account enabled')); card.appendChild(enabledLabel);
    const actions = document.createElement('div'); actions.className = 'child-actions'; const save = document.createElement('button'); save.type = 'button'; save.className = 'primary-button'; save.textContent = 'Save requests and account status';
    save.addEventListener('click', async function () { save.disabled = true; try { await request('/api/parent/children/' + encodeURIComponent(child.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestedEntitlements: values(requested), enabled: enabled.checked }) }); setStatus('Saved ' + displayName(child) + '’s requests. Admins control the actual workbook access.', true); await Promise.all([loadChildren(), loadDashboard()]); } catch (error) { setStatus(error.message, false); } finally { save.disabled = false; } });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger-button'; remove.textContent = 'Delete child';
    remove.addEventListener('click', async function () { if (!window.confirm('Delete this child account and its sign-in? This cannot be undone.')) return; remove.disabled = true; try { await request('/api/parent/children/' + encodeURIComponent(child.id), { method: 'DELETE' }); setStatus('Child account deleted.', true); await Promise.all([loadChildren(), loadDashboard()]); } catch (error) { setStatus(error.message, false); } finally { remove.disabled = false; } });
    actions.append(save, remove); card.appendChild(actions);
    const reset = document.createElement('form'); reset.className = 'inline-form'; reset.innerHTML = '<label>Set child password<input type="password" required minlength="12" maxlength="256" autocomplete="new-password"></label><button class="secondary-button" type="submit">Reset child password</button>';
    reset.addEventListener('submit', async function (event) { event.preventDefault(); const button = reset.querySelector('button'); button.disabled = true; try { await request('/api/parent/children/' + encodeURIComponent(child.id) + '/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: reset.querySelector('input').value }) }); reset.reset(); setStatus('Child password reset. Their other sessions were ended.', true); } catch (error) { setStatus(error.message, false); } finally { button.disabled = false; } });
    card.appendChild(reset); list.appendChild(card);
  }

  async function loadChildren() {
    const data = await request('/api/parent/children'); list.replaceChildren();
    (data.children || []).forEach(renderChild);
    if (!data.children || !data.children.length) list.textContent = 'No child accounts yet. Add your first child below.';
  }

  addForm.addEventListener('submit', async function (event) {
    event.preventDefault(); const requestedEntitlements = values(document.getElementById('child-entitlements'));
    if (!requestedEntitlements.length) { setStatus('Choose at least one workbook to request.', false); return; }
    const button = addForm.querySelector('button[type="submit"]'); button.disabled = true;
    const body = { firstName: addForm.elements.firstName.value.trim(), surname: addForm.elements.surname.value.trim(), dateOfBirth: addForm.elements.dateOfBirth.value, schoolYear: addForm.elements.schoolYear.value, username: addForm.elements.username.value.trim(), password: addForm.elements.password.value, requestedEntitlements: requestedEntitlements };
    try { await request('/api/parent/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); addForm.reset(); document.querySelectorAll('#child-entitlements input').forEach(function (input) { input.checked = false; }); setStatus('Child profile created. The requested workbook access is awaiting administrator review.', true); await Promise.all([loadChildren(), loadDashboard()]); }
    catch (error) { setStatus(error.message, false); }
    finally { button.disabled = false; }
  });

  document.getElementById('refresh-children').addEventListener('click', function () { Promise.all([loadChildren(), loadDashboard()]).catch(function (error) { setStatus(error.message, false); }); });
  const workbookFilter = document.getElementById('filter-workbook');
  WORKBOOKS.forEach(function (entry) { workbookFilter.add(new Option(entry[1], entry[0])); });
  ['filter-child', 'filter-workbook', 'filter-period', 'filter-topic'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', renderDashboard);
    document.getElementById(id).addEventListener('change', renderDashboard);
  });
  document.getElementById('refresh-dashboard').addEventListener('click', function () { loadDashboard().catch(function (error) { setStatus(error.message, false); }); });
  document.getElementById('child-entitlements').replaceWith(entitlementChecks([], 'new-child-entitlement'));
  document.querySelector('#add-child-form fieldset .choice-grid').id = 'child-entitlements';

  function showParentPage() {
    const hash = (window.location.hash || '#dashboard').slice(1);
    const aliases = { 'parent-portal': 'children', 'dashboard-title': 'dashboard', 'add-child-title': 'add-child' };
    const candidate = aliases[hash] || hash;
    const allowed = ['dashboard', 'children', 'add-child'];
    const active = allowed.includes(candidate) ? candidate : 'dashboard';
    document.querySelectorAll('[data-parent-view]').forEach(function (view) { view.hidden = view.dataset.parentView !== active; });
    document.querySelectorAll('[data-parent-page]').forEach(function (link) {
      if (link.dataset.parentPage === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', showParentPage);
  showParentPage();

  request('/api/auth/me').then(function (data) {
    if (!data.authenticated || data.user.accountType !== 'parent') { window.location.replace('/'); return; }
    return Promise.all([loadChildren(), loadDashboard()]);
  }).catch(function (error) { setStatus(error.message, false); });
})();
