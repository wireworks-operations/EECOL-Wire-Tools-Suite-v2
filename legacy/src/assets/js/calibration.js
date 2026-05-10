/**
 * Calibration Measurements Logic
 * EECOL Wire Tools Suite
 */

const machines = [
    "Manual Hand Coiler",
    "Green Electric Hand Coiler",
    "Blue Electric Hand Coiler",
    "Telus Machine",
    "Big Blue Machine # 1",
    "Big Blue Machine # 2"
];

let dbReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDB();
        renderMachines();
    } catch (error) {
        console.error("Failed to initialize database:", error);
        showAlert('Failed to connect to the database. Please try refreshing the page.', 'Error');
    }
});

async function initializeDB() {
    try {
        if (window.eecolDBPromise) {
            await window.eecolDBPromise;
        }

        if (!window.EECOLIndexedDB) {
            throw new Error('EECOLIndexedDB is not available globally');
        }

        window.eecolDB = EECOLIndexedDB.getInstance();
        await window.eecolDB.isReady();
        dbReady = true;
    } catch (error) {
        console.error('Failed to initialize db instance:', error);
        throw error;
    }
}

async function renderMachines() {
    const container = document.getElementById('calibrationContainer');
    if (!container) return;

    container.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    for (let i = 0; i < machines.length; i++) {
        const machineName = machines[i];
        const machineId = `machine-${i}`;

        // Fetch recent measurements
        let recentMeasurements = [];
        if (dbReady) {
            try {
                recentMeasurements = await window.eecolDB.getRecentCalibrationMeasurements(machineName, 3);
                // Sort ascending for display: older -> newer
                recentMeasurements = recentMeasurements.sort((a, b) => a.timestamp - b.timestamp);
            } catch (error) {
                console.error(`Error fetching measurements for ${machineName}:`, error);
            }
        }

        const machineDiv = document.createElement('div');
        machineDiv.className = 'bg-white p-6 rounded-xl shadow-lg border-l-4 card-border-blue mb-6 machine-section dark:bg-slate-800 dark:border-slate-600';
        machineDiv.id = machineId;

        const title = document.createElement('h2');
        title.className = 'text-xl font-bold text-[#0058B3] mb-4 text-center dark:text-blue-400';
        title.textContent = machineName;
        machineDiv.appendChild(title);

        const measurementsContainer = document.createElement('div');
        measurementsContainer.className = 'mb-6';
        const measurementsTitle = document.createElement('h3');
        measurementsTitle.className = 'text-sm font-semibold mb-3 header-gradient dark:text-gray-300';
        measurementsTitle.textContent = 'Previous Measurements:';
        measurementsContainer.appendChild(measurementsTitle);
        renderPreviousMeasurements(recentMeasurements, measurementsContainer);
        machineDiv.appendChild(measurementsContainer);

        const entryDiv = document.createElement('div');
        entryDiv.className = 'border-t border-gray-200 dark:border-gray-700 pt-4 mt-4';
        entryDiv.innerHTML = `
            <h3 class="text-sm font-semibold mb-3 header-gradient dark:text-gray-300">New Calibration Entry:</h3>
            <div class="flex flex-col sm:flex-row gap-4 items-end">
                <div class="flex-1 w-full">
                    <label class="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Measured Length</label>
                    <input type="number" id="input-${machineId}" step="0.01" min="0" placeholder="e.g. 10.5"
                        class="w-full p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400">
                </div>
                <div class="w-full sm:w-auto">
                    <label class="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Unit</label>
                    <select id="unit-${machineId}" class="w-full sm:w-32 p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="ft">Feet (ft)</option>
                        <option value="m">Meters (m)</option>
                    </select>
                </div>
                <div class="w-full sm:w-auto flex gap-2">
                    <button id="save-${machineId}"
                        class="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 border-2 border-indigo-600 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-indigo-600 focus:ring-opacity-50 flex items-center justify-center">
                        💾 Save
                    </button>
                    <button id="print-${machineId}"
                        class="flex-1 sm:flex-none px-6 py-3 bg-gray-600 border-2 border-gray-600 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-600 focus:ring-opacity-50 flex items-center justify-center">
                        🖨️ Print
                    </button>
                </div>
            </div>
        `;
        entryDiv.querySelector(`#save-${machineId}`).onclick = () => saveMeasurement(machineName, machineId);
        entryDiv.querySelector(`#print-${machineId}`).onclick = () => printMeasurement(machineName);
        machineDiv.appendChild(entryDiv);

        container.appendChild(machineDiv);
    }
}

