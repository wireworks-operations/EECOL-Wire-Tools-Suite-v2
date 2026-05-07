// Machine Maintenance Checklist - EECOL Wire Tools Suite

// Custom Modal Functions
// Shared data functions for cross-page compatibility
function saveSharedChecklistData(inspectorName, inspectionDate, comments) {
    const sharedData = {
        inspectorName: inspectorName || '',
        inspectionDate: inspectionDate || '',
        comments: comments || '',
        sharedAt: new Date().toISOString()
    };

    // Save to both IndexedDB and localStorage for maximum compatibility
    if (window.eecolDB) {
        window.eecolDB.update('maintenanceLogs', { id: 'shared_checklist_data', ...sharedData });
    }
    localStorage.setItem('maintenanceSharedData', JSON.stringify(sharedData));
}

function loadSharedChecklistData() {
    return new Promise((resolve) => {
        if (window.eecolDB) {
            window.eecolDB.get('maintenanceLogs', 'shared_checklist_data').then(data => {
                if (data && data.sharedAt) {
                    resolve(data);
                } else {
                    // Try localStorage fallback
                    const localData = localStorage.getItem('maintenanceSharedData');
                    if (localData) {
                        try {
                            resolve(JSON.parse(localData));
                        } catch (e) {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                }
            }).catch(() => resolve(null));
        } else {
            // localStorage only
            const localData = localStorage.getItem('maintenanceSharedData');
            if (localData) {
                try {
                    resolve(JSON.parse(localData));
                } catch (e) {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        }
    });
}


// Maintenance checklist data
const machines = [
    'Manual Hand Coiler',
    'Green Electric Hand Coiler',
    'Blue Electric Hand Coiler',
    'Telus Machine',
    'Big Blue Machine # 1',
    'Big Blue Machine # 2'
];

const maintenanceItems = [
    'Frame Welds & Covers',
    'Hoses & Cables',
    'Electrical Connections',
    'Oil Leaks',
    'Hydraulic Hose(s) & Pins',
    'Coller & Reel Bars',
    'Deadman (Foot Switch)',
    'Controls & Operation',
    'Wire Machine Surroundings',
    'Cutting Area Free Of Hazards',
    'Tail Ends Trimmed Or Tacked',
    'Top Wire Spooled From Bottom',
    'PPE Ready & Available'
];

// Initialize checklists
function initializeChecklists() {
    const tbody = document.getElementById('checklistTableBody');
    maintenanceItems.forEach((item, itemIndex) => {
        const row = document.createElement('tr');
        const itemTd = document.createElement('td');
        itemTd.className = 'item-cell';
        itemTd.textContent = item;
        row.appendChild(itemTd);

        for (let i = 1; i <= 6; i++) {
            // Skip checkboxes for Manual Hand Coiler (i=1) on specific items
            const isManualHandCoilerSkip = i === 1 && [1,2,3,4,5,6,7].includes(itemIndex);
            // Skip checkboxes for Green Coiler (i=2) on specific items
            const isGreenCoilerSkip = i === 2 && [3,4,5,7].includes(itemIndex);
            // Skip checkboxes for Blue Coiler (i=3) on specific items
            const isBlueCoilerSkip = i === 3 && [3,4,5].includes(itemIndex);
            if (isManualHandCoilerSkip || isGreenCoilerSkip || isBlueCoilerSkip) {
                const td = document.createElement('td');
                td.className = 'checkbox-cell';
                td.textContent = '-';
                row.appendChild(td);
            } else {
                const td = document.createElement('td');
                td.className = 'checkbox-cell';
                const group = document.createElement('div');
                group.className = 'checkbox-group';

                const ok = document.createElement('input');
                ok.type = 'checkbox';
                ok.className = 'ok-checkbox';
                ok.dataset.machine = i;
                ok.dataset.item = itemIndex;
                group.appendChild(ok);

                const notOk = document.createElement('input');
                notOk.type = 'checkbox';
                notOk.className = 'not-ok-checkbox';
                notOk.dataset.machine = i;
                notOk.dataset.item = itemIndex;
                group.appendChild(notOk);

                td.appendChild(group);
                row.appendChild(td);
            }
        }
        tbody.appendChild(row);
    });

    // Add checkbox event listeners
    document.querySelectorAll('.ok-checkbox, .not-ok-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

// Handle checkbox behavior (only one per row can be selected)
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const machine = checkbox.dataset.machine;
    const item = checkbox.dataset.item;
    const isOk = checkbox.classList.contains('ok-checkbox');

    // Uncheck the other checkbox in this cell
    const otherClass = isOk ? 'not-ok-checkbox' : 'ok-checkbox';
    const otherCheckbox = document.querySelector(`.${otherClass}[data-machine="${machine}"][data-item="${item}"]`);
    if (otherCheckbox) {
        otherCheckbox.checked = false;
    }

    // Auto-save on change
    saveCurrentSession();
}

// Validate checklist completion
async function validateChecklist() {
    // Check inspected by
    if (!document.getElementById('globalInspectedBy').value.trim()) {
        await showAlert('Please enter your name in "Inspected By".', "Validation Error");
        return false;
    }

    // Check date
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('globalInspectionDate').value !== today) {
        await showAlert('Inspection date must be set to today.', "Validation Error");
        return false;
    }

    // Check all required checkboxes are filled
    const skipLists = {
        1: [1,2,3,4,5,6,7], // Manual Hand Coiler skips these item indices
        2: [3,4,5,7],       // Green Electric Hand Coiler skips
        3: [3,4,5]          // Blue Electric Hand Coiler skips
    };

    for (let machine = 1; machine <= 6; machine++) {
        const skipIndexes = skipLists[machine] || [];

        for (let itemIndex = 0; itemIndex < maintenanceItems.length; itemIndex++) {
            // Skip items based on machine-specific skip list
            if (skipIndexes.includes(itemIndex)) continue;

            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${machine}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${machine}"][data-item="${itemIndex}"]`);

            const okChecked = okCheckbox?.checked || false;
            const notOkChecked = notOkCheckbox?.checked || false;

            if (!okChecked && !notOkChecked && okCheckbox && notOkCheckbox) {
                await showAlert(`Item "${maintenanceItems[itemIndex]}" for ${machines[machine-1]} must be marked as OK or NG.`, "Validation Error");
                return false;
            }
            if (okChecked && notOkChecked) {
                await showAlert(`Only one checkbox per item should be selected for ${machines[machine-1]}.`, "Validation Error");
                return false;
            }
        }
    }

    return true;
}

// Save current session (work-in-progress) to temporary storage
function saveCurrentSession() {
    const state = {};
    state.globalInspectedBy = document.getElementById('globalInspectedBy').value || '';
    state.globalInspectionDate = document.getElementById('globalInspectionDate').value || '';
    state.comments = document.getElementById('comments').value || '';
    state.savedAt = new Date().toISOString(); // Timestamp for current session

    // Also save shared data for cross-page compatibility
    saveSharedChecklistData(state.globalInspectedBy, state.globalInspectionDate, state.comments);

    for (let i = 1; i <= 6; i++) {
        state[`machine-${i}`] = {
            checks: []
        };

        maintenanceItems.forEach((item, itemIndex) => {
            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
            state[`machine-${i}`].checks.push({
                ok: okCheckbox ? okCheckbox.checked : false,
                notOk: notOkCheckbox ? notOkCheckbox.checked : false
            });
        });
    }

    // Save to IndexedDB
    if (window.eecolDB) {
        window.eecolDB.update('maintenanceLogs', { id: 'current_session', ...state }).catch(error => {
            console.error('Failed to save current session to database:', error);
            // Fallback to localStorage
            localStorage.setItem('maintenanceCurrentSession', JSON.stringify(state));
        });
    } else {
        // Fallback to localStorage
        localStorage.setItem('maintenanceCurrentSession', JSON.stringify(state));
    }
}

// Restore current session (work-in-progress) from temporary storage
function restoreCurrentSession() {
    if (window.eecolDB) {
        window.eecolDB.get('maintenanceLogs', 'current_session').then(data => {
            if (data && data.savedAt) {
                loadDataIntoForm(data);
                setTodaysDate(); // Force date to today
            } else {
                // No session data, try to load shared data instead
                loadSharedDataIntoForm();
            }
        }).catch(() => {
            // Fallback to localStorage
            const state = localStorage.getItem('maintenanceCurrentSession');
            if (state) {
                try {
                    const data = JSON.parse(state);
                    loadDataIntoForm(data);
                    setTodaysDate(); // Force date to today
                } catch (e) {
                    console.error('Error loading current session from localStorage:', e);
                    // Try shared data fallback
                    loadSharedDataIntoForm();
                }
            } else {
                // Try shared data fallback
                loadSharedDataIntoForm();
            }
        });
    } else {
        // Fallback to localStorage
        const state = localStorage.getItem('maintenanceCurrentSession');
        if (state) {
            try {
                const data = JSON.parse(state);
                loadDataIntoForm(data);
                setTodaysDate(); // Force date to today
            } catch (e) {
                console.error('Error loading current session from localStorage:', e);
                // Try shared data fallback
                loadSharedDataIntoForm();
            }
        } else {
            // Try shared data fallback
            loadSharedDataIntoForm();
        }
    }
}

// Clear current session from temporary storage
function clearCurrentSession() {
    if (window.eecolDB) {
        window.eecolDB.delete('maintenanceLogs', 'current_session').catch(error => {
            console.error('Failed to clear current session from database:', error);
            // Fallback
            localStorage.removeItem('maintenanceCurrentSession');
        });
    } else {
        localStorage.removeItem('maintenanceCurrentSession');
    }
}

// Save checklist state to database
function saveChecklistState() {
    const state = {};
    state.globalInspectedBy = document.getElementById('globalInspectedBy').value || '';
    state.globalInspectionDate = document.getElementById('globalInspectionDate').value || '';
    state.comments = document.getElementById('comments').value || '';
    state.completedAt = new Date().toISOString(); // Timestamp completion

    for (let i = 1; i <= 6; i++) {
        state[`machine-${i}`] = {
            checks: []
        };

        maintenanceItems.forEach((item, itemIndex) => {
            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
            state[`machine-${i}`].checks.push({
                ok: okCheckbox ? okCheckbox.checked : false,
                notOk: notOkCheckbox ? notOkCheckbox.checked : false
            });
        });
    }

    // Save to IndexedDB
    if (window.eecolDB) {
        const dateKey = new Date().toISOString().split('T')[0]; // Use date as key
        window.eecolDB.update('maintenanceLogs', { id: dateKey, ...state }).then(() => {
            // Also update the daily check with inspector info for index page alerts
            window.eecolDB.update('maintenanceLogs', {
                id: 'daily_check',
                completedAt: state.completedAt,
                inspectorName: state.globalInspectedBy,
                inspectionDate: state.globalInspectionDate,
                comments: state.comments
            }).catch(() => {
                // Ignore daily_check errors
            });
            // Also save shared data for cross-page compatibility (name/date/comments)
            saveSharedChecklistData(state.globalInspectedBy, state.globalInspectionDate, state.comments);
            // Clear current session after completion
            clearCurrentSession();
        }).catch(error => {
            console.error('Failed to save to database:', error);
            // Fallback to localStorage
            localStorage.setItem('machineMaintenanceChecklist', JSON.stringify(state));
            // Also set daily_check in localStorage for notification system
            localStorage.setItem('daily_check', JSON.stringify({
                completedAt: state.completedAt,
                inspectorName: state.globalInspectedBy,
                inspectionDate: state.globalInspectionDate,
                comments: state.comments
            }));
            localStorage.removeItem('maintenanceCurrentSession');
        });
    } else {
        // Fallback to localStorage
        localStorage.setItem('machineMaintenanceChecklist', JSON.stringify(state));
        localStorage.removeItem('maintenanceCurrentSession');
    }
}

// Load checklist state for today
function loadChecklistState() {
    if (window.eecolDB) {
        const today = new Date().toISOString().split('T')[0];
        window.eecolDB.get('maintenanceLogs', today).then(data => {
            if (!data || !data.completedAt) {
                return;
            }
            loadDataIntoForm(data);
            // Disable complete button since already completed today
            const completeBtn = document.getElementById('completeBtn');
            completeBtn.disabled = true;
            completeBtn.textContent = '✅ Completed Today';
            completeBtn.classList.add('bg-gray-400');
            completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        }).catch((error) => {
            // Fallback to localStorage
            const state = localStorage.getItem('machineMaintenanceChecklist');
            if (!state) {
                return;
            }
            try {
                const data = JSON.parse(state);
                if (!data.completedAt) {
                    return;
                }
                const completedDate = new Date(data.completedAt).toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];
                if (completedDate !== today) {
                    return;
                }
                loadDataIntoForm(data);
                const completeBtn = document.getElementById('completeBtn');
                completeBtn.disabled = true;
                completeBtn.textContent = '✅ Completed Today';
                completeBtn.classList.add('bg-gray-400');
                completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            } catch (e) {
                console.error('Error loading checklist state from localStorage:', e);
            }
        });
    } else {
        // Fallback to localStorage
        const state = localStorage.getItem('machineMaintenanceChecklist');
        if (!state) {
            return;
        }

        try {
            const data = JSON.parse(state);

            // Check if completed
            if (!data.completedAt) {
                return;
            }

            const completedDate = new Date(data.completedAt).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];

            // Load data only if completed for today
            if (completedDate !== today) {
                return;
            }

            loadDataIntoForm(data);

            // Disable complete button since already completed today
            const completeBtn = document.getElementById('completeBtn');
            completeBtn.disabled = true;
            completeBtn.textContent = '✅ Completed Today';
            completeBtn.classList.add('bg-gray-400');
            completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        } catch (e) {
            console.error('Error loading checklist state:', e);
        }
    }
}

function loadDataIntoForm(data) {
    // Load global fields
    document.getElementById('globalInspectedBy').value = data.globalInspectedBy || '';
    document.getElementById('globalInspectionDate').value = data.globalInspectionDate || '';

    // Load checkbox states
    for (let i = 1; i <= 6; i++) {
        const machineData = data[`machine-${i}`];
        if (machineData && machineData.checks) {
            machineData.checks.forEach((check, itemIndex) => {
                const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
                const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);

                if (okCheckbox && notOkCheckbox) {
                    okCheckbox.checked = check.ok || false;
                    notOkCheckbox.checked = check.notOk || false;
                }
            });
        }
    }

    // Set global comments
    document.getElementById('comments').value = data.comments || '';
}

// Load shared data into form fields (cross-page compatibility)
function loadSharedDataIntoForm() {
    loadSharedChecklistData().then(sharedData => {
        if (sharedData) {
            // Load shared fields
            document.getElementById('globalInspectedBy').value = sharedData.inspectorName || '';
            document.getElementById('globalInspectionDate').value = sharedData.inspectionDate || '';
            document.getElementById('comments').value = sharedData.comments || '';

            // Force date to today
            setTodaysDate();
        }
    }).catch(error => {
        console.error('Error loading shared data into form:', error);
    });
}

// Load historical record by date with migration capability
async function loadHistoricalRecord(date) {
    try {
        let data = await window.eecolDB.get('maintenanceLogs', date);
        let dataSource = 'IndexedDB';

        // If no data in IndexedDB, try localStorage fallback
        if (!data || !data.completedAt) {
            const localStorageKey = `machineMaintenanceChecklist_${date}`;
            const localStorageData = localStorage.getItem(localStorageKey);

            if (localStorageData) {
                try {
                    data = JSON.parse(localStorageData);
                    dataSource = 'localStorage (migrating)';

                    // Migrate to IndexedDB
                    await window.eecolDB.update('maintenanceLogs', { id: date, ...data });
                } catch (parseError) {
                    console.error('Error parsing localStorage data:', parseError);
                }
            }
        }

        if (data && data.completedAt) {
            // Save current session before switching to historical view
            saveCurrentSession();
            loadDataIntoForm(data);
            // Make form read-only and add return to current session button
            makeFormReadOnlyForHistorical(true);
            const today = new Date().toISOString().split('T')[0];
            const message = date === today
                ? `Current day record loaded for ${date}. Form is in read-only mode. (Loaded from ${dataSource})`
                : `Historical record loaded for ${date}. Form is in read-only mode. (Loaded from ${dataSource})`;
            await showAlert(message);
        } else {
            await showAlert(`No maintenance record found for ${date}.`, "Record Not Found");
        }
    } catch (error) {
        console.error('Error loading historical record:', error);
        await showAlert('Failed to load historical record. Please check your data storage.', "Error");
    }
}

function makeFormReadOnly(readOnly = true) {
    // Disable inputs
    document.getElementById('globalInspectedBy').disabled = readOnly;
    document.getElementById('globalInspectionDate').disabled = readOnly;
    document.getElementById('comments').disabled = readOnly;

    // Disable checkboxes
    document.querySelectorAll('.ok-checkbox, .not-ok-checkbox').forEach(checkbox => {
        checkbox.disabled = readOnly;
    });

    // Update complete button
    const completeBtn = document.getElementById('completeBtn');
    if (readOnly) {
        completeBtn.disabled = true;
        completeBtn.textContent = '📖 View Mode';
        completeBtn.classList.add('bg-gray-400');
        completeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    }
}

function makeFormReadOnlyForHistorical(readOnly = true) {
    // Make form read-only similar to makeFormReadOnly
    document.getElementById('globalInspectedBy').disabled = readOnly;
    document.getElementById('globalInspectionDate').disabled = readOnly;
    document.getElementById('comments').disabled = readOnly;

    // Disable checkboxes
    document.querySelectorAll('.ok-checkbox, .not-ok-checkbox').forEach(checkbox => {
        checkbox.disabled = readOnly;
    });

    // Update complete button to be a "Return to Current Session" button
    const completeBtn = document.getElementById('completeBtn');
    if (readOnly) {
        completeBtn.disabled = false;
        completeBtn.textContent = '⬅️ Back to Current';
        completeBtn.classList.remove('bg-gray-400', 'bg-green-600', 'hover:bg-green-700');
        completeBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');

        // Remove existing event listener and add new one for returning to current session
        completeBtn.removeEventListener('click', completeBtn._completeHandler);
        completeBtn.addEventListener('click', returnToCurrentSession);
    }
}

async function returnToCurrentSession() {
    // Restore current session
    restoreCurrentSession();

    // Clear read-only state
    makeFormReadOnly(false);

    // Restore complete button functionality
    const completeBtn = document.getElementById('completeBtn');
    completeBtn.textContent = '✅ Complete';
    completeBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
    completeBtn.classList.add('bg-green-600', 'hover:bg-green-700');

    // Remove return to current session listener and restore complete functionality
    completeBtn.removeEventListener('click', returnToCurrentSession);
    setupCompleteFunctionality();

    await showAlert('Returned to current session. Your previous work has been restored.');
}

// Set today's date in inspection date fields
function setTodaysDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('globalInspectionDate');
    if (dateInput) {
        dateInput.value = today;
    }
}

