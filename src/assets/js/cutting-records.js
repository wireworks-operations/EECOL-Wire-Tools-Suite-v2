/**
 * EECOL Wire Cut Records Tool - JavaScript Module
 * Modern IndexedDB implementation with P2P sync capability
 */

// Global variables
let cutRecords = [];

/**
 * BOLT OPTIMIZATION: High-performance date formatters
 * Pre-initializing Intl.DateTimeFormat instances at module scope is significantly faster
 * than calling toLocaleString() inside render loops, as it avoids repeated parsing of
 * locale strings and options.
 */
const shortDateTimeFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
});

const fullDateTimeFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

/**
 * BOLT OPTIMIZATION: Debounce utility
 * Limits the rate at which a function can fire. Essential for search inputs to prevent
 * expensive O(N) filtering and re-rendering on every single keystroke.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
let editingId = null;
let displayedRecordsCount = 0;
let recordsPerPage = 25;
let isLoading = false;
let currentSortField = 'timestamp'; // Default sort by timestamp
let lastDeltaExport = null;
let undoStack = [];
let redoStack = [];
let maxHistorySize = 20; // Keep last 20 states
let batchUndoStack = [];
let batchRedoStack = [];

// Wire Cut List variables
let wireCutList = [];
let wireListEditingId = null;
let currentContextMenuId = null;
let draggedItemId = null;

// Diagnostic function to test database connectivity
async function testDatabaseConnection() {

    try {
        // Check if EECOLIndexedDB is available
        if (typeof EECOLIndexedDB === 'undefined') {
            console.error('❌ EECOLIndexedDB class not found');
            return { success: false, error: 'EECOLIndexedDB class not available' };
        }

        // Check if database instance exists
        if (!window.eecolDB) {
            console.error('❌ Database instance not found');
            return { success: false, error: 'Database instance not initialized' };
        }

        // Check if database is ready
        const isReady = await window.eecolDB.isReady();
        if (!isReady) {
            console.error('❌ Database not ready');
            return { success: false, error: 'Database not ready' };
        }

        // Test basic operations

        // Test getting all records
        const records = await window.eecolDB.getAll('cuttingRecords');

        // Test adding a temporary record
        const testRecord = {
            id: 'test-' + Date.now(),
            wireId: 'TEST',
            cutLength: 1.0,
            cutLengthUnit: 'm',
            cutterName: 'TEST',
            lineCode: 'L:001',
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const addResult = await window.eecolDB.add('cuttingRecords', testRecord);

        // Verify the record was added
        const verifyRecord = await window.eecolDB.get('cuttingRecords', testRecord.id);
        if (verifyRecord) {

            // Clean up test record
            await window.eecolDB.delete('cuttingRecords', testRecord.id);
        } else {
            console.error('❌ Test record verification failed');
        }

        // Test settings store
        const testSetting = { name: 'testSetting', value: 'testValue' };
        await window.eecolDB.update('settings', testSetting);
        const retrievedSetting = await window.eecolDB.get('settings', 'testSetting');
        if (retrievedSetting && retrievedSetting.value === 'testValue') {
            await window.eecolDB.delete('settings', 'testSetting');
        } else {
            console.error('❌ Settings store test failed');
        }

        return {
            success: true,
            recordCount: records.length,
            message: `Database is working correctly. Found ${records.length} existing records.`
        };

    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return {
            success: false,
            error: error.message,
            details: error
        };
    }
}

// Make diagnostic function available globally for debugging
if (typeof window !== 'undefined') {
    window.testDatabaseConnection = testDatabaseConnection;
}

// IndexedDB-based data loading and saving functions (Fresh Database)
async function loadCutRecords() {
    try {
        // Load from IndexedDB (fresh database)
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('cuttingRecords');
            if (records && records.length > 0) {
                cutRecords = records.sort((a, b) => b.timestamp - a.timestamp);
                displayedRecordsCount = 0;
                renderCutRecords();
                updateStats(); // Initial stats calculation
                updateExportStatus();
                return;
            }
        }

        // Fresh database starts empty - no fallback needed
        cutRecords = [];
        displayedRecordsCount = 0;
        renderCutRecords();
        updateStats();
        updateExportStatus();

    } catch (error) {
        console.error("Error loading cut records:", error);
        await showAlert("Error loading cut records. Please refresh the page.", "Loading Error");
    }
}

async function saveCutRecordToDB(record) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const result = await window.eecolDB.add('cuttingRecords', record);

            // Verify the save worked
            const verification = await window.eecolDB.get('cuttingRecords', record.id);
            if (verification) {
            } else {
                console.error("❌ Save verification failed for record:", record.id);
            }

            return result;
        } else {
            console.error("❌ Database not available or not ready");
            console.log("Database status:", {
                eecolDBExists: !!window.eecolDB,
                isReady: window.eecolDB ? await window.eecolDB.isReady() : false
            });
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("❌ Error saving cut record:", error);
        console.error("Record that failed to save:", record);
        throw error;
    }
}

async function updateCutRecordInDB(record) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('cuttingRecords', record);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error updating cut record:", error);
        throw error;
    }
}

async function deleteCutRecordFromDB(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('cuttingRecords', id);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error deleting cut record:", error);
        throw error;
    }
}

async function clearAllCutRecordsFromDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.clear('cuttingRecords');
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error clearing cut records:", error);
        throw error;
    }
}

function updateExportStatus() {
    function setExportDisplay(element, timestamp) {
        if (!element) return;
        element.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

        if (!timestamp) {
            const a = document.createElement('a');
            a.href = '#';
            a.onclick = (e) => { e.preventDefault(); exportJSONBackup(); };
            a.style.color = '#f59e0b';
            a.style.fontWeight = '600';
            a.style.textDecoration = 'underline';
            a.textContent = 'Never exported';
            element.appendChild(a);
            return;
        }

        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const isStale = diffDays > 3;

        if (isStale) {
            const a = document.createElement('a');
            a.href = '#';
            a.onclick = (e) => { e.preventDefault(); exportJSONBackup(); };
            a.textContent = diffDays > 7 ? date.toLocaleDateString() : `${diffDays} days ago`;
            element.appendChild(a);
            return;
        }

        let text = '';
        if (diffDays === 0) {
            text = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (diffDays === 1) {
            text = 'Yesterday';
        } else if (diffDays < 7) {
            text = `${diffDays} days ago`;
        } else {
            text = date.toLocaleDateString();
        }
        element.textContent = text;
    }

    // Try to get from IndexedDB first
    const jsonEl = document.getElementById('lastJsonExport');
    if (window.eecolDB && window.eecolDB.isReady()) {
        window.eecolDB.get('settings', 'lastJsonExport').then((jsonExport) => {
            setExportDisplay(jsonEl, jsonExport?.value);
        }).catch(() => {
            setExportDisplay(jsonEl, null);
        });
    } else {
        setExportDisplay(jsonEl, null);
    }
}

// Quick Stats bar update logic
async function updateStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    /**
     * BOLT OPTIMIZATION: Single-pass metrics calculation
     * Consolidates 6 redundant O(N) passes (filter, reduce, forEach) into a single iteration
     * to avoid redundant passes over the cutRecords dataset as it grows.
     */
    let totalCutsToday = 0;
    let totalLength = 0;
    let fullPicksCount = 0;
    let systemCutsCount = 0;
    const cutterCounts = {};
    const customerCounts = {};

    for (const r of cutRecords) {
        // Daily cuts
        if (r.timestamp >= todayStart) totalCutsToday++;

        // Total length
        totalLength += (r.cutLength || 0);

        // Full picks
        if (r.isFullPick === true) fullPicksCount++;

        // System cuts
        if (r.isSystemCut === true) systemCutsCount++;

        // Cutter activity
        if (r.cutterName) {
            cutterCounts[r.cutterName] = (cutterCounts[r.cutterName] || 0) + 1;
        }

        // Customer activity
        if (r.customerName) {
            customerCounts[r.customerName] = (customerCounts[r.customerName] || 0) + 1;
        }
    }

    // Post-processing: Calculate most active cutter
    let topCutter = '-';
    let maxCuts = 0;
    for (const [cutter, count] of Object.entries(cutterCounts)) {
        if (count > maxCuts) {
            maxCuts = count;
            topCutter = cutter;
        }
    }

    // Post-processing: Calculate most active customer
    let topCustomer = '-';
    let maxCutsCustomer = 0;
    for (const [customer, count] of Object.entries(customerCounts)) {
        if (count > maxCutsCustomer) {
            maxCutsCustomer = count;
            topCustomer = customer;
        }
    }

    // Update DOM
    const cutsTodayEl = document.getElementById('cutsToday');
    if (cutsTodayEl) cutsTodayEl.textContent = totalCutsToday;
    document.getElementById('totalLength').textContent = totalLength.toFixed(2) + 'm';
    document.getElementById('fullPicksCount').textContent = fullPicksCount;
    document.getElementById('topCutter').textContent = topCutter;
    document.getElementById('topCustomer').textContent = topCustomer;
    document.getElementById('systemCutsCount').textContent = systemCutsCount;
}

function validateInputs() {
    const batchEntryMode = document.getElementById('batchEntryMode').checked;

    if (batchEntryMode) {
        return validateBatchInputs();
    } else {
        return validateSingleInputs();
    }
}

function validateSingleInputs() {
    const lineCode = document.getElementById('lineCode').value.trim();
    const turnedToLineCode = document.getElementById('turnedToLineCode').value.trim();
    const wireId = document.getElementById('wireId').value.trim();
    const cutLength = document.getElementById('cutLength').value;
    const cutterName = document.getElementById('cutterName').value.trim();
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const isSystemCut = document.getElementById('systemCut').checked;

    if (!lineCode || !(/^[A-Za-z]$/.test(lineCode) || /^\d{1,3}$/.test(lineCode))) {
        showError("Line Code must be a single letter or 1 to 3 digits.");
        return false;
    }

    if (!turnedToLineCode || !(/^[A-Za-z]$/.test(turnedToLineCode) || /^\d{1,3}$/.test(turnedToLineCode))) {
        showError("Turned To Line Code must be a single letter or 1 to 3 digits.");
        return false;
    }

    if (!wireId) {
        showError("Please enter a Wire Type/ID.");
        return false;
    }

    if (isNaN(parseFloat(cutLength)) || parseFloat(cutLength) <= 0) {
        showError("Please enter a valid Cut Length (> 0).");
        return false;
    }

    if (!cutterName) {
        showError("Please enter a Cutter Name.");
        return false;
    }

    // Check required fields when System Cut is NOT checked
    if (!isSystemCut) {
        if (!orderNumber) {
            showError("Please enter an Order Number / IBT Number (required unless System Cut is selected).");
            return false;
        }

        if (!customerName) {
            showError("Please enter a Customer Name / Branch (required unless System Cut is selected).");
            return false;
        }
    }

    return true;
}

function validateBatchInputs() {
    const batchCutList = document.getElementById('batchCutList');
    const entries = batchCutList.querySelectorAll('div.p-2');
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const isSystemCut = document.getElementById('systemCut').checked;

    if (entries.length === 0) {
        showError("Please add at least one cut entry in batch mode.");
        return false;
    }

    // Check required fields when System Cut is NOT checked
    if (!isSystemCut) {
        if (!orderNumber) {
            showError("Please enter an Order Number / IBT Number (required unless System Cut is selected).");
            return false;
        }

        if (!customerName) {
            showError("Please enter a Customer Name / Branch (required unless System Cut is selected).");
            return false;
        }
    }

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const wireId = entry.querySelector('input[placeholder="Wire Type/ID"]').value.trim();
        const cutLength = entry.querySelector('input[placeholder="Cut Length"]').value;
        const lineCodeRaw = entry.querySelector('input[placeholder="Line Code"]').value.trim();
        const turnedToLineCodeRaw = entry.querySelector('input[placeholder="Turned To Line Code"]').value.trim();
        const cutterName = entry.querySelector('input[placeholder="Cutter Name"]').value.trim();

        if (!wireId) {
            showError(`Batch entry ${i + 1}: Please enter a Wire Type/ID.`);
            return false;
        }

        if (!cutLength || isNaN(parseFloat(cutLength)) || parseFloat(cutLength) <= 0) {
            showError(`Batch entry ${i + 1}: Please enter a valid Cut Length (> 0).`);
            return false;
        }

        if (!lineCodeRaw || !(/^[A-Za-z]$/.test(lineCodeRaw) || /^\d{1,3}$/.test(lineCodeRaw))) {
            showError(`Batch entry ${i + 1}: Line Code must be a single letter or 1 to 3 digits.`);
            return false;
        }

        if (!turnedToLineCodeRaw || !(/^[A-Za-z]$/.test(turnedToLineCodeRaw) || /^\d{1,3}$/.test(turnedToLineCodeRaw))) {
            showError(`Batch entry ${i + 1}: Turned To Line Code must be a single letter or 1 to 3 digits.`);
            return false;
        }

        if (!cutterName) {
            showError(`Batch entry ${i + 1}: Please enter a Cutter Name.`);
            return false;
        }
    }

    return true;
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorBox').classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}

