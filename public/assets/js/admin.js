(function () {
  const WORKBOOKS = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'],
    ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'], ['year10', 'Year 10 NZ'], ['year11', 'Year 11 NZ'],
    ['year12', 'Year 12 NZ (NCEA Level 2)'], ['year13', 'Year 13 NZ (NCEA Level 3)']
  ];
  const status = document.getElementById('admin-status');
  const usersList = document.getElementById('users-list');

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

  async function loadUsers() {
    const result = await request('/api/admin/users');
    usersList.replaceChildren();
    result.users.forEach(function (user) {
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

      const reset = document.createElement('form');
      reset.className = 'reset-row';
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
      card.append(top, access, actions, reset);
      usersList.appendChild(card);
    });
    if (!result.users.length) usersList.textContent = 'No accounts have been created yet.';
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

  request('/api/auth/me').then(function (result) {
    if (!result.authenticated || result.user.role !== 'admin') {
      window.location.replace('/'); return;
    }
    return loadUsers();
  }).catch(function (error) { setStatus(error.message, false); });
})();
