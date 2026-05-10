/**
 * EECOL Wire Inventory Records Tool - JavaScript Module
 * IndexedDB implementation for inventory data persistence
 */

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
        const records = await window.eecolDB.getAll('inventoryRecords');

        // Test adding a temporary record
        const testRecord = {
            id: 'test-' + Date.now(),
            wireType: 'TEST',
            inventoryDate: new Date().toISOString().split('T')[0],
            personName: 'TEST',
            productCode: 'TEST',
            lineCode: 'L:001',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            timestamp: Date.now()
        };

        const addResult = await window.eecolDB.add('inventoryRecords', testRecord);

        // Verify the record was added
        const verifyRecord = await window.eecolDB.get('inventoryRecords', testRecord.id);
        if (verifyRecord) {
            // Clean up test record
            await window.eecolDB.delete('inventoryRecords', testRecord.id);
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

// Global variables
let inventoryItems = [];

/**
 * BOLT OPTIMIZATION: High-performance date formatters
 * Pre-initializing Intl.DateTimeFormat instances at module scope is significantly faster
 * than calling toLocaleString() inside render loops, as it avoids repeated parsing of
 * locale strings and options.
 */
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
let currentView = 'inventory';
let displayedItemsCount = 0;
let itemsPerPage = 25;
let isLoading = false;
let currentSortField = 'timestamp';
let lastDeltaExport = null;
// Undo/Redo system
let operationHistory = [];
let undoStack = [];
let isUndoRedoOperation = false; // Flag to prevent history recording during undo/redo

// IndexedDB-based data loading and saving functions
async function loadInventoryItems() {
    try {
        // Load from IndexedDB
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('inventoryRecords');

            if (records && records.length > 0) {
                // Sanitize and validate loaded data
                inventoryItems = records.map((item, index) => {
                    // Ensure timestamps are numbers, not strings
                    if (item.timestamp && typeof item.timestamp === 'string') {
                        item.timestamp = parseInt(item.timestamp) || Date.now();
                    }
                    if (item.reviewedTimestamp && typeof item.reviewedTimestamp === 'string') {
                        item.reviewedTimestamp = parseInt(item.reviewedTimestamp) || null;
                    }
                    if (item.createdAt && typeof item.createdAt === 'string') {
                        item.createdAt = parseInt(item.createdAt) || Date.now();
                    }
                    if (item.updatedAt && typeof item.updatedAt === 'string') {
                        item.updatedAt = parseInt(item.updatedAt) || Date.now();
                    }

                    // Ensure reviewed field exists
                    if (item.reviewed === undefined) {
                        item.reviewed = false;
                    }

                    // Ensure reviewedTimestamp exists for reviewed items
                    if (item.reviewed && !item.reviewedTimestamp) {
                        item.reviewedTimestamp = item.timestamp || Date.now();
                    }

                    return item;
                }).sort((a, b) => b.timestamp - a.timestamp);

                displayedItemsCount = 0;
                try {
                    renderInventoryItems();
                } catch (renderError) {
                    console.error('❌ Error in renderInventoryItems:', renderError);
                }
                try {
                    updateExportStatus();
                } catch (exportError) {
                    console.error('❌ Error in updateExportStatus:', exportError);
                }
                return;
            }
        }

        // Fresh database starts empty
        inventoryItems = [];
        displayedItemsCount = 0;
        renderInventoryItems();
        updateExportStatus();

    } catch (error) {
        console.error("❌ Error loading inventory items:", error);
        await showAlert("Error loading inventory items. Please refresh the page.", "Loading Error");
    }
}

async function saveInventoryStateToDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            /**
             * IDB SENTINEL: Atomic batch update
             * Replaced non-atomic loop with single transaction bulkPut
             * to prevent partial state in IndexedDB and reduce disk syncs.
             */
            await window.eecolDB.bulkPut('inventoryRecords', inventoryItems, true);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error saving inventory state:", error);
        throw error;
    }
}

async function saveInventoryItemToDB(item) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const result = await window.eecolDB.add('inventoryRecords', item);

            // Verify the save worked
            const verification = await window.eecolDB.get('inventoryRecords', item.id);
            if (!verification) {
                console.error("❌ Save verification failed for record:", item.id);
            }

            return result;
        } else {
            console.error("❌ Database not available or not ready");
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("❌ Error saving inventory item:", error);
        throw error;
    }
}

async function updateInventoryItemInDB(item) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('inventoryRecords', item);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
    }
}

function validateInputs() {
    // Check required fields
    const personName = document.getElementById('personName').value.trim();
    if (!personName) {
        showError("Name is required.");
        return false;
    }

    const productCode = document.getElementById('productCode').value.trim();
    if (!productCode) {
        showError("Product code is required.");
        return false;
    }

    const reason = document.getElementById('reason').value;
    if (!reason) {
        showError("Reason is required.");
        return false;
    }

    const lineCode = document.getElementById('lineCode').value.trim();
    if (!lineCode) {
        showError("Line code is required.");
        return false;
    }

    // Check that both current and actual length are provided and valid
    const currentLength = document.getElementById('currentLength').value.trim();
    const actualLength = document.getElementById('actualLength').value.trim();

    if (!currentLength || isNaN(parseFloat(currentLength)) || parseFloat(currentLength) <= 0) {
        showError("Current Length is required and must be a valid positive number.");
        return false;
    }

    if (!actualLength || isNaN(parseFloat(actualLength)) || parseFloat(actualLength) < 0) {
        showError("Actual Length is required and must be a valid number (0 or greater allowed for no remaining wire).");
        return false;
    }

    // Check that note field is provided
    const note = document.getElementById('note').value;
    if (!note) {
        showError("Note is required.");
        return false;
    }

    // If custom note is selected, ensure custom text is provided
    if (note === 'custom') {
        const customNoteText = document.getElementById('noteCustom').value.trim();
        if (!customNoteText) {
            showError("Custom note text is required when 'Custom' is selected.");
            return false;
        }
    }

    return true;
}

function handleReasonChange() {
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');

    if (reasonSelect.value === 'custom') {
        customReasonInput.style.display = 'block';
    } else {
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    }
}