function clearForm() {
    document.getElementById('wireId').value = '';
    document.getElementById('cutLength').value = '';
    document.getElementById('startingMark').value = '';
    document.getElementById('endingMark').value = '';
    document.getElementById('singleUnitCut').checked = false;
    document.getElementById('fullPick').checked = false;
    document.getElementById('noMarks').checked = false;
    document.getElementById('systemCut').checked = false;
    document.getElementById('lineCode').value = '';
    document.getElementById('turnedToLineCode').value = '';
    document.getElementById('cutterName').value = '';
    document.getElementById('reelSize').value = '';
    document.getElementById('chargeable').value = '';
    document.getElementById('orderComments').value = '';
    document.getElementById('orderNumber').value = '';
    document.getElementById('customerName').value = '';
    editingId = null;
    document.getElementById('recordBtn').textContent = 'RECORD CUT';
    hideError();
    // Trigger the checkbox change to re-enable fields
    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
}

async function saveCutRecord() {
    if (!validateInputs()) return;

    hideError();

    const batchEntryMode = document.getElementById('batchEntryMode').checked;

    if (batchEntryMode) {
        await saveBatchRecords();
    } else {
        await saveSingleRecord();
    }
}

async function saveSingleRecord() {
    try {
        const wireId = document.getElementById('wireId').value.trim().toUpperCase();
        let cutLength = parseFloat(document.getElementById('cutLength').value);
        const cutLengthUnit = document.getElementById('cutLengthUnit').value;
        const isFullPick = document.getElementById('fullPick').checked;
        const startingMarkInput = document.getElementById('startingMark').value.trim();
        const startingMark = startingMarkInput ? parseFloat(startingMarkInput) : null;
        const startingMarkUnit = document.getElementById('startingMarkUnit').value;
        const endingMarkValue = document.getElementById('endingMark').value.trim();
        const isSingleUnitCut = document.getElementById('singleUnitCut').checked;
        const endingMark = endingMarkValue ? parseFloat(endingMarkValue) : null;

        const lineCode = 'L:' + document.getElementById('lineCode').value.trim().toUpperCase();
        const turnedToLineCodeValue = document.getElementById('turnedToLineCode').value.trim().toUpperCase();
        const cutterName = document.getElementById('cutterName').value.trim();
        const orderNumber = document.getElementById('orderNumber').value.trim();
        const customerName = document.getElementById('customerName').value.trim().toUpperCase();
        const coilOrReel = document.getElementById('coilOrReel').value;
        const reelSizeInput = document.getElementById('reelSize').value.trim();
        const quantity = 1;
        const chargeable = document.getElementById('chargeable').value;
        const orderComments = document.getElementById('orderComments').value.trim();

        const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

        const isNoMarks = document.getElementById('noMarks').checked;
        const isSystemCut = document.getElementById('systemCut').checked;
        const isCutInSystem = document.getElementById('cutInSystem').checked;
        const now = Date.now();
        const existingRecord = editingId ? cutRecords.find(r => r.id === editingId) : null;

        // Set cutInSystemTimestamp when checkbox is checked
        let cutInSystemTimestamp = existingRecord?.cutInSystemTimestamp;
        if (isCutInSystem) {
            // If checkbox is checked, set/update timestamp to now
            // For new records or when checkbox was previously unchecked
            if (!existingRecord || existingRecord.isCutInSystem !== true) {
                cutInSystemTimestamp = now;
            }
        } else {
            // If checkbox is unchecked, keep existing timestamp or null
            cutInSystemTimestamp = existingRecord?.cutInSystemTimestamp || null;
        }

        const record = {
            wireId,
            cutLength,
            cutLengthUnit,
            startingMark: isNoMarks ? null : startingMark,
            startingMarkUnit: isNoMarks ? null : startingMarkUnit,
            endingMark: isNoMarks ? null : endingMark,
            endingMarkUnit: isNoMarks ? null : (isFullPick ? null : startingMarkUnit),
            lineCode,
            turnedToLineCode: turnedToLineCodeValue,
            cutterName,
            orderNumber,
            customerName,
            coilOrReel,
            reelSize,
            chargeable,
            orderComments,
            isSingleUnitCut: isNoMarks ? false : isSingleUnitCut,
            isFullPick,
            isNoMarks,
            isSystemCut,
            isCutInSystem,
            cutInSystemTimestamp,
            createdAt: existingRecord ? existingRecord.createdAt : now,
            updatedAt: now,
            timestamp: existingRecord ? existingRecord.timestamp : now,
            id: editingId || crypto.randomUUID(),
        };

        saveToHistory();

        // Store editing ID before clearing for scrolling
        const wasEditingId = editingId;

        if (editingId) {
            cutRecords = cutRecords.map(r => r.id === editingId ? record : r);
            await updateCutRecordInDB(record);
            editingId = null;
        } else {
            cutRecords.push(record);
            await saveCutRecordToDB(record);
        }

        updateStats(); // Update stats after data mutation

        cutRecords.sort((a, b) => {
            const timeDiff = b.timestamp - a.timestamp;
            if (timeDiff !== 0) return timeDiff;
            // Stable sort for equal timestamps
            return b.id.localeCompare(a.id);
        });

        // Reset display counter and re-render
        displayedRecordsCount = 0;
        if (wasEditingId) {
            const filteredRecords = getFilteredRecords();
            const editedIndex = filteredRecords.findIndex(record => record.id === wasEditingId);
            if (editedIndex !== -1) {
                displayedRecordsCount = editedIndex + 1;
            }
        }
        renderCutRecords();

        // Scroll to edited record if we were editing
        if (wasEditingId) {
            setTimeout(() => {
                const editedRecordElement = document.querySelector(`button[onclick*="editRecord('${wasEditingId}')"]`);
                if (editedRecordElement) {
                    editedRecordElement.closest('.cut-record-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        clearForm();
        updateButtonStates();

        await showAlert('Cut record saved successfully!', 'Success');

    } catch (error) {
        console.error('❌ Failed to save single record:', error);
        await showAlert(`Failed to save cut record: ${error.message}\n\nPlease check the browser console for more details.`, 'Save Error');
    }
}

async function saveBatchRecords() {
    try {
        const batchCutList = document.getElementById('batchCutList');
        const entries = batchCutList.querySelectorAll('div.p-2');
        const orderNumber = document.getElementById('orderNumber').value.trim();
        const customerName = document.getElementById('customerName').value.trim().toUpperCase();
        const orderComments = document.getElementById('orderComments').value.trim();
        const now = Date.now();

        const newRecords = [];

        entries.forEach(entry => {
            const wireId = entry.querySelector('input[placeholder="Wire Type/ID"]').value.trim().toUpperCase();
            const cutLength = parseFloat(entry.querySelector('input[placeholder="Cut Length"]').value);
            const cutLengthUnit = entry.querySelector('select').value; // First select is unit
            const lineCode = 'L:' + entry.querySelector('input[placeholder="Line Code"]').value.trim().toUpperCase();
            const cutterName = entry.querySelector('input[placeholder="Cutter Name"]').value.trim();
            const coilOrReel = entry.querySelector('.coilOrReelSelect').value;
            const reelSizeInput = entry.querySelector('input[placeholder="Reel Size"]').value.trim();
            const quantity = 1;
            const chargeable = entry.querySelector('select:has(option[value="yes"])').value;

            // Read individual checkboxes for this entry
            const isSingleUnitCut = entry.querySelector('.batchEntrySingleUnitCut').checked;
            const isFullPick = entry.querySelector('.batchEntryFullPick').checked;
            const isNoMarks = entry.querySelector('.batchEntryNoMarks').checked;
            const isSystemCut = entry.querySelector('.batchEntrySystemCut').checked;
            const isCutInSystem = entry.querySelector('.batchEntryCutInSystem').checked;

            // Read starting and ending mark values for this entry
            const startingMarkValue = entry.querySelector('.batchEntryStartingMark').value.trim();
            const startingMark = startingMarkValue !== '' ? parseFloat(startingMarkValue) : null;
            const startingMarkUnit = entry.querySelector('.batchEntryStartingMarkUnit').value;
            const endingMarkValue = entry.querySelector('.batchEntryEndingMark').value.trim();
            const endingMark = endingMarkValue !== '' ? parseFloat(endingMarkValue) : null;
            const endingMarkUnit = entry.querySelector('.batchEntryEndingMarkUnit').value;

            const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

            const turnedToLineCodeRaw = entry.querySelector('input[placeholder="Turned To Line Code"]').value.trim().toUpperCase();
            const record = {
                wireId,
                cutLength,
                cutLengthUnit,
                startingMark: isFullPick || isNoMarks ? null : startingMark,
                startingMarkUnit: isFullPick || isNoMarks ? null : startingMarkUnit,
                endingMark: isFullPick || isNoMarks ? null : (isSingleUnitCut ? startingMark + cutLength : endingMark),
                endingMarkUnit: isFullPick || isNoMarks ? null : (isSingleUnitCut ? startingMarkUnit : endingMarkUnit),
                lineCode,
                turnedToLineCode: turnedToLineCodeRaw,
                cutterName,
                orderNumber,
                customerName,
                coilOrReel,
                reelSize,
                quantity,
                chargeable,
                orderComments,
                isSingleUnitCut,
                isFullPick,
                isNoMarks,
                isSystemCut,
                createdAt: now,
                updatedAt: now,
                timestamp: now,
                id: crypto.randomUUID(),
            };

            newRecords.push(record);
        });

        saveToHistory();
        cutRecords.push(...newRecords);
        cutRecords.sort((a, b) => b.timestamp - a.timestamp);

        // Save all new records to database using atomic bulk operation
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('cuttingRecords', newRecords, false);
        } else {
            // Fallback
            for (let i = 0; i < newRecords.length; i++) {
                const record = newRecords[i];
                await saveCutRecordToDB(record);
            }
        }

        // Reset display counter and re-render
        displayedRecordsCount = 0;
        renderCutRecords();
        updateStats(); // Batch update stats
        clearForm();
        updateButtonStates();

        await showAlert(`Successfully saved ${newRecords.length} batch cut records!`);

    } catch (error) {
        console.error('❌ Failed to save batch records:', error);
        await showAlert(`Failed to save batch cut records: ${error.message}\n\nPlease check the browser console for more details.`, 'Batch Save Error');
    }
}

// Undo/Redo functionality
function saveToHistory() {
    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Deep copy
    undoStack.push(currentState);

    // Keep only the last maxHistorySize states
    if (undoStack.length > maxHistorySize) {
        undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack.length = 0;
}

async function undo() {
    if (undoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Save current for redo
    redoStack.push(currentState);

    cutRecords = undoStack.pop();

    // Update database with new state using atomic bulk operation
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
    } else {
        // Fallback
        await clearAllCutRecordsFromDB();
        for (const record of cutRecords) {
            await saveCutRecordToDB(record);
        }
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
    updateButtonStates();

    showAlert('Last action undone.', 'Undo');
}

async function redo() {
    if (redoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Save current for undo
    undoStack.push(currentState);

    cutRecords = redoStack.pop();

    // Update database with new state using atomic bulk operation
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
    } else {
        // Fallback
        await clearAllCutRecordsFromDB();
        for (const record of cutRecords) {
            await saveCutRecordToDB(record);
        }
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
    updateButtonStates();

    showAlert('Last undone action restored.', 'Redo');
}

function updateButtonStates() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
    }

    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }

    // Update batch undo/redo states
    const batchUndoBtn = document.getElementById('batchUndoBtn');
    const batchRedoBtn = document.getElementById('batchRedoBtn');

    if (batchUndoBtn) {
        batchUndoBtn.disabled = batchUndoStack.length === 0;
    }

    if (batchRedoBtn) {
        batchRedoBtn.disabled = batchRedoStack.length === 0;
    }

    // Update global undo/redo states and badges
    const globalUndoBtn = document.getElementById('globalUndoBtn');
    const globalRedoBtn = document.getElementById('globalRedoBtn');
    const globalUndoBadge = document.getElementById('globalUndoBadge');

    if (globalUndoBtn) {
        globalUndoBtn.disabled = undoStack.length === 0;
    }

    if (globalRedoBtn) {
        globalRedoBtn.disabled = redoStack.length === 0;
    }

    if (globalUndoBadge) {
        globalUndoBadge.textContent = undoStack.length > 0 ? undoStack.length : '0';
        if (undoStack.length === 0) {
            globalUndoBadge.classList.add('disabled:hidden');
        } else {
            globalUndoBadge.classList.remove('disabled:hidden');
        }
    }
}

// Batch undo/redo functions
function saveBatchState() {
    const batchCutList = document.getElementById('batchCutList');
    const entries = batchCutList.querySelectorAll('div.p-2');
    const state = Array.from(entries).map(entry => {
        return {
            wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
            cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
            cutLengthUnit: entry.querySelector('select').value,
            lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
            cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
            startingMark: entry.querySelector('.batchEntryStartingMark').value,
            startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
            endingMark: entry.querySelector('.batchEntryEndingMark').value,
            endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
            coilOrReel: entry.querySelector('.coilOrReelSelect').value,
            reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
            chargeable: entry.querySelector('select:has(option[value="yes"])').value,
            isSingleUnitCut: entry.querySelector('.batchEntrySingleUnitCut').checked,
            isFullPick: entry.querySelector('.batchEntryFullPick').checked,
            isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
            isSystemCut: entry.querySelector('.batchEntrySystemCut').checked,
            isCutInSystem: entry.querySelector('.batchEntryCutInSystem').checked
        };
    });
    batchUndoStack.push(JSON.parse(JSON.stringify(state)));
    if (batchUndoStack.length > maxHistorySize) {
        batchUndoStack.shift();
    }
    batchRedoStack.length = 0; // Clear redo on new action
    updateButtonStates();
}

function batchUndo() {
    if (batchUndoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(Array.from(document.getElementById('batchCutList').querySelectorAll('div.p-2')).map(entry => ({
        wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
        cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
        cutLengthUnit: entry.querySelector('select').value,
        lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
        cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
        startingMark: entry.querySelector('.batchEntryStartingMark').value,
        startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
        endingMark: entry.querySelector('.batchEntryEndingMark').value,
        endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
        coilOrReel: entry.querySelector('.coilOrReelSelect').value,
        reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
        chargeable: entry.querySelector('select:has(option[value="yes"])').value,
        isSingleUnitCut: entry.querySelector('.batchEntrySingleUnitCut').checked,
        isFullPick: entry.querySelector('.batchEntryFullPick').checked,
        isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
        isSystemCut: entry.querySelector('.batchEntrySystemCut').checked,
        isCutInSystem: entry.querySelector('.batchEntryCutInSystem').checked
    }))));

    batchRedoStack.push(JSON.parse(JSON.stringify(currentState)));

    const previousState = batchUndoStack.pop();
    restoreBatchState(previousState);

    showAlert('Last batch action undone.', 'Batch Undo');
}

function batchRedo() {
    if (batchRedoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(Array.from(document.getElementById('batchCutList').querySelectorAll('div.p-2')).map(entry => ({
        wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
        cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
        cutLengthUnit: entry.querySelector('select').value,
        lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
        cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
        startingMark: entry.querySelector('.batchEntryStartingMark').value,
        startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
        endingMark: entry.querySelector('.batchEntryEndingMark').value,
        endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
        coilOrReel: entry.querySelector('.coilOrReelSelect').value,
        reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
        chargeable: entry.querySelector('select:has(option[value="yes"])').value,
        isFullPick: entry.querySelector('.batchEntryFullPick').checked,
        isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
        isSystemCut: entry.querySelector('.batchEntrySystemCut').checked
    }))));

    batchUndoStack.push(JSON.parse(JSON.stringify(currentState)));

    const nextState = batchRedoStack.pop();
    restoreBatchState(nextState);

    showAlert('Last undone batch action restored.', 'Batch Redo');
}

function restoreBatchState(state) {
    const batchCutList = document.getElementById('batchCutList');
    batchCutList.innerHTML = '';

    state.forEach(entryData => {
        const newEntry = createBatchCutEntry(entryData);
        batchCutList.appendChild(newEntry);
    });

    updateButtonStates();
}

async function deleteRecord(id) {
    const confirmResult = await showConfirm('Are you sure you want to delete this cut record?', 'Delete Record');
    if (!confirmResult) return;

    cutRecords = cutRecords.filter(record => record.id !== id);
    await deleteCutRecordFromDB(id);

    // Reset display counter and re-render
    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
}

function editRecord(id) {
    const record = cutRecords.find(r => r.id === id);
    if (!record) {
        showAlert('Record not found.', 'Error').then(() => {});
        return;
    }

    document.getElementById('wireId').value = record.wireId;
    document.getElementById('cutLength').value = record.cutLength.toString();
    document.getElementById('cutLengthUnit').value = record.cutLengthUnit;
    document.getElementById('singleUnitCut').checked = record.isSingleUnitCut || false;
    document.getElementById('fullPick').checked = record.isFullPick || false;
    document.getElementById('noMarks').checked = record.isNoMarks || false;
    document.getElementById('systemCut').checked = !!record.isSystemCut;
    document.getElementById('cutInSystem').checked = !!record.isCutInSystem;
    if (record.isFullPick || record.isNoMarks) {
        document.getElementById('startingMark').value = '';
        document.getElementById('startingMarkUnit').value = 'm';
        document.getElementById('endingMark').value = '';
    } else {
        document.getElementById('startingMark').value = record.startingMark ? record.startingMark.toString() : '';
        document.getElementById('startingMarkUnit').value = record.startingMarkUnit || 'm';
        document.getElementById('endingMarkUnit').value = record.startingMarkUnit || 'm';
        document.getElementById('endingMark').value = record.isSingleUnitCut ? '' : (record.endingMark ? record.endingMark.toString() : '');
    }
    document.getElementById('lineCode').value = record.lineCode.replace('L:', '');
    document.getElementById('turnedToLineCode').value = record.turnedToLineCode || '';
    document.getElementById('cutterName').value = record.cutterName;
    document.getElementById('orderNumber').value = record.orderNumber;
    document.getElementById('customerName').value = record.customerName;
    document.getElementById('coilOrReel').value = record.coilOrReel || 'reel';
    document.getElementById('reelSize').value = record.reelSize ? record.reelSize.toString() : '';
    document.getElementById('chargeable').value = record.chargeable;
    document.getElementById('orderComments').value = record.orderComments || '';
    editingId = id;
    document.getElementById('recordBtn').textContent = 'UPDATE CUT RECORD';

    // Trigger the checkbox change to update field states
    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
}

function getFilteredRecords() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterField = document.getElementById('filterByField').value;
    const dateFromValue = document.getElementById('dateFrom').value;
    const dateToValue = document.getElementById('dateTo').value;
    const dateFrom = dateFromValue ? new Date(dateFromValue).getTime() : null;
    const dateTo = dateToValue ? new Date(dateToValue).getTime() + 86399999 : null; // Include entire day

    /**
     * BOLT OPTIMIZATION: High-performance filtering
     * Avoids creating a 'fieldsToSearch' object for every single record in the loop.
     * Uses direct property access and short-circuiting for O(N) efficiency without object overhead.
     */
    return cutRecords.filter(record => {
        // Date filtering
        if (dateFrom && record.timestamp < dateFrom) return false;
        if (dateTo && record.timestamp > dateTo) return false;

        if (!searchTerm) return true;

        // Search filtering by specific field
        if (filterField !== 'all') {
            const val = record[filterField];
            return val && val.toLowerCase().includes(searchTerm);
        }

        // Search filtering across 'all' fields - optimized short-circuiting
        return (record.wireId && record.wireId.toLowerCase().includes(searchTerm)) ||
               (record.orderNumber && record.orderNumber.toLowerCase().includes(searchTerm)) ||
               (record.cutterName && record.cutterName.toLowerCase().includes(searchTerm)) ||
               (record.customerName && record.customerName.toLowerCase().includes(searchTerm));
    });
}

// Toggle Cut In System function - one-way toggle (false to true, then disabled)
async function toggleCutInSystem(id) {
    const itemIndex = cutRecords.findIndex(r => r.id === id);
    if (itemIndex === -1) return;

    const record = cutRecords[itemIndex];

    // Only allow toggling from false to true (one-way)
    if (record.isCutInSystem === true) {
        return; // Already set, do nothing
    }

    // Set to true and record timestamp
    const now = Date.now();
    record.isCutInSystem = true;
    record.cutInSystemTimestamp = now;
    record.updatedAt = now;

    try {
        // Update in database
        await updateCutRecordInDB(record);

        // Re-render the UI immediately to show changes
        renderCutRecords();

        // Optional: visual feedback
        await showAlert(`Cut record marked as "Cut In System" at ${shortDateTimeFormat.format(now)}`, 'System Status Updated');

    } catch (error) {
        console.error('Error toggling Cut In System status:', error);
        await showAlert('Failed to update system status. Please try again.', 'Update Error');

        // Revert local change on error
        record.isCutInSystem = false;
        record.cutInSystemTimestamp = null;
        renderCutRecords();
    }
}

function renderCutRecords() {
    const cutHistoryList = document.getElementById('cutHistoryList');
    const totalRecordsElement = document.getElementById('totalRecordsCount');
    const displayedRecordsElement = document.getElementById('displayedRecordsCount');

    const filteredRecords = getFilteredRecords();

    // Update counters
    totalRecordsElement.textContent = filteredRecords.length;

    cutHistoryList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    if (filteredRecords.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-sm text-gray-500';
        emptyMsg.textContent = 'No cut records found yet.';
        cutHistoryList.appendChild(emptyMsg);
        displayedRecordsElement.textContent = '0';
        // BOLT: Removed redundant updateStats() call from render loop
        return;
    }

    // Load more records if needed
    const recordsToShow = Math.min(displayedRecordsCount + recordsPerPage, filteredRecords.length);
    displayedRecordsCount = recordsToShow;
    displayedRecordsElement.textContent = displayedRecordsCount;

    filteredRecords.slice(0, displayedRecordsCount).forEach(record => {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'cut-record-item';

        const headerP = document.createElement('p');
        headerP.className = 'text-xs font-semibold header-gradient truncate';
        headerP.textContent = `Wire: ${record.wireId} | Cut From ${record.lineCode || 'N/A'} | Turned To L:${record.turnedToLineCode || 'N/A'} | Order: ${record.orderNumber} | Customer: ${record.customerName}`;
        recordDiv.appendChild(headerP);

        const detailsP = document.createElement('p');
        detailsP.className = 'text-xs text-gray-700';

        const lengthSpan = document.createElement('span');
        lengthSpan.className = 'font-bold';
        lengthSpan.textContent = `${record.cutLength.toFixed(2)} ${record.cutLengthUnit}`;

        detailsP.textContent = 'Cut Length: ';
        detailsP.appendChild(lengthSpan);
        detailsP.appendChild(document.createTextNode(' | '));

        let pickFlags = [];
        if (record.isFullPick) pickFlags.push('Full Pick');
        if (record.isNoMarks) pickFlags.push('No Marks');

        if (pickFlags.length > 0) {
            const flagsSpan = document.createElement('span');
            flagsSpan.className = 'font-bold';
            flagsSpan.textContent = pickFlags.join(', ');
            detailsP.appendChild(flagsSpan);

            if (record.startingMark && !record.isNoMarks) {
                detailsP.appendChild(document.createTextNode(' | Start Mark: '));
                const startSpan = document.createElement('span');
                startSpan.className = 'font-bold';
                startSpan.textContent = `${record.startingMark} ${record.startingMarkUnit}`;
                detailsP.appendChild(startSpan);
                detailsP.appendChild(document.createTextNode(' | End Mark: '));
                const endSpan = document.createElement('span');
                endSpan.className = 'font-bold';
                endSpan.textContent = record.isSingleUnitCut ? '1 unit cut' : `${record.endingMark} ${record.endingMarkUnit}`;
                detailsP.appendChild(endSpan);
            }
        } else if (record.startingMark && !record.isNoMarks) {
            detailsP.appendChild(document.createTextNode('Start Mark: '));
            const startSpan = document.createElement('span');
            startSpan.className = 'font-bold';
            startSpan.textContent = `${record.startingMark} ${record.startingMarkUnit}`;
            detailsP.appendChild(startSpan);
            detailsP.appendChild(document.createTextNode(' | End Mark: '));
            const endSpan = document.createElement('span');
            endSpan.className = 'font-bold';
            endSpan.textContent = record.isSingleUnitCut ? '1 unit cut' : `${record.endingMark} ${record.endingMarkUnit}`;
            detailsP.appendChild(endSpan);
        } else {
            detailsP.appendChild(document.createTextNode('No Marks'));
        }
        recordDiv.appendChild(detailsP);

        const cutterP = document.createElement('p');
        cutterP.className = 'text-xs text-gray-700';
        let cutterText = `Cutter: ${record.cutterName} | `;
        if (record.coilOrReel === 'coil') cutterText += 'Coil: Yes';
        if (record.coilOrReel === 'reel' && record.chargeable === 'no') cutterText += 'Non-Chargeable Reel';
        if (record.coilOrReel === 'reel' && record.chargeable === 'yes') {
            cutterText += ` RLS EE-${record.reelSize ? record.reelSize : 'N/A'}W | Chargeable: ${record.chargeable}`;
        }
        cutterP.textContent = cutterText;
        if (record.isSystemCut) {
            const systemSpan = document.createElement('span');
            systemSpan.className = 'font-bold';
            systemSpan.textContent = ' | System Cut';
            cutterP.appendChild(systemSpan);
        }
        const cutInSystemSpan = document.createElement('span');
        cutInSystemSpan.className = 'font-bold';
        cutInSystemSpan.textContent = ` | Cut In System: ${record.isCutInSystem ? 'Yes' : 'No'}`;
        cutterP.appendChild(cutInSystemSpan);
        recordDiv.appendChild(cutterP);

        const commentsP = document.createElement('p');
        commentsP.className = 'text-xs text-gray-700';
        commentsP.textContent = `Comments: ${record.orderComments || 'N/A'}`;
        recordDiv.appendChild(commentsP);

        /**
         * BOLT OPTIMIZATION: High-performance date formatting
         * Uses pre-initialized Intl.DateTimeFormat instead of .toLocaleString()
         * which is significantly faster within high-frequency render loops.
         */
        const date = fullDateTimeFormat.format(record.timestamp);
        const metaP = document.createElement('p');
        metaP.className = 'text-xs text-gray-500';
        metaP.textContent = `@ ${date} by Local`;
        recordDiv.appendChild(metaP);

        const createdDate = fullDateTimeFormat.format(record.createdAt || record.timestamp);
        const updatedDate = record.updatedAt && record.updatedAt !== record.createdAt ? ` | Updated: ${fullDateTimeFormat.format(record.updatedAt)}` : '';
        const createdP = document.createElement('p');
        createdP.className = 'text-xs text-gray-400';
        createdP.textContent = `Created: ${createdDate}${updatedDate}`;
        recordDiv.appendChild(createdP);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex justify-between items-center mt-1';

        const btnGroup = document.createElement('div');
        btnGroup.className = 'flex space-x-1';

        const editBtn = document.createElement('button');
        editBtn.onclick = () => editRecord(record.id);
        editBtn.className = 'text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded';
        editBtn.textContent = 'Edit';
        btnGroup.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.onclick = () => deleteRecord(record.id);
        deleteBtn.className = 'text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded';
        deleteBtn.textContent = 'Delete';
        btnGroup.appendChild(deleteBtn);

        actionsDiv.appendChild(btnGroup);

        const cutInSystemButton = document.createElement('button');
        if (record.isCutInSystem) {
            const setDate = record.cutInSystemTimestamp ? (() => {
                const d = new Date(record.cutInSystemTimestamp);
                return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
            })() : 'Unknown';
            cutInSystemButton.disabled = true;
            cutInSystemButton.className = 'text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-not-allowed opacity-75';
            cutInSystemButton.textContent = `✓ Cut In System (${setDate})`;
            cutInSystemButton.title = `Marked as Cut In System on ${setDate}`;
        } else {
            cutInSystemButton.onclick = () => toggleCutInSystem(record.id);
            cutInSystemButton.className = 'text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded';
            cutInSystemButton.textContent = 'Cut In System';
        }
        actionsDiv.appendChild(cutInSystemButton);
        recordDiv.appendChild(actionsDiv);

        cutHistoryList.appendChild(recordDiv);
    });

    // Add "Load More" button if there are more records
    if (displayedRecordsCount < filteredRecords.length) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'text-center mt-4';
        const moreBtn = document.createElement('button');
        moreBtn.onclick = loadMoreRecords;
        moreBtn.className = 'px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200';
        moreBtn.textContent = `Load More Records (${filteredRecords.length - displayedRecordsCount} remaining)`;
        moreDiv.appendChild(moreBtn);
        cutHistoryList.appendChild(moreDiv);
    }

    // BOLT: Removed redundant updateStats() call from render loop.
    // Statistics are now only recalculated upon data mutation.
}

function loadMoreRecords() {
    if (isLoading) return;

    isLoading = true;
    document.getElementById('loadingIndicator').classList.remove('hidden');

    // Simulate loading delay for better UX
    setTimeout(() => {
        renderCutRecords();
        document.getElementById('loadingIndicator').classList.add('hidden');
        isLoading = false;
    }, 300);
}

function setupInfiniteScroll() {
    const cutHistoryList = document.getElementById('cutHistoryList');

    cutHistoryList.addEventListener('scroll', function() {
        if (isLoading || displayedRecordsCount >= cutRecords.length) return;

        // Check if user has scrolled to bottom
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
            loadMoreRecords();
        }
    });
}

/**
 * IDB SENTINEL: Secure CSV escaping utility
 * Mitigates CSV Injection (Excel Formula Injection) and ensures proper RFC 4180 escaping.
 * @param {any} value The value to escape for CSV
 * @returns {string} The escaped and sanitized string
 */
function escapeCSVValue(value) {
    if (value === null || value === undefined) return '';
    let stringValue = value.toString();

    // Mitigate CSV Injection by prefixing values starting with =, +, -, or @
    if (['=', '+', '-', '@'].some(char => stringValue.startsWith(char))) {
        stringValue = "'" + stringValue;
    }

    // Standard RFC 4180 double-quote escaping
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

async function exportToCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No cut records to export.', 'No Records');
        return;
    }

    const header = [
        'id', 'wireid', 'cutlength', 'cutlengthunit', 'startingmark', 'startingmarkunit', 'endingmark', 'endingmarkunit',
        'cut from line code', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'quantity', 'chargeable', 'ordercomments', 'issingleunitcut', 'isfullpick', 'turnedtolinecode'
    ];

    const rows = cutRecords.map(record => [
        escapeCSVValue(record.id),
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.quantity),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : '')
    ]);

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvContent = bom + [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `cut_records_${cutRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Save export timestamp to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: new Date().toISOString() });
    }
    updateExportStatus();
    await showAlert(`Successfully exported ${cutRecords.length} cut records to CSV.`);
}

async function exportDeltaToCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No cut records to export.', 'No Records');
        return;
    }

    const now = Date.now();
    let lastExportTime = lastDeltaExport;

    if (window.eecolDB && await window.eecolDB.isReady()) {
        try {
            const lastExport = await window.eecolDB.get('settings', 'lastDeltaExport');
            lastExportTime = lastExport?.value ? parseInt(lastExport.value) : null;
        } catch (error) {
            console.error("Error getting delta export time from IndexedDB:", error);
            lastExportTime = null;
        }
    }

    const newRecords = lastExportTime ? cutRecords.filter(record => record.timestamp > lastExportTime) : cutRecords;

    if (newRecords.length === 0) {
        await showAlert('No new records since the last export.', 'No New Records');
        return;
    }

    const header = [
        'id', 'wireid', 'cutlength', 'cutlengthunit', 'startingmark', 'startingmarkunit', 'endingmark', 'endingmarkunit',
        'cut from line code', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'quantity', 'chargeable', 'ordercomments', 'issingleunitcut', 'isfullpick', 'turnedtolinecode'
    ];

    const rows = newRecords.map(record => [
        escapeCSVValue(record.id),
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.quantity),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : '')
    ]);

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvContent = bom + [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const dateStr = new Date(now).toISOString().split('T')[0];
    a.download = `cut_records_new_${newRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update lastDeltaExport
    lastDeltaExport = now;

    // Save to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastDeltaExport', value: now.toString() });
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: new Date().toISOString() });
    }

    updateExportStatus();
    await showAlert(`Successfully exported ${newRecords.length} new cut records to CSV.\n\nFile: cut_records_new_${newRecords.length}_${dateStr}.csv\n\n${lastExportTime ? 'This export contains records added since the last export.' : 'This was the first export - future exports will only include newer records.'}`);
}





