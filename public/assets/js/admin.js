(function () {
  const WORKBOOKS = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'],
    ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'], ['year10', 'Year 10 NZ'], ['year11', 'Year 11 NZ'],
    ['year12', 'Year 12 NZ (NCEA Level 2)'], ['year13', 'Year 13 NZ (NCEA Level 3)']
  ];
  const status = document.getElementById('admin-status');
  const adminsList = document.getElementById('admins-list');
  const parentAccountsList = document.getElementById('parent-accounts-list');
  const pendingList = document.getElementById('pending-users');
  const progressList = document.getElementById('admin-progress');
  let cachedProgress = [];

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
    const pending = users.filter(function (user) { return user.approvalStatus === 'pending' || user.accessRequestStatus === 'pending'; });
    document.getElementById('pending-count').textContent = String(pending.length);
    pendingList.replaceChildren();
    pending.forEach(function (user) {
      const isNewApproval = user.approvalStatus === 'pending';
      const isAccessReview = !isNewApproval && user.accessRequestStatus === 'pending';
      const isParent = user.accountType === 'parent';
      const card = document.createElement('article'); card.className = 'user-card pending-card';
      const heading = document.createElement('h3'); heading.textContent = (user.firstName + ' ' + user.surname).trim() + ' - ' + user.username;
      card.appendChild(heading);
      if (user.accountType === 'child' && !user.parentId) {
        const assignment = document.createElement('div'); assignment.className = 'parent-assignment';
        const label = document.createElement('label'); label.textContent = 'Link this child to an approved parent';
        const select = document.createElement('select'); select.append(new Option('Choose parent account', ''));
        users.filter(function (item) { return item.accountType === 'parent' && item.active && item.approvalStatus === 'approved'; }).forEach(function (parent) {
          select.add(new Option((parent.firstName + ' ' + parent.surname).trim() + ' · ' + parent.username, parent.id));
        });
        label.appendChild(select); assignment.appendChild(label);
        const link = document.createElement('button'); link.type = 'button'; link.className = 'secondary'; link.textContent = 'Link child';
        link.addEventListener('click', async function () {
          if (!select.value) { setStatus('Select an approved parent first.', false); return; }
          link.disabled = true;
          try { await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: select.value }) }); setStatus('Linked child to parent. Review and approve requested workbook access next.', true); await loadUsers(); }
          catch (error) { setStatus(error.message, false); }
          finally { link.disabled = false; }
        });
        assignment.appendChild(link); card.appendChild(assignment);
      }
      addProfileDetail(card, 'Email', user.email); addProfileDetail(card, 'Date of birth', user.dateOfBirth);
      addProfileDetail(card, 'Address', user.address); addProfileDetail(card, 'School year', user.schoolYear);
      addProfileDetail(card, 'Parent or guardian', user.parentName ? user.parentName + ' (' + user.parentEmail + ')' : 'Not required');
      const requested = document.createElement('p'); requested.className = 'profile-detail';
      const requestedNames = user.requestedEntitlements.map(function (key) { const match = WORKBOOKS.find(function (entry) { return entry[0] === key; }); return match ? match[1] : key; }).join(', ');
      if (isParent && isNewApproval) requested.textContent = 'Parent account request. This account has no workbook access unless an administrator grants it separately.';
      else requested.textContent = (isAccessReview ? 'Requested workbook access changes. Current access remains active until you approve the selection: ' : 'Requested: ') + requestedNames;
      card.appendChild(requested);
      const access = document.createElement('div'); access.className = 'entitlement-grid'; makeEntitlementInputs(access, user.requestedEntitlements, 'grant-' + user.id);
      if (!isParent || isAccessReview) card.appendChild(access);
      const actions = document.createElement('div'); actions.className = 'user-actions';
      if (isParent && isNewApproval && user.email) {
        const receipt = document.createElement('button'); receipt.type = 'button'; receipt.className = 'secondary'; receipt.textContent = 'Resend registration receipt';
        receipt.addEventListener('click', async function () {
          receipt.disabled = true;
          try { await request('/api/admin/registrations/' + encodeURIComponent(user.id) + '/receipt-email', { method: 'POST' }); setStatus('Resent the family registration receipt to ' + user.email + '.', true); }
          catch (error) { setStatus(error.message, false); }
          finally { receipt.disabled = false; }
        });
        actions.appendChild(receipt);
      }
      const approve = document.createElement('button'); approve.type = 'button'; approve.textContent = isParent && isNewApproval ? 'Approve parent account' : 'Approve selected workbook access';
      approve.addEventListener('click', async function () {
        const entitlements = isParent && isNewApproval ? [] : checkedValues(access);
        if (!isParent && isNewApproval && !entitlements.length) { setStatus('Choose at least one workbook to grant.', false); return; }
        approve.disabled = true;
        try {
          await request('/api/admin/registrations/' + encodeURIComponent(user.id) + '/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entitlements: entitlements }) });
          setStatus(isParent && isNewApproval ? 'Approved parent account ' + user.username + ' and sent the email.' : 'Approved workbook access for ' + user.username + '.', true); await loadUsers();
        } catch (error) { setStatus(error.message, false); await loadUsers().catch(function () {}); }
        finally { approve.disabled = false; }
      });
      const decline = document.createElement('button'); decline.type = 'button'; decline.className = 'danger'; decline.textContent = isAccessReview ? 'Decline access request' : 'Decline and delete';
      decline.addEventListener('click', async function () {
        const prompt = isAccessReview ? 'Decline this workbook access request? The current access will remain unchanged.' : 'Decline this application and permanently delete its profile?';
        if (!window.confirm(prompt)) return;
        decline.disabled = true;
        try {
          if (isAccessReview) await request('/api/admin/registrations/' + encodeURIComponent(user.id) + '/reject-access', { method: 'POST' });
          else await request('/api/admin/registrations/' + encodeURIComponent(user.id), { method: 'DELETE' });
          setStatus(isAccessReview ? 'Declined the access request; existing access was kept.' : 'Declined application and deleted its profile.', true); await loadUsers();
        } catch (error) { setStatus(error.message, false); }
        finally { decline.disabled = false; }
      });
      actions.append(approve, decline); card.appendChild(actions); pendingList.appendChild(card);
    });
    if (!pending.length) pendingList.textContent = 'There are no registrations or access requests waiting for review.';
  }

  async function loadProgress() {
    const result = await request('/api/admin/progress'); cachedProgress = result.children || []; renderProgress();
  }
  function renderProgress() {
    const search = document.getElementById('admin-progress-search').value.trim().toLowerCase(); const workbook = document.getElementById('admin-progress-workbook').value;
    progressList.replaceChildren(); let count=0;
    cachedProgress.forEach(function(child){
      const sessions=(child.sessions||[]).filter(function(item){return workbook==='all'||item.workbookKey===workbook;});
      const label=((child.firstName+' '+child.surname)+' '+child.username+' '+child.parentName).toLowerCase();
      if(search&&!label.includes(search))return;count++;
      const card=document.createElement('article');card.className='user-card';const heading=document.createElement('h3');heading.textContent=((child.firstName+' '+child.surname).trim()||child.username)+' · '+child.schoolYear+' · Parent: '+child.parentName;card.appendChild(heading);
      if(!sessions.length){const empty=document.createElement('p');empty.textContent='No recorded practice sessions for this filter.';card.appendChild(empty);}
      sessions.slice(0,30).forEach(function(item){const row=document.createElement('p');row.className='profile-detail';const ratio=item.totalQuestions?Math.round(100*item.completedQuestions/item.totalQuestions):0;row.textContent=item.title+' · '+item.workbookKey+' · '+item.completedQuestions+'/'+item.totalQuestions+' ('+ratio+'%) · '+Math.round(item.elapsedSeconds/60)+' min · '+new Date(item.lastActivity).toLocaleString();card.appendChild(row);});
      progressList.appendChild(card);
    });
    if(!count)progressList.textContent='No child accounts match this filter.';
  }

  function actionButton(label, className, handler) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = className || 'secondary';
    button.addEventListener('click', async function () { button.disabled = true; try { await handler(); } catch (error) { setStatus(error.message, false); } finally { button.disabled = false; } }); return button;
  }

  function passwordResetForm(user) {
    const form = document.createElement('form'); form.className = 'reset-row';
    const label = document.createElement('label'); label.textContent = 'Set a new password';
    const input = document.createElement('input'); input.type = 'password'; input.minLength = 12; input.maxLength = 256; input.required = true; input.autocomplete = 'new-password';
    const button = document.createElement('button'); button.type = 'submit'; button.className = 'secondary'; button.textContent = 'Reset password';
    label.appendChild(input); form.append(label, button);
    form.addEventListener('submit', async function (event) { event.preventDefault(); button.disabled = true; try { await request('/api/admin/users/' + encodeURIComponent(user.id) + '/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: input.value }) }); form.reset(); setStatus('Password reset for ' + user.username + '; their active sessions were cleared.', true); } catch (error) { setStatus(error.message, false); } finally { button.disabled = false; } });
    return form;
  }

  function emailEditForm(user) {
    const form = document.createElement('form'); form.className = 'email-row';
    const label = document.createElement('label'); label.textContent = 'Email';
    const input = document.createElement('input'); input.type = 'email'; input.maxLength = 254; input.required = true; input.autocomplete = 'email'; input.value = user.email || '';
    const button = document.createElement('button'); button.type = 'submit'; button.className = 'secondary'; button.textContent = 'Save email'; label.appendChild(input); form.append(label, button);
    form.addEventListener('submit', async function (event) { event.preventDefault(); button.disabled = true; try { await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value.trim() }) }); setStatus('Updated email for ' + user.username + '.', true); await loadUsers(); } catch (error) { setStatus(error.message, false); } finally { button.disabled = false; } });
    return form;
  }

  function renderAdmins(users) {
    adminsList.replaceChildren();
    const admins = users.filter(function (user) { return user.accountType === 'admin' || user.role === 'admin'; });
    admins.forEach(function (user) {
      const card = document.createElement('article'); card.className = 'user-card';
      const heading = document.createElement('h3'); heading.textContent = ((user.firstName + ' ' + user.surname).trim() || 'Administrator') + (user.active ? '' : ' · Disabled'); card.appendChild(heading);
      addProfileDetail(card, 'Username', user.username); addProfileDetail(card, 'Email', user.email || 'Not set');
      const actions = document.createElement('div'); actions.className = 'user-actions';
      if (user.email) actions.appendChild(actionButton('Resend setup emails', 'secondary', async function () { await request('/api/admin/users/' + encodeURIComponent(user.id) + '/invitation-email', { method: 'POST' }); setStatus('Sent username and password setup emails to ' + user.email + '.', true); }));
      actions.appendChild(actionButton(user.active ? 'Disable admin' : 'Enable admin', 'secondary', async function () { await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !user.active }) }); setStatus('Updated administrator access for ' + user.username + '.', true); await loadUsers(); }));
      actions.appendChild(actionButton('Delete admin', 'danger', async function () { if (!window.confirm('Permanently delete administrator ' + user.username + '?')) return; await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'DELETE' }); setStatus('Deleted administrator ' + user.username + '.', true); await loadUsers(); }));
      card.append(actions, passwordResetForm(user)); adminsList.appendChild(card);
    });
    if (!admins.length) adminsList.textContent = 'No administrator accounts found.';
  }

  function renderParentAccounts(users) {
    parentAccountsList.replaceChildren();
    const parents = users.filter(function (user) { return user.accountType === 'parent' && user.approvalStatus !== 'pending'; });
    parents.forEach(function (parent) {
      const children = users.filter(function (user) { return user.accountType === 'child' && user.parentId === parent.id; });
      const details = document.createElement('details'); details.className = 'parent-account';
      const summary = document.createElement('summary');
      const label = document.createElement('span'); label.textContent = ((parent.firstName + ' ' + parent.surname).trim() || parent.username) + ' · ' + parent.username + ' · ' + children.length + (children.length === 1 ? ' child' : ' children') + (parent.active ? '' : ' · Disabled');
      const email = document.createElement('small'); email.textContent = parent.email || 'No email'; summary.append(label, email); details.appendChild(summary);
      const body = document.createElement('div'); body.className = 'parent-detail-body';
      addProfileDetail(body, 'Date of birth', parent.dateOfBirth); addProfileDetail(body, 'Address', parent.address); addProfileDetail(body, 'Username', parent.username); addProfileDetail(body, 'Account status', parent.active ? 'Enabled' : 'Disabled');
      body.append(emailEditForm(parent), passwordResetForm(parent));
      const parentActions = document.createElement('div'); parentActions.className = 'user-actions';
      if (parent.email) parentActions.appendChild(actionButton('Resend setup emails', 'secondary', async function () { await request('/api/admin/users/' + encodeURIComponent(parent.id) + '/invitation-email', { method: 'POST' }); setStatus('Sent setup emails to ' + parent.email + '.', true); }));
      parentActions.appendChild(actionButton(parent.active ? 'Disable parent' : 'Enable parent', 'secondary', async function () { await request('/api/admin/users/' + encodeURIComponent(parent.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !parent.active }) }); setStatus('Updated parent account ' + parent.username + '.', true); await loadUsers(); }));
      parentActions.appendChild(actionButton('Delete parent and children', 'danger', async function () { if (!window.confirm('Permanently delete ' + parent.username + ' and all linked child accounts?')) return; await request('/api/admin/users/' + encodeURIComponent(parent.id), { method: 'DELETE' }); setStatus('Deleted parent and linked child accounts.', true); await loadUsers(); }));
      body.appendChild(parentActions);
      const childrenTitle = document.createElement('h3'); childrenTitle.textContent = 'Children (' + children.length + ')'; body.appendChild(childrenTitle);
      if (!children.length) { const empty = document.createElement('p'); empty.textContent = 'No child profiles are linked to this parent.'; body.appendChild(empty); }
      children.forEach(function (child) {
        const card = document.createElement('article'); card.className = 'child-account-card';
        const title = document.createElement('h4'); title.textContent = ((child.firstName + ' ' + child.surname).trim() || child.username) + ' · ' + child.username; card.appendChild(title);
        addProfileDetail(card, 'School year', child.schoolYear); addProfileDetail(card, 'Date of birth', child.dateOfBirth); addProfileDetail(card, 'Status', child.active ? 'Enabled' : 'Disabled');
        const access = document.createElement('div'); access.className = 'entitlement-grid'; makeEntitlementInputs(access, child.entitlements || [], 'parent-child-' + child.id); card.appendChild(access);
        const linkLabel = document.createElement('label'); linkLabel.textContent = 'Linked parent account';
        const parentSelect = document.createElement('select'); parentSelect.append(new Option('Unassigned (sign-in disabled)', ''));
        users.filter(function (item) { return item.accountType === 'parent' && item.approvalStatus === 'approved' && (item.active || item.id === child.parentId); }).forEach(function (item) { parentSelect.add(new Option(((item.firstName + ' ' + item.surname).trim() || item.username) + ' · ' + item.username + (item.active ? '' : ' (disabled)'), item.id)); });
        parentSelect.value = child.parentId || parent.id; linkLabel.appendChild(parentSelect); card.appendChild(linkLabel);
        const childActions = document.createElement('div'); childActions.className = 'user-actions';
        childActions.appendChild(actionButton('Save access and parent', '', async function () { await request('/api/admin/users/' + encodeURIComponent(child.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entitlements: checkedValues(access), parentId: parentSelect.value || null }) }); setStatus('Saved workbook access and parent link for ' + child.username + '.', true); await loadUsers(); }));
        childActions.appendChild(actionButton(child.active ? 'Disable child' : 'Enable child', 'secondary', async function () { await request('/api/admin/users/' + encodeURIComponent(child.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !child.active }) }); setStatus('Updated child account ' + child.username + '.', true); await loadUsers(); }));
        childActions.appendChild(actionButton('Delete child', 'danger', async function () { if (!window.confirm('Permanently delete child account ' + child.username + '?')) return; await request('/api/admin/users/' + encodeURIComponent(child.id), { method: 'DELETE' }); setStatus('Deleted child account ' + child.username + '.', true); await loadUsers(); }));
        card.appendChild(childActions); card.append(emailEditForm(child), passwordResetForm(child));
        body.appendChild(card);
      });
      details.appendChild(body); parentAccountsList.appendChild(details);
    });
    if (!parents.length) parentAccountsList.textContent = 'No parent accounts found.';
  }

  async function loadUsers() {
    const result = await request('/api/admin/users');
    renderPending(result.users); renderAdmins(result.users); renderParentAccounts(result.users);
    document.getElementById('nav-pending-count').textContent = document.getElementById('pending-count').textContent;
  }

  document.getElementById('create-admin-form').addEventListener('submit', async function (event) {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const result = await request('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', firstName: form.elements.firstName.value.trim(), surname: form.elements.surname.value.trim(), username: form.elements.username.value.trim(), email: form.elements.email.value.trim() }) });
      form.reset(); setStatus(result.emailSent === false ? result.message : 'Created administrator ' + result.user.username + ' and sent the two setup emails.', result.emailSent !== false); await loadUsers();
    } catch (error) { setStatus(error.message, false); }
    finally { button.disabled = false; }
  });

  document.getElementById('create-parent-form').addEventListener('submit', async function (event) {
    event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
    try {
      const result=await request('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'parent',username:form.elements.username.value.trim(),firstName:form.elements.firstName.value.trim(),surname:form.elements.surname.value.trim(),email:form.elements.email.value.trim(),dateOfBirth:form.elements.dateOfBirth.value,address:form.elements.address.value.trim()})});
      form.reset();setStatus(result.emailSent===false?(result.message||'Parent account created, but email delivery needs attention.'):'Created approved parent account '+result.user.username+' and sent the two setup emails.',result.emailSent!==false);await loadUsers();
    } catch(error){setStatus(error.message,false);} finally{button.disabled=false;}
  });

  function refreshUsers() {
    loadUsers().then(function () { setStatus('', true); }).catch(function (error) { setStatus(error.message, false); });
  }
  document.getElementById('refresh-admins').addEventListener('click', refreshUsers);
  document.getElementById('refresh-accounts').addEventListener('click', refreshUsers);
  document.getElementById('refresh-users-pending').addEventListener('click', refreshUsers);
  function showAdminPage() {
    const page = (window.location.hash || '#admins').slice(1);
    const valid = ['admins', 'preapproved-parents', 'registrations', 'accounts', 'progress'];
    const active = valid.includes(page) ? page : 'admins';
    document.querySelectorAll('.admin-view').forEach(function (view) { view.hidden = view.id !== 'view-' + active; });
    document.querySelectorAll('[data-admin-page]').forEach(function (link) { if (link.dataset.adminPage === active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  }
  window.addEventListener('hashchange', showAdminPage); showAdminPage();
  const progressWorkbook=document.getElementById('admin-progress-workbook');WORKBOOKS.forEach(function(entry){progressWorkbook.add(new Option(entry[1],entry[0]));});
  document.getElementById('refresh-progress').addEventListener('click',function(){loadProgress().catch(function(error){setStatus(error.message,false);});});
  document.getElementById('admin-progress-search').addEventListener('input',renderProgress);progressWorkbook.addEventListener('change',renderProgress);

  request('/api/auth/me').then(function (result) {
    if (!result.authenticated || result.user.role !== 'admin') {
      window.location.replace('/'); return;
    }
    return Promise.all([loadUsers(),loadProgress()]);
  }).catch(function (error) { setStatus(error.message, false); });
})();
