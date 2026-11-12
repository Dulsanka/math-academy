(function () {
  const WORKBOOKS = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'],
    ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'], ['year10', 'Year 10 NZ'], ['year11', 'Year 11 NZ'],
    ['year12', 'Year 12 NZ (NCEA Level 2)'], ['year13', 'Year 13 NZ (NCEA Level 3)']
  ];
  const status = document.getElementById('admin-status');
  const usersList = document.getElementById('users-list');
  const pendingList = document.getElementById('pending-users');

  async function request(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }

  function setStatus(message, success) {
    status.textContent = message || '';
    status.classList.toggle('success', Boolean(success));
  }

  function makeEntitlementInputs(container, selected, prefix) {
    container.replaceChildren();
    WORKBOOKS.forEach(function (entry) {
      const label = document.createElement('label');
      label.className = 'check-label';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = entry[0];
      input.name = prefix;
      input.checked = selected.includes(entry[0]);
      label.append(input, document.createTextNode(entry[1]));
      container.appendChild(label);
    });
  }

  function checkedValues(container) {
    return Array.from(container.querySelectorAll('input:checked')).map(function (input) { return input.value; });
  }

  function addProfileDetail(container, label, value) {
    if (!value) return;
    const item = document.createElement('p'); item.className = 'profile-detail';
    const strong = document.createElement('strong'); strong.textContent = label + ': ';
    item.append(strong, document.createTextNode(value)); container.appendChild(item);
  }

  function renderPending(users) {
    const pending = users.filter(function (user) { return user.approvalStatus === 'pending'; });
    document.getElementById('pending-count').textContent = String(pending.length);
    pendingList.replaceChildren();
    pending.forEach(function (user) {
      const card = document.createElement('article'); card.className = 'user-card pending-card';
      const heading = document.createElement('h3'); heading.textContent = (user.firstName + ' ' + user.surname).trim() + ' — ' + user.username;
      card.appendChild(heading);
      addProfileDetail(card, 'Email', user.email); addProfileDetail(card, 'Date of birth', user.dateOfBirth);
      addProfileDetail(card, 'Address', user.address); addProfileDetail(card, 'School year', user.schoolYear);
      addProfileDetail(card, 'Parent or guardian', user.parentName ? user.parentName + ' (' + user.parentEmail + ')' : 'Not required');
      const requested = document.createElement('p'); requested.className = 'profile-detail'; requested.textContent = 'Requested: ' + user.requestedEntitlements.map(function (key) { const match = WORKBOOKS.find(function (entry) { return entry[0] === key; }); return match ? match[1] : key; }).join(', '); card.appendChild(requested);
      const access = document.createElement('div'); access.className = 'entitlement-grid'; makeEntitlementInputs(access, user.requestedEntitlements, 'grant-' + user.id); card.appendChild(access);
      const actions = document.createElement('div'); actions.className = 'user-actions';
      const approve = document.createElement('button'); approve.type = 'button'; approve.textContent = 'Approve selected access';
      approve.addEventListener('click', async function () {
        const entitlements = checkedValues(access); if (!entitlements.length) { setStatus('Choose at least one workbook to grant.', false); return; }
        approve.disabled = true;
        try { await request('/api/admin/registrations/' + encodeURIComponent(user.id) + '/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entitlements: entitlements }) }); setStatus('Approved ' + user.username + ' and sent the access email.', true); await loadUsers(); }
        catch (error) { setStatus(error.message, false); await loadUsers().catch(function () {}); }
        finally { approve.disabled = false; }
      });
      const decline = document.createElement('button'); decline.type = 'button'; decline.className = 'danger'; decline.textContent = 'Decline and delete';
      decline.addEventListener('click', async function () {
        if (!window.confirm('Decline this application and permanently delete its profile?')) return;
        decline.disabled = true;
        try { await request('/api/admin/registrations/' + encodeURIComponent(user.id), { method: 'DELETE' }); setStatus('Declined application and deleted its profile.', true); await loadUsers(); }
        catch (error) { setStatus(error.message, false); }
        finally { decline.disabled = false; }
      });
      actions.append(approve, decline); card.appendChild(actions); pendingList.appendChild(card);
    });
    if (!pending.length) pendingList.textContent = 'There are no registrations waiting for review.';
  }

  async function loadUsers() {
    const result = await request('/api/admin/users');
    renderPending(result.users);
    usersList.replaceChildren();
    result.users.filter(function (user) { return user.approvalStatus !== 'pending'; }).forEach(function (user) {
      const card = document.createElement('article');
      card.className = 'user-card';
      const top = document.createElement('div');
      top.className = 'user-top';
      const name = document.createElement('div');
      name.innerHTML = '<span class="user-name"></span><span class="user-role"></span>';
      name.querySelector('.user-name').textContent = user.username;
      name.querySelector('.user-role').textContent = user.role;
      const activeLabel = document.createElement('label');
      activeLabel.className = 'active-toggle';
      const active = document.createElement('input');
      active.type = 'checkbox';
      active.checked = user.active;
      activeLabel.append(active, document.createTextNode('Account enabled'));
      top.append(name, activeLabel);

      const emailForm = document.createElement('form'); emailForm.className = 'email-row'; emailForm.innerHTML = '<label>Account email<input type="email" maxlength="254" required autocomplete="email"></label><button type="submit" class="secondary">Update email</button>';
      emailForm.querySelector('input').value = user.email || '';
      emailForm.addEventListener('submit', async function (event) {
        event.preventDefault(); const button = emailForm.querySelector('button'); button.disabled = true;
        try { await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailForm.querySelector('input').value.trim() }) }); setStatus('Updated email for ' + user.username + '.', true); await loadUsers(); }
        catch (error) { setStatus(error.message, false); }
        finally { button.disabled = false; }
      });

      const access = document.createElement('div');
      access.className = 'entitlement-grid';
      makeEntitlementInputs(access, user.entitlements, 'entitlement-' + user.id);
      const actions = document.createElement('div');
      actions.className = 'user-actions';
      const save = document.createElement('button');
      save.type = 'button'; save.textContent = 'Save access';
      save.addEventListener('click', async function () {
        save.disabled = true;
        try {
          await request('/api/admin/users/' + encodeURIComponent(user.id), {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entitlements: checkedValues(access), active: active.checked })
          });
          setStatus('Updated access for ' + user.username + '.', true);
        } catch (error) { setStatus(error.message, false); }
        finally { save.disabled = false; }
      });
      actions.appendChild(save);
      if (user.email) {
        const notify = document.createElement('button'); notify.type = 'button'; notify.className = 'secondary'; notify.textContent = 'Send approval email';
        notify.addEventListener('click', async function () {
          notify.disabled = true;
          try { await request('/api/admin/users/' + encodeURIComponent(user.id) + '/approval-email', { method: 'POST' }); setStatus('Sent the access email to ' + user.username + '.', true); }
          catch (error) { setStatus(error.message, false); }
          finally { notify.disabled = false; }
        });
        actions.appendChild(notify);
      }

      const reset = document.createElement('form');
      reset.className = 'reset-row';
      reset.method = 'post';
      reset.innerHTML = '<label>Set new password<input type="password" minlength="12" autocomplete="new-password" required /></label><button type="submit" class="secondary">Reset password</button>';
      reset.addEventListener('submit', async function (event) {
        event.preventDefault();
        const passwordInput = reset.querySelector('input');
        const button = reset.querySelector('button');
        button.disabled = true;
        try {
          await request('/api/admin/users/' + encodeURIComponent(user.id) + '/password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: passwordInput.value })
          });
          reset.reset(); setStatus('Password reset. ' + user.username + ' will need to sign in again.', true);
        } catch (error) { setStatus(error.message, false); }
        finally { button.disabled = false; }
      });
      card.append(top, emailForm, access, actions, reset);
      usersList.appendChild(card);
    });
    if (!result.users.some(function (user) { return user.approvalStatus !== 'pending'; })) usersList.textContent = 'No approved accounts have been created yet.';
  }

  makeEntitlementInputs(document.querySelector('[data-entitlements]'), [], 'new-entitlement');
  document.getElementById('create-user-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const result = await request('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.value.trim(), password: form.password.value, entitlements: checkedValues(form.querySelector('[data-entitlements]')) })
      });
      form.reset();
      makeEntitlementInputs(form.querySelector('[data-entitlements]'), [], 'new-entitlement');
      setStatus('Created account ' + result.user.username + '.', true);
      await loadUsers();
    } catch (error) { setStatus(error.message, false); }
    finally { button.disabled = false; }
  });

  document.getElementById('refresh-users').addEventListener('click', function () {
    loadUsers().then(function () { setStatus('', true); }).catch(function (error) { setStatus(error.message, false); });
  });
  document.getElementById('refresh-users-pending').addEventListener('click', function () {
    loadUsers().then(function () { setStatus('', true); }).catch(function (error) { setStatus(error.message, false); });
  });

  request('/api/auth/me').then(function (result) {
    if (!result.authenticated || result.user.role !== 'admin') {
      window.location.replace('/'); return;
    }
    return loadUsers();
  }).catch(function (error) { setStatus(error.message, false); });
})();
