(function () {
  const form = document.getElementById('parent-registration-form');
  const status = document.getElementById('parent-registration-status');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (form.elements.password.value !== form.elements.confirmPassword.value) { status.textContent = 'The passwords do not match.'; return; }
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; status.textContent = 'Submitting your parent account for review…';
    const body = {
      firstName: form.elements.firstName.value.trim(), surname: form.elements.surname.value.trim(), email: form.elements.email.value.trim(),
      dateOfBirth: form.elements.dateOfBirth.value, address: [form.elements.address.value.trim(), form.elements.country.value].filter(Boolean).join(', '),
      username: form.elements.username.value.trim(), password: form.elements.password.value, privacyAcknowledged: form.elements.privacyAcknowledged.checked
    };
    try {
      const response = await fetch('/api/auth/register-parent', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.error || 'Registration could not be completed.');
      form.reset(); status.textContent = 'Parent account request submitted. Check your email; you can sign in after administrator approval.'; status.classList.add('success');
    } catch (error) { status.textContent = error.message; status.classList.remove('success'); }
    finally { button.disabled = false; }
  });
})();