async function clearAllRecords() {
    const confirmResult = await showConfirm(`Are you sure you want to clear all ${cutRecords.length} cut records? This action cannot be undone.`, 'Clear All Records');
    if (confirmResult) {
        cutRecords = [];
        displayedRecordsCount = 0;
        await clearAllCutRecordsFromDB();
        renderCutRecords();
        updateStats(); // Update stats after clearing
        await showAlert('All cut records have been cleared.', 'Records Cleared');
    }
}

// Cloud sync functions for OneDrive Excel CSV
async function syncToCloudCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No records to sync. Please add some cut records first.', 'No Records');
        return;
    }

    // Generate CSV content
    const header = [
        'WireId', 'CutLength', 'CutLengthUnit', 'StartingMark', 'StartingMarkUnit', 'EndingMark', 'EndingMarkUnit',
        'Cut From Line Code', 'CutterName', 'OrderNumber', 'CustomerName', 'CoilOrReel', 'ReelSize', 'Chargeable', 'OrderComments', 'IsSingleUnitCut', 'IsFullPick', 'TurnedToLineCode', 'Quantity'
    ];

    const rows = cutRecords.map(record => [
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : ''),
        escapeCSVValue(record.quantity)
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_cut_records_${cutRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);
}



// JSON Backup Export Function
async function exportJSONBackup() {
    const backup = {
        records: cutRecords,
        wireCutList: wireCutList,
        timestamp: Date.now(),
        version: '0.7.9.7',
        exportDate: new Date().toISOString(),
        totalRecords: cutRecords.length,
        totalWireCutListItems: wireCutList.length
    };

    // Save export timestamp to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastJsonExport', value: new Date().toISOString() });
    }
    updateExportStatus();

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_json_backup_${cutRecords.length}_${dateStr}.json`;

    a.click();
    URL.revokeObjectURL(url);

    await showAlert(`JSON backup exported successfully!\nContains ${backup.totalRecords} records.\nFile: eecol_json_backup_${cutRecords.length}_${dateStr}.json`, 'JSON Backup Exporter');
}

// JSON Backup Import Function
async function importJSONBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backupData = JSON.parse(e.target?.result);

            // Validate backup structure
            if (!backupData.records || !Array.isArray(backupData.records)) {
                await showAlert('Invalid backup file format. Missing records array.', 'Invalid Backup');
                return;
            }

            const importRecords = backupData.records || [];
            const importWireCutList = backupData.wireCutList || [];
            const backupVersion = backupData.version || 'unknown';
            const exportDate = backupData.exportDate ? new Date(backupData.exportDate).toLocaleDateString() : 'unknown';

            // Show import options
            const merge = await showConfirm(`JSON Backup Import:\n\nBackup Details:\n- Version: ${backupVersion}\n- Export Date: ${exportDate}\n- Cut Records: ${importRecords.length}\n- Wire List Items: ${importWireCutList.length}\n\nChoose:\nOK = Merge with existing data\nCancel = Replace all existing data`, 'Import Options');

            cutRecords = merge ? [...cutRecords, ...importRecords] : importRecords;
            wireCutList = merge ? [...wireCutList, ...importWireCutList] : importWireCutList;

            updateStats(); // Update stats after import

            // Clean up records (ensure IDs, etc.)
            cutRecords.forEach(record => {
                if (!record.id) record.id = crypto.randomUUID();
            });
            wireCutList.forEach(item => {
                if (!item.id) item.id = crypto.randomUUID();
            });

            cutRecords.sort((a, b) => b.timestamp - a.timestamp);
            wireCutList.sort((a, b) => (a.position || 0) - (b.position || 0));

            // Save to database using atomic bulk operations
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
                await window.eecolDB.bulkPut('wireCutList', wireCutList, !merge);
            } else {
                // Fallback
                await clearAllCutRecordsFromDB();
                for (const record of cutRecords) {
                    await saveCutRecordToDB(record);
                }
            }

            displayedRecordsCount = 0;
            renderCutRecords();
            renderWireCutList();

            await showAlert(`JSON import successful!\n${merge ? 'Merged' : 'Replaced'} with ${importRecords.length} records.\nTotal records: ${cutRecords.length}`, 'Import Successful');

            // Reset file input to allow re-selection of same file
            event.target.value = '';

        } catch (error) {
            await showAlert(`Error importing JSON backup: ${error.message}\n\nPlease ensure this is a valid EECOL JSON backup file.`, 'Import Error');

            // Reset file input even on error to allow retry
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}



//Print Records Capabilities using shared print utility
function printRecords(filtered = false) {
    const records = filtered ? getFilteredRecords() : cutRecords;

    const printContent = `
        <html>
        <head>
            <title>EECOL Cut Records</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #0058B3;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    button { display: none !important; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">EECOL Wire Cut Records Report</div>
                <div>Total Records: ${records.length} | Generated: ${window.escapeHTML(new Date().toLocaleDateString())} ${window.escapeHTML(new Date().toLocaleTimeString())}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Wire ID</th>
                        <th>Cut Length</th>
                        <th>Start Mark</th>
                        <th>End Mark</th>
                        <th>Line Code</th>
                        <th>Cutter</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Comments</th>
                        <th>Date/Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${window.escapeHTML(record.wireId)}</td>
                            <td>${window.escapeHTML(record.cutLength)} ${window.escapeHTML(record.cutLengthUnit)}</td>
                            <td>${record.isFullPick ? 'Full Pick' : window.escapeHTML(record.startingMark) + ' ' + window.escapeHTML(record.startingMarkUnit)}</td>
                            <td>${record.isFullPick ? 'Full Pick' : (record.isSingleUnitCut ? '1 unit cut' : window.escapeHTML(record.endingMark) + ' ' + window.escapeHTML(record.endingMarkUnit))}</td>
                            <td>${window.escapeHTML(record.lineCode || 'N/A')}</td>
                            <td>${window.escapeHTML(record.cutterName)}</td>
                            <td>${window.escapeHTML(record.orderNumber)}</td>
                            <td>${window.escapeHTML(record.customerName)}</td>
                            <td>${record.coilOrReel === 'coil' ? 'Coil' : (record.reelSize ? `RLS EE-${window.escapeHTML(record.reelSize)}W` : 'Reel')}</td>
                            <td>${window.escapeHTML(record.orderComments || 'N/A')}</td>
                            <td>${window.escapeHTML(new Date(record.timestamp).toLocaleString())}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Printed: ${window.escapeHTML(new Date().toLocaleDateString())} ${window.escapeHTML(new Date().toLocaleTimeString())}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `;

    if (typeof createPrintWindow === 'function') {
        createPrintWindow('EECOL Cut Records', printContent);
    } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize database if not already done (important for pages that don't load index.js)
    if (typeof EECOLIndexedDB !== 'undefined' && !window.eecolDB) {
        try {
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            await showAlert("Failed to initialize database. Please refresh the page.", "Database Error");
            return;
        }
    }

    // Initialize modal system
    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }

    // Batch Entry Mode toggle
    const batchEntryModeCheckbox = document.getElementById('batchEntryMode');
    const singleCutForm = document.getElementById('singleCutForm');
    const batchCutForm = document.getElementById('batchCutForm');
    const wireIdContainer = document.getElementById('wireIdContainer');
    batchEntryModeCheckbox.addEventListener('change', function(e) {
        if (e.target.checked) {
            singleCutForm.classList.add('hidden');
            batchCutForm.classList.remove('hidden');
            wireIdContainer.classList.add('hidden');
        } else {
            singleCutForm.classList.remove('hidden');
            batchCutForm.classList.add('hidden');
            wireIdContainer.classList.remove('hidden');
        }
    });

    // Input validation for order number (alphanumeric, max 7, auto uppercase)
    const orderNumberInput = document.getElementById('orderNumber');
    if (orderNumberInput) {
        orderNumberInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 7).toUpperCase();
        });
    }

    // Input validation for line code (single letter or digits, max 3) and auto uppercase
    const lineCodeInput = document.getElementById('lineCode');
    if (lineCodeInput) {
        lineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

    const turnedToLineCodeInput = document.getElementById('turnedToLineCode');
    if (turnedToLineCodeInput) {
        turnedToLineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

    // Auto uppercase for wire ID, customer name, and cutter name
    const wireIdInput = document.getElementById('wireId');
    if (wireIdInput) {
        wireIdInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const customerNameInput = document.getElementById('customerName');
    if (customerNameInput) {
        customerNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const cutterNameInput = document.getElementById('cutterName');
    if (cutterNameInput) {
        cutterNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Handle coil/reel field enable/disable for single cut form
    const coilOrReelSelect = document.getElementById('coilOrReel');
    if (coilOrReelSelect) {
        coilOrReelSelect.addEventListener('change', function(e) {
            const isReel = e.target.value === 'reel';
            const reelFields = ['reelSize', 'quantity', 'chargeable'];

            reelFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.disabled = !isReel;
                    if (!isReel) {
                        field.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        field.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            });

            // Enable/disable import button
            const importBtn = document.getElementById('importFromEstimatorBtn');
            if (importBtn) {
                importBtn.disabled = !isReel;
            }
        });
    }

    // Handle coil/reel field enable/disable for batch cut entries
    (function() {
        const batchCutList = document.getElementById('batchCutList');
        if (!batchCutList) return;
        batchCutList.addEventListener('change', function(e) {
            if (e.target.tagName.toLowerCase() === 'select' && (e.target.classList.contains('coilOrReelSelect') || e.target.previousElementSibling?.classList.contains('coilOrReelSelect'))) {
                const select = e.target;
                const entryDiv = select.closest('div.p-2');
                if (!entryDiv) return;
                const isReel = select.value === 'reel';
                const reelSizeInput = entryDiv.querySelector('input[placeholder="Reel Size"]');
                const quantityInput = entryDiv.querySelector('input[placeholder="Quantity"]');
                const chargeableSelect = entryDiv.querySelector('select:has(option[value="yes"])');
                if (reelSizeInput) {
                    reelSizeInput.disabled = !isReel;
                    if (!isReel) {
                        reelSizeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        reelSizeInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (quantityInput) {
                    quantityInput.disabled = !isReel;
                    if (!isReel) {
                        quantityInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        quantityInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (chargeableSelect) {
                    chargeableSelect.disabled = !isReel;
                    if (!isReel) {
                        chargeableSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        chargeableSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            }
        });
    })();

    // Search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        /**
         * BOLT OPTIMIZATION: Search Debouncing
         * Applies a 250ms debounce to the search input to prevent expensive O(N)
         * re-renders and filtering on every single keystroke.
         */
        searchInput.addEventListener('input', debounce(() => {
            displayedRecordsCount = 0;
            renderCutRecords();
        }, 250));
    }
    const filterByField = document.getElementById('filterByField');
    if (filterByField) {
        filterByField.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const filterByField = document.getElementById('filterByField');
            if (filterByField) filterByField.value = 'all';
            const dateFrom = document.getElementById('dateFrom');
            if (dateFrom) dateFrom.value = '';
            const dateTo = document.getElementById('dateTo');
            if (dateTo) dateTo.value = '';
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }

    // Sync endingMarkUnit with startingMarkUnit
    const startingMarkUnit = document.getElementById('startingMarkUnit');
    if (startingMarkUnit) {
        startingMarkUnit.addEventListener('change', function(e) {
            document.getElementById('endingMarkUnit').value = e.target.value;
        });
    }

    // Handle full pick checkbox - now allows mark entry even when full pick is checked
    const fullPickCheckbox = document.getElementById('fullPick');
    if (fullPickCheckbox) {
        fullPickCheckbox.addEventListener('change', function(e) {
            // Full pick checkbox now allows marks to remain enabled - no changes needed
            // User can enter marks for reference even on full pick records
        });
    }

    // Handle no marks checkbox
    const noMarksCheckbox = document.getElementById('noMarks');
    if (noMarksCheckbox) {
        noMarksCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const startingMarkInput = document.getElementById('startingMark');
            const endingMarkInput = document.getElementById('endingMark');
            const startingMarkUnit = document.getElementById('startingMarkUnit');
            if (startingMarkInput) {
                startingMarkInput.disabled = isChecked;
                if (isChecked) {
                    startingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    startingMarkInput.value = '';
                } else {
                    startingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
            if (endingMarkInput) {
                endingMarkInput.disabled = isChecked;
                if (isChecked) {
                    endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    endingMarkInput.value = '';
                } else {
                    endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
            if (startingMarkUnit) {
                startingMarkUnit.disabled = isChecked;
                if (isChecked) {
                    startingMarkUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
                } else {
                    startingMarkUnit.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
        });
    }

    // Handle system cut checkbox
    const systemCutCheckbox = document.getElementById('systemCut');
    if (systemCutCheckbox) {
        systemCutCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const orderNumberInput = document.getElementById('orderNumber');
            const customerNameInput = document.getElementById('customerName');
            if (orderNumberInput) {
                orderNumberInput.disabled = isChecked;
                if (isChecked) {
                    orderNumberInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    orderNumberInput.value = '';
                } else {
                    orderNumberInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    orderNumberInput.removeAttribute('disabled');
                }
            }
            if (customerNameInput) {
                customerNameInput.disabled = isChecked;
                if (isChecked) {
                    customerNameInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    customerNameInput.value = '';
                } else {
                    customerNameInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    customerNameInput.removeAttribute('disabled');
                }
            }
        });
    }

    // Handle single unit cut checkbox
    const singleUnitCutCheckbox = document.getElementById('singleUnitCut');
    if (singleUnitCutCheckbox) {
        singleUnitCutCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const cutLengthInput = document.getElementById('cutLength');
            const endingMarkInput = document.getElementById('endingMark');
            if (isChecked) {
                // Auto-fill cut length to 1
                cutLengthInput.value = '1';
                // Disable ending mark input
                endingMarkInput.disabled = true;
                endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                endingMarkInput.value = '';
            } else {
                // Re-enable ending mark input
                endingMarkInput.disabled = false;
                endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        });
    }

    // Button event listeners
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveCutRecord);

    // Undo/Redo button event listeners
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redo);

    // Batch undo/redo button event listeners
    const batchUndoBtn = document.getElementById('batchUndoBtn');
    if (batchUndoBtn) batchUndoBtn.addEventListener('click', batchUndo);

    const batchRedoBtn = document.getElementById('batchRedoBtn');
    if (batchRedoBtn) batchRedoBtn.addEventListener('click', batchRedo);

    // Keyboard shortcuts for undo/redo
    document.addEventListener('keydown', function(event) {
        // Ctrl+Z for undo (Cmd+Z on Mac, but we use Ctrl for simplicity)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            undo();
        }
        // Ctrl+Y or Ctrl+Shift+Z for redo
        if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'Z' && event.shiftKey))) {
            event.preventDefault();
            redo();
        }
    });

    // Import from Estimator Button - Now opens modal
    const importFromEstimatorBtn = document.getElementById('importFromEstimatorBtn');
    if (importFromEstimatorBtn) {
        importFromEstimatorBtn.addEventListener('click', () => {
            showImportReelModal();
        });
    }

    // Import from Calculator Button (enhanced with history dropdowns)
    const importFromCalculatorBtn = document.getElementById('importFromCalculatorBtn');
    if (importFromCalculatorBtn) {
        importFromCalculatorBtn.addEventListener('click', () => {
            showImportCalculatorModal();
        });
    }

    // Export/Import button event listeners
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    const exportDeltaBtn = document.getElementById('exportDeltaBtn');
    if (exportDeltaBtn) exportDeltaBtn.addEventListener('click', exportDeltaToCSV);
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', () => {
        const csvFileInput = document.getElementById('csvFileInput');
        if (csvFileInput) csvFileInput.click();
    });
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportJSONBackup);
    const importJSONBtn = document.getElementById('importJSONBtn');
    if (importJSONBtn) {
        importJSONBtn.addEventListener('click', () => {
            jsonFileInput = document.getElementById('jsonFileInput');
            if (jsonFileInput) jsonFileInput.click();
        });

        // Add the missing change event listener
        jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) jsonFileInput.addEventListener('change', importJSONBackup);
    }

    // P2P Sync button event listeners
    const syncAllRecordsP2PBtn = document.getElementById('syncAllRecordsP2PBtn');
    if (syncAllRecordsP2PBtn) syncAllRecordsP2PBtn.addEventListener('click', syncAllRecordsP2P);
    const syncNewRecordsP2PBtn = document.getElementById('syncNewRecordsP2PBtn');
    if (syncNewRecordsP2PBtn) syncNewRecordsP2PBtn.addEventListener('click', syncNewRecordsP2P);
    const pullRecordsFromP2PBtn = document.getElementById('pullRecordsFromP2PBtn');
    if (pullRecordsFromP2PBtn) pullRecordsFromP2PBtn.addEventListener('click', pullRecordsFromP2P);

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', () => printRecords());
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllRecords);

    // Setup infinite scroll
    setupInfiniteScroll();

    // Load records on page load
    loadCutRecords();

    updateExportStatus();

    // Load saved cutter name
    const savedCutterName = localStorage.getItem('cutterName');
    if (savedCutterName) {
        document.getElementById('cutterName').value = savedCutterName;
    }

    // Initialize button states
    updateButtonStates();

    // Wire Cut List initialization
    initWireCutList();

    // Batch Cut List management
    const batchCutList = document.getElementById('batchCutList');
    const addBatchCutBtn = document.getElementById('addBatchCutBtn');

    function createBatchCutEntry(data = {}) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-2 border border-gray-300 rounded space-y-2';

        entryDiv.innerHTML = `
            <div class="flex flex-wrap gap-4 justify-center">
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntrySingleUnitCut w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-semibold header-gradient">Single Unit Cut</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryFullPick w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-semibold header-gradient">Full Pick</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryNoMarks w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-semibold header-gradient">No Marks</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntrySystemCut w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm font-semibold header-gradient">System Cut</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryCutInSystem w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm font-semibold header-gradient">Cut In System</span>
                </label>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <input type="text" placeholder="Wire Type/ID" class="p-1 border border-gray-300 rounded text-sm flex-grow" />
                <input type="number" placeholder="Cut Length" class="p-1 border border-gray-300 rounded text-sm w-20" />
                <select class="p-1 border border-gray-300 rounded text-sm w-24">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                </select>
                <input type="text" placeholder="Line Code" maxlength="3" class="p-1 border border-gray-300 rounded text-sm w-20" />
                <input type="text" placeholder="Turned To Line Code" maxlength="3" class="p-1 border border-gray-300 rounded text-sm w-24" />
                <input type="text" placeholder="Cutter Name" class="p-1 border border-gray-300 rounded text-sm w-32" />
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <div class="flex items-center gap-1">
                    <input type="number" placeholder="Start Mark" class="batchEntryStartingMark p-1 border border-gray-300 rounded text-sm w-20" />
                    <select class="batchEntryStartingMarkUnit p-1 border border-gray-300 rounded text-sm w-16">
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                    </select>
                </div>
                <div class="flex items-center gap-1">
                    <input type="number" placeholder="End Mark" class="batchEntryEndingMark p-1 border border-gray-300 rounded text-sm w-20" />
                    <select class="batchEntryEndingMarkUnit p-1 border border-gray-300 rounded text-sm w-16">
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                    </select>
                </div>
                <select class="coilOrReelSelect p-1 border border-gray-300 rounded text-sm w-24">
                    <option value="coil">Coil</option>
                    <option value="reel">Reel</option>
                </select>
                <input type="number" placeholder="Reel Size" class="p-1 border border-gray-300 rounded text-sm w-20" disabled />
                <select class="p-1 border border-gray-300 rounded text-sm w-24" disabled>
                    <option value="">Chargeable?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
                <button type="button" class="removeBatchCutBtn px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>
            </div>
        `;

        // Set values securely using .value
        entryDiv.querySelector('.batchEntrySingleUnitCut').checked = !!data.isSingleUnitCut;
        entryDiv.querySelector('.batchEntryFullPick').checked = !!data.isFullPick;
        entryDiv.querySelector('.batchEntryNoMarks').checked = !!data.isNoMarks;
        entryDiv.querySelector('.batchEntrySystemCut').checked = !!data.isSystemCut;
        entryDiv.querySelector('.batchEntryCutInSystem').checked = !!data.isCutInSystem;

        entryDiv.querySelector('input[placeholder="Wire Type/ID"]').value = data.wireId || '';
        entryDiv.querySelector('input[placeholder="Cut Length"]').value = data.cutLength || '';
        entryDiv.querySelector('select').value = data.cutLengthUnit || 'm';
        entryDiv.querySelector('input[placeholder="Line Code"]').value = data.lineCode || '';
        entryDiv.querySelector('input[placeholder="Turned To Line Code"]').value = data.turnedToLineCode || '';
        entryDiv.querySelector('input[placeholder="Cutter Name"]').value = data.cutterName || '';

        entryDiv.querySelector('.batchEntryStartingMark').value = data.startingMark || '';
        entryDiv.querySelector('.batchEntryStartingMarkUnit').value = data.startingMarkUnit || 'm';
        entryDiv.querySelector('.batchEntryEndingMark').value = data.endingMark || '';
        entryDiv.querySelector('.batchEntryEndingMarkUnit').value = data.endingMarkUnit || 'm';

        entryDiv.querySelector('.coilOrReelSelect').value = data.coilOrReel || 'coil';
        entryDiv.querySelector('input[placeholder="Reel Size"]').value = data.reelSize || '';
        entryDiv.querySelector('select:has(option[value="yes"])').value = data.chargeable || '';

        // Add event listeners for auto-uppercase and validation
        const wireIdInput = entryDiv.querySelector('input[placeholder="Wire Type/ID"]');
        if (wireIdInput) {
            wireIdInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        const lineCodeInput = entryDiv.querySelector('input[placeholder="Line Code"]');
        if (lineCodeInput) {
            lineCodeInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
            });
        }

        const cutterNameInput = entryDiv.querySelector('input[placeholder="Cutter Name"]');
        if (cutterNameInput) {
            cutterNameInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Handle coil/reel field enable/disable for this entry
        const coilOrReelSelect = entryDiv.querySelector('.coilOrReelSelect');
        if (coilOrReelSelect) {
            coilOrReelSelect.addEventListener('change', function(e) {
                const isReel = e.target.value === 'reel';
                const reelSizeInput = entryDiv.querySelector('input[placeholder="Reel Size"]');
                const quantityInput = entryDiv.querySelector('input[placeholder="Quantity"]');
                const chargeableSelect = entryDiv.querySelector('select:has(option[value="yes"])');
                if (reelSizeInput) {
                    reelSizeInput.disabled = !isReel;
                    if (!isReel) {
                        reelSizeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                        reelSizeInput.value = '';
                    } else {
                        reelSizeInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (quantityInput) {
                    quantityInput.disabled = !isReel;
                    if (!isReel) {
                        quantityInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                        quantityInput.value = '1';
                    } else {
                        quantityInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (chargeableSelect) {
                    chargeableSelect.disabled = !isReel;
                    if (!isReel) {
                        chargeableSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
                        chargeableSelect.value = '';
                    } else {
                        chargeableSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            });
        }

        // Handle single unit cut checkbox for this entry
        const singleUnitCutCheckbox = entryDiv.querySelector('.batchEntrySingleUnitCut');
        if (singleUnitCutCheckbox) {
            singleUnitCutCheckbox.addEventListener('change', function(e) {
                const isChecked = e.target.checked;
                const cutLengthInput = entryDiv.querySelector('input[placeholder="Cut Length"]');
                const endingMarkInput = entryDiv.querySelector('.batchEntryEndingMark');
                if (isChecked) {
                    // Auto-fill cut length to 1
                    cutLengthInput.value = '1';
                    // Disable ending mark input
                    endingMarkInput.disabled = true;
                    endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    endingMarkInput.value = '';
                } else {
                    // Re-enable ending mark input
                    endingMarkInput.disabled = false;
                    endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            });
        }

        // Remove button event
        entryDiv.querySelector('.removeBatchCutBtn').addEventListener('click', () => {
            saveBatchState();
            batchCutList.removeChild(entryDiv);
        });

        return entryDiv;
    }

    addBatchCutBtn.addEventListener('click', () => {
        saveBatchState();
        const newEntry = createBatchCutEntry();
        batchCutList.appendChild(newEntry);
    });

    // Initialize with one empty entry
    batchCutList.appendChild(createBatchCutEntry());

    // Quick Stats toggle functionality - starts collapsed
    const statsContent = document.getElementById('statsContent');
    const statsToggle = document.getElementById('statsToggle');
    if (statsContent && statsToggle) {
        // Start with stats hidden on page load
        statsContent.classList.add('hidden');
        statsToggle.textContent = '►'; // Right arrow indicating expandable
    }

    const toggleStatsBtn = document.getElementById('toggleStats');
    if (toggleStatsBtn) {
        toggleStatsBtn.addEventListener('click', function() {
            const statsContent = document.getElementById('statsContent');
            const statsToggle = document.getElementById('statsToggle');

            if (statsContent.classList.contains('hidden')) {
                // Show stats
                statsContent.classList.remove('hidden');
                statsToggle.textContent = '▼';
            } else {
                // Hide stats
                statsContent.classList.add('hidden');
                statsToggle.textContent = '►';
            }
        });
    }

    // Quick calculators functionality
    const toggleQuickCalc = document.getElementById('toggleQuickCalc');
    const quickCalcSection = document.getElementById('quickCalcSection');
    if (toggleQuickCalc && quickCalcSection) {
        toggleQuickCalc.addEventListener('change', function() {
            if (this.checked) {
                quickCalcSection.classList.remove('hidden');
            } else {
                quickCalcSection.classList.add('hidden');
            }
        });
    }

    // Data Management Controls toggle functionality
    const toggleDataControls = document.getElementById('toggleDataControls');
    const dataControlsSection = document.getElementById('dataControlsSection');
    if (toggleDataControls && dataControlsSection) {
        toggleDataControls.addEventListener('change', function() {
            if (this.checked) {
                dataControlsSection.classList.remove('hidden');
            } else {
                dataControlsSection.classList.add('hidden');
            }
        });
    }

    // Sync Controls toggle functionality
    const toggleSyncControls = document.getElementById('toggleSyncControls');
    const syncControlsSection = document.getElementById('syncControlsSection');
    if (toggleSyncControls && syncControlsSection) {
        toggleSyncControls.addEventListener('change', function() {
            if (this.checked) {
                syncControlsSection.classList.remove('hidden');
            } else {
                syncControlsSection.classList.add('hidden');
            }
        });
    }

    // Mark difference calculator
    const calcMarkDiffBtn = document.getElementById('calcMarkDiff');
    if (calcMarkDiffBtn) {
        calcMarkDiffBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStartMark').value);
            const endMark = parseFloat(document.getElementById('quickEndMark').value);
            const unit = document.getElementById('quickMarkUnit').value;
            const resultEl = document.getElementById('markDiffResult');

            if (isNaN(startMark) || isNaN(endMark)) {
                resultEl.textContent = 'Please enter valid marks';
                resultEl.classList.add('hidden');
                return;
            }

            let difference = Math.abs(endMark - startMark);

            if (unit === 'm') {
                resultEl.textContent = `\uD83D\uCCCF Length: ${difference.toFixed(2)} meters`;
                const feetConversion = (difference * 3.28084).toFixed(2);
                if (feetConversion !== difference.toFixed(2)) {
                    resultEl.textContent += ` (${feetConversion} ft)`;
                }
            } else {
                resultEl.textContent = `\uD83D\uCCCF Length: ${difference.toFixed(2)} feet`;
                const metersConversion = (difference * 0.3048).toFixed(2);
                if (metersConversion !== difference.toFixed(2)) {
                    resultEl.textContent += ` (${metersConversion} m)`;
                }
            }

            resultEl.classList.remove('hidden');
        });
    }

    // Stop mark calculator
    const calcStopMarkBtn = document.getElementById('calcStopMark');
    if (calcStopMarkBtn) {
        calcStopMarkBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStopStart').value);
            const cutLength = parseFloat(document.getElementById('quickStopLength').value);
            const unit = document.getElementById('quickStopUnit').value;
            const countDown = document.getElementById('quickCountDown').checked;
            const resultEl = document.getElementById('stopMarkResult');

            if (isNaN(startMark) || isNaN(cutLength)) {
                resultEl.textContent = 'Please enter valid values';
                resultEl.classList.add('hidden');
                return;
            }

            if (cutLength <= 0) {
                resultEl.textContent = 'Cut length must be positive';
                resultEl.classList.add('hidden');
                return;
            }

            let stopMark = countDown ? startMark - cutLength : startMark + cutLength;

            if (countDown && stopMark < 0) {
                resultEl.textContent = 'Negative stop mark - check direction';
                resultEl.classList.add('hidden');
                return;
            }

            if (unit === 'm') {
                resultEl.textContent = `\uD83D\uDED1 Stop mark: ${stopMark.toFixed(2)} meters`;
                const feetConversion = (stopMark * 3.28084).toFixed(2);
                if (feetConversion !== stopMark.toFixed(2)) {
                    resultEl.textContent += ` (${feetConversion} ft)`;
                }
            } else {
                resultEl.textContent = `\uD83D\uDED1 Stop mark: ${stopMark.toFixed(2)} feet`;
                const metersConversion = (stopMark * 0.3048).toFixed(2);
                if (metersConversion !== stopMark.toFixed(2)) {
                    resultEl.textContent += ` (${metersConversion} m)`;
                }
            }

            resultEl.classList.remove('hidden');
        });
    }
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '📈 Reports', href: '../cutting-reports/cutting-reports.html', class: 'bg-purple-600 hover:bg-purple-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Wire Cut Records'
    });
}

// Enhanced Calculator Import Functions
async function showImportCalculatorModal() {
    const modal = document.getElementById('importCalculatorModal');
    const modalContent = document.getElementById('importModalContent');

    if (!modal || !modalContent) {
        console.error('Import calculator modal not found');
        return;
    }

    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Populate dropdowns with history
    await populateCalculatorDropdowns();

    // Setup modal event listeners
    setupImportModalEventListeners();
}

async function populateCalculatorDropdowns() {
    const markDropdown = document.getElementById('markCalculatorDropdown');
    const stopDropdown = document.getElementById('stopCalculatorDropdown');

    if (!markDropdown || !stopDropdown) {
        console.error('Calculator dropdowns not found');
        return;
    }

    try {
        // Clear existing options
        markDropdown.innerHTML = '';
        const markLoadingOpt = document.createElement('option');
        markLoadingOpt.value = '';
        markLoadingOpt.textContent = 'Loading...';
        markDropdown.appendChild(markLoadingOpt);

        stopDropdown.innerHTML = '';
        const stopLoadingOpt = document.createElement('option');
        stopLoadingOpt.value = '';
        stopLoadingOpt.textContent = 'Loading...';
        stopDropdown.appendChild(stopLoadingOpt);

        // Check if database is available
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            markLoadingOpt.textContent = 'Database not available';
            stopLoadingOpt.textContent = 'Database not available';
            return;
        }

        // Fetch last 5 records from markConverter store
        const markRecords = await window.eecolDB.getAll('markConverter');
        const sortedMarkRecords = markRecords
            .filter(record => record.startMark && record.endMark && record.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Fetch last 5 records from stopmarkConverter store
        const stopRecords = await window.eecolDB.getAll('stopmarkConverter');
        const sortedStopRecords = stopRecords
            .filter(record => record.startMark && record.endMark && record.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Populate Mark Calculator dropdown
        markDropdown.innerHTML = '';
        const markDefaultOpt = document.createElement('option');
        markDefaultOpt.value = '';
        markDefaultOpt.textContent = 'Select a saved calculation...';
        markDropdown.appendChild(markDefaultOpt);

        if (sortedMarkRecords.length === 0) {
            const noneOpt = document.createElement('option');
            noneOpt.value = '';
            noneOpt.disabled = true;
            noneOpt.textContent = 'No saved calculations found';
            markDropdown.appendChild(noneOpt);
        } else {
            sortedMarkRecords.forEach(record => {
                const date = new Date(record.timestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const unitLabel = record.unit === 'ft' ? 'ft' : 'm';
                const opt = document.createElement('option');
                opt.value = record.id;
                opt.setAttribute('data-unit', record.unit);
                opt.setAttribute('data-start', record.startMark);
                opt.setAttribute('data-end', record.endMark);
                opt.textContent = `Start: ${record.startMark}${unitLabel}, End: ${record.endMark}${unitLabel}, Saved: ${date}`;
                markDropdown.appendChild(opt);
            });
        }

        // Populate Stop Calculator dropdown
        stopDropdown.innerHTML = '';
        const stopDefaultOpt = document.createElement('option');
        stopDefaultOpt.value = '';
        stopDefaultOpt.textContent = 'Select a saved calculation...';
        stopDropdown.appendChild(stopDefaultOpt);

        if (sortedStopRecords.length === 0) {
            const noneOpt = document.createElement('option');
            noneOpt.value = '';
            noneOpt.disabled = true;
            noneOpt.textContent = 'No saved calculations found';
            stopDropdown.appendChild(noneOpt);
        } else {
            sortedStopRecords.forEach(record => {
                const date = new Date(record.timestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const unitLabel = record.unit === 'ft' ? 'ft' : 'm';
                const opt = document.createElement('option');
                opt.value = record.id;
                opt.setAttribute('data-unit', record.unit);
                opt.setAttribute('data-start', record.startMark);
                opt.setAttribute('data-end', record.endMark);
                opt.textContent = `Start: ${record.startMark}${unitLabel}, End: ${record.endMark}${unitLabel}, Saved: ${date}`;
                stopDropdown.appendChild(opt);
            });
        }

    } catch (error) {
        console.error('Error populating calculator dropdowns:', error);
        markDropdown.innerHTML = '';
        const errOpt = document.createElement('option');
        errOpt.value = '';
        errOpt.textContent = 'Error loading history';
        markDropdown.appendChild(errOpt);

        stopDropdown.innerHTML = '';
        const errOptStop = document.createElement('option');
        errOptStop.value = '';
        errOptStop.textContent = 'Error loading history';
        stopDropdown.appendChild(errOptStop);
    }
}

function setupImportModalEventListeners() {
    // Close modal button
    const closeBtn = document.getElementById('closeImportModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideImportModal);
    }

    // Modal backdrop click to close
    const backdrop = document.getElementById('importModalBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', hideImportModal);
    }

    // Import from Mark Calculator button
    const importMarkBtn = document.getElementById('importFromMarkCalculatorBtn');
    if (importMarkBtn) {
        importMarkBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('markCalculatorDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFromCalculator('markCalculator', selectedOption);
            } else {
                showAlert('Please select a calculation from the Mark Calculator dropdown.', 'No Selection');
            }
        });
    }

    // Import from Stop Calculator button
    const importStopBtn = document.getElementById('importFromStopCalculatorBtn');
    if (importStopBtn) {
        importStopBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('stopCalculatorDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFromCalculator('stopCalculator', selectedOption);
            } else {
                showAlert('Please select a calculation from the Stop Calculator dropdown.', 'No Selection');
            }
        });
    }

    // Enable/disable import buttons based on selection
    const markDropdown = document.getElementById('markCalculatorDropdown');
    const stopDropdown = document.getElementById('stopCalculatorDropdown');

    if (markDropdown) {
        markDropdown.addEventListener('change', () => {
            const hasSelection = markDropdown.selectedOptions[0] && markDropdown.selectedOptions[0].value;
            if (importMarkBtn) importMarkBtn.disabled = !hasSelection;
        });
    }

    if (stopDropdown) {
        stopDropdown.addEventListener('change', () => {
            const hasSelection = stopDropdown.selectedOptions[0] && stopDropdown.selectedOptions[0].value;
            if (importStopBtn) importStopBtn.disabled = !hasSelection;
        });
    }

    // Initially disable import buttons
    if (importMarkBtn) importMarkBtn.disabled = true;
    if (importStopBtn) importStopBtn.disabled = true;
}

async function importFromCalculator(calculatorType, selectedOption) {
    try {
        const recordId = selectedOption.value;
        const unit = selectedOption.getAttribute('data-unit');
        const startMark = parseFloat(selectedOption.getAttribute('data-start'));
        const endMark = parseFloat(selectedOption.getAttribute('data-end'));

        // Update form fields
        document.getElementById('startingMark').value = startMark.toString();
        document.getElementById('endingMark').value = endMark.toString();

        // Update unit dropdowns based on the imported record's unit
        const unitDisplay = unit === 'ft' ? 'ft' : 'm';
        document.getElementById('startingMarkUnit').value = unitDisplay;
        document.getElementById('endingMarkUnit').value = unitDisplay;

        // Close modal
        hideImportModal();

        // Show success message
        const calculatorName = calculatorType === 'markCalculator' ? 'Mark Calculator' : 'Stop Calculator';
        await showAlert(`Marks imported from ${calculatorName}. Units set to ${unit === 'ft' ? 'Feet (ft)' : 'Meters (m)'}.`, 'Import Successful');

    } catch (error) {
        console.error('Error importing from calculator:', error);
        await showAlert('Error importing marks. Please try again.', 'Import Error');
    }
}

function hideImportModal() {
    const modal = document.getElementById('importCalculatorModal');
    const modalContent = document.getElementById('importModalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// ====================================================================
// WIRE CUT LIST FUNCTIONS
// ====================================================================

async function initWireCutList() {
    const toggleBtn = document.getElementById('toggleWireList');
    const content = document.getElementById('wireListContent');
    const toggleArrow = document.getElementById('wireListToggle');
    const addBtn = document.getElementById('addWireListItemBtn');
    const refreshBtn = document.getElementById('refreshWireListBtn');
    const statusFilter = document.getElementById('wireListStatusFilter');
    const searchInput = document.getElementById('wireListSearch');

    if (toggleBtn && content) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = content.classList.contains('hidden');
            if (isHidden) {
                content.classList.remove('hidden');
                toggleArrow.textContent = '▼';
                loadWireCutList();
            } else {
                content.classList.add('hidden');
                toggleArrow.textContent = '►';
            }
        });
    }

    if (addBtn) addBtn.addEventListener('click', () => showWireListItemModal());
    if (refreshBtn) refreshBtn.addEventListener('click', loadWireCutList);
    if (statusFilter) statusFilter.addEventListener('change', renderWireCutList);
    if (searchInput) searchInput.addEventListener('input', renderWireCutList);

    // Modal input listeners for auto-capitalization
    ['wireListOrder', 'wireListCustomer', 'wireListWireType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    });

    // Modal events
    const cancelBtn = document.getElementById('cancelWireListItemBtn');
    const saveBtn = document.getElementById('saveWireListItemBtn');
    const backdrop = document.getElementById('wireModalBackdrop');

    if (cancelBtn) cancelBtn.addEventListener('click', hideWireListItemModal);
    if (saveBtn) saveBtn.addEventListener('click', saveWireListItem);
    if (backdrop) backdrop.addEventListener('click', hideWireListItemModal);

    // Removal reason modal events
    const cancelRemBtn = document.getElementById('cancelRemovalBtn');
    const confirmRemBtn = document.getElementById('confirmRemovalBtn');
    const remBackdrop = document.getElementById('removalModalBackdrop');

    if (cancelRemBtn) cancelRemBtn.addEventListener('click', hideRemovalReasonModal);
    if (confirmRemBtn) confirmRemBtn.addEventListener('click', saveRemovalWithReason);
    if (remBackdrop) remBackdrop.addEventListener('click', hideRemovalReasonModal);

    // Context menu events
    document.addEventListener('click', hideWireListContextMenu);
    document.getElementById('ctxEdit').addEventListener('click', () => {
        if (currentContextMenuId) showWireListItemModal(currentContextMenuId);
    });
    document.getElementById('ctxRemove').addEventListener('click', async () => {
        if (currentContextMenuId) {
            const confirm = await showConfirm('Remove this item from the list?', 'Remove Item');
            if (confirm) {
                await deleteWireListItem(currentContextMenuId);
            }
        }
    });
    document.getElementById('ctxColorPicker').addEventListener('input', (e) => {
        if (currentContextMenuId) {
            updateWireListItemColor(currentContextMenuId, e.target.value);
        }
    });

    // Drag and drop events for the container
    const container = document.getElementById('wireCutListItems');
    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });

    container.addEventListener('drop', async e => {
        e.preventDefault();
        await saveWireListOrder();
    });

    // Load initial data
    await loadWireCutList();
}

async function loadWireCutList() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('wireCutList');
            wireCutList = records.sort((a, b) => (a.position || 0) - (b.position || 0));
            renderWireCutList();
        }
    } catch (error) {
        console.error("Error loading wire cut list:", error);
    }
}

function renderWireCutList() {
    const container = document.getElementById('wireCutListItems');
    const filter = document.getElementById('wireListStatusFilter').value;
    const searchTerm = document.getElementById('wireListSearch')?.value.trim().toLowerCase() || '';

    container.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    const filtered = wireCutList.filter(item => {
        // Status filter
        if (filter !== 'all' && item.status !== filter) return false;

        // Search filter
        if (searchTerm) {
            const searchFields = [
                item.orderNumber,
                item.customerName,
                item.wireType,
                item.description,
                item.orderComments,
                item.shipperComments
            ].map(f => (f || '').toLowerCase());

            if (!searchFields.some(f => f.includes(searchTerm))) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-center text-gray-500 italic';
        emptyMsg.textContent = searchTerm ? 'No items match your search.' : (filter === 'all' ? 'No items in the list.' : `No ${filter} items found.`);
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'wire-list-item';
        itemDiv.draggable = true;
        itemDiv.dataset.id = item.id;

        const card = document.createElement('div');
        card.className = 'wire-list-card';
        if (item.color) {
            card.style.backgroundColor = item.color;
            card.style.borderColor = 'rgba(0,0,0,0.1)';
        }

        // Secure rendering using createElement and textContent
        const headerRow = document.createElement('div');
        headerRow.className = 'flex justify-between items-start border-b border-black/10 pb-1 mb-1 font-bold text-[10px] uppercase';

        ['ORDER / LINE CUSTOMER', 'ORDER COMMENTS', 'SHIPPER COMMENTS'].forEach(text => {
            const div = document.createElement('div');
            div.textContent = text;
            headerRow.appendChild(div);
        });

        const bodyRow = document.createElement('div');
        bodyRow.className = 'flex gap-2';

        // Left Column (Details)
        const detailsCol = document.createElement('div');
        detailsCol.className = 'w-1/3';

        const orderLine = document.createElement('div');
        orderLine.className = 'font-bold text-sm flex items-center gap-2';
        orderLine.textContent = `${item.orderNumber || 'N/A'} / ${item.lineNumber || '1'}`;

        if (item.urgency && item.urgency !== 'normal') {
            const urgencyBadge = document.createElement('span');
            urgencyBadge.className = `px-1 rounded text-[8px] uppercase ${item.urgency === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`;
            urgencyBadge.textContent = item.urgency;
            orderLine.appendChild(urgencyBadge);
        }

        const meta = document.createElement('div');
        meta.className = 'text-[9px] font-bold';
        const dateStr = new Date(item.timestamp).toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        }).toUpperCase();
        meta.textContent = `${dateStr} @ ${item.customerName || 'N/A'}`;

        const highlightBox = document.createElement('div');
        highlightBox.className = 'mt-2 bg-black/5 border border-black/10 p-1 rounded italic font-black text-xs';

        const typeLength = document.createElement('div');
        typeLength.textContent = `${item.lengthZ || '0'} Z \u00A0\u00A0 ${item.wireType || 'N/A'}`;

        const desc = document.createElement('span');
        desc.className = 'text-[9px] font-normal';
        desc.textContent = item.description || '';

        highlightBox.appendChild(typeLength);
        highlightBox.appendChild(desc);

        detailsCol.appendChild(orderLine);
        detailsCol.appendChild(meta);
        detailsCol.appendChild(highlightBox);

        // Middle Column (Order Comments)
        const orderCommentsCol = document.createElement('div');
        orderCommentsCol.className = 'w-1/3 border-l border-black/10 pl-2 text-[10px] whitespace-pre-wrap';
        orderCommentsCol.textContent = item.orderComments || '';

        // Right Column (Shipper Comments)
        const shipperCommentsCol = document.createElement('div');
        shipperCommentsCol.className = 'w-1/3 border-l border-black/10 pl-2 text-[10px] whitespace-pre-wrap';
        shipperCommentsCol.textContent = item.shipperComments || '';

        bodyRow.appendChild(detailsCol);
        bodyRow.appendChild(orderCommentsCol);
        bodyRow.appendChild(shipperCommentsCol);

        card.appendChild(headerRow);
        card.appendChild(bodyRow);

        // Removal Reason (if exists)
        if (item.status === 'removed' && item.removalReason) {
            const reasonDiv = document.createElement('div');
            reasonDiv.className = 'mt-1 p-1 bg-red-100/50 border border-red-200 rounded text-[9px] italic';
            reasonDiv.textContent = `Removal Reason: ${item.removalReason}`;
            card.appendChild(reasonDiv);
        }

        // Action Buttons (only for active items)
        if (item.status === 'active') {
            const actionsRow = document.createElement('div');
            actionsRow.className = 'flex justify-end gap-2 mt-2 pt-1 border-t border-black/5';

            const autoFillBtn = document.createElement('button');
            autoFillBtn.className = 'px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold hover:bg-blue-700 transition';
            autoFillBtn.textContent = '📥 AutoFill Cut';
            autoFillBtn.onclick = (e) => {
                e.stopPropagation();
                autoFillCuttingForm(item.id);
            };

            const completeBtn = document.createElement('button');
            completeBtn.className = 'px-2 py-0.5 bg-green-600 text-white rounded text-[9px] font-bold hover:bg-green-700 transition';
            completeBtn.textContent = '✅ Complete';
            completeBtn.onclick = (e) => {
                e.stopPropagation();
                completeWireListItem(item.id);
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 transition';
            removeBtn.textContent = '❌ Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                showRemovalReasonModal(item.id);
            };

            actionsRow.appendChild(autoFillBtn);
            actionsRow.appendChild(completeBtn);
            actionsRow.appendChild(removeBtn);
            card.appendChild(actionsRow);
        }

        itemDiv.appendChild(card);

        // Events
        itemDiv.addEventListener('contextmenu', e => {
            e.preventDefault();
            showWireListContextMenu(e, item.id);
        });

        itemDiv.addEventListener('dragstart', () => {
            itemDiv.classList.add('dragging');
            draggedItemId = item.id;
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
        });

        container.appendChild(itemDiv);
    });
}

function showWireListItemModal(id = null) {
    const modal = document.getElementById('wireListItemModal');
    const modalContent = document.getElementById('wireModalContent');
    const title = document.getElementById('wireModalTitle');

    wireListEditingId = id;

    if (id) {
        title.textContent = 'Edit Wire Cut List Item';
        const item = wireCutList.find(i => i.id === id);
        if (item) {
            document.getElementById('wireListOrder').value = item.orderNumber || '';
            document.getElementById('wireListLine').value = item.lineNumber || '';
            document.getElementById('wireListCustomer').value = item.customerName || '';
            document.getElementById('wireListWireType').value = item.wireType || '';
            document.getElementById('wireListLength').value = item.lengthZ || '';
            document.getElementById('wireListUrgency').value = item.urgency || 'normal';
            document.getElementById('wireListStatus').value = item.status || 'active';
            document.getElementById('wireListDescription').value = item.description || '';
            document.getElementById('wireListOrderComments').value = item.orderComments || '';
            document.getElementById('wireListShipperComments').value = item.shipperComments || '';
        }
    } else {
        title.textContent = 'Add Wire Cut List Item';
        document.getElementById('wireListOrder').value = '';
        document.getElementById('wireListLine').value = '1';
        document.getElementById('wireListCustomer').value = '';
        document.getElementById('wireListWireType').value = '';
        document.getElementById('wireListLength').value = '';
        document.getElementById('wireListUrgency').value = 'normal';
        document.getElementById('wireListStatus').value = 'active';
        document.getElementById('wireListDescription').value = '';
        document.getElementById('wireListOrderComments').value = '';
        document.getElementById('wireListShipperComments').value = '';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideWireListItemModal() {
    const modal = document.getElementById('wireListItemModal');
    const modalContent = document.getElementById('wireModalContent');

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

async function saveWireListItem() {
    const item = {
        id: wireListEditingId || crypto.randomUUID(),
        orderNumber: document.getElementById('wireListOrder').value.trim().toUpperCase(),
        lineNumber: document.getElementById('wireListLine').value.trim(),
        customerName: document.getElementById('wireListCustomer').value.trim().toUpperCase(),
        wireType: document.getElementById('wireListWireType').value.trim().toUpperCase(),
        lengthZ: document.getElementById('wireListLength').value.trim(),
        urgency: document.getElementById('wireListUrgency').value,
        status: document.getElementById('wireListStatus').value,
        description: document.getElementById('wireListDescription').value.trim(),
        orderComments: document.getElementById('wireListOrderComments').value.trim(),
        shipperComments: document.getElementById('wireListShipperComments').value.trim(),
        timestamp: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).timestamp : Date.now(),
        position: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).position : wireCutList.length,
        color: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).color : null
    };

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('wireCutList', item);
            await loadWireCutList();
            hideWireListItemModal();
        }
    } catch (error) {
        console.error("Error saving wire list item:", error);
        showAlert("Failed to save item.", "Error");
    }
}

async function deleteWireListItem(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('wireCutList', id);
            await loadWireCutList();
        }
    } catch (error) {
        console.error("Error deleting wire list item:", error);
    }
}

async function completeWireListItem(id) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.status = 'completed';
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();
                await showAlert('Item marked as completed!', 'Success');
            }
        } catch (error) {
            console.error("Error completing item:", error);
        }
    }
}

function showRemovalReasonModal(id) {
    currentContextMenuId = id; // Reuse this variable to track target ID
    const modal = document.getElementById('removalReasonModal');
    const modalContent = document.getElementById('removalModalContent');
    const textarea = document.getElementById('removalReasonText');

    textarea.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
        textarea.focus();
    }, 10);
}

function hideRemovalReasonModal() {
    const modal = document.getElementById('removalReasonModal');
    const modalContent = document.getElementById('removalModalContent');

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

async function saveRemovalWithReason() {
    const reason = document.getElementById('removalReasonText').value.trim();
    if (!reason) {
        showAlert('Please provide a reason for removal.', 'Reason Required');
        return;
    }

    const item = wireCutList.find(i => i.id === currentContextMenuId);
    if (item) {
        item.status = 'removed';
        item.removalReason = reason;
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();
                hideRemovalReasonModal();
                await showAlert('Item archived with reason.', 'Removed');
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    }
}

async function autoFillCuttingForm(id) {
    const item = wireCutList.find(i => i.id === id);
    if (!item) return;

    // Mapping wire list fields to cutting record fields
    const fields = {
        'orderNumber': item.orderNumber || '',
        'customerName': item.customerName || '',
        'wireId': item.wireType || '',
        'cutLength': item.lengthZ || ''
    };

    // Populate the fields
    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            // Force uppercase for relevant fields immediately
            if (['orderNumber', 'customerName', 'wireId'].includes(id)) {
                el.value = el.value.toUpperCase();
            }
            // Trigger input events for validation/dependent logic
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Ensure Batch Entry Mode is OFF for this autofill to work as expected on the main form
    const batchMode = document.getElementById('batchEntryMode');
    if (batchMode && batchMode.checked) {
        batchMode.checked = false;
        batchMode.dispatchEvent(new Event('change'));
    }

    // Visual feedback
    await showAlert(`Autofilled cut details for Order #${item.orderNumber}`, 'AutoFill Success');

    // Scroll to the form
    document.getElementById('recordsPage').scrollIntoView({ behavior: 'smooth' });
}

