// Google Forms-inspired Form Builder

const defaultFields = [
  { label: 'Name', type: 'text', required: true },
  { label: 'Email', type: 'email', required: true },
  { label: 'Age', type: 'number', required: true },
  { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
  { label: 'Phone Number', type: 'tel', required: true },
  { label: 'City', type: 'text', required: true },
  { label: 'State', type: 'text', required: true },
];

let customFields = [];
let conditionalLogic = [];
let previewMode = false;

const customFieldsContainer = document.getElementById('customFieldsContainer');
const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
const logicContainer = document.getElementById('logicContainer');
const addLogicBtn = document.getElementById('addLogicBtn');
const previewSection = document.getElementById('previewSection');
const togglePreviewBtn = document.getElementById('togglePreview');
const formBuilderForm = document.getElementById('formBuilderForm');
const previewForm = document.getElementById('previewForm');

function renderCustomFields() {
  customFieldsContainer.innerHTML = '';
  customFields.forEach((field, idx) => {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `
      <span class="field-label">${field.label}</span>
      <span class="field-type">${field.type}${field.options ? ' (' + field.options.join('/') + ')' : ''}</span>
      <div class="field-actions">
        <button type="button" class="remove-btn" title="Remove" data-idx="${idx}">&times;</button>
      </div>
    `;
    row.querySelector('.remove-btn').onclick = () => {
      customFields.splice(idx, 1);
      renderCustomFields();
      renderLogicRows();
    };
    row.onclick = (e) => {
      if (e.target.classList.contains('remove-btn')) return;
      editCustomField(idx);
    };
    customFieldsContainer.appendChild(row);
  });
}

function editCustomField(idx) {
  const field = customFields[idx];
  const label = prompt('Field label:', field.label);
  if (!label) return;
  let type = prompt('Field type (text, number, email, date, select, checkbox, textarea):', field.type);
  if (!type) return;
  let options = undefined;
  if (type === 'select' || type === 'checkbox') {
    const opts = prompt('Options (comma separated):', field.options ? field.options.join(',') : '');
    if (!opts) return;
    options = opts.split(',').map(s => s.trim()).filter(Boolean);
  }
  customFields[idx] = { label, type, options };
  renderCustomFields();
  renderLogicRows();
}

addCustomFieldBtn.onclick = () => {
  const label = prompt('Field label:');
  if (!label) return;
  let type = prompt('Field type (text, number, email, date, select, checkbox, textarea):', 'text');
  if (!type) return;
  let options = undefined;
  if (type === 'select' || type === 'checkbox') {
    const opts = prompt('Options (comma separated):');
    if (!opts) return;
    options = opts.split(',').map(s => s.trim()).filter(Boolean);
  }
  customFields.push({ label, type, options });
  renderCustomFields();
  renderLogicRows();
};

function renderLogicRows() {
  logicContainer.innerHTML = '';
  conditionalLogic.forEach((logic, idx) => {
    const row = document.createElement('div');
    row.className = 'logic-row';
    row.innerHTML = `
      <span class="logic-label">If <b>${logic.ifField}</b> is <b>${logic.ifValue}</b>, show <b>${logic.showField}</b></span>
      <button type="button" class="remove-btn" title="Remove" data-idx="${idx}">&times;</button>
    `;
    row.querySelector('.remove-btn').onclick = () => {
      conditionalLogic.splice(idx, 1);
      renderLogicRows();
    };
    logicContainer.appendChild(row);
  });
}

addLogicBtn.onclick = () => {
  if (customFields.length === 0) {
    alert('Add at least one custom field first.');
    return;
  }
  const ifField = prompt('If which field? (custom field label)');
  if (!ifField || !customFields.find(f => f.label === ifField)) return alert('Field not found.');
  const ifValue = prompt('If value equals:');
  if (!ifValue) return;
  const showField = prompt('Show which field? (custom field label)');
  if (!showField || !customFields.find(f => f.label === showField)) return alert('Field not found.');
  conditionalLogic.push({ ifField, ifValue, showField });
  renderLogicRows();
};

function renderPreview() {
  previewForm.innerHTML = '';
  // Render default fields
  defaultFields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-field';
    const label = document.createElement('label');
    label.className = 'preview-label';
    label.textContent = field.label + (field.required ? ' *' : '');
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'preview-select';
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.className = 'preview-input';
      input.type = field.type;
    }
    input.required = field.required;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    previewForm.appendChild(wrapper);
  });
  // Render custom fields (apply conditional logic)
  customFields.forEach(field => {
    // Check if this field should be shown based on logic
    let show = true;
    conditionalLogic.forEach(logic => {
      // For preview, just show all fields (logic applies on real form)
    });
    if (show) {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-field';
      const label = document.createElement('label');
      label.className = 'preview-label';
      label.textContent = field.label;
      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'preview-select';
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else if (field.type === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'preview-input';
      } else if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'preview-input';
      } else {
        input = document.createElement('input');
        input.className = 'preview-input';
        input.type = field.type;
      }
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      previewForm.appendChild(wrapper);
    }
  });
}

togglePreviewBtn.onclick = () => {
  previewMode = !previewMode;
  previewSection.style.display = previewMode ? 'block' : 'none';
  formBuilderForm.style.display = previewMode ? 'none' : 'block';
  togglePreviewBtn.textContent = previewMode ? 'Edit Mode' : 'Preview Mode';
  if (previewMode) renderPreview();
};

formBuilderForm.onsubmit = (e) => {
  e.preventDefault();
  // Save form structure (for now, just log or save to localStorage)
  const eventId = new URLSearchParams(window.location.search).get('eventId');
  const formStructure = {
    eventId,
    defaultFields,
    customFields,
    conditionalLogic
  };
  localStorage.setItem('formBuilder_' + eventId, JSON.stringify(formStructure));
  alert('Form structure saved! (In real app, this would be sent to backend)');
};

// Initial render
renderCustomFields();
renderLogicRows(); 