// Complete functionality
async function setupCompleteFunctionality() {
    const completeHandler = async () => {
        if (await validateChecklist()) {
            // Disable button immediately to prevent multiple clicks
            const completeBtn = document.getElementById('completeBtn');
            completeBtn.disabled = true;
            completeBtn.textContent = '⏳ Saving...';

            try {
                await saveChecklistState(); // Wait for save to complete

                // Refresh current view to ensure it's showing the completed state
                await loadChecklistState(); // Reload to handle completion state properly

                await showAlert('Maintenance checklist completed successfully! All fields are now read-only.', 'Success');
            } catch (error) {
                console.error('Error completing checklist:', error);
                // Re-enable button on error
                completeBtn.disabled = false;
                completeBtn.textContent = '✅ Complete';
                await showAlert('Error saving checklist. Please try again.', 'Error');
            }
        }
    };

    const completeBtn = document.getElementById('completeBtn');
    completeBtn.addEventListener('click', completeHandler);
    // Store handler reference for potential removal
    completeBtn._completeHandler = completeHandler;
}

// View Past Log functionality
async function setupViewPastLogFunctionality() {
    document.getElementById('viewPastLogBtn').addEventListener('click', async () => {
        const selectedDate = await showDateInputModal('View Past Maintenance Log');
        if (selectedDate) {
            await loadHistoricalRecord(selectedDate);
        }
    });
}