function handleNoteChange() {
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');

    if (noteSelect.value === 'custom') {
        customNoteInput.style.display = 'block';
    } else {
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    }
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorBox').classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}

function clearForm() {
    // Clear all form fields
    document.getElementById('inventoryDate').value = '';
    document.getElementById('personName').value = '';
    document.getElementById('reason').value = '';
    handleReasonChange(); // Reset the reason dropdown UI
    document.getElementById('reasonCustom').value = '';
    document.getElementById('note').value = '';
    handleNoteChange(); // Reset the note dropdown UI
    document.getElementById('noteCustom').value = '';
    document.getElementById('productCode').value = '';
    document.getElementById('coilCode').value = '';
    document.getElementById('currentLength').value = '';
    document.getElementById('actualLength').value = '';
    document.getElementById('averageCost').value = '';
    document.getElementById('costUnit').value = '$';
    document.getElementById('totalValue').value = '';
    document.getElementById('lineCode').value = '';
    document.getElementById('adjustCB').checked = false;
    document.getElementById('approvedCB').checked = false;
    document.getElementById('notApprovedCB').checked = false;
    document.getElementById('inventoryComments').value = '';
    document.getElementById('inaNumber').value = '';
    document.getElementById('inaDate').value = '';

    editingId = null;
    document.getElementById('recordBtn').textContent = 'ADD TO INVENTORY';
    hideError();
}

// Helper function to record an operation for undo
function recordOperation(operation) {
    // Only record if not currently in undo/redo operation
    if (!isUndoRedoOperation) {
        operationHistory.push(operation);
        updateUndoRedoButtons();
    }
}

// Function to update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (operationHistory.length > 0) {
        undoBtn.disabled = false;
    } else {
        undoBtn.disabled = true;
    }

    if (undoStack.length > 0) {
        redoBtn.disabled = false;
    } else {
        redoBtn.disabled = true;
    }
}

// Undo the last operation
async function undoLastOperation() {
    if (operationHistory.length === 0) return;

    isUndoRedoOperation = true;

    const lastOperation = operationHistory.pop();
    undoStack.push(lastOperation);

    // Reverse the operation
    if (lastOperation.type === 'add') {
        // Undo add: remove the added item
        inventoryItems = inventoryItems.filter(item => item.id !== lastOperation.id);
    } else if (lastOperation.type === 'delete') {
        // Undo delete: restore the deleted item
        inventoryItems.push(lastOperation.deletedItem);
    } else if (lastOperation.type === 'edit') {
        // Undo edit: restore the original item
        const index = inventoryItems.findIndex(item => item.id === lastOperation.id);
        if (index !== -1) {
            inventoryItems[index] = { ...lastOperation.originalItem };
        }
    }

    // Ensure items remain sorted after restoration
    inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

    // Update database
    await saveInventoryStateToDB();

    displayedItemsCount = 0;
    renderInventoryItems();
    updateStats(); // Update stats after undo/redo
    updateUndoRedoButtons();

    isUndoRedoOperation = false;
}

// Redo the last undone operation
async function redoLastOperation() {
    if (undoStack.length === 0) return;

    isUndoRedoOperation = true;

    const lastUndoneOperation = undoStack.pop();
    operationHistory.push(lastUndoneOperation);

    // Reapply the operation
    if (lastUndoneOperation.type === 'add') {
        // Redo add: add back the full item data stored in the operation
        if (lastUndoneOperation.fullItem) {
            inventoryItems.push(lastUndoneOperation.fullItem);
        } else {
            await showAlert('Full item data not available for redo operation. Please add the item again.', 'Redo Error');
        }
    } else if (lastUndoneOperation.type === 'delete') {
        // Redo delete: delete the item again
        inventoryItems = inventoryItems.filter(item => item.id !== lastUndoneOperation.id);
    } else if (lastUndoneOperation.type === 'edit') {
        // Redo edit: restore the edited item
        if (lastUndoneOperation.newItem) {
            const index = inventoryItems.findIndex(item => item.id === lastUndoneOperation.id);
            if (index !== -1) {
                inventoryItems[index] = lastUndoneOperation.newItem;
            } else {
                await showAlert('Item not found for redo edit operation.', 'Redo Error');
            }
        } else {
            await showAlert('Edit item data not available for redo operation.', 'Redo Error');
        }
    }

    inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

    // Update database
    await saveInventoryStateToDB();

    displayedItemsCount = 0;
    renderInventoryItems();
    updateStats(); // Update stats after redo
    updateUndoRedoButtons();

    isUndoRedoOperation = false;
}

