/**
 * EECOL Live Statistics Dashboard - JavaScript Module
 * Real-time analytics combining inventory and cutting data
 */

// Global variables
let inventoryItems = [];
let cutRecords = [];

/**
 * BOLT OPTIMIZATION: High-performance date formatter
 * Pre-initializing Intl.DateTimeFormat at module scope avoids repeated parsing of
 * locale strings and options inside loops.
 */
const shortDateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
});

let approvalChart = null;
let productChart = null;
let activityChart = null;
let qualityChart = null;
let valueChart = null;
let topCustomersChart = null;
let wireTypeChart = null;
let cuttingPerformanceChart = null;

/**
 * BOLT OPTIMIZATION: Single-pass metrics object
 * Stores all pre-calculated statistics to avoid redundant O(N) iterations.
 */
let calculatedMetrics = {
    // Inventory
    totalInventoryItems: 0,
    approvedCount: 0,
    deniedCount: 0,
    pendingCount: 0,
    totalProcessed: 0,
    inventoryValue: 0,
    todayInventoryCount: 0,
    recentInventoryCount: 0,
    quality: { normal: 0, damaged: 0, tailends: 0 },
    valueDistribution: { high: 0, standard: 0 },
    inventoryApprovalRateChange: '+0%',

    // Cutting
    totalCuts: 0,
    totalLengthCut: 0,
    cutsToday: 0,
    recentCutsCount: 0,
    cutsThisWeek: 0,
    cutsLastWeek: 0,
    performance: { fullPicks: 0, systemCuts: 0 },

    // Combined/Advanced
    productCounts: {}, // Combined inventory productCode and cutting wireId
    customerCounts: {},
    wireTypeCounts: {},
    activityTimeline: [0, 0, 0, 0, 0, 0, 0], // Last 7 days
    topProduct: 'None',
    topCustomer: '-',
    topCustomerOrders: '-',
    recentINAItems: [] // BOLT: Pre-collected in single pass
};

// Chart.js initialization with CDN fallback
function loadChartJS() {
    return new Promise((resolve, reject) => {
        // Try local Chart.js first (offline support)
        const localScript = document.createElement('script');
        localScript.src = '../../utils/chart.js';
        localScript.onload = () => {
            resolve('local');
        };
        localScript.onerror = () => {
            console.warn('Local Chart.js failed, trying CDN...');
            // Fallback to CDN (Pinned to 4.4.1 for SRI)
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1';
            cdnScript.integrity = 'sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4';
            cdnScript.crossOrigin = 'anonymous';
            cdnScript.onload = () => {
                resolve('cdn');
            };
            cdnScript.onerror = () => {
                console.error('Failed to load Chart.js from both local and CDN');
                const errorDiv = document.getElementById('chartError');
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                }
                reject('No chart library available');
            };
            document.head.appendChild(cdnScript);
        };
        document.head.appendChild(localScript);
    });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', async function() {

    // Initialize IndexedDB first
    if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
        window.eecolDB = EECOLIndexedDB.getInstance();
        await window.eecolDB.ready;

        // Run migration from localStorage if needed
        const hasExistingData = localStorage.getItem('cutRecords') ||
                               localStorage.getItem('inventoryItems') ||
                               localStorage.getItem('machineMaintenanceChecklist');

        if (hasExistingData) {
            const migratedItems = await window.eecolDB.migrateFromLocalStorage();
        }
    } else {
        console.warn('⚠️ IndexedDB is not supported. Falling back to localStorage for live statistics.');
    }

    try {
        // Wait for Chart.js to load
        await loadChartJS();

        // Initialize data loading
        await loadLiveData();
        initAutoRefresh();

        // Initialize all charts
        await initializeAllCharts();


    } catch (error) {
        console.error('❌ Failed to initialize live dashboard:', error);
        // Fallback mode with no charts
        await loadLiveData();
        initAutoRefresh();
        console.warn('Running in fallback mode without charts');
    }
});

