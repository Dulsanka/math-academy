(function () {
  const WORKBOOKS = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'],
    ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'], ['year10', 'Year 10 NZ'], ['year11', 'Year 11 NZ'],
    ['year12', 'Year 12 NZ (NCEA Level 2)'], ['year13', 'Year 13 NZ (NCEA Level 3)']
  ];
  const status = document.getElementById('admin-status');
  const usersList = document.getElementById('users-list');
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

  async function loadUsers() {
    const result = await request('/api/admin/users');
    renderPending(result.users);
    usersList.replaceChildren();
    result.users.filter(function (user) { return user.approvalStatus !== 'pending' && user.accessRequestStatus !== 'pending'; }).forEach(function (user) {
      const card = document.createElement('article');
      card.className = 'user-card';
      const top = document.createElement('div');
      top.className = 'user-top';
      const name = document.createElement('div');
      name.innerHTML = '<span class="user-name"></span><span class="user-role"></span>';
      name.querySelector('.user-name').textContent = user.username;
      name.querySelector('.user-role').textContent = user.accountType === 'learner' ? user.role : user.accountType;
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
      let parentAssignment = null;
      if (user.accountType === 'child') {
        const label=document.createElement('label');label.className='parent-assignment';label.textContent='Linked parent account';parentAssignment=document.createElement('select');parentAssignment.append(new Option('Unassigned (sign-in disabled)',''));result.users.filter(function(item){return item.accountType==='parent'&&item.active&&item.approvalStatus==='approved';}).forEach(function(parent){parentAssignment.add(new Option((parent.firstName+' '+parent.surname).trim()+' · '+parent.username,parent.id));});parentAssignment.value=user.parentId||'';label.append(parentAssignment);card.appendChild(label);
      }
      const actions = document.createElement('div');
      actions.className = 'user-actions';
      const save = document.createElement('button');
      save.type = 'button'; save.textContent = 'Save access';
      save.addEventListener('click', async function () {
        save.disabled = true;
        try {
          await request('/api/admin/users/' + encodeURIComponent(user.id), {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({ entitlements: checkedValues(access), active: active.checked }, parentAssignment ? { parentId: parentAssignment.value || null } : {}))
          });
          setStatus('Updated access for ' + user.username + '.', true);
        } catch (error) { setStatus(error.message, false); }
        finally { save.disabled = false; }
      });
      actions.appendChild(save);
      if (user.email || user.parentEmail) {
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
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Delete account';
      remove.addEventListener('click', async function () {
        const extra = user.accountType === 'parent' ? ' This will also permanently delete all linked child accounts.' : '';
        if (!window.confirm('Permanently delete ' + user.username + '?' + extra)) return;
        remove.disabled = true;
        try { await request('/api/admin/users/' + encodeURIComponent(user.id), { method: 'DELETE' }); setStatus('Deleted account ' + user.username + '.', true); await loadUsers(); }
        catch (error) { setStatus(error.message, false); }
        finally { remove.disabled = false; }
      });
      actions.appendChild(remove);
      card.append(top, emailForm, access, actions, reset);
      usersList.appendChild(card);
    });
    if (!result.users.some(function (user) { return user.approvalStatus !== 'pending' && user.accessRequestStatus !== 'pending'; })) usersList.textContent = 'No approved accounts have been created yet.';
  }

  document.getElementById('create-admin-form').addEventListener('submit', async function (event) {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const result = await request('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.elements.username.value.trim(), password: form.elements.password.value, role: 'admin' }) });
      form.reset(); setStatus('Created administrator account ' + result.user.username + '.', true); await loadUsers();
    } catch (error) { setStatus(error.message, false); }
    finally { button.disabled = false; }
  });

  document.getElementById('create-parent-form').addEventListener('submit', async function (event) {
    event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
    try {
      const result=await request('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'parent',username:form.elements.username.value.trim(),password:form.elements.password.value,firstName:form.elements.firstName.value.trim(),surname:form.elements.surname.value.trim(),email:form.elements.email.value.trim(),dateOfBirth:form.elements.dateOfBirth.value,address:form.elements.address.value.trim()})});
      form.reset();setStatus('Created approved parent account '+result.user.username+'. Link their children from the account list.',true);await loadUsers();
    } catch(error){setStatus(error.message,false);} finally{button.disabled=false;}
  });

  document.getElementById('refresh-users').addEventListener('click', function () {
    loadUsers().then(function () { setStatus('', true); }).catch(function (error) { setStatus(error.message, false); });
  });
  document.getElementById('refresh-users-pending').addEventListener('click', function () {
    loadUsers().then(function () { setStatus('', true); }).catch(function (error) { setStatus(error.message, false); });
  });
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
