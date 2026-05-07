// Machine Maintenance Checklist Multi-Page - EECOL Wire Tools Suite

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
    'Coiler & Reel Bars',
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
    const skipLists = {
        1: [1,2,3,4,5,6,7], // Manual Hand Coiler skips these item indices
        2: [3,4,5,7],       // Green Electric Hand Coiler skips
        3: [3,4,5]          // Blue Electric Hand Coiler skips
    };

    for (let i = 1; i <= 6; i++) {
        const tbody = document.getElementById(`checklist-${i}`);
        maintenanceItems.forEach((item, itemIndex) => {
            const skipIndexes = skipLists[i] || [];
            if (!skipIndexes.includes(itemIndex)) {
                const row = document.createElement('tr');

                const itemTd = document.createElement('td');
                itemTd.className = 'item-cell';
                itemTd.textContent = item;
                row.appendChild(itemTd);

                const okTd = document.createElement('td');
                okTd.className = 'checkbox-cell';
                const okInput = document.createElement('input');
                okInput.type = 'checkbox';
                okInput.className = 'ok-checkbox';
                okInput.dataset.machine = i;
                okInput.dataset.item = itemIndex;
                okTd.appendChild(okInput);
                row.appendChild(okTd);

                const notOkTd = document.createElement('td');
                notOkTd.className = 'checkbox-cell';
                const notOkInput = document.createElement('input');
                notOkInput.type = 'checkbox';
                notOkInput.className = 'not-ok-checkbox';
                notOkInput.dataset.machine = i;
                notOkInput.dataset.item = itemIndex;
                notOkTd.appendChild(notOkInput);
                row.appendChild(notOkTd);

                tbody.appendChild(row);
            }
        });
    }

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

    // Uncheck the other checkbox in this row
    const tbody = document.getElementById(`checklist-${machine}`);
    const otherCheckbox = tbody.querySelector(`input[data-item="${item}"]:not(.${checkbox.className.replace(' ', '.')})`);
    if (otherCheckbox) {
        otherCheckbox.checked = false;
    }

    // Auto-save on change
    saveCurrentSession();
}

// Validate checklist completion - all machines must have their data filled
async function validateChecklist() {
    const today = new Date().toISOString().split('T')[0];

    for (let i = 1; i <= 6; i++) {
        // Check inspected by
        const inspectedBy = document.getElementById(`inspectedBy-${i}`).value.trim();
        if (!inspectedBy) {
            await showAlert(`Please enter "Inspected By" for ${machines[i-1]}.`, "Validation Error");
            return false;
        }

        // Check date
        const inspectionDate = document.getElementById(`inspectionDate-${i}`).value;
        if (inspectionDate !== today) {
            await showAlert(`Inspection date for ${machines[i-1]} must be set to today.`, "Validation Error");
            return false;
        }

        // Check all required checkboxes are filled for this machine
        const skipIndexes = (function() {
            const skips = { 1: [1,2,3,4,5,6,7], 2: [3,4,5,7], 3: [3,4,5] };
            return skips[i] || [];
        })();

        for (let itemIndex = 0; itemIndex < maintenanceItems.length; itemIndex++) {
            // Skip items based on machine-specific skip list
            if (skipIndexes.includes(itemIndex)) continue;

            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);

            const okChecked = okCheckbox?.checked || false;
            const notOkChecked = notOkCheckbox?.checked || false;

            if (!okChecked && !notOkChecked && okCheckbox && notOkCheckbox) {
                await showAlert(`Item "${maintenanceItems[itemIndex]}" for ${machines[i-1]} must be marked as OK or NG.`, "Validation Error");
                return false;
            }
            if (okChecked && notOkChecked) {
                await showAlert(`Only one checkbox per item should be selected for ${machines[i-1]}.`, "Validation Error");
                return false;
            }
        }
    }

    return true;
}

