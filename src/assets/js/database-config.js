document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DB
    if (typeof EECOLIndexedDB === 'undefined') {
        console.error('❌ EECOLIndexedDB class not found');
        return;
    }

    if (!window.eecolDB) {
        window.eecolDB = EECOLIndexedDB.getInstance();
    }

    const db = window.eecolDB;
    await db.ready;

    initModalSystem();

    // DOM Elements
    const exportDbBtn = document.getElementById('exportDbBtn');
    const importDbBtn = document.getElementById('importDbBtn');
    const deleteDbBtn = document.getElementById('deleteDbBtn');
    const importFileInput = document.getElementById('importFileInput');

    const markConverterList = document.getElementById('markConverterList');
    const stopmarkConverterList = document.getElementById('stopmarkConverterList');
    const wireCutListList = document.getElementById('wireCutListList');
    const reelcapacityEstimatorList = document.getElementById('reelcapacityEstimatorList');

    const deleteSelectedMarkConverterBtn = document.getElementById('deleteSelectedMarkConverter');
    const deleteSelectedStopmarkConverterBtn = document.getElementById('deleteSelectedStopmarkConverter');
    const deleteSelectedWireCutListBtn = document.getElementById('deleteSelectedWireCutList');
    const deleteSelectedReelcapacityEstimatorBtn = document.getElementById('deleteSelectedReelcapacityEstimator');

    // Load and render records
    const formatRecord = (storeName, record) => {
        const timestamp = new Date(record.timestamp).toLocaleString();
        switch (storeName) {
            case 'markConverter':
                return `Start: ${record.startMark}, End: ${record.endMark}, Unit: ${record.unit} (${timestamp})`;
            case 'stopmarkConverter':
                return `Start: ${record.startMark}, Length: ${record.cutLength}, Unit: ${record.unit} (${timestamp})`;
            case 'reelcapacityEstimator':
                return `Flange: ${record.flangeDiameter.value} ${record.flangeDiameter.unit}, Core: ${record.coreDiameter.value} ${record.coreDiameter.unit}, Traverse: ${record.traverseWidth.value} ${record.traverseWidth.unit} (${timestamp})`;
            case 'wireCutList':
                const urgencyPrefix = record.urgency && record.urgency !== 'normal' ? `[${record.urgency.toUpperCase()}] ` : '';
                let wireSummary = `${urgencyPrefix}Order: ${record.orderNumber}, Cust: ${record.customerName}, Wire: ${record.wireType}, Status: ${record.status}`;
                if (record.status === 'removed' && record.removalReason) {
                    wireSummary += ` | Reason: ${record.removalReason}`;
                }
                return `${wireSummary} (${timestamp})`;
            default:
                return JSON.stringify(record);
        }
    };

    const renderRecords = async (storeName, listElement) => {
        const records = await db.getAll(storeName);
        listElement.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
        if (records.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.className = 'text-gray-500';
            emptyP.textContent = 'No records found.';
            listElement.appendChild(emptyP);
            return;
        }
        records.forEach(record => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-2 border-b';

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.id = record.id;
            checkbox.className = 'mr-2';
            leftDiv.appendChild(checkbox);

            const span = document.createElement('span');
            span.className = 'text-sm';
            span.textContent = formatRecord(storeName, record);
            leftDiv.appendChild(span);

            div.appendChild(leftDiv);

            const deleteBtn = document.createElement('button');
            deleteBtn.dataset.id = record.id;
            deleteBtn.className = 'delete-record text-red-500 hover:text-red-700 text-xs';
            deleteBtn.textContent = 'Delete';
            div.appendChild(deleteBtn);

            listElement.appendChild(div);
        });
    };

    // Statistics calculation functions
    const calculateStatistics = async () => {
        try {
            const stats = {
                totalRecords: 0,
                markRecords: 0,
                stopmarkRecords: 0,
                reelRecords: 0,
                cuttingRecords: 0,
                inventoryRecords: 0,
                wireCutListRecords: 0,
                storageSize: 0,
                largestStore: { name: 'None', count: 0 }
            };

            // Get all stores and calculate statistics
            for (const [storeName, storeConfig] of Object.entries(db.stores)) {
                const records = await db.getAll(storeName);
                const recordCount = records.length;
                stats.totalRecords += recordCount;

                // Count by type
                switch (storeName) {
                    case 'markConverter':
                        stats.markRecords = recordCount;
                        break;
                    case 'stopmarkConverter':
                        stats.stopmarkRecords = recordCount;
                        break;
                    case 'reelcapacityEstimator':
                        stats.reelRecords = recordCount;
                        break;
                    case 'cuttingRecords':
                        stats.cuttingRecords = recordCount;
                        break;
                    case 'inventoryRecords':
                        stats.inventoryRecords = recordCount;
                        break;
                    case 'wireCutList':
                        stats.wireCutListRecords = recordCount;
                        break;
                }

                // Track largest store
                if (recordCount > stats.largestStore.count) {
                    stats.largestStore = { name: storeName, count: recordCount };
                }

                // Estimate storage size (rough calculation: ~1KB per record)
                stats.storageSize += recordCount * 1024; // 1KB per record estimate
            }

            // Update UI with statistics
            updateStatisticsDisplay(stats);

        } catch (error) {
            console.error('Error calculating statistics:', error);
        }
    };

    const updateStatisticsDisplay = (stats) => {
        // Update main statistics cards
        document.getElementById('totalRecords').textContent = stats.totalRecords.toLocaleString();
        document.getElementById('storageUsed').textContent = formatBytes(stats.storageSize);

        // Update record breakdown
        document.getElementById('markRecords').textContent = stats.markRecords;
        document.getElementById('stopmarkRecords').textContent = stats.stopmarkRecords;
        document.getElementById('reelRecords').textContent = stats.reelRecords;
        document.getElementById('cuttingRecords').textContent = stats.cuttingRecords;
        document.getElementById('inventoryRecords').textContent = stats.inventoryRecords;
        document.getElementById('wireCutListRecords').textContent = stats.wireCutListRecords;

        // Update storage analysis
        document.getElementById('dbSize').textContent = formatBytes(stats.storageSize);
        document.getElementById('avgRecordSize').textContent =
            stats.totalRecords > 0 ? formatBytes(Math.round(stats.storageSize / stats.totalRecords)) : '0 B';
        document.getElementById('largestStore').textContent =
            stats.largestStore.name !== 'None' ? `${stats.largestStore.name} (${stats.largestStore.count})` : 'None';

        // Update activity (simplified - could be enhanced with actual activity tracking)
        const lastActivity = localStorage.getItem('eecol-last-db-activity');
        document.getElementById('lastActivity').textContent =
            lastActivity ? new Date(lastActivity).toLocaleString() : 'Never';

        // Update backup count (simplified)
        const backupCount = localStorage.getItem('eecol-backup-count') || 0;
        document.getElementById('backupsCreated').textContent = backupCount;
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };



    // Activity tracking helper
    const trackActivity = (action) => {
        localStorage.setItem('eecol-last-db-activity', new Date().toISOString());
        if (action === 'backup') {
            const currentCount = parseInt(localStorage.getItem('eecol-backup-count') || 0);
            localStorage.setItem('eecol-backup-count', currentCount + 1);
        }
        // Refresh statistics to show updated activity
        setTimeout(() => calculateStatistics(), 100);
    };

    // Event Listeners
    exportDbBtn.addEventListener('click', async () => {
        const allData = {};
        for (const storeName of Object.keys(db.stores)) {
            allData[storeName] = await db.getAll(storeName);
        }
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eecol-db-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        trackActivity('backup');
        await showAlert('Database exported successfully!');
    });

    importDbBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = JSON.parse(e.target.result);
            const confirmed = await showConfirm('Are you sure you want to import this data? This will overwrite existing data.');
            if (confirmed) {
                for (const storeName of Object.keys(data)) {
                    if (db.stores[storeName]) {
                        await db.clear(storeName);
                        for (const record of data[storeName]) {
                            await db.add(storeName, record);
                        }
                    }
                }
                await loadAllRecords();
                await showAlert('Database imported successfully!');
            }
        };
        reader.readAsText(file);
    });

    deleteDbBtn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Are you sure you want to delete the entire database? This action is irreversible.');
        if (confirmed) {
            for (const storeName of Object.keys(db.stores)) {
                await db.clear(storeName);
            }
            await loadAllRecords();
            await showAlert('Database deleted successfully!');
        }
    });

    const handleDeleteSelected = async (storeName, listElement) => {
        const selectedIds = Array.from(listElement.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) {
            await showAlert('No records selected.');
            return;
        }

        const confirmed = await showConfirm(`Are you sure you want to delete ${selectedIds.length} records?`);
        if (confirmed) {
            for (const id of selectedIds) {
                await db.delete(storeName, id);
            }
            await renderRecords(storeName, listElement);
            await showAlert(`${selectedIds.length} records deleted successfully!`);
        }
    };

    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-record')) {
            const id = e.target.dataset.id;
            const storeName = e.target.closest('.overflow-y-auto').id.replace('List', '');
            const confirmed = await showConfirm('Are you sure you want to delete this record?');
            if (confirmed) {
                await db.delete(storeName, id);
                await renderRecords(storeName, e.target.closest('.overflow-y-auto'));
                await showAlert('Record deleted successfully!');
            }
        }
    });

    // ===== BULK OPERATIONS FUNCTIONALITY =====

    // Bulk operations state management
    const bulkState = {
        markConverter: { selected: new Set(), selectAll: false },
        stopmarkConverter: { selected: new Set(), selectAll: false },
        wireCutList: { selected: new Set(), selectAll: false },
        reelcapacityEstimator: { selected: new Set(), selectAll: false }
    };

    // Update selected count display
    const updateSelectedCount = (storeName) => {
        const count = bulkState[storeName].selected.size;
        const countElement = document.getElementById(`selectedCount${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`);
        if (countElement) {
            countElement.textContent = `(${count} selected)`;
        }

        // Update button states
        const deleteBtn = document.getElementById(`deleteSelected${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`);
        const exportBtn = document.getElementById(`exportSelected${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`);

        if (deleteBtn && exportBtn) {
            const hasSelection = count > 0;
            deleteBtn.disabled = !hasSelection;
            exportBtn.disabled = !hasSelection;
        }
    };

    // Handle individual checkbox changes
    const handleCheckboxChange = (storeName, recordId, checked) => {
        if (checked) {
            bulkState[storeName].selected.add(recordId);
        } else {
            bulkState[storeName].selected.delete(recordId);
            // Uncheck select all if individual item is unchecked
            if (bulkState[storeName].selectAll) {
                bulkState[storeName].selectAll = false;
                const selectAllCheckbox = document.getElementById(`selectAll${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`);
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
            }
        }
        updateSelectedCount(storeName);
    };

    // Handle select all functionality
    const handleSelectAll = (storeName, checked) => {
        bulkState[storeName].selectAll = checked;
        const listElement = document.getElementById(`${storeName}List`);
        const checkboxes = listElement.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const recordId = checkbox.dataset.id;
            if (checked) {
                bulkState[storeName].selected.add(recordId);
            } else {
                bulkState[storeName].selected.clear();
            }
        });

        updateSelectedCount(storeName);
    };

    // Bulk delete operation
    const handleBulkDelete = async (storeName) => {
        const selectedIds = Array.from(bulkState[storeName].selected);
        if (selectedIds.length === 0) {
            await showAlert('No records selected.');
            return;
        }

        const confirmed = await showConfirm(`Are you sure you want to delete ${selectedIds.length} selected records? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            for (const id of selectedIds) {
                await db.delete(storeName, id);
            }

            // Clear selection
            bulkState[storeName].selected.clear();
            bulkState[storeName].selectAll = false;
            const selectAllCheckbox = document.getElementById(`selectAll${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`);
            if (selectAllCheckbox) selectAllCheckbox.checked = false;

            // Refresh the list
            await loadAllRecords();

            await showAlert(`Successfully deleted ${selectedIds.length} records.`);
        } catch (error) {
            console.error('Bulk delete error:', error);
            await showAlert('Error occurred during bulk delete operation.');
        }
    };

    // Bulk export operation
    const handleBulkExport = async (storeName) => {
        const selectedIds = Array.from(bulkState[storeName].selected);
        if (selectedIds.length === 0) {
            await showAlert('No records selected.');
            return;
        }

        try {
            const allRecords = await db.getAll(storeName);
            const selectedRecords = allRecords.filter(record => selectedIds.includes(record.id.toString()));

            const exportData = {
                [storeName]: selectedRecords,
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    recordCount: selectedRecords.length,
                    exportedBy: 'EECOL Database Config Tool'
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `eecol-${storeName}-selected-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            trackActivity('backup');
            await showAlert(`Successfully exported ${selectedRecords.length} selected records.`);
        } catch (error) {
            console.error('Bulk export error:', error);
            await showAlert('Error occurred during bulk export operation.');
        }
    };

    // ===== CATEGORY SYSTEM FUNCTIONALITY =====

    // Category management for reel configurations
    const categories = ['copper', 'aluminum', 'steel', 'custom'];
    let customCategories = [];

    // Load categories from localStorage
    const loadCategories = () => {
        const stored = localStorage.getItem('eecol-reel-categories');
        if (stored) {
            customCategories = JSON.parse(stored);
        }
        updateCategoryOptions();
    };

    // Save categories to localStorage
    const saveCategories = () => {
        localStorage.setItem('eecol-reel-categories', JSON.stringify(customCategories));
    };

    // Add new category
    const addCategory = (categoryName) => {
        if (!categoryName.trim()) return;
        const normalizedName = categoryName.toLowerCase().trim();
        if (!categories.includes(normalizedName) && !customCategories.includes(normalizedName)) {
            customCategories.push(normalizedName);
            saveCategories();
            updateCategoryOptions();
            return true;
        }
        return false;
    };

    // Update category filter options
    const updateCategoryOptions = () => {
        const categoryFilter = document.getElementById('reelCategoryFilter');
        if (!categoryFilter) return;

        // Clear existing options except "All Categories"
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }

        // Add default categories
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            categoryFilter.appendChild(option);
        });

        // Add custom categories
        customCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            categoryFilter.appendChild(option);
        });
    };

    // ===== SEARCH AND FILTER FUNCTIONALITY =====

    // Store original records for filtering
    let originalRecords = {
        markConverter: [],
        stopmarkConverter: [],
        wireCutList: [],
        reelcapacityEstimator: []
    };

    // Search and filter functions
    const filterRecords = (storeName, searchTerm, sortBy) => {
        let records = [...originalRecords[storeName]];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            records = records.filter(record => {
                const formatted = formatRecord(storeName, record).toLowerCase();
                return formatted.includes(term);
            });
        }

        // Apply sorting
        records.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'oldest':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'startAsc':
                    return (a.startMark || 0) - (b.startMark || 0);
                case 'startDesc':
                    return (b.startMark || 0) - (a.startMark || 0);
                case 'lengthAsc':
                    return (a.cutLength || 0) - (b.cutLength || 0);
                case 'lengthDesc':
                    return (b.cutLength || 0) - (a.cutLength || 0);
                case 'flangeAsc':
                    return (a.flangeDiameter?.value || 0) - (b.flangeDiameter?.value || 0);
                case 'flangeDesc':
                    return (b.flangeDiameter?.value || 0) - (a.flangeDiameter?.value || 0);
                case 'coreAsc':
                    return (a.coreDiameter?.value || 0) - (b.coreDiameter?.value || 0);
                case 'coreDesc':
                    return (b.coreDiameter?.value || 0) - (a.coreDiameter?.value || 0);
                case 'orderAsc':
                    return (a.orderNumber || '').localeCompare(b.orderNumber || '');
                case 'orderDesc':
                    return (b.orderNumber || '').localeCompare(a.orderNumber || '');
                default:
                    return 0;
            }
        });

        return records;
    };

    // Special filter function for reel configurations with category support
    const filterReelRecords = (searchTerm, sortBy, categoryFilter) => {
        let records = [...originalRecords.reelcapacityEstimator];

        // Apply category filter first
        if (categoryFilter) {
            records = records.filter(record => {
                const recordCategory = record.category || 'custom'; // Default to 'custom' if no category
                return recordCategory.toLowerCase() === categoryFilter.toLowerCase();
            });
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            records = records.filter(record => {
                const formatted = formatRecord('reelcapacityEstimator', record).toLowerCase();
                return formatted.includes(term);
            });
        }

        // Apply sorting
        records.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'oldest':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'flangeAsc':
                    return (a.flangeDiameter?.value || 0) - (b.flangeDiameter?.value || 0);
                case 'flangeDesc':
                    return (b.flangeDiameter?.value || 0) - (a.flangeDiameter?.value || 0);
                case 'coreAsc':
                    return (a.coreDiameter?.value || 0) - (b.coreDiameter?.value || 0);
                case 'coreDesc':
                    return (b.coreDiameter?.value || 0) - (a.coreDiameter?.value || 0);
                default:
                    return 0;
            }
        });

        return records;
    };

    const updateFilteredRecords = (storeName, listElement, searchInput, sortSelect) => {
        const searchTerm = searchInput.value;
        const sortBy = sortSelect.value;
        const filteredRecords = filterRecords(storeName, searchTerm, sortBy);

        // Update the list display
        renderFilteredRecords(storeName, filteredRecords, listElement);
    };

    const renderFilteredRecords = (storeName, records, listElement) => {
        listElement.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
        if (records.length === 0) {
            const searchTerm = listElement.closest('.grid').querySelector('input[type="text"]').value;
            const emptyP = document.createElement('p');
            emptyP.className = 'text-gray-500';
            if (searchTerm.trim()) {
                emptyP.textContent = 'No records match your search.';
            } else {
                emptyP.textContent = 'No records found.';
            }
            listElement.appendChild(emptyP);
            return;
        }

        records.forEach(record => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-2 border-b';

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.id = record.id;
            checkbox.className = 'mr-2';
            leftDiv.appendChild(checkbox);

            const span = document.createElement('span');
            span.className = 'text-sm';
            span.textContent = formatRecord(storeName, record);
            leftDiv.appendChild(span);

            div.appendChild(leftDiv);

            const deleteBtn = document.createElement('button');
            deleteBtn.dataset.id = record.id;
            deleteBtn.className = 'delete-record text-red-500 hover:text-red-700 text-xs';
            deleteBtn.textContent = 'Delete';
            div.appendChild(deleteBtn);

            listElement.appendChild(div);
        });
    };

    // Load records and store originals for filtering
    const loadAllRecords = async () => {
        // Load records for each store
        originalRecords.markConverter = await db.getAll('markConverter');
        originalRecords.stopmarkConverter = await db.getAll('stopmarkConverter');
        originalRecords.wireCutList = await db.getAll('wireCutList');
        originalRecords.reelcapacityEstimator = await db.getAll('reelcapacityEstimator');

        // Render initial (unfiltered) records
        await renderRecords('markConverter', markConverterList);
        await renderRecords('stopmarkConverter', stopmarkConverterList);
        await renderRecords('wireCutList', wireCutListList);
        await renderRecords('reelcapacityEstimator', reelcapacityEstimatorList);

        // Calculate and display statistics after loading records
        await calculateStatistics();
    };

    // ===== SEARCH AND FILTER EVENT LISTENERS =====

    // Mark Converter search and filter
    const markSearchInput = document.getElementById('markSearchInput');
    const markSortSelect = document.getElementById('markSortSelect');
    const markClearSearch = document.getElementById('markClearSearch');

    markSearchInput.addEventListener('input', () => {
        updateFilteredRecords('markConverter', markConverterList, markSearchInput, markSortSelect);
    });

    markSortSelect.addEventListener('change', () => {
        updateFilteredRecords('markConverter', markConverterList, markSearchInput, markSortSelect);
    });

    markClearSearch.addEventListener('click', () => {
        markSearchInput.value = '';
        markSortSelect.value = 'newest';
        updateFilteredRecords('markConverter', markConverterList, markSearchInput, markSortSelect);
    });

    // Stop Mark Converter search and filter
    const stopmarkSearchInput = document.getElementById('stopmarkSearchInput');
    const stopmarkSortSelect = document.getElementById('stopmarkSortSelect');
    const stopmarkClearSearch = document.getElementById('stopmarkClearSearch');

    stopmarkSearchInput.addEventListener('input', () => {
        updateFilteredRecords('stopmarkConverter', stopmarkConverterList, stopmarkSearchInput, stopmarkSortSelect);
    });

    stopmarkSortSelect.addEventListener('change', () => {
        updateFilteredRecords('stopmarkConverter', stopmarkConverterList, stopmarkSearchInput, stopmarkSortSelect);
    });

    stopmarkClearSearch.addEventListener('click', () => {
        stopmarkSearchInput.value = '';
        stopmarkSortSelect.value = 'newest';
        updateFilteredRecords('stopmarkConverter', stopmarkConverterList, stopmarkSearchInput, stopmarkSortSelect);
    });

    // Wire Cut List search and filter
    const wireCutSearchInput = document.getElementById('wireCutSearchInput');
    const wireCutSortSelect = document.getElementById('wireCutSortSelect');
    const wireCutClearSearch = document.getElementById('wireCutClearSearch');

    wireCutSearchInput.addEventListener('input', () => {
        updateFilteredRecords('wireCutList', wireCutListList, wireCutSearchInput, wireCutSortSelect);
    });

    wireCutSortSelect.addEventListener('change', () => {
        updateFilteredRecords('wireCutList', wireCutListList, wireCutSearchInput, wireCutSortSelect);
    });

    wireCutClearSearch.addEventListener('click', () => {
        wireCutSearchInput.value = '';
        wireCutSortSelect.value = 'newest';
        updateFilteredRecords('wireCutList', wireCutListList, wireCutSearchInput, wireCutSortSelect);
    });

    // Reel Capacity Estimator search and filter
    const reelSearchInput = document.getElementById('reelSearchInput');
    const reelSortSelect = document.getElementById('reelSortSelect');
    const reelCategoryFilter = document.getElementById('reelCategoryFilter');
    const reelClearSearch = document.getElementById('reelClearSearch');

    const updateReelFilteredRecords = () => {
        const searchTerm = reelSearchInput.value;
        const sortBy = reelSortSelect.value;
        const categoryFilter = reelCategoryFilter.value;
        const filteredRecords = filterReelRecords(searchTerm, sortBy, categoryFilter);
        renderFilteredRecords('reelcapacityEstimator', filteredRecords, reelcapacityEstimatorList);
    };

    reelSearchInput.addEventListener('input', updateReelFilteredRecords);
    reelSortSelect.addEventListener('change', updateReelFilteredRecords);
    reelCategoryFilter.addEventListener('change', updateReelFilteredRecords);

    reelClearSearch.addEventListener('click', () => {
        reelSearchInput.value = '';
        reelSortSelect.value = 'newest';
        reelCategoryFilter.value = '';
        updateReelFilteredRecords();
    });

    // Category management
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    addCategoryBtn.addEventListener('click', () => {
        const categoryName = newCategoryInput.value.trim();
        if (addCategory(categoryName)) {
            newCategoryInput.value = '';
            showAlert(`Category "${categoryName}" added successfully!`);
        } else if (categoryName) {
            showAlert('Category already exists or is invalid.');
        }
    });

    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryBtn.click();
        }
    });

    // ===== BULK OPERATIONS EVENT LISTENERS =====

    // Select All checkboxes
    document.getElementById('selectAllMarkConverter').addEventListener('change', (e) => {
        handleSelectAll('markConverter', e.target.checked);
    });

    document.getElementById('selectAllStopmarkConverter').addEventListener('change', (e) => {
        handleSelectAll('stopmarkConverter', e.target.checked);
    });

    document.getElementById('selectAllWireCutList').addEventListener('change', (e) => {
        handleSelectAll('wireCutList', e.target.checked);
    });

    document.getElementById('selectAllReelcapacityEstimator').addEventListener('change', (e) => {
        handleSelectAll('reelcapacityEstimator', e.target.checked);
    });

    // Bulk operation buttons
    document.getElementById('deleteSelectedMarkConverter').addEventListener('click', () => {
        handleBulkDelete('markConverter');
    });

    document.getElementById('exportSelectedMarkConverter').addEventListener('click', () => {
        handleBulkExport('markConverter');
    });

    document.getElementById('deleteSelectedStopmarkConverter').addEventListener('click', () => {
        handleBulkDelete('stopmarkConverter');
    });

    document.getElementById('exportSelectedStopmarkConverter').addEventListener('click', () => {
        handleBulkExport('stopmarkConverter');
    });

    document.getElementById('deleteSelectedWireCutList').addEventListener('click', () => {
        handleBulkDelete('wireCutList');
    });

    document.getElementById('exportSelectedWireCutList').addEventListener('click', () => {
        handleBulkExport('wireCutList');
    });

    document.getElementById('deleteSelectedReelcapacityEstimator').addEventListener('click', () => {
        handleBulkDelete('reelcapacityEstimator');
    });

    document.getElementById('exportSelectedReelcapacityEstimator').addEventListener('click', () => {
        handleBulkExport('reelcapacityEstimator');
    });

    // Handle individual checkbox changes (delegated event listener)
    document.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' && e.target.dataset.id) {
            const listElement = e.target.closest('.overflow-y-auto');
            if (listElement) {
                const storeName = listElement.id.replace('List', '');
                handleCheckboxChange(storeName, e.target.dataset.id, e.target.checked);
            }
        }
    });

    // Initial Load
    loadCategories(); // Load categories first
    await loadAllRecords();
});
// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Database Config'
    });
}