// IndexedDB-based data loading for both inventory and cutting records
async function loadLiveData() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {

            const [inventoryData, cuttingData] = await Promise.all([
                window.eecolDB.getAll('inventoryRecords'),
                window.eecolDB.getAll('cuttingRecords')
            ]);

            inventoryItems = inventoryData && inventoryData.length > 0 ?
                inventoryData.sort((a, b) => b.timestamp - a.timestamp) : [];

            cutRecords = cuttingData && cuttingData.length > 0 ?
                cuttingData.sort((a, b) => b.timestamp - a.timestamp) : [];

            calculateMetrics();
            updateDashboard();

        } else {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage');
            loadFromLocalStorage();
        }

    } catch (error) {
        console.error('❌ Error loading live statistics data from IndexedDB:', error);
        loadFromLocalStorage();
    }
}

// Fallback localStorage loading
function loadFromLocalStorage() {
    try {
        // Load inventory items
        const inventoryStored = localStorage.getItem('inventoryItems');
        if (inventoryStored) {
            const items = JSON.parse(inventoryStored);
            items.forEach(item => {
                if (!item.timestamp) {
                    item.timestamp = item.createdAt || Date.now();
                }
            });
            inventoryItems = items.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            inventoryItems = [];
        }

        // Load cutting records
        const cuttingStored = localStorage.getItem('cutRecords');
        if (cuttingStored) {
            const cuts = JSON.parse(cuttingStored);
            cuts.forEach(cut => {
                if (!cut.timestamp) {
                    cut.timestamp = cut.createdAt || Date.now();
                }
            });
            cutRecords = cuts.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            cutRecords = [];
        }

        calculateMetrics();
        updateDashboard();

    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        inventoryItems = [];
        cutRecords = [];
        calculateMetrics();
        updateDashboard();
    }
}

// Auto-refresh mechanism
function initAutoRefresh() {

    // Listen for storage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'eecolDBChange' || e.key === null) {
            loadLiveData();
        }
    });

    // Periodic refresh check
    setInterval(function() {
        try {
            if (window.eecolDB && window.eecolDB.isReady()) {
                // Check if data has changed
                Promise.all([
                    window.eecolDB.count('inventoryRecords'),
                    window.eecolDB.count('cuttingRecords')
                ]).then(([inventoryCount, cuttingCount]) => {
                    const hasChanged = inventoryCount !== inventoryItems.length ||
                                     cuttingCount !== cutRecords.length;
                    if (hasChanged) {
                        loadLiveData();
                    }
                }).catch(() => {
                    // Silently handle errors in periodic checks
                });
            }
        } catch (e) {
            // Silently handle errors in periodic checks
        }
    }, 30000); // Check every 30 seconds
}

/**
 * BOLT OPTIMIZATION: Single-pass metrics calculation
 * Consolidates multiple O(N) passes into a single iteration for each dataset.
 */