// Save current session (work-in-progress) to temporary storage
function saveCurrentSession() {
    const state = {};
    state.savedAt = new Date().toISOString(); // Timestamp for current session

    // For multi-page format, use first machine's data for shared fields
    const firstMachineInspectedBy = document.getElementById('inspectedBy-1').value || '';
    const firstMachineInspectionDate = document.getElementById('inspectionDate-1').value || '';
    const firstMachineComments = document.getElementById('comments-1').value || '';

    // Also save shared data for cross-page compatibility
    saveSharedChecklistData(firstMachineInspectedBy, firstMachineInspectionDate, firstMachineComments);

    for (let i = 1; i <= 6; i++) {
        state[`machine-${i}`] = {
            inspectedBy: document.getElementById(`inspectedBy-${i}`).value,
            inspectionDate: document.getElementById(`inspectionDate-${i}`).value,
            comments: document.getElementById(`comments-${i}`).value,
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
        window.eecolDB.update('maintenanceLogs', { id: 'current_session', ...state }).then(() => {

        }).catch(error => {
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
                }
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
            }
        }
    }
}

// Clear current session from temporary storage
function clearCurrentSession() {
    if (window.eecolDB) {
        window.eecolDB.delete('maintenanceLogs', 'current_session').then(() => {
        }).catch(error => {
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
    state.completedAt = new Date().toISOString(); // Timestamp completion

    // Define variables from first machine's data (fix undefined variable bug)
    const firstMachineInspectedBy = document.getElementById('inspectedBy-1')?.value || '';
    const firstMachineInspectionDate = document.getElementById('inspectionDate-1')?.value || '';
    const firstMachineComments = document.getElementById('comments-1')?.value || '';

    for (let i = 1; i <= 6; i++) {
        state[`machine-${i}`] = {
            inspectedBy: document.getElementById(`inspectedBy-${i}`).value,
            inspectionDate: document.getElementById(`inspectionDate-${i}`).value,
            comments: document.getElementById(`comments-${i}`).value,
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
            // Also update the daily check with complete inspector info for alert system compatibility
            window.eecolDB.update('maintenanceLogs', {
                id: 'daily_check',
                completedAt: state.completedAt,
                inspectorName: firstMachineInspectedBy,
                inspectionDate: firstMachineInspectionDate,
                comments: firstMachineComments
            }).catch(() => {
                // Ignore daily_check errors
            });
            // Clear current session after completion
            clearCurrentSession();
            // Also clear any shared data after successful completion
            if (window.eecolDB) {
                window.eecolDB.delete('maintenanceLogs', 'shared_checklist_data').catch(() => {});
            }
            localStorage.removeItem('maintenanceSharedData');
        }).catch(error => {
            console.error('Failed to save to database:', error);
            // Fallback to localStorage
            localStorage.setItem('machineMaintenanceChecklist', JSON.stringify(state));
            localStorage.setItem('daily_check', JSON.stringify({
                completedAt: state.completedAt,
                inspectorName: firstMachineInspectedBy,
                inspectionDate: firstMachineInspectionDate,
                comments: firstMachineComments
            }));
            localStorage.removeItem('maintenanceCurrentSession');
            localStorage.removeItem('maintenanceSharedData');
        });
    } else {
        // Fallback to localStorage
        localStorage.setItem('machineMaintenanceChecklist', JSON.stringify(state));
        localStorage.setItem('daily_check', JSON.stringify({
            completedAt: state.completedAt,
            inspectorName: firstMachineInspectedBy,
            inspectionDate: firstMachineInspectionDate,
            comments: firstMachineComments
        }));
        localStorage.removeItem('maintenanceCurrentSession');
        localStorage.removeItem('maintenanceSharedData');
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
    for (let i = 1; i <= 6; i++) {
        const machineData = data[`machine-${i}`];
        if (machineData) {
            document.getElementById(`inspectedBy-${i}`).value = machineData.inspectedBy || '';
            document.getElementById(`inspectionDate-${i}`).value = machineData.inspectionDate || '';
            document.getElementById(`comments-${i}`).value = machineData.comments || '';

            // Try to load checkbox states
            if (machineData.checks && Array.isArray(machineData.checks)) {
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
    }
}

// Load shared data into multi-page form fields (cross-page compatibility)
function loadSharedDataIntoMultiPageForm() {
    loadSharedChecklistData().then(sharedData => {
        if (sharedData) {
            // Load shared data into all machine fields for consistency
            for (let i = 1; i <= 6; i++) {
                if (document.getElementById(`inspectedBy-${i}`)) {
                    document.getElementById(`inspectedBy-${i}`).value = sharedData.inspectorName || '';
                }
                if (document.getElementById(`inspectionDate-${i}`)) {
                    document.getElementById(`inspectionDate-${i}`).value = sharedData.inspectionDate || '';
                }
                if (document.getElementById(`comments-${i}`)) {
                    document.getElementById(`comments-${i}`).value = sharedData.comments || '';
                }
            }

            // Force date to today
            setTodaysDate();
        }
    }).catch(error => {
        console.error('Error loading shared data into multi-page form:', error);
    });
}

// Sync multi-page form changes to shared data in real-time
function setupMultiPageFieldSync() {
    for (let i = 1; i <= 6; i++) {
        // Sync name field changes
        const nameField = document.getElementById(`inspectedBy-${i}`);
        if (nameField) {
            nameField.addEventListener('input', function() {
                syncFirstMachineDataToShared();
            });
        }

        // Sync date field changes
        const dateField = document.getElementById(`inspectionDate-${i}`);
        if (dateField) {
            dateField.addEventListener('input', function() {
                syncFirstMachineDataToShared();
            });
        }

        // Sync comments field changes
        const commentsField = document.getElementById(`comments-${i}`);
        if (commentsField) {
            commentsField.addEventListener('input', function() {
                syncFirstMachineDataToShared();
            });
        }
    }
}

// Sync first machine's data to shared storage (real-time)
function syncFirstMachineDataToShared() {
    const firstMachineName = document.getElementById('inspectedBy-1')?.value || '';
    const firstMachineDate = document.getElementById('inspectionDate-1')?.value || '';
    const firstMachineComments = document.getElementById('comments-1')?.value || '';

    // Only sync if we have data to share
    if (firstMachineName || firstMachineDate || firstMachineComments) {
        saveSharedChecklistData(firstMachineName, firstMachineDate, firstMachineComments);
    }
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
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`inspectedBy-${i}`).disabled = readOnly;
        document.getElementById(`inspectionDate-${i}`).disabled = readOnly;
        document.getElementById(`comments-${i}`).disabled = readOnly;
    }

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
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`inspectedBy-${i}`).disabled = readOnly;
        document.getElementById(`inspectionDate-${i}`).disabled = readOnly;
        document.getElementById(`comments-${i}`).disabled = readOnly;
    }

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
    for (let i = 1; i <= 6; i++) {
        const dateInput = document.getElementById(`inspectionDate-${i}`);
        if (dateInput) {
            dateInput.value = today;
        }
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
        if (window.printMachineMaintenanceChecklistMultiPage) {
            window.printMachineMaintenanceChecklistMultiPage();
        } else {
            window.print(); // fallback
        }
    });
}

