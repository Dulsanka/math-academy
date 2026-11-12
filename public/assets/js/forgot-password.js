(function () {
  const form = document.getElementById('forgot-form'); const status = document.getElementById('forgot-status');
  form.addEventListener('submit', async function (event) { event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; status.textContent = 'Sending…';
    try { const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.elements.email.value.trim() }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Request could not be completed.'); status.textContent = result.message; status.classList.add('success'); }
    catch (error) { status.textContent = error.message; status.classList.remove('success'); } finally { button.disabled = false; }
  });
})();
