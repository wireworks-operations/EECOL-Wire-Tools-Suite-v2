/**
 * EECOL Wire Tools Suite - Shared Modal System
 * Enterprise PWA v0.8.0.0
 */

/**
 * IDB SENTINEL: Secure Modal Pattern
 * Strictly avoids innerHTML for dynamic content.
 * Uses textContent for messages and titles, and programmatic
 * element creation for UI components to prevent XSS.
 */

// Helper to create themed buttons securely
function createModalButton(id, text, isPrimary, onClick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = text;

    const primaryClass = "px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold";
    const secondaryClass = "px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold";

    btn.className = isPrimary ? primaryClass : secondaryClass;
    btn.addEventListener('click', onClick);
    return btn;
}

// Reset modal inputs and buttons
function resetModalUI() {
    const modalInput = document.getElementById('modalInput');
    const modalButtons = document.getElementById('modalButtons');
    const modalInputValue = document.getElementById('modalInputValue');
    const modalDateInput = document.getElementById('modalDateInput');

    if (modalInput) modalInput.style.display = 'none';
    if (modalButtons) modalButtons.innerHTML = ''; // Safe because we only clear it
    if (modalInputValue) {
        modalInputValue.style.display = 'none';
        modalInputValue.type = 'text';
        modalInputValue.value = '';
    }
    if (modalDateInput) {
        modalDateInput.style.display = 'none';
        modalDateInput.value = '';
    }
}

// Custom Modal Functions for EECOL Themed Alerts/Confirmations
function showAlert(message, title = "Notification") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        if (!modal) {
            console.warn('Custom modal element not found in DOM');
            resolve();
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalButtons = document.getElementById('modalButtons');

        if (!modalTitle || !modalMessage || !modalButtons) {
            console.warn('Modal elements not found');
            resolve();
            return;
        }

        resetModalUI();

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalMessage.classList.add('whitespace-pre-line');

        const okBtn = createModalButton('modalOKBtn', 'OK', true, () => {
            hideModal();
            resolve();
        });
        modalButtons.appendChild(okBtn);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    });
}

function showConfirm(message, title = "Confirmation") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalButtons = document.getElementById('modalButtons');

        if (!modal || !modalTitle || !modalMessage || !modalButtons) {
            resolve(false);
            return;
        }

        resetModalUI();

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalMessage.classList.add('whitespace-pre-line');

        const cancelBtn = createModalButton('modalCancelBtn', 'Cancel', false, () => {
            hideModal();
            resolve(false);
        });
        cancelBtn.classList.add('mr-2');

        const okBtn = createModalButton('modalOKBtn', 'OK', true, () => {
            hideModal();
            resolve(true);
        });

        modalButtons.appendChild(cancelBtn);
        modalButtons.appendChild(okBtn);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    });
}

function showPrompt(message, defaultValue = '', title = "Input Required") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalInputValue = document.getElementById('modalInputValue');
        const modalButtons = document.getElementById('modalButtons');

        if (!modal || !modalTitle || !modalMessage || !modalButtons || !modalInput || !modalInputValue) {
            console.warn('Prompt modal elements not found');
            resolve(null);
            return;
        }

        resetModalUI();

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.style.display = 'block';
        modalInputValue.style.display = 'block';
        modalInputValue.type = 'text';
        modalInputValue.value = defaultValue;

        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                okBtn.click();
            }
        };

        const cleanup = () => {
            modalInputValue.removeEventListener('keypress', keyHandler);
        };

        const cancelBtn = createModalButton('modalCancelBtn', 'Cancel', false, () => {
            cleanup();
            hideModal();
            resolve(null);
        });
        cancelBtn.classList.add('mr-2');

        const okBtn = createModalButton('modalOKBtn', 'OK', true, () => {
            const val = modalInputValue.value;
            cleanup();
            hideModal();
            resolve(val);
        });

        modalButtons.appendChild(cancelBtn);
        modalButtons.appendChild(okBtn);

        modalInputValue.addEventListener('keypress', keyHandler);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
            modalInputValue.focus();
        }, 10);
    });
}

function showDatePrompt(message, defaultValue = '', title = "Select Date") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalDateInput = document.getElementById('modalDateInput');
        const modalInputValue = document.getElementById('modalInputValue');
        const modalButtons = document.getElementById('modalButtons');

        // Fallback to modalInputValue if modalDateInput is missing
        const inputToUse = modalDateInput || modalInputValue;

        if (!modal || !modalTitle || !modalMessage || !modalButtons || !modalInput || !inputToUse) {
            console.warn('Date prompt modal elements not found');
            resolve(null);
            return;
        }

        resetModalUI();

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.style.display = 'block';
        inputToUse.style.display = 'block';
        inputToUse.type = 'date';
        inputToUse.value = defaultValue || new Date().toISOString().split('T')[0];

        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                okBtn.click();
            }
        };

        const cleanup = () => {
            inputToUse.removeEventListener('keypress', keyHandler);
        };

        const cancelBtn = createModalButton('modalCancelBtn', 'Cancel', false, () => {
            cleanup();
            hideModal();
            resolve(null);
        });
        cancelBtn.classList.add('mr-2');

        const okBtn = createModalButton('modalOKBtn', 'OK', true, () => {
            const val = inputToUse.value;
            cleanup();
            hideModal();
            resolve(val);
        });

        modalButtons.appendChild(cancelBtn);
        modalButtons.appendChild(okBtn);

        inputToUse.addEventListener('keypress', keyHandler);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
            inputToUse.focus();
        }, 10);
    });
}

// Legacy wrapper for backward compatibility
function showDateInputModal(title = "Select Date") {
    return showDatePrompt('Select the date of the record you want to view:', '', title);
}

function hideModal() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('modalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        resetModalUI();
    }, 200);
}

// Initialize modal system with secure defaults
function initModalSystem() {
    document.addEventListener('DOMContentLoaded', function() {
        const modalBackdrop = document.getElementById('modalBackdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', function() {
                // Securely handle backdrop clicks by triggering the negative action
                const cancelBtn = document.getElementById('modalCancelBtn');
                const okBtn = document.getElementById('modalOKBtn');
                if (cancelBtn) {
                    cancelBtn.click();
                } else if (okBtn) {
                    okBtn.click();
                } else {
                    hideModal();
                }
            });
        }
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.showAlert = showAlert;
    window.showConfirm = showConfirm;
    window.showPrompt = showPrompt;
    window.showDatePrompt = showDatePrompt;
    window.showDateInputModal = showDateInputModal;
    window.hideModal = hideModal;
    window.initModalSystem = initModalSystem;
}