function calculateMetrics() {
    /**
     * BOLT OPTIMIZATION: Single-pass metrics calculation
     * Consolidates all metrics and INA item collection into single iterations using
     * timestamp comparisons to avoid thousands of Date object allocations and string conversions.
     */
    calculatedMetrics = {
        totalInventoryItems: inventoryItems.length,
        approvedCount: 0,
        deniedCount: 0,
        pendingCount: 0,
        totalProcessed: 0,
        inventoryValue: 0,
        todayInventoryCount: 0,
        recentInventoryCount: 0,
        quality: { normal: 0, damaged: 0, tailends: 0 },
        valueDistribution: { high: 0, standard: 0 },
        inventoryApprovalRateChange: '+0%',
        totalCuts: cutRecords.length,
        totalLengthCut: 0,
        cutsToday: 0,
        recentCutsCount: 0,
        cutsThisWeek: 0,
        cutsLastWeek: 0,
        performance: { fullPicks: 0, systemCuts: 0 },
        productCounts: {},
        customerCounts: {},
        wireTypeCounts: {},
        activityTimeline: [0, 0, 0, 0, 0, 0, 0],
        topProduct: 'None',
        topCustomer: '-',
        topCustomerOrders: '-',
        recentINAItems: []
    };

    const now = Date.now();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const todayStart = d.getTime();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    // Pre-calculate activity timeline start-of-day timestamps
    const dayStarts = [];
    for (let i = 0; i < 7; i++) {
        const tempDate = new Date(todayStart);
        tempDate.setDate(tempDate.getDate() - (6 - i));
        dayStarts.push(tempDate.getTime());
    }

    // Weekly inventory approval rate counters
    let currentWeekInvProcessed = 0;
    let currentWeekInvApproved = 0;
    let previousWeekInvProcessed = 0;
    let previousWeekInvApproved = 0;

    // Single pass for inventory
    for (const item of inventoryItems) {
        const ts = item.timestamp;

        // Approval status
        if (item.approved === true) {
            calculatedMetrics.approvedCount++;
            calculatedMetrics.totalProcessed++;
        } else if (item.approved === false) {
            calculatedMetrics.deniedCount++;
            calculatedMetrics.totalProcessed++;
        } else {
            calculatedMetrics.pendingCount++;
        }

        // Value
        const val = item.totalValue || 0;
        calculatedMetrics.inventoryValue += val;
        if (val >= 50) {
            calculatedMetrics.valueDistribution.high++;
        } else {
            calculatedMetrics.valueDistribution.standard++;
        }

        // Recency & Weekly change tracking
        if (ts >= todayStart) {
            calculatedMetrics.todayInventoryCount++;
        }
        if (ts > weekAgo) {
            calculatedMetrics.recentInventoryCount++;
            if (item.approved !== null && item.approved !== undefined) {
                currentWeekInvProcessed++;
                if (item.approved === true) currentWeekInvApproved++;
            }
        } else if (ts > twoWeeksAgo) {
            if (item.approved !== null && item.approved !== undefined) {
                previousWeekInvProcessed++;
                if (item.approved === true) previousWeekInvApproved++;
            }
        }

        // Products
        const code = item.productCode || 'Unknown';
        calculatedMetrics.productCounts[code] = (calculatedMetrics.productCounts[code] || 0) + 1;

        // Quality
        const reason = (item.reason || '').toLowerCase();
        if (reason.includes('damaged')) {
            calculatedMetrics.quality.damaged++;
        } else if (reason.includes('tail end') || reason.includes('tailend')) {
            calculatedMetrics.quality.tailends++;
        } else {
            calculatedMetrics.quality.normal++;
        }

        // BOLT: Collect top 5 INA items during metrics pass
        if (calculatedMetrics.recentINAItems.length < 5 && item.inaNumber && item.inaNumber.trim() !== '') {
            calculatedMetrics.recentINAItems.push(item);
        }
    }

    // Single pass for cutting records
    for (const record of cutRecords) {
        const ts = record.timestamp;

        // Basic metrics
        calculatedMetrics.totalLengthCut += (record.cutLength || 0);
        if (record.isFullPick === true) calculatedMetrics.performance.fullPicks++;
        if (record.isSystemCut === true) calculatedMetrics.performance.systemCuts++;

        // Recency & Timeline
        if (ts >= todayStart) {
            calculatedMetrics.cutsToday++;
        }
        if (ts > weekAgo) {
            calculatedMetrics.recentCutsCount++;
            calculatedMetrics.cutsThisWeek++;
        } else if (ts > twoWeeksAgo) {
            calculatedMetrics.cutsLastWeek++;
        }

        // Activity Timeline bucket using pre-calculated day starts
        for (let i = 6; i >= 0; i--) {
            if (ts >= dayStarts[i]) {
                calculatedMetrics.activityTimeline[i]++;
                break;
            }
        }

        // Combined Product Counts
        const wireId = record.wireId || 'Unknown';
        calculatedMetrics.productCounts[wireId] = (calculatedMetrics.productCounts[wireId] || 0) + 1;

        // Wire Type Counts
        calculatedMetrics.wireTypeCounts[wireId] = (calculatedMetrics.wireTypeCounts[wireId] || 0) + 1;

        // Customer Counts
        const customer = record.customerName || 'Unknown';
        calculatedMetrics.customerCounts[customer] = (calculatedMetrics.customerCounts[customer] || 0) + 1;
    }

    // Post-processing for tops and rates
    if (Object.keys(calculatedMetrics.productCounts).length > 0) {
        calculatedMetrics.topProduct = Object.keys(calculatedMetrics.productCounts).reduce((a, b) =>
            calculatedMetrics.productCounts[a] > calculatedMetrics.productCounts[b] ? a : b, 'None');
    }

    if (Object.keys(calculatedMetrics.customerCounts).length > 0) {
        const sortedCustomers = Object.entries(calculatedMetrics.customerCounts)
            .sort(([, a], [, b]) => b - a);
        const [name, count] = sortedCustomers[0];
        calculatedMetrics.topCustomer = name;
        calculatedMetrics.topCustomerOrders = count > 1 ? `${count} cuts` : `${count} cut`;
    }

    // Inventory approval rate change
    const currentRate = currentWeekInvProcessed > 0 ? (currentWeekInvApproved / currentWeekInvProcessed) * 100 : 0;
    const previousRate = previousWeekInvProcessed > 0 ? (previousWeekInvApproved / previousWeekInvProcessed) * 100 : 0;
    calculatedMetrics.inventoryApprovalRateChange = calculateChange(currentRate, previousRate);
}