async function updateWireListItemColor(id, color) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.color = color;
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                renderWireCutList();
            }
        } catch (error) {
            console.error("Error updating color:", error);
        }
    }
}

function showWireListContextMenu(e, id) {
    const menu = document.getElementById('wireListContextMenu');
    currentContextMenuId = id;

    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.classList.remove('hidden');

    // Set color picker to current color
    const item = wireCutList.find(i => i.id === id);
    if (item && item.color) {
        document.getElementById('ctxColorPicker').value = item.color;
    } else {
        document.getElementById('ctxColorPicker').value = '#fef08a';
    }
}

function hideWireListContextMenu() {
    const menu = document.getElementById('wireListContextMenu');
    menu.classList.add('hidden');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.wire-list-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveWireListOrder() {
    const container = document.getElementById('wireCutListItems');
    const items = [...container.querySelectorAll('.wire-list-item')];

    for (let i = 0; i < items.length; i++) {
        const id = items[i].dataset.id;
        const item = wireCutList.find(item => item.id === id);
        if (item) {
            item.position = i;
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
            }
        }
    }
    // Refresh local list
    const records = await window.eecolDB.getAll('wireCutList');
    wireCutList = records.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// ====================================================================
// REEL ESTIMATOR IMPORT MODAL FUNCTIONS
// ====================================================================

async function showImportReelModal() {
    const modal = document.getElementById('importReelModal');
    const modalContent = document.getElementById('reelModalContent');

    if (!modal || !modalContent) {
        console.error('Import reel modal not found');
        return;
    }

    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Populate dropdown with saved reel configurations
    await populateFlangeDropdown();

    // Setup modal event listeners
    setupReelModalEventListeners();
}

async function populateFlangeDropdown() {
    const dropdown = document.getElementById('flangeSizeDropdown');

    if (!dropdown) {
        console.error('Flange size dropdown not found');
        return;
    }

    try {
        // Clear existing options
        dropdown.innerHTML = '';
        const loadingOpt = document.createElement('option');
        loadingOpt.value = '';
        loadingOpt.textContent = 'Loading...';
        dropdown.appendChild(loadingOpt);

        // Check if database is available
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            loadingOpt.textContent = 'Database not available';
            return;
        }

        // Fetch all reel capacity estimator configurations
        const reelConfigurations = await window.eecolDB.getAll('reelcapacityEstimator');

        // Sort by timestamp (newest first) and take last 5
        const sortedConfigurations = reelConfigurations
            .filter(config => config.flangeDiameter && config.flangeDiameter.value && config.flangeDiameter.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Populate dropdown
        dropdown.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Select a saved flange size...';
        dropdown.appendChild(defaultOpt);

        if (sortedConfigurations.length === 0) {
            const noneOpt = document.createElement('option');
            noneOpt.value = '';
            noneOpt.disabled = true;
            noneOpt.textContent = 'No saved configurations found';
            dropdown.appendChild(noneOpt);
        } else {
            sortedConfigurations.forEach(config => {
                const date = new Date(config.timestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const flangeSize = config.flangeDiameter.value;
                const flangeUnit = config.flangeDiameter.unit;
                const opt = document.createElement('option');
                opt.value = config.id;
                opt.setAttribute('data-value', flangeSize);
                opt.setAttribute('data-unit', flangeUnit);
                opt.textContent = `Flange: ${flangeSize} ${flangeUnit} - Saved: ${date}`;
                dropdown.appendChild(opt);
            });
        }

    } catch (error) {
        console.error('Error populating flange dropdown:', error);
        dropdown.innerHTML = '';
        const errOpt = document.createElement('option');
        errOpt.value = '';
        errOpt.textContent = 'Error loading configurations';
        dropdown.appendChild(errOpt);
    }
}

function setupReelModalEventListeners() {
    // Close modal button
    const closeBtn = document.getElementById('closeReelModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideReelModal);
    }

    // Modal backdrop click to close
    const backdrop = document.getElementById('reelModalBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', hideReelModal);
    }

    // Import flange button
    const importBtn = document.getElementById('importFlangeBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('flangeSizeDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFlangeSize(selectedOption);
            } else {
                showAlert('Please select a flange size from the dropdown.', 'No Selection');
            }
        });
    }

    // Enable/disable import button based on selection
    const dropdown = document.getElementById('flangeSizeDropdown');
    if (dropdown) {
        dropdown.addEventListener('change', () => {
            const hasSelection = dropdown.selectedOptions[0] && dropdown.selectedOptions[0].value;
            if (importBtn) importBtn.disabled = !hasSelection;
        });
    }

    // Initially disable import button
    if (importBtn) importBtn.disabled = true;
}

async function importFlangeSize(selectedOption) {
    try {
        const flangeValue = parseFloat(selectedOption.getAttribute('data-value'));
        const flangeUnit = selectedOption.getAttribute('data-unit');

        // Convert to inches for the reel size field
        let convertedValue = flangeValue;
        if (flangeUnit !== 'in') {
            if (flangeUnit === 'cm') convertedValue = flangeValue / 2.54;
            else if (flangeUnit === 'm') convertedValue = flangeValue / 0.0254;
            else if (flangeUnit === 'ft') convertedValue = flangeValue * 12;
        }

        // Set coil/reel to 'reel' and populate the reel size
        document.getElementById('coilOrReel').value = 'reel';
        document.getElementById('coilOrReel').dispatchEvent(new Event('change'));
        document.getElementById('reelSize').value = Math.round(convertedValue);

        // Close modal
        hideReelModal();

        // Show success message
        await showAlert(`Flange diameter imported: ${Math.round(convertedValue)} inches`, 'Import Successful');

    } catch (error) {
        console.error('Error importing flange size:', error);
        await showAlert('Error importing flange size. Please try again.', 'Import Error');
    }
}

function hideReelModal() {
    const modal = document.getElementById('importReelModal');
    const modalContent = document.getElementById('reelModalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}
