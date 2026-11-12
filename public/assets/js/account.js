(function () {
  const profileForm = document.getElementById('profile-form');
  const guardianBox = document.getElementById('account-guardian');
  async function request(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.error || 'Request could not be completed.');
    return result;
  }
  function setFormValues(form, data) { Object.keys(data).forEach(function (key) { if (form.elements[key]) form.elements[key].value = data[key] || ''; }); }
  function ageFor(value) { if (!value) return null; const born = new Date(value + 'T00:00:00Z'); const now = new Date(); let age = now.getUTCFullYear() - born.getUTCFullYear(); if (now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())) age -= 1; return age; }
  function updateGuardian() { const age = ageFor(profileForm.elements.dateOfBirth.value); const required = age !== null && age < 18; guardianBox.classList.toggle('hidden', !required); profileForm.elements.parentName.required = required; profileForm.elements.parentEmail.required = required; }
  request('/api/account').then(function (result) { setFormValues(profileForm, result.profile); updateGuardian(); }).catch(function () { window.location.replace('/'); });
  profileForm.elements.dateOfBirth.addEventListener('change', updateGuardian);
  profileForm.addEventListener('submit', async function (event) {
    event.preventDefault(); const button = profileForm.querySelector('button'); const status = document.getElementById('profile-status'); button.disabled = true; status.textContent = 'Saving…';
    const body = {}; ['firstName','surname','email','dateOfBirth','address','schoolYear','parentName','parentEmail'].forEach(function (key) { body[key] = profileForm.elements[key].value.trim(); });
    try { const result = await request('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setFormValues(profileForm, result.profile); status.textContent = 'Profile saved.'; status.classList.add('success'); }
    catch (error) { status.textContent = error.message; status.classList.remove('success'); }
    finally { button.disabled = false; }
  });
  const passwordForm = document.getElementById('password-form');
  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault(); const status = document.getElementById('password-status'); const button = passwordForm.querySelector('button');
    button.disabled = true; status.textContent = 'Updating password…';
    try { await request('/api/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: passwordForm.elements.currentPassword.value, newPassword: passwordForm.elements.newPassword.value }) }); passwordForm.reset(); status.textContent = 'Password updated. Other signed-in sessions have been signed out.'; status.classList.add('success'); }
    catch (error) { status.textContent = error.message; status.classList.remove('success'); }
    finally { button.disabled = false; }
  });
  document.getElementById('sign-out').addEventListener('click', async function () { try { await request('/api/auth/logout', { method: 'POST' }); } finally { window.location.replace('/'); } });
})();
