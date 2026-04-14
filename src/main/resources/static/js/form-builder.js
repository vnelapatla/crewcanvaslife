/**
 * Form Builder Logic for CrewCanvas
 */
let fields = [];

function addField(type, label) {
    const id = 'field_' + Date.now();
    fields.push({ id, type, label, required: true });
    renderFields();
}

function removeField(id) {
    fields = fields.filter(f => f.id !== id);
    renderFields();
}

function renderFields() {
    const container = document.getElementById('form-fields-container');
    const preview = document.getElementById('preview-container');

    if (!container || !preview) return;

    container.innerHTML = '';
    preview.innerHTML = '';

    if (fields.length === 0) {
        preview.innerHTML = '<p style="color:#888; text-align:center; margin-top:50px">Add fields to see preview</p>';
        return;
    }

    fields.forEach((field, index) => {
        // Canvas UI
        const fieldEl = document.createElement('div');
        fieldEl.className = 'dropped-field';
        fieldEl.innerHTML = `
            <div class="field-controls">
                <button class="control-btn delete" onclick="removeField('${field.id}')">🗑️</button>
            </div>
            <label style="display:block; margin-bottom:8px; font-weight:600">${field.label}</label>
            <input type="${field.type === 'textarea' ? 'text' : field.type}" placeholder="Input placeholder..." disabled style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd">
        `;
        container.appendChild(fieldEl);

        // Preview UI
        const previewEl = document.createElement('div');
        previewEl.style.marginBottom = '15px';
        previewEl.innerHTML = `
            <label style="display:block; font-size:12px; margin-bottom:4px; color:#aaa">${field.label}</label>
            <div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:6px; font-size:13px; color:#eee">
                Example input for ${field.label}
            </div>
        `;
        preview.appendChild(previewEl);
    });
}

function saveForm() {
    const titleElement = document.querySelector('.form-title');
    const title = titleElement ? titleElement.innerText : 'Untitled Form';
    const config = {
        title: title,
        fields: fields,
        updatedAt: new Date()
    };

    console.log('Exporting Form Configuration:', JSON.stringify(config));
    showMessage('Form Configuration Saved Successfully!', 'success');

    setTimeout(() => {
        window.location.href = 'event-dashboard.html';
    }, 1500);
}