function renderPreviousMeasurements(measurements, container) {
    if (!measurements || measurements.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg border border-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400 text-center';
        emptyDiv.textContent = 'No previous measurements found.';
        container.appendChild(emptyDiv);
        return;
    }

    const listDiv = document.createElement('div');
    listDiv.className = 'flex flex-col gap-2';

    measurements.forEach((m, index) => {
        const date = new Date(m.timestamp).toLocaleString();
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100 dark:bg-slate-700/50 dark:border-slate-600 transition-all hover:shadow-md';

        const leftDiv = document.createElement('div');
        leftDiv.className = 'flex items-center gap-3';

        const badge = document.createElement('span');
        badge.className = 'flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 text-xs font-bold dark:bg-indigo-900 dark:text-indigo-200';
        badge.textContent = (index + 1).toString();
        leftDiv.appendChild(badge);

        const dateSpan = document.createElement('span');
        dateSpan.className = 'text-sm text-gray-600 dark:text-gray-400';
        dateSpan.textContent = date;
        leftDiv.appendChild(dateSpan);

        itemDiv.appendChild(leftDiv);

        const valueDiv = document.createElement('div');
        valueDiv.className = 'font-bold text-indigo-700 dark:text-indigo-400 text-lg';
        valueDiv.textContent = m.measurement;
        itemDiv.appendChild(valueDiv);

        listDiv.appendChild(itemDiv);
    });

    container.appendChild(listDiv);
}

async function saveMeasurement(machineName, machineId) {
    const inputEl = document.getElementById(`input-${machineId}`);
    const unitEl = document.getElementById(`unit-${machineId}`);

    if (!inputEl || !unitEl) return;

    const value = parseFloat(inputEl.value);

    if (isNaN(value) || value <= 0) {
        showAlert('Please enter a valid positive number for the measurement.', 'Invalid Input');
        return;
    }

    const measurementStr = `${value} ${unitEl.value}`;

    try {
        if (!dbReady) {
            throw new Error("Database not ready");
        }

        await window.eecolDB.saveCalibrationMeasurement(machineName, measurementStr);

        // Clear input
        inputEl.value = '';

        // Show success and re-render to show updated list
        showAlert(`Measurement saved successfully for ${machineName}.`, 'Success');
        await renderMachines();

    } catch (error) {
        console.error("Failed to save measurement:", error);
        showAlert('Failed to save measurement to the database.', 'Error');
    }
}

async function printMeasurement(machineName) {
    if (!dbReady) {
        showAlert('Database not ready. Please try again.', 'Error');
        return;
    }

    try {
        let recentMeasurements = await window.eecolDB.getRecentCalibrationMeasurements(machineName, 3);
        // Sort descending to show newest first on print
        recentMeasurements = recentMeasurements.sort((a, b) => b.timestamp - a.timestamp);

        if (typeof window.printMachineCalibrationMeasurement === 'function') {
            window.printMachineCalibrationMeasurement(machineName, recentMeasurements);
        } else {
            console.error("Print function printMachineCalibrationMeasurement not found in global scope.");
            showAlert('Print module is not loaded correctly.', 'Error');
        }
    } catch (error) {
        console.error("Failed to print measurements:", error);
        showAlert('Failed to gather measurements for printing.', 'Error');
    }
}
