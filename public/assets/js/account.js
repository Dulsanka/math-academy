(function () {
  const profileForm = document.getElementById('profile-form');
  const guardianBox = document.getElementById('account-guardian');
  let isAdminProfile = false;
  let originalEmail = '';

  async function request(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.error || 'Request could not be completed.');
    return result;
  }

  function setFormValues(form, data) {
    Object.keys(data).forEach(function (key) {
      if (form.elements[key]) form.elements[key].value = data[key] || '';
    });
  }

  function ageFor(value) {
    if (!value) return null;
    const born = new Date(value + 'T00:00:00Z');
    const now = new Date();
    let age = now.getUTCFullYear() - born.getUTCFullYear();
    if (now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())) age -= 1;
    return age;
  }

  function updateGuardian() {
    const age = ageFor(profileForm.elements.dateOfBirth.value);
    const required = !isAdminProfile && age !== null && age < 18;
    guardianBox.classList.toggle('hidden', !required);
    profileForm.elements.parentName.required = required;
    profileForm.elements.parentEmail.required = required;
  }

  function updateEmailConfirmation() {
    const changed = isAdminProfile && profileForm.elements.email.value.trim().toLowerCase() !== originalEmail.toLowerCase();
    document.getElementById('admin-email-password-field').classList.toggle('hidden', !changed);
    profileForm.elements.adminEmailPassword.required = changed;
  }

  request('/api/account').then(function (result) {
    const profile = result.profile;
    setFormValues(profileForm, profile);
    originalEmail = profile.email || '';
    updateGuardian();
    if (profile.accountType === 'parent' || profile.role === 'admin') {
      document.getElementById('school-year-field').classList.add('hidden');
      profileForm.elements.schoolYear.required = false;
    }
    if (profile.role === 'admin') {
      isAdminProfile = true;
      ['date-of-birth-field', 'address-field', 'account-guardian'].forEach(function (id) {
        document.getElementById(id).classList.add('hidden');
      });
      profileForm.elements.email.readOnly = false;
      updateGuardian();
      updateEmailConfirmation();
    }
  }).catch(function (error) {
    window.location.replace('/');
  });

  profileForm.elements.dateOfBirth.addEventListener('change', updateGuardian);
  profileForm.elements.email.addEventListener('input', updateEmailConfirmation);

  profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = profileForm.querySelector('button[type="submit"]');
    const status = document.getElementById('profile-status');
    button.disabled = true;
    status.textContent = 'Saving...';
    const body = {};
    ['firstName', 'surname', 'email', 'dateOfBirth', 'address', 'schoolYear', 'parentName', 'parentEmail'].forEach(function (key) {
      body[key] = profileForm.elements[key].value.trim();
    });
    try {
      if (isAdminProfile && body.email.toLowerCase() !== originalEmail.toLowerCase()) {
        const emailResult = await request('/api/account/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: body.email, currentPassword: profileForm.elements.adminEmailPassword.value })
        });
        originalEmail = emailResult.email;
        profileForm.elements.adminEmailPassword.value = '';
        updateEmailConfirmation();
      }
      const result = await request('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setFormValues(profileForm, result.profile);
      originalEmail = result.profile.email || originalEmail;
      updateEmailConfirmation();
      status.textContent = 'Profile saved.';
      status.classList.add('success');
    } catch (error) {
      status.textContent = error.message;
      status.classList.remove('success');
    } finally {
      button.disabled = false;
    }
  });

  const passwordForm = document.getElementById('password-form');
  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const status = document.getElementById('password-status');
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    status.textContent = 'Updating password...';
    try {
      await request('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.elements.currentPassword.value, newPassword: passwordForm.elements.newPassword.value })
      });
      passwordForm.reset();
      status.textContent = 'Password updated. Other signed-in sessions have been signed out.';
      status.classList.add('success');
    } catch (error) {
      status.textContent = error.message;
      status.classList.remove('success');
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('sign-out').addEventListener('click', async function () {
    try { await request('/api/auth/logout', { method: 'POST' }); }
    finally { window.location.replace('/'); }
  });
})();
