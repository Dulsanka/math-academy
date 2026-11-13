(function () {
  const form = document.getElementById('parent-registration-form');
  const status = document.getElementById('parent-registration-status');
  const childCount = document.getElementById('child-count');
  const childrenHost = document.getElementById('registration-children');
  const parentFields = form.querySelector('.family-contact-grid');
  const parentValue = function (name) { return parentFields.querySelector('[name="' + name + '"]').value.trim(); };
  const workbooks = [
    ['arithmetic', 'Arithmetic & Division'], ['year6', 'Year 6 NZ'], ['year7', 'Year 7 NZ'],
    ['year8', 'Year 8 NZ'], ['year9', 'Year 9 NZ'], ['year10', 'Year 10 NZ'],
    ['year11', 'Year 11 NZ'], ['year12', 'Year 12 NZ'], ['year13', 'Year 13 NZ']
  ];
  const schoolYears = ['Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];

  function makeInput(labelText, name, type, attributes) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.name = name;
    input.type = type || 'text';
    input.required = true;
    Object.keys(attributes || {}).forEach(function (key) { input.setAttribute(key, attributes[key]); });
    label.appendChild(input);
    return label;
  }

  function renderChild(index) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'registration-child';
    fieldset.dataset.childIndex = String(index);
    const legend = document.createElement('legend');
    legend.textContent = 'Child ' + (index + 1);
    fieldset.appendChild(legend);
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    grid.append(
      makeInput('First name', 'firstName', 'text', { maxlength: '80', autocomplete: 'given-name' }),
      makeInput('Surname', 'surname', 'text', { maxlength: '80', autocomplete: 'family-name' })
    );
    const birthLabel = makeInput('Date of birth', 'dateOfBirth', 'date', { autocomplete: 'bday' });
    grid.appendChild(birthLabel);
    const yearLabel = document.createElement('label');
    yearLabel.textContent = 'School year';
    const yearSelect = document.createElement('select');
    yearSelect.name = 'schoolYear'; yearSelect.required = true;
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a year'; yearSelect.appendChild(placeholder);
    schoolYears.forEach(function (year) { const option = document.createElement('option'); option.value = year; option.textContent = year; yearSelect.appendChild(option); });
    yearLabel.appendChild(yearSelect); grid.appendChild(yearLabel);
    grid.append(
      makeInput('Child username', 'username', 'text', { minlength: '3', maxlength: '32', pattern: '[A-Za-z0-9._-]{3,32}', autocomplete: 'username' }),
      makeInput('Initial password', 'password', 'password', { minlength: '12', maxlength: '256', autocomplete: 'new-password' }),
      makeInput('Confirm child password', 'confirmPassword', 'password', { minlength: '12', maxlength: '256', autocomplete: 'new-password' })
    );
    fieldset.appendChild(grid);
    const accessSet = document.createElement('fieldset');
    accessSet.className = 'child-workbook-choices';
    const accessLegend = document.createElement('legend'); accessLegend.textContent = 'Preferred workbooks'; accessSet.appendChild(accessLegend);
    const note = document.createElement('p'); note.textContent = 'These are requests. An administrator must approve workbook access.'; accessSet.appendChild(note);
    const options = document.createElement('div'); options.className = 'choice-grid';
    workbooks.forEach(function (item) {
      const label = document.createElement('label'); label.className = 'choice';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.name = 'requestedEntitlements'; checkbox.value = item[0];
      label.append(checkbox, document.createTextNode(item[1])); options.appendChild(label);
    });
    accessSet.appendChild(options); fieldset.appendChild(accessSet);
    return fieldset;
  }

  function renderChildren() {
    const previous = Array.from(childrenHost.querySelectorAll('.registration-child'));
    childrenHost.replaceChildren();
    const count = Number(childCount.value);
    for (let i = 0; i < count; i += 1) {
      const card = renderChild(i);
      if (previous[i]) {
        const old = previous[i];
        ['firstName', 'surname', 'dateOfBirth', 'schoolYear', 'username', 'password', 'confirmPassword'].forEach(function (key) {
          const oldInput = old.querySelector('[name="' + key + '"]');
          const newInput = card.querySelector('[name="' + key + '"]');
          if (oldInput && newInput) newInput.value = oldInput.value;
        });
        old.querySelectorAll('[name="requestedEntitlements"]:checked').forEach(function (oldInput) {
          const newInput = card.querySelector('[name="requestedEntitlements"][value="' + oldInput.value + '"]');
          if (newInput) newInput.checked = true;
        });
      }
      childrenHost.appendChild(card);
    }
  }

  childCount.addEventListener('change', renderChildren);
  renderChildren();

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    status.classList.remove('success');
    status.classList.remove('warning');
    const childCards = Array.from(childrenHost.querySelectorAll('.registration-child'));
    const children = [];
    for (let index = 0; index < childCards.length; index += 1) {
      const card = childCards[index];
      const field = function (name) { return card.querySelector('[name="' + name + '"]').value.trim(); };
      const password = card.querySelector('[name="password"]').value;
      const confirmedPassword = card.querySelector('[name="confirmPassword"]').value;
      if (password !== confirmedPassword) { status.textContent = 'The passwords for Child ' + (index + 1) + ' do not match.'; return; }
      const requestedEntitlements = Array.from(card.querySelectorAll('[name="requestedEntitlements"]:checked')).map(function (input) { return input.value; });
      if (!requestedEntitlements.length) { status.textContent = 'Choose at least one workbook for Child ' + (index + 1) + '.'; return; }
      children.push({ firstName: field('firstName'), surname: field('surname'), dateOfBirth: field('dateOfBirth'), schoolYear: field('schoolYear'), username: field('username'), password: password, requestedEntitlements: requestedEntitlements });
    }
    const parentPassword = parentFields.querySelector('[name="password"]').value;
    const parentConfirmedPassword = parentFields.querySelector('[name="confirmPassword"]').value;
    if (parentPassword !== parentConfirmedPassword) { status.textContent = 'The parent passwords do not match.'; return; }
    const familyUsernames = [parentValue('username')].concat(children.map(function (child) { return child.username; })).map(function (value) { return value.toLowerCase(); });
    if (new Set(familyUsernames).size !== familyUsernames.length) { status.textContent = 'Use a different username for the parent and for each child.'; return; }
    const button = form.querySelector('button[type="submit"]'); button.disabled = true; status.textContent = 'Submitting your family registration for review...';
    const body = {
      firstName: parentValue('firstName'), surname: parentValue('surname'), email: parentValue('email'),
      dateOfBirth: parentValue('dateOfBirth'), address: [parentValue('address'), parentValue('country')].filter(Boolean).join(', '),
      username: parentValue('username'), password: parentPassword, children: children,
      privacyAcknowledged: form.elements.privacyAcknowledged.checked
    };
    try {
      const response = await fetch('/api/auth/register-parent', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.error || 'Registration could not be completed.');
      form.reset(); childCount.value = '1'; renderChildren();
      status.textContent = result.emailSent === false
        ? (result.message || 'Your family registration was saved, but the receipt email could not be sent. An administrator can resend it; children can sign in, but workbooks remain locked until approved.')
        : 'Family registration submitted. Check your email. Your parent account awaits administrator approval; children can sign in now, but workbook access awaits administrator approval. Returning to sign in shortly...';
      status.classList.toggle('success', result.emailSent !== false);
      status.classList.toggle('warning', result.emailSent === false);
      if (result.emailSent !== false) window.setTimeout(function () { window.location.replace('/'); }, 4000);
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
})();
