(function () {
  const form = document.getElementById('reset-form'); const status = document.getElementById('reset-status'); const token = new URLSearchParams(window.location.search).get('token') || '';
  form.addEventListener('submit', async function (event) { event.preventDefault();
    if (form.elements.password.value !== form.elements.confirmPassword.value) { status.textContent = 'Passwords do not match.'; return; }
    const button = form.querySelector('button'); button.disabled = true; status.textContent = 'Saving…';
    try { const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token, password: form.elements.password.value }) }); const result = await response.json().catch(function () { return {}; }); if (!response.ok) throw new Error(result.error || 'Could not reset password.'); form.reset(); status.textContent = 'Password changed. You can now sign in with your new password.'; status.classList.add('success'); }
    catch (error) { status.textContent = error.message; status.classList.remove('success'); } finally { button.disabled = false; }
  });
})();