// Print functionality
function setupPrintFunctionality() {
    document.getElementById('printBtn').addEventListener('click', () => {
        if (window.printMachineMaintenanceChecklist) {
            window.printMachineMaintenanceChecklist();
        } else {
            window.print(); // fallback
        }
    });
}

// Setup auto-save for text inputs
function setupAutoSave() {
    const inputs = [
        'globalInspectedBy',
        'globalInspectionDate',
        'comments'
    ];

    // Simple debounce to prevent excessive writes
    let timeout;
    const debouncedSave = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveCurrentSession();
        }, 500);
    };

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debouncedSave);
        }
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize modal system
    if (window.initModalSystem) window.initModalSystem();

    // Initialize database if not already done (important for maintenance checklist pages)
    if (typeof EECOLIndexedDB !== 'undefined' && !window.eecolDB) {
        try {
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;
        } catch (error) {
            console.error('Failed to initialize database for maintenance checklist:', error);
        }
    }

    initializeChecklists();
    setupAutoSave(); // Initialize auto-save listeners
    loadChecklistState();
    restoreCurrentSession(); // Restore any saved current work session
    setTodaysDate();
    setupPrintFunctionality();
    setupCompleteFunctionality();
    setupViewPastLogFunctionality();
});

// Initialize mobile menu
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📋 Alternate Checklist', href: '../machine-maintenance-checklist/machine-maintenance-checklist-multi.html', class: 'bg-teal-600 hover:bg-teal-700' },
            { text: '📅 View Past Log', action: 'click', selector: '#viewPastLogBtn', class: 'bg-blue-500 hover:bg-blue-600' },
            { text: '🖨️ Print Checklist', action: 'click', selector: '#printBtn', class: 'bg-blue-700 hover:bg-blue-800' },
            { text: '✅ Complete', action: 'click', selector: '#completeBtn', class: 'bg-green-600 hover:bg-green-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Machine Maintenance Checklist'
    });
}
