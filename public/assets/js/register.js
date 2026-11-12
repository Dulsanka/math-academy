(function () {
  const form = document.getElementById('registration-form');
  const status = document.getElementById('registration-status');
  const options = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'], ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'],
    ['year10', 'Year 10 NZ'], ['year11', 'Year 11 NZ'], ['year12', 'Year 12 NZ'], ['year13', 'Year 13 NZ']
  ];
  const optionsHost = document.getElementById('workbook-options');
  options.forEach(function (item) {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'requestedEntitlements'; input.value = item[0];
    label.append(input, document.createTextNode(item[1])); optionsHost.appendChild(label);
  });
  const birthDate = form.elements.dateOfBirth;
  const guardian = document.getElementById('guardian-fields');
  function updateGuardianFields() {
    if (!birthDate.value) { guardian.classList.add('hidden'); form.elements.parentName.required = false; form.elements.parentEmail.required = false; return; }
    const today = new Date(); const birth = new Date(birthDate.value + 'T00:00:00Z');
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age -= 1;
    const required = age < 18;
    guardian.classList.toggle('hidden', !required);
    form.elements.parentName.required = required;
    form.elements.parentEmail.required = required;
    if (!required) { form.elements.parentName.value = ''; form.elements.parentEmail.value = ''; }
  }
  birthDate.addEventListener('change', updateGuardianFields);
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    updateGuardianFields();
    if (form.elements.password.value !== form.elements.confirmPassword.value) { status.textContent = 'The passwords do not match.'; return; }
    const requestedEntitlements = Array.from(form.querySelectorAll('[name="requestedEntitlements"]:checked')).map(function (item) { return item.value; });
    if (!requestedEntitlements.length) { status.textContent = 'Choose at least one workbook access preference.'; return; }
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; status.classList.remove('success'); status.textContent = 'Submitting your registration…';
    const body = {
      firstName: form.elements.firstName.value.trim(), surname: form.elements.surname.value.trim(), email: form.elements.email.value.trim(),
      dateOfBirth: form.elements.dateOfBirth.value, address: form.elements.address.value.trim(), schoolYear: form.elements.schoolYear.value,
      username: form.elements.username.value.trim(), password: form.elements.password.value, parentName: form.elements.parentName.value.trim(),
      parentEmail: form.elements.parentEmail.value.trim(), requestedEntitlements, privacyAcknowledged: form.elements.privacyAcknowledged.checked
    };
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.error || 'Registration could not be completed.');
      form.reset(); guardian.classList.add('hidden');
      status.textContent = 'Registration submitted. Check your email for confirmation; sign-in will be available after administrator approval.';
      status.classList.add('success');
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
})();