// Initialize all charts
async function initializeAllCharts() {
    createApprovalChart();
    createProductChart();
    createActivityChart();
    createQualityChart();
    createValueChart();

    // New cutting charts
    createTopCustomersChart();
    createWireTypeChart();
    createCuttingPerformanceChart();

    updateAllCharts();
}

// Update key metrics dashboard
function updateDashboard() {
    const m = calculatedMetrics;

    const approvedRate = m.totalProcessed > 0 ? Math.round((m.approvedCount / m.totalProcessed) * 100) : 0;
    const avgInventoryValue = m.totalInventoryItems > 0 ? m.inventoryValue / m.totalInventoryItems : 0;
    const todayActivityCount = m.cutsToday + m.todayInventoryCount;
    const recentActivityCount = m.recentCutsCount + m.recentInventoryCount;
    const cutsChange = calculateChange(m.cutsThisWeek, m.cutsLastWeek);

    // Update DOM with pre-calculated data
    const totalItemsEl = document.getElementById('dashboardTotalItems');
    if (totalItemsEl) totalItemsEl.textContent = m.totalInventoryItems + m.totalCuts;

    const approvalRateEl = document.getElementById('dashboardApprovalRate');
    if (approvalRateEl) approvalRateEl.textContent = approvedRate + '%';

    const topProductEl = document.getElementById('dashboardTopProduct');
    if (topProductEl) topProductEl.textContent = (m.totalInventoryItems + m.totalCuts) > 0 ? m.topProduct : '-';

    const totalValueEl = document.getElementById('dashboardTotalValue');
    if (totalValueEl) totalValueEl.textContent = '$' + m.inventoryValue.toFixed(2);

    const avgValueEl = document.getElementById('dashboardAvgValue');
    if (avgValueEl) avgValueEl.textContent = '$' + avgInventoryValue.toFixed(2) + ' avg';

    const activityTodayEl = document.getElementById('dashboardActivityToday');
    if (activityTodayEl) activityTodayEl.textContent = todayActivityCount + ' activities today';

    const totalItemsChangeEl = document.getElementById('dashboardTotalItemsChange');
    if (totalItemsChangeEl) totalItemsChangeEl.textContent = cutsChange + ' vs last week';

    const approvalRateChangeEl = document.getElementById('dashboardApprovalRateChange');
    if (approvalRateChangeEl) approvalRateChangeEl.textContent = m.totalProcessed > 0 ? '+0% vs last week' : 'No processed';

    const topCustomerEl = document.getElementById('dashboardTopCustomer');
    if (topCustomerEl) topCustomerEl.textContent = m.topCustomer;

    const topCustomerOrdersEl = document.getElementById('dashboardTopCustomerOrders');
    if (topCustomerOrdersEl) topCustomerOrdersEl.textContent = m.topCustomerOrders;

    const totalCutsEl = document.getElementById('dashboardTotalCuts');
    if (totalCutsEl) totalCutsEl.textContent = m.totalCuts;

    const cutsTodayEl = document.getElementById('dashboardCutsToday');
    if (cutsTodayEl) cutsTodayEl.textContent = cutsChange + ' this week';

    // Inventory section metrics
    const inventoryApprovalRateChangeEl = document.getElementById('inventoryApprovalRateChange');
    if (inventoryApprovalRateChangeEl) inventoryApprovalRateChangeEl.textContent = m.inventoryApprovalRateChange + ' vs last week';

    const qualityPercent = m.totalProcessed > 0 ? Math.round((m.quality.normal / m.totalProcessed) * 100) : 0;
    const inventoryQualityCountEl = document.getElementById('inventoryQualityCount');
    if (inventoryQualityCountEl) inventoryQualityCountEl.textContent = m.quality.normal;
    const inventoryQualityPercentEl = document.getElementById('inventoryQualityPercent');
    if (inventoryQualityPercentEl) inventoryQualityPercentEl.textContent = qualityPercent + '% Normal';

    // Cutting section metrics
    const cuttingTotalCutsEl = document.getElementById('cuttingTotalCuts');
    if (cuttingTotalCutsEl) cuttingTotalCutsEl.textContent = m.totalCuts;
    const cuttingCutsTodayEl = document.getElementById('cuttingCutsToday');
    if (cuttingCutsTodayEl) cuttingCutsTodayEl.textContent = m.cutsToday;
    const cuttingTopCustomerEl = document.getElementById('cuttingTopCustomer');
    if (cuttingTopCustomerEl) cuttingTopCustomerEl.textContent = m.topCustomer;
    const cuttingTopCustomerOrdersEl = document.getElementById('cuttingTopCustomerOrders');
    if (cuttingTopCustomerOrdersEl) cuttingTopCustomerOrdersEl.textContent = m.topCustomerOrders;
    const cuttingWeeklyChangeEl = document.getElementById('cuttingWeeklyChange');
    if (cuttingWeeklyChangeEl) cuttingWeeklyChangeEl.textContent = cutsChange;
}

