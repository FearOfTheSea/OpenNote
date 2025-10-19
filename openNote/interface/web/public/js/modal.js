// modal.js - Reusable modal dialog system

class Modal {
    constructor() {
        this.overlay = null;
        this.currentResolve = null;
    }

    /**
     * Show a modal dialog
     * @param {Object} config - Modal configuration
     * @param {string} config.title - Modal title
     * @param {string} config.body - Modal body HTML
     * @param {Array} config.buttons - Array of button configs
     * @returns {Promise} Resolves with button value or input value
     */
    show(config) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            this.render(config);
        });
    }

    render(config) {
        // Remove existing modal if any
        this.close();

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close(null);
            }
        });

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';

        // Header
        if (config.title) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.textContent = config.title;
            modal.appendChild(header);
        }

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = config.body;
        modal.appendChild(body);

        // Footer with buttons
        if (config.buttons && config.buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';

            config.buttons.forEach((btn) => {
                const button = document.createElement('button');
                button.textContent = btn.text;
                button.className = btn.className || 'btn-secondary';
                button.addEventListener('click', () => {
                    if (btn.onClick) {
                        const result = btn.onClick(modal);
                        if (result !== false) {
                            this.close(result);
                        }
                    } else {
                        this.close(btn.value);
                    }
                });
                footer.appendChild(button);
            });

            modal.appendChild(footer);
        }

        this.overlay.appendChild(modal);
        document.body.appendChild(this.overlay);

        // Focus first input if exists
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        // Handle Escape key
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close(null);
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    close(value) {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        if (this.currentResolve) {
            this.currentResolve(value);
            this.currentResolve = null;
        }
    }

    /**
     * Show a confirmation dialog
     * @param {string} message - Confirmation message
     * @param {string} title - Dialog title (optional)
     * @returns {Promise<boolean>} True if confirmed, false otherwise
     */
    confirm(message, title = 'Confirm') {
        return this.show({
            title: title,
            body: `<p style="margin: 0; font-size: 15px; line-height: 1.6;">${this.escapeHtml(message)}</p>`,
            buttons: [
                {
                    text: 'Cancel',
                    className: 'btn-secondary',
                    value: false
                },
                {
                    text: 'Confirm',
                    className: 'btn-primary',
                    value: true
                }
            ]
        });
    }

    /**
     * Show a prompt dialog for text input
     * @param {string} message - Prompt message
     * @param {string} defaultValue - Default input value
     * @param {string} title - Dialog title (optional)
     * @returns {Promise<string|null>} Input value or null if cancelled
     */
    prompt(message, defaultValue = '', title = 'Input') {
        const inputId = 'modal-input-' + Date.now();

        return this.show({
            title: title,
            body: `
                <label for="${inputId}" style="display: block; margin-bottom: 8px; font-size: 15px;">
                    ${this.escapeHtml(message)}
                </label>
                <input type="text" 
                       id="${inputId}" 
                       value="${this.escapeHtml(defaultValue)}"
                       style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 15px;">
            `,
            buttons: [
                {
                    text: 'Cancel',
                    className: 'btn-secondary',
                    value: null
                },
                {
                    text: 'OK',
                    className: 'btn-primary',
                    onClick: (modal) => {
                        const input = modal.querySelector(`#${inputId}`);
                        return input.value.trim() || null;
                    }
                }
            ]
        });
    }

    /**
     * Show an alert dialog
     * @param {string} message - Alert message
     * @param {string} title - Dialog title (optional)
     * @returns {Promise<void>}
     */
    alert(message, title = 'Alert') {
        return this.show({
            title: title,
            body: `<p style="margin: 0; font-size: 15px; line-height: 1.6;">${this.escapeHtml(message)}</p>`,
            buttons: [
                {
                    text: 'OK',
                    className: 'btn-primary',
                    value: true
                }
            ]
        });
    }

    /**
     * Show a custom form modal
     * @param {Object} config - Form configuration
     * @param {string} config.title - Form title
     * @param {Array} config.fields - Array of field configs
     * @param {Function} config.onSubmit - Submit handler
     * @returns {Promise<Object|null>} Form data or null if cancelled
     */
    form(config) {
        const formId = 'modal-form-' + Date.now();

        const fieldsHtml = config.fields.map((field, index) => {
            const fieldId = `${formId}-field-${index}`;

            let inputHtml = '';
            switch (field.type) {
                case 'textarea':
                    inputHtml = `
                        <textarea id="${fieldId}" 
                                  name="${field.name}"
                                  rows="${field.rows || 4}"
                                  style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 15px; resize: vertical;">${this.escapeHtml(field.value || '')}</textarea>
                    `;
                    break;
                case 'select':
                    inputHtml = `
                        <select id="${fieldId}" 
                                name="${field.name}"
                                style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 15px;">
                            ${field.options.map(opt => `
                                <option value="${this.escapeHtml(opt.value)}" 
                                        ${opt.value === field.value ? 'selected' : ''}>
                                    ${this.escapeHtml(opt.label)}
                                </option>
                            `).join('')}
                        </select>
                    `;
                    break;
                default: // text input
                    inputHtml = `
                        <input type="${field.type || 'text'}" 
                               id="${fieldId}" 
                               name="${field.name}"
                               value="${this.escapeHtml(field.value || '')}"
                               placeholder="${this.escapeHtml(field.placeholder || '')}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 15px;">
                    `;
            }

            return `
                <div style="margin-bottom: 16px;">
                    <label for="${fieldId}" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500;">
                        ${this.escapeHtml(field.label)}
                        ${field.required ? '<span style="color: var(--danger);">*</span>' : ''}
                    </label>
                    ${inputHtml}
                </div>
            `;
        }).join('');

        return this.show({
            title: config.title,
            body: `<form id="${formId}">${fieldsHtml}</form>`,
            buttons: [
                {
                    text: 'Cancel',
                    className: 'btn-secondary',
                    value: null
                },
                {
                    text: config.submitText || 'Submit',
                    className: 'btn-primary',
                    onClick: (modal) => {
                        const form = modal.querySelector(`#${formId}`);
                        const formData = new FormData(form);
                        const data = {};

                        // Validate required fields
                        for (const field of config.fields) {
                            const value = formData.get(field.name);

                            if (field.required && (!value || !value.trim())) {
                                this.alert(`${field.label} is required`, 'Validation Error');
                                return false; // Don't close modal
                            }

                            data[field.name] = value;
                        }

                        return data;
                    }
                }
            ]
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create singleton instance
const modal = new Modal();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.modal = modal;
}