async function saveInventoryItem() {
    if (!validateInputs()) {
        return;
    }

    hideError();

    const inventoryDate = document.getElementById('inventoryDate').value || new Date().toISOString().split('T')[0];
    const personName = document.getElementById('personName').value.trim().toUpperCase();

    // Handle the reason field logic
    let reason = '';
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');
    if (reasonSelect.value === 'custom') {
        reason = customReasonInput.value.trim();
    } else {
        reason = reasonSelect.value;
    }

    // Handle the note field logic
    let note = '';
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');
    if (noteSelect.value === 'custom') {
        note = customNoteInput.value.trim();
    } else {
        note = noteSelect.value;
    }

    const productCode = document.getElementById('productCode').value.trim().toUpperCase();
    const coilCode = document.getElementById('coilCode').value.trim().toUpperCase();
    const currentLength = parseFloat(document.getElementById('currentLength').value) || 0;
    const currentLengthUnit = document.getElementById('currentLengthUnit').value;
    const actualLength = parseFloat(document.getElementById('actualLength').value) || 0;
    const actualLengthUnit = document.getElementById('actualLengthUnit').value;
    const averageCost = parseFloat(document.getElementById('averageCost').value) || 0;
    const costUnit = document.getElementById('costUnit').value;
    const totalValue = parseFloat(document.getElementById('totalValue').value) || 0;
    const lineCode = document.getElementById('lineCode').value.trim().toUpperCase();
    const adjust = document.getElementById('adjustCB').checked;
    let approved = null;
    if (document.getElementById('approvedCB').checked) {
        approved = true;
    } else if (document.getElementById('notApprovedCB').checked) {
        approved = false;
    } else {
        approved = null;
    }
    const inventoryComments = document.getElementById('inventoryComments').value.trim();
    const inaNumber = document.getElementById('inaNumber').value;
    const inaDate = document.getElementById('inaDate').value;

    const now = Date.now();
    const existingItem = editingId ? inventoryItems.find(i => i.id === editingId) : null;

    const item = {
        wireType: 'INVENTORY',
        inventoryDate,
        personName,
        reason,
        productCode,
        coilCode,
        currentLength,
        currentLengthUnit,
        actualLength,
        actualLengthUnit,
        averageCost,
        costUnit,
        totalValue,
        lineCode,
        adjust,
        approved,
        inventoryComments,
        inaNumber,
        inaDate,
        note,
        reviewed: existingItem ? existingItem.reviewed : false,
        reviewedTimestamp: existingItem ? existingItem.reviewedTimestamp : null,
        createdAt: existingItem ? existingItem.createdAt : now,
        updatedAt: now,
        timestamp: existingItem ? existingItem.timestamp : now,
        id: editingId || crypto.randomUUID(),
    };

    // Store editing ID before clearing for scrolling
    const wasEditingId = editingId;
    let operation = null;

    try {
        if (editingId) {
            // Store the original item before editing for undo
            const originalItem = inventoryItems.find(i => i.id === editingId);
            inventoryItems = inventoryItems.map(i => i.id === editingId ? item : i);
            await updateInventoryItemInDB(item);
            editingId = null;
            operation = { type: 'edit', id: item.id, originalItem: { ...originalItem }, newItem: { ...item } };
        } else {
            inventoryItems.push(item);
            await saveInventoryItemToDB(item);
            operation = { type: 'add', id: item.id, fullItem: { ...item } };
        }

        inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

        // Record operation for undo
        if (operation) {
            recordOperation(operation);
        }

        displayedItemsCount = 0;
        renderInventoryItems();
        updateStats(); // Update stats after save

        // Scroll to edited item if we were editing
        if (wasEditingId) {
            setTimeout(() => {
                const editedItemElement = document.querySelector(`button[onclick*="editItem('${wasEditingId}')"]`);
                if (editedItemElement) {
                    editedItemElement.closest('.inventory-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        clearForm();
        await showAlert('Inventory item saved successfully!', 'Success');
    } catch (error) {
        console.error('Error saving inventory item:', error);
        await showAlert(`Failed to save inventory item: ${error.message}\n\nPlease check the browser console for more details.`, 'Save Error');
    }
}

async function deleteInventoryItem(id) {
    const confirmResult = await showConfirm('Are you sure you want to delete this inventory item? This action cannot be undone.', 'Delete Item');
    if (!confirmResult) return;

    const deletedItem = inventoryItems.find(item => item.id === id);
    inventoryItems = inventoryItems.filter(item => item.id !== id);

    try {
        await deleteInventoryItemFromDB(id);

        // Record operation for undo
        recordOperation({ type: 'delete', id, deletedItem: { ...deletedItem } });

        displayedItemsCount = 0;
        renderInventoryItems();
        updateStats(); // Update stats after delete
    } catch (error) {
        // Restore item on error
        if (deletedItem) inventoryItems.push(deletedItem);
        console.error('Error deleting inventory item:', error);
        await showAlert(`Failed to delete inventory item: ${error.message}`, 'Delete Error');
    }
}

async function editInventoryItem(id) {
    const item = inventoryItems.find(i => i.id === id);
    if (!item) {
        await showAlert('Item not found.', 'Edit Error');
        return;
    }

    // Populate all the new fields when editing
    document.getElementById('inventoryDate').value = item.inventoryDate || '';
    document.getElementById('personName').value = item.personName || '';

    // Handle reason field for editing - check if it's a predefined option or custom
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');
    if (item.reason === 'discrepancy') {
        reasonSelect.value = 'discrepancy';
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    } else if (item.reason) {
        // Any other reason goes to custom
        reasonSelect.value = 'custom';
        customReasonInput.style.display = 'block';
        customReasonInput.value = item.reason;
    } else {
        reasonSelect.value = '';
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    }

    // Handle note field for editing
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');
    if (item.note === 'tail end' || item.note === 'damaged') {
        noteSelect.value = item.note;
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    } else if (item.note) {
        // Any other note goes to custom
        noteSelect.value = 'custom';
        customNoteInput.style.display = 'block';
        customNoteInput.value = item.note;
    } else {
        noteSelect.value = '';
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    }

    document.getElementById('productCode').value = item.productCode || '';
    document.getElementById('coilCode').value = item.coilCode || '';
    document.getElementById('currentLength').value = item.currentLength ? item.currentLength.toString() : '';
    document.getElementById('currentLengthUnit').value = item.currentLengthUnit || 'm';
    document.getElementById('actualLength').value = item.actualLength ? item.actualLength.toString() : '';
    document.getElementById('actualLengthUnit').value = item.actualLengthUnit || 'm';
    document.getElementById('averageCost').value = item.averageCost ? item.averageCost.toString() : '';
    document.getElementById('costUnit').value = item.costUnit || '$';
    document.getElementById('totalValue').value = item.totalValue ? item.totalValue.toString() : '';
    document.getElementById('lineCode').value = item.lineCode || '';
    document.getElementById('adjustCB').checked = item.adjust || false;
    if (item.approved === true) {
        document.getElementById('approvedCB').checked = true;
        document.getElementById('notApprovedCB').checked = false;
    } else if (item.approved === false) {
        document.getElementById('approvedCB').checked = false;
        document.getElementById('notApprovedCB').checked = true;
    } else {
        document.getElementById('approvedCB').checked = false;
        document.getElementById('notApprovedCB').checked = false;
    }
    document.getElementById('inventoryComments').value = item.inventoryComments || '';
    document.getElementById('inaNumber').value = item.inaNumber || '';
    document.getElementById('inaDate').value = item.inaDate || '';
    editingId = id;
    document.getElementById('recordBtn').textContent = 'UPDATE ITEM';

    item.scrollIntoView();
}

function getFilteredInventoryItems() {
    const searchTermLower = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchTermUpper = searchTermLower.toUpperCase();
    const filterField = document.getElementById('filterByField').value;
    const filterValue = (document.querySelector('input[name="filterDamaged"]:checked') || { value: 'all' }).value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    /**
     * BOLT OPTIMIZATION: High-performance filtering
     * - Uses string-based date comparison to avoid expensive new Date() parsing.
     * - Only compares the YYYY-MM-DD portion to remain inclusive of full days.
     * - Caches search terms and uses case-insensitive comparison.
     * - Employs short-circuiting for O(N) efficiency.
     */
    let filtered = inventoryItems.filter(item => {
        // Date filtering (lexicographical comparison for YYYY-MM-DD)
        if (dateFrom || dateTo) {
            const itemDate = item.inventoryDate;
            if (itemDate) {
                // Take only the date part to ensure "2023-10-27T14:00" is included when dateTo is "2023-10-27"
                const itemDatePart = itemDate.length > 10 ? itemDate.substring(0, 10) : itemDate;
                if (dateFrom && itemDatePart < dateFrom) return false;
                if (dateTo && itemDatePart > dateTo) return false;
            }
        }

        // Text search filtering
        if (searchTermLower) {
            if (filterField !== 'all') {
                const val = item[filterField];
                if (!val || !val.toString().toUpperCase().includes(searchTermUpper)) return false;
            } else {
                // Search 'all' fields with optimized short-circuiting
                const match = (item.productCode && item.productCode.toString().toUpperCase().includes(searchTermUpper)) ||
                            (item.personName && item.personName.toString().toUpperCase().includes(searchTermUpper)) ||
                            (item.lineCode && item.lineCode.toString().toUpperCase().includes(searchTermUpper)) ||
                            (item.inventoryComments && item.inventoryComments.toString().toUpperCase().includes(searchTermUpper));
                if (!match) return false;
            }
        }

        // Damaged/Tailends filtering
        if (filterValue !== 'all') {
            const reason = (item.reason || '').toLowerCase();
            if (filterValue === 'damaged') {
                if (!reason.includes('damaged')) return false;
            } else if (filterValue === 'tailends') {
                if (!reason.includes('tail end') && !reason.includes('tailend')) return false;
            }
        }

        return true;
    });

    // Sorting
    const sortField = document.getElementById('sortByField').value;
    if (sortField === 'personName') {
        filtered.sort((a, b) => {
            const na = (a.personName || '').toUpperCase();
            const nb = (b.personName || '').toUpperCase();
            return na < nb ? -1 : (na > nb ? 1 : 0);
        });
    } else if (sortField === 'productCode') {
        filtered.sort((a, b) => {
            const pa = (a.productCode || '').toUpperCase();
            const pb = (b.productCode || '').toUpperCase();
            return pa < pb ? -1 : (pa > pb ? 1 : 0);
        });
    } else if (sortField === 'currentLength') {
        filtered.sort((a, b) => (a.currentLength || 0) - (b.currentLength || 0));
    } else if (sortField === 'actualLength') {
        filtered.sort((a, b) => (a.actualLength || 0) - (b.actualLength || 0));
    } else if (sortField === 'inventoryDate') {
        filtered.sort((a, b) => {
            const da = a.inventoryDate || '';
            const db = b.inventoryDate || '';
            return da < db ? 1 : (da > db ? -1 : 0);
        });
    } else {
        // Default: timestamp sort
        // Base array `inventoryItems` is always kept sorted by timestamp descending
        // in all mutation paths (load, add, edit, undo, redo, import).
        // Array.prototype.filter() is stable and preserves this order.
    }

    return filtered;
}

function formatDateMMDDYYYY(dateString) {
    // Convert YYYY-MM-DD to MM/DD/YYYY
    if (!dateString || dateString === 'N/A') return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
}

function formatTimestampToMMDDYYYY(timestamp) {
    // Safely convert a timestamp (number) to MM/DD/YYYY format
    if (!timestamp || isNaN(timestamp)) return 'N/A';

    try {
        // Ensure timestamp is a valid number
        const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        if (isNaN(timestampNum) || timestampNum <= 0) return 'N/A';

        // Create date and format to YYYY-MM-DD string
        const date = new Date(timestampNum);
        if (isNaN(date.getTime())) return 'N/A'; // Invalid date

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return formatDateMMDDYYYY(`${year}-${month}-${day}`);
    } catch (error) {
        console.warn('Error formatting timestamp:', timestamp, error);
        return 'N/A';
    }
}

function renderInventoryItems() {
    const inventoryList = document.getElementById('inventoryList');
    const totalItemsElement = document.getElementById('totalItemsCount');
    const displayedItemsElement = document.getElementById('displayedItemsCount');

    const filteredItems = getFilteredInventoryItems();

    totalItemsElement.textContent = filteredItems.length;

    // BOLT OPTIMIZATION: Faster list clearing using replaceChildren()
    inventoryList.replaceChildren();

    if (filteredItems.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-sm text-gray-500';
        emptyMsg.textContent = 'No inventory items found yet.';
        inventoryList.appendChild(emptyMsg);
        displayedItemsElement.textContent = '0';
        // BOLT: updateStats() is now only called upon data mutation
        return;
    }

    const itemsToShow = Math.min(displayedItemsCount + itemsPerPage, filteredItems.length);
    displayedItemsCount = itemsToShow;
    displayedItemsElement.textContent = displayedItemsCount;

    filteredItems.slice(0, displayedItemsCount).forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item bg-white p-3 rounded-lg shadow-sm border';

        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs';

        const fields = [
            { label: 'Date:', value: formatDateMMDDYYYY(item.inventoryDate || 'N/A') },
            { label: 'Name:', value: item.personName || 'N/A' },
            { label: 'Reason:', value: (item.reason || '').toUpperCase() },
            { label: 'Notes:', value: (item.note || '').toUpperCase() },
            { label: 'Comments:', value: item.inventoryComments || 'N/A' },
            { label: 'Line #:', value: item.lineCode || 'N/A' },
            { label: 'Product:', value: item.productCode || 'N/A' },
            { label: 'Current Length:', value: item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : 'N/A' },
            { label: 'Actual Length:', value: item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : 'N/A' },
            { label: 'Wire Coil Code:', value: item.coilCode || 'N/A' },
            { label: 'Adjust:', value: item.adjust ? 'Yes' : 'No', className: item.adjust ? 'text-orange-600 font-bold' : 'text-green-600' },
            { label: 'Approved:', value: getApprovalText(item.approved), className: getApprovalClass(item.approved) },
            { label: 'INA #:', value: item.inaNumber || 'N/A' },
            { label: 'INA Date:', value: formatDateMMDDYYYY(item.inaDate || 'N/A') },
            { label: 'Avg Cost:', value: item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : 'N/A' },
            { label: 'Value:', value: item.totalValue ? `$${item.totalValue}` : 'N/A' }
        ];

        fields.forEach(field => {
            const div = document.createElement('div');
            const labelSpan = document.createElement('span');
            labelSpan.className = 'font-semibold text-gray-900';
            labelSpan.textContent = field.label + ' ';
            div.appendChild(labelSpan);

            const valueSpan = document.createElement('span');
            valueSpan.className = field.className || 'text-gray-700';
            valueSpan.textContent = field.value;
            div.appendChild(valueSpan);
            gridDiv.appendChild(div);
        });

        itemDiv.appendChild(gridDiv);

        /**
         * BOLT OPTIMIZATION: High-performance date formatting
         * Uses pre-initialized Intl.DateTimeFormat instead of .toLocaleString()
         * which is significantly faster within high-frequency render loops.
         */
        const date = fullDateTimeFormat.format(item.timestamp);
        const metaP = document.createElement('p');
        metaP.className = 'text-xs text-gray-500 mt-2';
        metaP.textContent = `@ ${date} by Local`;
        itemDiv.appendChild(metaP);

        const createdDate = fullDateTimeFormat.format(item.createdAt || item.timestamp);
        const updatedDate = item.updatedAt && item.updatedAt !== item.createdAt ? ` | Updated: ${fullDateTimeFormat.format(item.updatedAt)}` : '';
        const createdP = document.createElement('p');
        createdP.className = 'text-xs text-gray-400';
        createdP.textContent = `Created: ${createdDate}${updatedDate}`;
        itemDiv.appendChild(createdP);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex justify-between flex-wrap mobile-stack items-center mt-2';

        const leftActions = document.createElement('div');
        leftActions.className = 'flex items-center gap-1';

        const adjustBtn = document.createElement('button');
        adjustBtn.onclick = () => toggleAdjust(item.id);
        adjustBtn.className = 'text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded';
        adjustBtn.textContent = 'Adjust';
        adjustBtn.title = 'Toggle adjust status';
        leftActions.appendChild(adjustBtn);

        const approvalBtn = document.createElement('button');
        approvalBtn.onclick = () => toggleApproval(item.id);
        approvalBtn.className = `text-xs ${item.approved === true ? 'bg-green-500 hover:bg-green-600' : item.approved === false ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white px-2 py-1 rounded`;
        approvalBtn.textContent = item.approved === true ? '✓ Approved' : item.approved === false ? '✗ Not Approved' : 'Not Set';
        approvalBtn.title = 'Toggle approval';
        leftActions.appendChild(approvalBtn);

        const clearBtn = document.createElement('button');
        clearBtn.onclick = () => clearInventoryApproval(item.id);
        clearBtn.className = 'text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded';
        clearBtn.textContent = 'Clear';
        clearBtn.title = 'Clear approval status';
        leftActions.appendChild(clearBtn);

        const approvalStatusSpan = document.createElement('span');
        approvalStatusSpan.className = 'text-xs font-semibold ml-2 ' + getApprovalClass(item.approved);
        approvalStatusSpan.textContent = getApprovalText(item.approved);
        leftActions.appendChild(approvalStatusSpan);

        const adjustStatusSpan = document.createElement('span');
        adjustStatusSpan.className = 'text-xs font-semibold ml-2 ' + (item.adjust ? 'text-orange-600 font-bold' : 'text-green-600');
        adjustStatusSpan.textContent = 'Adjust: ' + (item.adjust ? 'Yes' : 'No');
        leftActions.appendChild(adjustStatusSpan);

        actionsDiv.appendChild(leftActions);

        const rightActions = document.createElement('div');
        rightActions.className = 'flex items-center gap-1';

        const reviewBtn = document.createElement('button');
        reviewBtn.onclick = () => markAsReviewed(item.id);
        reviewBtn.className = `text-xs ${item.reviewed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'} text-white px-2 py-1 rounded`;
        if (item.reviewed) {
            const formattedDate = formatTimestampToMMDDYYYY(item.reviewedTimestamp || item.timestamp);
            reviewBtn.textContent = `✓ Reviewed (${formattedDate})`;
            reviewBtn.title = 'Reviewed on ' + formattedDate;
            reviewBtn.disabled = true;
            reviewBtn.onclick = null;
        } else {
            reviewBtn.textContent = 'Review';
            reviewBtn.title = 'Mark as reviewed';
        }
        rightActions.appendChild(reviewBtn);

        const inaBtn = document.createElement('button');
        inaBtn.onclick = () => updateINAdate(item.id);
        inaBtn.className = 'text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded';
        inaBtn.textContent = 'INA Date';
        inaBtn.title = 'Update INA Date';
        rightActions.appendChild(inaBtn);

        const editBtn = document.createElement('button');
        editBtn.onclick = () => editInventoryItem(item.id);
        editBtn.className = 'text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded';
        editBtn.textContent = 'Edit';
        rightActions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.onclick = () => deleteInventoryItem(item.id);
        deleteBtn.className = 'text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded';
        deleteBtn.textContent = 'Delete';
        rightActions.appendChild(deleteBtn);

        actionsDiv.appendChild(rightActions);
        itemDiv.appendChild(actionsDiv);
        inventoryList.appendChild(itemDiv);
    });

    if (displayedItemsCount < filteredItems.length) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'text-center mt-4';
        const moreBtn = document.createElement('button');
        moreBtn.onclick = loadMoreInventoryItems;
        moreBtn.className = 'px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200';
        moreBtn.textContent = `Load More Items (${filteredItems.length - displayedItemsCount} remaining)`;
        moreDiv.appendChild(moreBtn);
        inventoryList.appendChild(moreDiv);
    }

    // BOLT: Removed redundant updateStats() call from render loop.
    // Statistics are now only recalculated upon data mutation.
}

function loadMoreInventoryItems() {
    if (isLoading) return;

    isLoading = true;
    document.getElementById('loadingIndicator').classList.remove('hidden');

    setTimeout(() => {
        renderInventoryItems();
        document.getElementById('loadingIndicator').classList.add('hidden');
        isLoading = false;
    }, 300);
}

function getApprovalText(approved) {
    if (approved === true) return 'Approved';
    if (approved === false) return 'Not Approved';
    return 'Not Set';
}

function getApprovalClass(approved) {
    if (approved === true) return 'text-green-600 font-bold';
    if (approved === false) return 'text-red-600 font-bold';
    return 'text-yellow-600';
}

function approveInventoryItem(id) {
    updateInventoryApprovalStatus(id, true);
}

function denyInventoryItem(id) {
    updateInventoryApprovalStatus(id, false);
}

function clearInventoryApproval(id) {
    updateInventoryApprovalStatus(id, null);
}

async function updateInventoryApprovalStatus(id, status) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    inventoryItems[itemIndex].approved = status;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Re-render the grid to update approval text colors as well
        displayedItemsCount = 0;
        renderInventoryItems();

        updateStats(); // Update stats after approval change
    } catch (error) {
        console.error('Error updating approval status:', error);
        await showAlert('Failed to update approval status. Please try again.', 'Update Error');
    }
}