// Setup auto-save for text inputs
function setupAutoSave() {
    // Simple debounce to prevent excessive writes
    let timeout;
    const debouncedSave = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveCurrentSession();
        }, 500);
    };

    for (let i = 1; i <= 6; i++) {
        const inputs = [
            `inspectedBy-${i}`,
            `inspectionDate-${i}`,
            `comments-${i}`
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', debouncedSave);
            }
        });
    }
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
            console.error('Failed to initialize database for multi-page maintenance checklist:', error);
        }
    }

    initializeChecklists();
    setupAutoSave(); // Initialize auto-save listeners
    loadChecklistState();
    restoreCurrentSession(); // Restore any saved current work session

    // Load shared data for cross-page compatibility
    loadSharedDataIntoMultiPageForm();

    // Setup real-time field synchronization
    setupMultiPageFieldSync();

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
            { text: '📋 Main Checklist', href: '../machine-maintenance-checklist/machine-maintenance-checklist.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '📅 View Past Log', action: 'click', selector: '#viewPastLogBtn', class: 'bg-blue-500 hover:bg-blue-600' },
            { text: '🖨️ Print Checklist', action: 'click', selector: '#printBtn', class: 'bg-blue-700 hover:bg-blue-800' },
            { text: '✅ Complete', action: 'click', selector: '#completeBtn', class: 'bg-green-600 hover:bg-green-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Machine Maintenance Checklist (Multi-Page)'
    });
}