// Update all charts with current data
function updateAllCharts() {
    const now = new Date().toLocaleTimeString();
    const timestamp = 'Updated: ' + now;

    // Update timestamps
    const timestamps = [
        'approvalChartTimestamp', 'productChartTimestamp', 'activityChartTimestamp',
        'qualityChartTimestamp', 'valueChartTimestamp', 'topCustomersChartTimestamp',
        'wireTypeChartTimestamp', 'cuttingPerformanceChartTimestamp'
    ];
    timestamps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = timestamp;
    });

    updateApprovalChart();
    updateProductChart();
    updateActivityChart();
    updateQualityChart();
    updateValueChart();
    updateTopCustomersChart();
    updateWireTypeChart();
    updateCuttingPerformanceChart();
    updateINAItems();
}

// New chart creation functions
function createTopCustomersChart() {
    if (!topCustomersChart) {
        const ctx = document.getElementById('topCustomersChart').getContext('2d');
        topCustomersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cut Count',
                    data: [],
                    backgroundColor: [
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(245, 158, 11)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(59, 130, 246)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createWireTypeChart() {
    if (!wireTypeChart) {
        const ctx = document.getElementById('wireTypeChart').getContext('2d');
        wireTypeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Usage Count',
                    data: [],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createCuttingPerformanceChart() {
    if (!cuttingPerformanceChart) {
        const ctx = document.getElementById('cuttingPerformanceChart').getContext('2d');
        cuttingPerformanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Full Picks', 'System Cuts'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(59, 130, 246, 0.85)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Chart creation functions
function createApprovalChart() {
    if (!approvalChart) {
        const ctx = document.getElementById('approvalChart').getContext('2d');
        approvalChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Approved', 'Denied', 'Pending'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                        'rgba(156, 163, 175, 0.85)'
                    ],
                    borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(239, 68, 68)',
                        'rgb(156, 163, 175)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function createProductChart() {
    if (!productChart) {
        const ctx = document.getElementById('productChart').getContext('2d');
        productChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Usage Count (Combined)',
                    data: [],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createActivityChart() {
    if (!activityChart) {
        const ctx = document.getElementById('activityChart').getContext('2d');

        // Generate last 7 days labels
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Cutting Activity',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                },
                elements: {
                    point: { radius: 2 }
                }
            }
        });
    }
}

function createQualityChart() {
    if (!qualityChart) {
        const ctx = document.getElementById('qualityChart').getContext('2d');
        qualityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal Items', 'Damaged Items', 'Tailend Items'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                        'rgba(251, 191, 36, 0.85)'
                    ],
                    borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(239, 68, 68)',
                        'rgb(251, 191, 36)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function createValueChart() {
    if (!valueChart) {
        const ctx = document.getElementById('valueChart').getContext('2d');
        valueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['High Value ($50+)', 'Standard (< $50)'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgb(147, 51, 234)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

// BOLT OPTIMIZATION: Refactored chart update functions to use calculatedMetrics
function updateApprovalChart() {
    if (!approvalChart) return;
    const m = calculatedMetrics;
    approvalChart.data.datasets[0].data = [m.approvedCount, m.deniedCount, m.pendingCount];
    approvalChart.update();

    document.getElementById('approvedCount').textContent = m.approvedCount;
    document.getElementById('deniedCount').textContent = m.deniedCount;
    document.getElementById('pendingCount').textContent = m.pendingCount;
}

function updateProductChart() {
    if (!productChart) return;
    const sortedProducts = Object.entries(calculatedMetrics.productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    productChart.data.labels = sortedProducts.map(([code]) => code);
    productChart.data.datasets[0].data = sortedProducts.map(([, count]) => count);
    productChart.update();
}

function updateActivityChart() {
    if (!activityChart) return;
    activityChart.data.datasets[0].data = calculatedMetrics.activityTimeline;
    activityChart.update();
}

function updateQualityChart() {
    if (!qualityChart) return;
    const q = calculatedMetrics.quality;
    qualityChart.data.datasets[0].data = [q.normal, q.damaged, q.tailends];
    qualityChart.update();

    document.getElementById('normalCount').textContent = q.normal;
    document.getElementById('damagedCount').textContent = q.damaged;
    document.getElementById('tailendCount').textContent = q.tailends;
}

function updateValueChart() {
    if (!valueChart) return;
    const v = calculatedMetrics.valueDistribution;
    valueChart.data.datasets[0].data = [v.high, v.standard];
    valueChart.update();

    document.getElementById('highValueCount').textContent = v.high;
    document.getElementById('lowValueCount').textContent = v.standard;
}

function updateTopCustomersChart() {
    if (!topCustomersChart) return;
    const sortedCustomers = Object.entries(calculatedMetrics.customerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    topCustomersChart.data.labels = sortedCustomers.map(([customer]) => customer);
    topCustomersChart.data.datasets[0].data = sortedCustomers.map(([, count]) => count);
    topCustomersChart.update();
}

function updateWireTypeChart() {
    if (!wireTypeChart) return;
    const sortedWireTypes = Object.entries(calculatedMetrics.wireTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    wireTypeChart.data.labels = sortedWireTypes.map(([wireType]) => wireType);
    wireTypeChart.data.datasets[0].data = sortedWireTypes.map(([, count]) => count);
    wireTypeChart.update();
}

function updateCuttingPerformanceChart() {
    if (!cuttingPerformanceChart) return;
    const p = calculatedMetrics.performance;
    cuttingPerformanceChart.data.datasets[0].data = [p.fullPicks, p.systemCuts];
    cuttingPerformanceChart.update();

    document.getElementById('fullPickCount').textContent = p.fullPicks;
    document.getElementById('systemCutCount').textContent = p.systemCuts;
}

function updateINAItems() {
    const inaList = document.getElementById('topINAItems');
    if (!inaList) return;

    /**
     * BOLT OPTIMIZATION: Faster list clearing and pre-collected items
     * Uses replaceChildren() and leverages the INA items collected during the main
     * metrics pass to avoid a redundant O(N) filter.
     */
    inaList.replaceChildren();

    const inaItems = calculatedMetrics.recentINAItems;

    if (inaItems.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'text-gray-500';
        emptyLi.textContent = 'No INA items found';
        inaList.appendChild(emptyLi);
        return;
    }

    inaItems.forEach(item => {
        const date = shortDateFormat.format(item.timestamp);
        const inaNum = item.inaNumber;
        const value = item.totalValue ? '$' + item.totalValue.toFixed(2) : 'N/A';
        const product = item.productCode || 'Unknown';

        const li = document.createElement('li');
        li.className = 'text-xs';
        li.textContent = `${date}: INA ${inaNum} - ${product} (${value})`;
        inaList.appendChild(li);
    });
}

// Utility function
function calculateChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? '+∞%' : '+0%';
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return sign + change.toFixed(1) + '%';
}

// Keyboard shortcuts and global functions
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadLiveData();
    }
});

// Expose refresh function globally
if (typeof window !== 'undefined') {
    window.refreshLiveDashboard = loadLiveData;
}

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '✂️ Cutting Records', href: '../cutting-records/cutting-records.html', class: 'bg-orange-600 hover:bg-orange-700' },
            { text: '📦 Inventory Records', href: '../inventory-records/inventory-records.html', class: 'bg-purple-600 hover:bg-purple-700' }

        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Live Statistics'
    });
}