async function updateINAdate(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const currentINAdate = inventoryItems[itemIndex].inaDate || '';
    const newINAdate = await showDatePrompt('Select new INA Date:', currentINAdate, 'Update INA Date');

    if (newINAdate === null) return; // User cancelled

    // Store original item for undo
    const originalItem = { ...inventoryItems[itemIndex] };

    inventoryItems[itemIndex].inaDate = newINAdate;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Record operation for undo
        recordOperation({
            type: 'edit',
            id: id,
            originalItem: originalItem,
            newItem: { ...inventoryItems[itemIndex] }
        });

        displayedItemsCount = 0;
        renderInventoryItems();
    } catch (error) {
        console.error('Error updating INA date:', error);
        await showAlert('Failed to update INA date. Please try again.', 'Update Error');
        // Revert local change on error
        inventoryItems[itemIndex] = originalItem;
    }
}

// Export functions
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
    if (inventoryItems.length === 0) {
        await showAlert('No inventory items to export.', 'Export Failed');
        return;
    }

    const header = [
        'Date', 'Name', 'Reason', 'Notes', 'Line #', 'Product', 'Current Length', 'Actual Length', 'Wire Coil Code', 'Adjust', 'Approval Status', 'INA #', 'INA Date', 'AVG Cost', 'Value'
    ];

    const rows = inventoryItems.map(item => [
        escapeCSVValue(item.inventoryDate || ''),
        escapeCSVValue(item.personName || ''),
        escapeCSVValue(item.reason || ''),
        escapeCSVValue(item.inventoryComments || ''),
        escapeCSVValue(item.lineCode || ''),
        escapeCSVValue(item.productCode || ''),
        escapeCSVValue(item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : ''),
        escapeCSVValue(item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : ''),
        escapeCSVValue(item.coilCode || ''),
        escapeCSVValue(item.adjust ? 'Yes' : 'No'),
        escapeCSVValue(item.approved === true ? 'Approved' : (item.approved === false ? 'Not Approved' : 'Not Set')),
        escapeCSVValue(item.inaNumber || ''),
        escapeCSVValue(item.inaDate || ''),
        escapeCSVValue(item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : ''),
        escapeCSVValue(item.totalValue ? item.totalValue.toString() : '')
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `inventory_${inventoryItems.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update export status
    if (window.eecolDB && window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: now.toISOString() });
    }
    updateExportStatus();

    await showAlert(`Successfully exported ${inventoryItems.length} inventory items to CSV.`, 'Export Complete');
}

async function exportDeltaToCSV() {
    if (inventoryItems.length === 0) {
        await showAlert('No inventory items to export.', 'No Items');
        return;
    }

    const now = Date.now();
    const newItems = lastDeltaExport ? inventoryItems.filter(item => item.timestamp > lastDeltaExport) : inventoryItems;

    if (newItems.length === 0) {
        await showAlert('No new items since the last export.', 'No New Items');
        return;
    }

    const header = [
        'Date', 'Name', 'Reason', 'Notes', 'Line #', 'Product', 'Current Length', 'Actual Length', 'Wire Coil Code', 'Adjust', 'Approval Status', 'INA #', 'INA Date', 'AVG Cost', 'Value'
    ];

    const rows = newItems.map(item => [
        escapeCSVValue(item.inventoryDate || ''),
        escapeCSVValue(item.personName || ''),
        escapeCSVValue(item.reason || ''),
        escapeCSVValue(item.inventoryComments || ''),
        escapeCSVValue(item.lineCode || ''),
        escapeCSVValue(item.productCode || ''),
        escapeCSVValue(item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : ''),
        escapeCSVValue(item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : ''),
        escapeCSVValue(item.coilCode || ''),
        escapeCSVValue(item.adjust ? 'Yes' : 'No'),
        escapeCSVValue(item.approved === true ? 'Approved' : (item.approved === false ? 'Not Approved' : 'Not Set')),
        escapeCSVValue(item.inaNumber || ''),
        escapeCSVValue(item.inaDate || ''),
        escapeCSVValue(item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : ''),
        escapeCSVValue(item.totalValue ? item.totalValue.toString() : '')
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const dateStr = new Date(now).toISOString().split('T')[0];
    a.download = `inventory_new_${newItems.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update lastDeltaExport
    lastDeltaExport = now;
    updateExportStatus();

    await showAlert(`Successfully exported ${newItems.length} new inventory items to CSV.\n\nFile: inventory_new_${newItems.length}_${dateStr}.csv\n\n${lastDeltaExport ? 'This export contains items added since the last export.' : 'This was the first export - future exports will only include newer items.'}`);
}

async function clearAllItems() {
    const confirmResult = await showConfirm(`Are you sure you want to clear all ${inventoryItems.length} inventory items? This action cannot be undone.`);
    if (confirmResult) {
        inventoryItems = [];
        displayedItemsCount = 0;
        await clearAllInventoryItemsFromDB();
        renderInventoryItems();
        updateStats(); // Update stats after clearing
        await showAlert('All inventory items have been cleared.', 'Items Cleared');
    }
}

async function exportJSONBackup() {
    const backup = {
        records: inventoryItems,
        timestamp: Date.now(),
        version: '0.7.9.8',
        exportDate: new Date().toISOString(),
        totalRecords: inventoryItems.length
    };

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_inventory_json_backup_${inventoryItems.length}_${dateStr}.json`;

    a.click();
    URL.revokeObjectURL(url);

    // Update export status
    if (window.eecolDB && window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastJsonExport', value: new Date().toISOString() });
    }
    updateExportStatus();

    await showAlert(`JSON backup exported successfully!\nContains ${backup.totalRecords} inventory records.\nFile: eecol_inventory_json_backup_${inventoryItems.length}_${dateStr}.json`, 'JSON Backup Exported');
}

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

            const importRecords = backupData.records;
            const backupVersion = backupData.version || 'unknown';
            const exportDate = backupData.exportDate ? new Date(backupData.exportDate).toLocaleDateString() : 'unknown';

            // Show import options
            const merge = await showConfirm(`JSON Backup Import:\n\nBackup Details:\n- Version: ${backupVersion}\n- Export Date: ${exportDate}\n- Records: ${importRecords.length}\n- Current Records: ${inventoryItems.length}\n\nChoose:\nOK = Merge with existing data\nCancel = Replace all existing data`, 'Import Options');

            inventoryItems = merge ? [...inventoryItems, ...importRecords] : importRecords;

            // Clean up records (ensure IDs, etc.)
            inventoryItems.forEach(record => {
                if (!record.id) {
                    record.id = crypto.randomUUID();
                }
            });

            inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

            // Save to database using atomic bulk operation
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.bulkPut('inventoryRecords', inventoryItems, true);
            } else {
                // Fallback for older browsers or failed init
                await clearAllInventoryItemsFromDB();
                for (const record of inventoryItems) {
                    await saveInventoryItemToDB(record);
                }
            }

            displayedItemsCount = 0;
            renderInventoryItems();
            updateStats(); // Update stats after import

            await showAlert(`JSON import successful!\n${merge ? 'Merged' : 'Replaced'} with ${importRecords.length} inventory records.\nTotal records: ${inventoryItems.length}`, 'Import Successful');

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



// Event listeners and initialization
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

    // Toggle stats visibility
    document.getElementById('toggleStats').addEventListener('click', function() {
        const content = document.getElementById('statsContent');
        const toggle = document.getElementById('statsToggle');

        if (!content || !toggle) {
            console.error('Stats toggle elements not found:', { content, toggle });
            return;
        }

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            toggle.textContent = '▼';
            this.classList.add('text-blue-900', 'bg-blue-50');
        } else {
            content.classList.add('hidden');
            toggle.textContent = '►';
            this.classList.remove('text-blue-900', 'bg-blue-50');
        }
    });

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

    // Input validation for line code and person name - auto uppercase
    const lineCodeInput = document.getElementById('lineCode');
    if (lineCodeInput) {
        lineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

        const personNameInput = document.getElementById('personName');
    if (personNameInput) {
        personNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Auto uppercase for custom reason and note inputs
    const reasonCustomInput = document.getElementById('reasonCustom');
    if (reasonCustomInput) {
        reasonCustomInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const noteCustomInput = document.getElementById('noteCustom');
    if (noteCustomInput) {
        noteCustomInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        /**
         * BOLT OPTIMIZATION: Search Debouncing
         * Applies a 250ms debounce to the search input to prevent expensive O(N)
         * re-renders and filtering on every single keystroke.
         */
        searchInput.addEventListener('input', debounce(() => {
            displayedItemsCount = 0;
            renderInventoryItems();
        }, 250));
    }

    const filterByField = document.getElementById('filterByField');
    if (filterByField) {
        filterByField.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const sortByField = document.getElementById('sortByField');
    if (sortByField) {
        sortByField.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            // Clear filters
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const filterByField = document.getElementById('filterByField');
            if (filterByField) filterByField.value = 'all';
            const sortByField = document.getElementById('sortByField');
            if (sortByField) sortByField.value = 'timestamp';
            const dateFrom = document.getElementById('dateFrom');
            if (dateFrom) dateFrom.value = '';
            const dateTo = document.getElementById('dateTo');
            if (dateTo) dateTo.value = '';
            // Clear damaged/tailends filter by not selecting any radio button
            const filterRadios = document.querySelectorAll('input[name="filterDamaged"]');
            filterRadios.forEach(radio => radio.checked = false);

            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const filterRadios = document.querySelectorAll('input[name="filterDamaged"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    });

    // Button event listeners
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveInventoryItem);
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undoLastOperation);
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redoLastOperation);
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    const exportDeltaBtn = document.getElementById('exportDeltaBtn');
    if (exportDeltaBtn) exportDeltaBtn.addEventListener('click', exportDeltaToCSV);
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportJSONBackup);
    const importJSONBtn = document.getElementById('importJSONBtn');
    if (importJSONBtn) importJSONBtn.addEventListener('click', () => {
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) jsonFileInput.click();
    });
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (jsonFileInput) jsonFileInput.addEventListener('change', importJSONBackup);
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllItems);

    // Make approval checkboxes mutually exclusive
    document.getElementById('approvedCB').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('notApprovedCB').checked = false;
        }
    });

    document.getElementById('notApprovedCB').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('approvedCB').checked = false;
        }
    });

    // Load records on page load
    loadInventoryItems().then(() => {
        updateStats(); // Initial stats calculation after load
    }).catch((error) => {
        console.error('❌ loadInventoryItems() failed on page load:', error);
    });

    // Initially hide stats
    const statsContent = document.getElementById('statsContent');
    const statsToggle = document.getElementById('statsToggle');

    if (statsContent && statsToggle) {
        statsContent.classList.add('hidden');
        statsToggle.textContent = '►';
    } else {
        console.error('❌ Failed to find stats elements:', { statsContent: !!statsContent, statsToggle: !!statsToggle });
    }

    // Initialize modal system if needed
    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }
});

// Missing functions referenced in HTML
function printRecords() {
    // Basic print functionality for inventory records
    window.print();
}


// Additional missing database functions
async function deleteInventoryItemFromDB(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('inventoryRecords', id);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error deleting inventory item:", error);
        throw error;
    }
}

async function clearAllInventoryItemsFromDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.clear('inventoryRecords');
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error clearing inventory items:", error);
        throw error;
    }
}

async function updateExportStatus() {
    try {
        const jsonSpan = document.getElementById('lastJsonExport');
        if (!jsonSpan) return;

        // Get current time
        const now = Date.now();

        // Get export timestamps from IndexedDB settings
        let lastJsonExport = null;

        if (window.eecolDB && await window.eecolDB.isReady()) {
            const jsonSetting = await window.eecolDB.get('settings', 'lastJsonExport');
            if (jsonSetting && jsonSetting.value) {
                lastJsonExport = new Date(jsonSetting.value).getTime();
            }
        }

        jsonSpan.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

        // Update JSON export status
        if (lastJsonExport) {
            const daysSinceJsonExport = Math.floor((now - lastJsonExport) / (1000 * 60 * 60 * 24));
            if (daysSinceJsonExport < 3) {
                // Recent export - show plain text with green styling
                const span = document.createElement('span');
                span.style.color = '#10b981';
                span.style.fontWeight = '600';
                span.textContent = `Last exported ${daysSinceJsonExport === 0 ? 'today' : daysSinceJsonExport + ' days ago'}`;
                jsonSpan.appendChild(span);
            } else {
                // Stale export - show clickable link
                const exportDate = new Date(lastJsonExport).toLocaleDateString();
                const a = document.createElement('a');
                a.href = '#';
                a.onclick = (e) => { e.preventDefault(); exportJSONBackup(); };
                a.style.color = '#f59e0b';
                a.style.fontWeight = '600';
                a.style.textDecoration = 'underline';
                a.textContent = `${exportDate} (${daysSinceJsonExport} days ago)`;
                jsonSpan.appendChild(a);
            }
        } else {
            // Never exported - show clickable link
            const a = document.createElement('a');
            a.href = '#';
            a.onclick = (e) => { e.preventDefault(); exportJSONBackup(); };
            a.style.color = '#f59e0b';
            a.style.fontWeight = '600';
            a.style.textDecoration = 'underline';
            a.textContent = 'Never exported';
            jsonSpan.appendChild(a);
        }
    } catch (error) {
        console.error('Error updating export status:', error);
    }
}

function updateStats() {
    /**
     * BOLT OPTIMIZATION: Single-pass metrics calculation
     * Consolidates 3 redundant O(N) passes (filter and reduce) into a single iteration
     * to avoid redundant passes over the inventoryItems dataset.
     */
    const totalItems = inventoryItems.length;
    let totalLength = 0;
    let damagedItems = 0;
    let tailendReasons = 0;

    for (const item of inventoryItems) {
        totalLength += (item.length || item.actualLength || item.currentLength || 0);

        if (item.reason) {
            const reasonLower = item.reason.trim().toLowerCase();
            if (reasonLower === 'damaged') {
                damagedItems++;
            } else if (reasonLower === 'tail end' || reasonLower === 'tailend') {
                tailendReasons++;
            }
        }
    }

    const avgLength = totalItems > 0 ? totalLength / totalItems : 0;

    // Update DOM elements
    const totalItemsEl = document.getElementById('totalItems');
    const totalLengthEl = document.getElementById('totalLength');
    const damagedItemsEl = document.getElementById('damagedItems');
    const tailendReasonsEl = document.getElementById('tailendReasons');
    const avgLengthEl = document.getElementById('avgLength');
    const totalItemsCountEl = document.getElementById('totalItemsCount');

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (totalLengthEl) totalLengthEl.textContent = totalLength.toFixed(2) + 'm';
    if (damagedItemsEl) damagedItemsEl.textContent = damagedItems;
    if (tailendReasonsEl) tailendReasonsEl.textContent = tailendReasons;
    if (avgLengthEl) avgLengthEl.textContent = avgLength.toFixed(2) + 'm';
    if (totalItemsCountEl) totalItemsCountEl.textContent = totalItems;
}



// Adjust management functions
async function toggleApproval(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const currentApproved = inventoryItems[itemIndex].approved;

    // Toggle between true and false only (no null for toggle)
    const newApproved = currentApproved === true ? false : true;

    await updateInventoryApprovalStatus(id, newApproved);
}

async function toggleAdjust(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const newAdjust = !inventoryItems[itemIndex].adjust;
    inventoryItems[itemIndex].adjust = newAdjust;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        // Save to IndexedDB
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Re-render the grid to update adjust displays
        displayedItemsCount = 0;
        renderInventoryItems();

        updateStats(); // Update stats after adjust change
    } catch (error) {
        console.error('Error updating adjust status:', error);
        await showAlert('Failed to update adjust status. Please try again.', 'Update Error');
    }
}

// Review management functions - one-way toggle like Cut In System button
async function markAsReviewed(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) {
        console.error('❌ Item not found for review:', id);
        return;
    }

    const item = inventoryItems[itemIndex];

    // Only allow toggling from false to true (one-way)
    if (item.reviewed === true) {
        return; // Already set, do nothing
    }

    const now = Date.now();

    // Store original state for error recovery
    const originalReviewed = item.reviewed;
    const originalTimestamp = item.reviewedTimestamp;

    inventoryItems[itemIndex].reviewed = true;
    inventoryItems[itemIndex].reviewedTimestamp = now;
    inventoryItems[itemIndex].updatedAt = now;

    try {
        // Update in database
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Update the review status display
        const reviewStatusDiv = document.getElementById(`review-status-${id}`);
        if (reviewStatusDiv) {
            reviewStatusDiv.textContent = 'Reviewed';
            reviewStatusDiv.className = reviewStatusDiv.className.replace('text-gray-500', 'text-green-600');
        }

        // Update the button - make it permanent/unclickable like Cut In System
        const button = document.querySelector(`button[onclick="markAsReviewed('${id}')"]`);
        if (button) {
            button.className = button.className.replace('bg-gray-500 hover:bg-gray-600', 'bg-green-600 hover:bg-green-700');
            const reviewDate = formatTimestampToMMDDYYYY(now);
            button.textContent = `✓ Reviewed (${reviewDate})`;
            button.setAttribute('title', `Marked as reviewed on ${reviewDate}`);
            button.disabled = true; // Disable button permanently
            button.onclick = null; // Remove onclick handler
        }

        updateStats(); // Update stats after review status change

        // Show success alert like Cut In System button
        await showAlert(`Inventory item marked as "Reviewed" at ${new Date(now).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`, 'Review Status Updated');

    } catch (error) {
        console.error('❌ Error updating review status:', error);

        // Revert local changes on error
        inventoryItems[itemIndex].reviewed = originalReviewed;
        inventoryItems[itemIndex].reviewedTimestamp = originalTimestamp;

        await showAlert('Failed to update review status. Please try again.', 'Update Error');
    }
}



// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '📈 Reports', href: '../inventory-reports/inventory-reports.html', class: 'bg-purple-600 hover:bg-purple-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Wire Inventory Records'
    });
}

// Global function exports for HTML onclick handlers
if (typeof window !== 'undefined') {
    // Core functions - Main operations
    window.saveInventoryItem = saveInventoryItem;
    window.handleReasonChange = handleReasonChange;
    window.editItem = editInventoryItem;
    window.deleteItem = deleteInventoryItem;
    window.approveItem = approveInventoryItem;
    window.denyItem = denyInventoryItem;
    window.clearApproval = clearInventoryApproval;
    window.toggleApproval = toggleApproval;
    window.updateINAdate = updateINAdate;
    window.loadMoreInventoryItems = loadMoreInventoryItems;
    window.printRecords = printRecords;
    window.toggleAdjust = toggleAdjust;
    window.markAsReviewed = markAsReviewed;

}
