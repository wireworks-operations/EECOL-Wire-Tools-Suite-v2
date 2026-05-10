// ====================================================================
// CONSTANTS & UTILITY FUNCTIONS
// ====================================================================

const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 1 / METERS_TO_FEET;
const INCHES_TO_MM = 25.4;
const MM_TO_INCHES = 1 / 25.4;
const LBS_TO_KG = 0.453592;

// Material specific gravities (from reel capacity estimator)
const SPECIFIC_GRAVITY = {
    copper: 8.89,
    aluminum: 2.70,
    pvc: 1.40,
    xlpe: 0.92
};

const STRANDING_FACTOR = 1.03; // K for stranded conductors

// ====================================================================
// INDUSTRY STANDARD TABLES
// ====================================================================

// AWG and MCM to conductor diameter in inches (stranded bundle diameter)
const STANDARD_CONDUCTOR_DIAMETERS = {
    // American Wire Gauge (AWG) - Solid/Stranded
    '18': 0.048, '16': 0.052, '14': 0.064, '12': 0.081,
    '10': 0.102, '8': 0.129, '6': 0.163, '4': 0.205,
    '3': 0.230, '2': 0.258, '1': 0.289, '0': 0.325,
    // MCM (Thousand Circular Mils) - Stranded
    '250': 0.255, '350': 0.293, '400': 0.311, '500': 0.340,
    '600': 0.377, '700': 0.412, '750': 0.429, '800': 0.448,
    '900': 0.478, '1000': 0.508
};

// Insulation thickness by type (mm)
const STANDARD_INSULATION_THICKNESS = {
    'rw90': 1.65, 'tk90': 2.4, 'xw': 2.35, 'rw75': 1.4, 'standard': 1.2
};

// Comprehensive cable construction specifications with layers and ODs
const CABLE_CONSTRUCTION_DATA = {
    'TK90': {
        voltage: '600V',
        layers: [
            { type: 'conductor', material: 'conductor' }, // copper/aluminum based on designation
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.65 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.2 },
            { type: 'armor', material: 'steel', thickness_mm: 0.76 } // 0.030" galvanized steel
        ],
        // Overall diameter by gauge (inches) - includes all layers
        od_inches: {
            '14': 0.485, '12': 0.530, '10': 0.600, '8': 0.685,
            '6': 0.795, '4': 0.925, '3': 0.985, '2': 1.055, '1': 1.165,
            '1/0': 1.280, '2/0': 1.410, '3/0': 1.545, '4/0': 1.705,
            '250': 1.545, '350': 1.780, '500': 2.055, '600': 2.240,
            '750': 2.480, '1000': 2.835
        }
    },
    'ACWU90': {
        voltage: '600V',
        layers: [
            { type: 'conductor', material: 'aluminum' },
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.65 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.2 }
        ],
        od_inches: {
            '6': 0.420, '4': 0.545, '3': 0.605, '2': 0.690, '1': 0.795,
            '1/0': 0.920, '2/0': 1.045, '3/0': 1.165, '4/0': 1.315,
            '250': 1.165, '350': 1.380, '400': 1.480, '500': 1.630,
            '600': 1.780, '700': 1.880, '750': 2.000, '800': 2.080
        }
    },
    'RW90': {
        voltage: '600V',
        layers: [
            { type: 'conductor', material: 'copper' },
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.65 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.2 }
        ],
        od_inches: {
            '14': 0.200, '12': 0.225, '10': 0.280, '8': 0.345, '6': 0.430,
            '4': 0.560, '3': 0.620, '2': 0.680, '1': 0.800,
            '1/0': 0.920, '2/0': 1.050, '3/0': 1.180, '4/0': 1.320,
            '250': 1.180, '300': 1.300, '350': 1.400, '400': 1.500,
            '500': 1.680, '600': 1.850, '700': 1.980, '750': 2.080,
            '800': 2.180, '900': 2.300, '1000': 2.450
        }
    },
    'SOOW': {
        voltage: '600V',
        layers: [
            { type: 'conductor', material: 'copper' },
            { type: 'insulation', material: 'rubber', thickness_mm: 1.2 },
            { type: 'jacket', material: 'soow', thickness_mm: 2.4 } // SOOW jacket
        ],
        od_inches: {
            '18': 0.345, '16': 0.385, '14': 0.470, '12': 0.550, '10': 0.680,
            '8': 0.855, '6': 1.050, '4': 1.400, '3': 1.550, '2': 1.700,
            '1': 1.900, '1/0': 2.150, '2/0': 2.350, '3/0': 2.600, '4/0': 2.900
        }
    },
    'BARE': {
        layers: [
            { type: 'conductor', material: 'conductor' } // copper or aluminum based on designation
        ],
        od_inches: STANDARD_CONDUCTOR_DIAMETERS // Use conductor diameters as OD
    }
};

// Extended material properties for all cable components
const COMPONENT_SPECIFIC_GRAVITY = {
    // Conductors
    'conductor': null, // Will be resolved to copper/aluminum based on designation
    'copper': 8.89,
    'aluminum': 2.70,

    // Insulation materials
    'xlpe': 0.92,
    'pvc': 1.40,
    'rubber': 1.25,
    'soow': 1.35, // SOOW jacket compound

    // Armor materials
    'steel': 7.85,
    'aluminum_armor': 2.70
};

/**
 * Parses a cable designation string into its components
 * @param {string} designation The cable designation (e.g., "14/3CU", "250/3AL", "6AL")
 * @param {string} cableType The cable type (not used in parsing, but kept for consistency)
 * @returns {object} Object with gauge, material, and conductors properties
 */
function parseCableDesignation(designation, cableType) {
    if (!designation) {
        return { gauge: '', material: 'copper', conductors: 1 };
    }

    let gauge = '';
    let material = 'copper'; // default
    let conductors = 1;

    // Check for material suffix (CU or AL)
    let designationText = designation.trim().toUpperCase();

    // Remove any spaces
    designationText = designationText.replace(/\s+/g, '');

    // Find the last occurrence of 'CU' or 'AL'
    let lastPart = '';
    let materialFound = '';

    if (designationText.endsWith('CU')) {
        material = 'copper';
        materialFound = 'CU';
        lastPart = designationText.slice(0, -2);
    } else if (designationText.endsWith('AL')) {
        material = 'aluminum';
        materialFound = 'AL';
        lastPart = designationText.slice(0, -2);
    } else {
        // No material suffix found, treat as single copper conductor
        lastPart = designationText;
    }

    // Split by '/' to separate gauge from conductors
    const parts = lastPart.split('/');

    if (parts.length > 1) {
        // Multi-part designation like "250/3" or "1/0-4"
        const lastPartNoMaterial = parts[parts.length - 1];

        // Check for hyphen notation like "1/0-4"
        let conductorsPart = lastPartNoMaterial;
        if (lastPartNoMaterial.includes('-')) {
            const hyphenParts = lastPartNoMaterial.split('-');
            conductorsPart = hyphenParts[hyphenParts.length - 1]; // Last part after hyphen
        }

        // Parse conductors (default to 1 if not a number)
        const conductorsNum = parseInt(conductorsPart);
        conductors = isNaN(conductorsNum) ? 1 : conductorsNum;

        // Gauge is everything before the last /
        gauge = parts.slice(0, -1).join('/');
    } else {
        // Single part like "14" or "250"
        gauge = lastPart;
        conductors = 1;
    }

    return {
        gauge: gauge,
        material: material,
        conductors: conductors
    };
}

// ====================================================================
// COMPREHENSIVE INDUSTRY STANDARD CABLE DATABASE
// ====================================================================

const CABLE_UNIT_WEIGHTS = {
    // TECK90 Armored Cables - 600V Rating
    'TK 600V': {
        // #14 AWG (smallest standard)
        '14/2CU': 280, '14/3CU': 300, '14/4CU': 320, '14/6CU': 400,
        // #12 AWG
        '12/2CU': 380, '12/3CU': 400, '12/4CU': 450, '12/6CU': 550,
        // #10 AWG
        '10/2CU': 380, '10/3CU': 400, '10/4CU': 450,
        // #8 AWG
        '8/3CU': 700, '8/4CU': 850,
        // #6 AWG
        '6/3CU': 880,
        // Larger Copper
        '4/3CU': 1300, '3/3CU': 1500, '2/3CU': 1300, '1/3CU': 1750,
        '1/0-3CU': 1650, '2/0-3CU': 1950,
        // Aluminum (ACWU90 style sizes)
        '1/3AL': 950, '2/3AL': 760, '6/3AL': 450, '8/3AL': 350,
        '1/0-3AL': 1100, '1/0-4AL': 1300, '2/0-3AL': 795,
        // MCM Aluminum (corrected to industry standards)
        '250/3AL': 1900, '350/3AL': 2300, '400/3AL': 2700,
        '500/3AL': 3200, '600/3AL': 3800
    },

    // TECK90 Armored Cables - 1000V Rating
    'TK 1KV': {
        // Same size range as 600V but different voltage rating
        // Single conductors are less common in 1KV armored
        '4/3CU': 1400, '3/3CU': 1650, '2/3CU': 1450, '1/3CU': 1950,
        '1/0-3CU': 1850, '2/0-3CU': 2150,
        // Aluminum more common in higher voltage
        '1/3AL': 1050, '2/3AL': 850, '6/3AL': 550, '8/3AL': 450,
        '1/0-3AL': 1200, '1/0-4AL': 1400, '2/0-3AL': 900,
        '250/3AL': 2000, '350/3AL': 2500, '400/3AL': 2850,
        '500/3AL': 3400, '600/3AL': 4000
    },

    // ACWU90 - Aluminum Conductor, Crosslinked Polyethylene Insulation
    'ACWU90': {
        // Single aluminum conductors (correct realistic weights)
        '6AL': 120, '4AL': 190, '3AL': 240, '2AL': 290, '1AL': 380,
        '1/0AL': 480, '2/0AL': 600, '3/0AL': 750, '4/0AL': 900,
        // Multi-conductor aluminum (conductor weight × conductors + insulation)
        '6/2AL': 260, '6/3AL': 380, '8/3AL': 420, '10/2AL': 360,
        '10/3AL': 520, '16/2AL': 240, '16/3AL': 340,
        '2/2AL': 600, '2/3AL': 870, '1/2AL': 780, '1/3AL': 1130,
        '1/3AL': 1130, '2/3AL': 870,
        // MCM sizes (250/3 300m should be ~1500 lbs → ~1530 lbs/1000ft)
        '250/3AL': 1530, '250/4AL': 1730,
        // Standard MCM progression
        '350/3AL': 1850, '350/4AL': 2100,
        '400/3AL': 2000, '400/4AL': 2250,
        '500/3AL': 2300, '500/4AL': 2600,
        '600/3AL': 2700, '600/4AL': 3000,
        // Aluminum service entrance
        '1/0-4AL': 1950, '2/0-3AL': 1350, '4/0-2AL': 1200
    },

    // RW90 - Copper Conductor, Crosslinked Polyethylene Insulation
    'RW90': {
        // Single copper conductors
        '14CU': 50, '12CU': 80, '10CU': 100, '8CU': 160, '6CU': 250,
        '4CU': 400, '3CU': 520, '2CU': 680, '1CU': 870,
        '1/0CU': 1100, '2/0CU': 1350, '3/0CU': 1650, '4/0CU': 2000,
        // Aluminum building wire (less common but included)
        '1AL': 130, '1/0AL': 160, '250AL': 290, '350AL': 420, '500AL': 560,
        // Large copper building wire
        '250CU': 1350, '300CU': 1650, '350CU': 1900, '400CU': 2200,
        '500CU': 2700, '600CU': 3200, '700CU': 3700,
        '750CU': 4000, '800CU': 4300, '900CU': 4800, '1000CU': 5300
    },

    // SOOW - Extra Hard Service Portable Cord
    'SOOW': {
        // Range from #18 to 4/0 AWG
        '18/2C': 200, '18/3C': 280, '18/4C': 350, '18/5C': 420, '18/6C': 480,
        '16/2C': 240, '16/3C': 330, '16/4C': 420, '16/5C': 520,
        '14/2C': 320, '14/3C': 420, '14/4C': 550, '14/5C': 650, '14/6C': 750,
        '12/2C': 410, '12/3C': 550, '12/4C': 710,
        '10/2C': 650, '10/3C': 850, '10/4C': 1100, '10/5C': 1300,
        '8/2C': 800, '8/3C': 1100, '8/4C': 1400, '8/5C': 1700,
        '6/2C': 1250, '6/3C': 1550, '6/4C': 1900, '6/5C': 2300,
        '4/2C': 2250, '4/3C': 2800, '4/4C': 3400, '4/5C': 4000,
        '2/2C': 3300, '2/3C': 4100, '2/4C': 4800,
        '1/3C': 4200, '1/4C': 4800, '1/0C': 5500,
        // Larger portable cords (less common)
        '2/0C': 6500, '3/0C': 7500, '4/0C': 8500
    },

    // BARE 7STR - 7-Strand Bare Copper (Small AWG sizes)
    'BARE 7STR': {
        '#14CU': 35, '#12CU': 55, '#10CU': 90, '#8CU': 140, '#6CU': 210,
        '#4CU': 340, '#3CU': 430, '#2CU': 540, '#1CU': 690
    },

    // BARE 19STR - 19-Strand Bare Copper (Medium sizes)
    'BARE 19STR': {
        '#6CU': 250, '#4CU': 400, '#3CU': 510, '#2CU': 640, '#1CU': 820,
        '1/0CU': 1040, '2/0CU': 1310, '3/0CU': 1600, '4/0CU': 1950
    },

    // BARE 17STR - 17-Strand Bare Copper (As requested for differentiation)
    'BARE 17STR': {
        '#6CU': 245, '#4CU': 395, '#3CU': 500, '#2CU': 630, '#1CU': 800,
        '1/0CU': 1020, '2/0CU': 1280, '3/0CU': 1560, '4/0CU': 1900
    },

    // BARE 37STR - 37-Strand Bare Copper (Large MCM sizes)
    'BARE 37STR': {
        '250CU': 1400, '300CU': 1700, '350CU': 1950, '400CU': 2250,
        '500CU': 2800, '600CU': 3300, '700CU': 3800, '750CU': 4050,
        '800CU': 4350, '900CU': 4850, '1000CU': 5350
    }
};

/**
 * Calculates conductor weight using engineering formula
 * W_c = 340.5 × D² × G × K × n (lbs/1000 ft)
 */
function calculateConductorWeight(gauge, material, conductors = 1) {
    const diameter = STANDARD_CONDUCTOR_DIAMETERS[gauge];
    if (!diameter) return 0;

    const gravity = SPECIFIC_GRAVITY[material] || SPECIFIC_GRAVITY.copper;

    // Formula: 340.5 × D² × G × K × n
    return 340.5 * Math.pow(diameter, 2) * gravity * STRANDING_FACTOR * conductors;
}

/**
 * Calculates weight of annular layer using engineering formula
 * W_a = π × (OD² - ID²) × Length × SpecificGravity × 340.5 (lbs/1000 ft)
 * @param {number} od Outer diameter in inches
 * @param {number} id Inner diameter in inches
 * @param {string} material Material name (maps to specific gravity)
 * @returns {number} Weight in lbs/1000 ft
 */
function calculateAnnularLayerWeight(od, id, material) {
    const gravity = COMPONENT_SPECIFIC_GRAVITY[material];
    if (!gravity || od <= id) return 0;

    // Formula: π × (OD² - ID²) × SpecificGravity × 340.5 constant
    const annularArea = Math.PI * (Math.pow(od/2, 2) - Math.pow(id/2, 2));
    return annularArea * gravity * 340.5; // lbs/1000 ft (simplified from volume × density × constant)
}

/**
 * Gets the overall diameter for a specific cable gauge
 * @param {string} cableType Cable type key
 * @param {string} gauge Wire gauge/size
 * @returns {number} Overall diameter in inches
 */
function getCableOverallDiameter(cableType, gauge) {
    const construction = CABLE_CONSTRUCTION_DATA[cableType];
    if (!construction || !construction.od_inches) return 0;

    return construction.od_inches[gauge] || 0;
}

/**
 * Calculates diameter of a layer at given thickness from center
 * @param {number} innerDiameter Inner diameter in inches
 * @param {number} thickness_mm Thickness in millimeters
 * @returns {number} Outer diameter in inches
 */
function calculateLayerDiameter(innerDiameter, thickness_mm) {
    const thickness_inches = thickness_mm / 25.4; // Convert mm to inches
    return innerDiameter + (2 * thickness_inches);
}

/**
 * Calculates advanced engineering weight using detailed component breakdown
 * @param {string} designation Cable designation (e.g., "250/3AL")
 * @param {string} cableType Cable type key (e.g., "ACWU90")
 * @param {boolean} useAdvancedMode If true, uses component calculations; if false, uses published weights
 * @returns {object} Weight calculation result with method indicator
 */
function calculateEngineeringWeight(designation, cableType = '', useAdvancedMode = true) {
    const params = parseCableDesignation(designation, cableType);
    const construction = CABLE_CONSTRUCTION_DATA[cableType];

    if (!construction || !useAdvancedMode) {
        // Fall back to lookup table if advanced construction data not available
        const lookupKey = cableType === 'TK90' ? 'TK 600V' : cableType;
        const publishedWeight = CABLE_UNIT_WEIGHTS[lookupKey]?.[designation];
        return {
            weight: publishedWeight || 0,
            method: publishedWeight ? 'lookup' : 'unavailable'
        };
    }

    let totalWeight = 0;
    let currentDiameter = 0; // Start with zero diameter, build up layers

    // Process each layer sequentially
    for (const layer of construction.layers) {
        if (layer.type === 'conductor') {
            // Calculate conductor weight for all conductors
            const conductorMaterial = params.material; // copper or aluminum from designation
            const conductorWeight = calculateConductorWeight(params.gauge, conductorMaterial, params.conductors);
            totalWeight += conductorWeight;

            // Set current diameter to conductor bundle diameter for next layer
            const bundleDiameter = STANDARD_CONDUCTOR_DIAMETERS[params.gauge];
            currentDiameter = bundleDiameter * params.conductors; // Simplified - assumes conductors are bundled
        } else {
            // Calculate annular layer weight
            const layerThickness = layer.thickness_mm;
            const outerDiameter = calculateLayerDiameter(currentDiameter, layerThickness);
            const material = layer.material;

            // Special handling for conductor material resolution
            let actualMaterial = material;
            if (material === 'conductor') {
                actualMaterial = params.material; // Resolve to copper or aluminum
            }

            const layerWeight = calculateAnnularLayerWeight(outerDiameter, currentDiameter, actualMaterial);
            totalWeight += layerWeight;

            // Update current diameter for next layer
            currentDiameter = outerDiameter;
        }
    }

    return {
        weight: Math.round(totalWeight),
        method: 'advanced'
    };
}

// ====================================================================
// UI ELEMENTS
// ====================================================================

// Input Selectors
const cableTypeSelect = document.getElementById('cableType');
const designationSelect = document.getElementById('wireDesignation');
const knownLengthInput = document.getElementById('knownLength');
const lengthUnitSelect = document.getElementById('lengthUnit');
const tareWeightInput = document.getElementById('tareWeight');
const tareWeightUnitSelect = document.getElementById('tareWeightUnit');
const skidTareWeightInput = document.getElementById('skidTareWeight');
const skidTareWeightUnitSelect = document.getElementById('skidTareWeightUnit');

// Result Selectors
const totalWireWeightLbsDisplay = document.getElementById('totalWireWeightLbs');
const totalWireWeightKgDisplay = document.getElementById('totalWireWeightKg');
const totalShipmentWeightLbsDisplay = document.getElementById('totalShipmentWeightLbs');
const totalShipmentWeightKgDisplay = document.getElementById('totalShipmentWeightKg');
const unitWeightValueDisplay = document.getElementById('unitWeightValue');
const errorBox = document.getElementById('errorBox');
const errorMessageDisplay = document.getElementById('errorMessage');

// Calculation mode selector - defaults to basic lookup
let calculationMode = 'basic'; // 'basic' (lookup tables) or 'advanced' (engineering from advanced section)
let advancedCalculationMode = 'lookup'; // 'lookup' or 'engineering' (within advanced section)

/**
 * Hides the error message box.
 */
function hideError() {
    errorBox.classList.add('hidden');
}

/**
 * Shows the error message box with the specified text.
 * @param {string} message The error message to display.
 */
function showFatalError(message) {
    errorMessageDisplay.textContent = message;
    errorBox.classList.remove('hidden');
    // Clear calculation displays
    totalWireWeightLbsDisplay.textContent = '0.0 lbs';
    totalWireWeightKgDisplay.textContent = '';
    totalShipmentWeightLbsDisplay.textContent = '0.0 lbs';
    totalShipmentWeightKgDisplay.textContent = '';
    unitWeightValueDisplay.textContent = '--';
}

/**
 * Dynamically updates the designation dropdown based on the selected cable type.
 */
function updateDropdowns() {
    const cableType = cableTypeSelect.value;

    // 1. Reset and update Designation dropdown
    designationSelect.innerHTML = '<option value="">-- Select Designation (e.g., 14/3CU) --</option>';
    designationSelect.disabled = true;
    designationSelect.classList.add('bg-gray-100', 'cursor-not-allowed');

    // 2. Map HTML dropdown values to actual data structure keys
    let dataKey = cableType;

    // Handle special cases for data structure key mapping
    if (cableType === 'TK90') {
        // For TEK90, default to 600V (most common)
        dataKey = 'TK 600V';
    } else if (cableType === 'BARE') {
        // For BARE, use the first available BARE type (BARE 19STR)
        dataKey = 'BARE 19STR';
    }

    if (cableType && dataKey && CABLE_UNIT_WEIGHTS[dataKey]) {
        const designations = Object.keys(CABLE_UNIT_WEIGHTS[dataKey]).sort();

        designations.forEach(designation => {
            const option = document.createElement('option');
            option.value = designation;
            option.textContent = designation; // Display the full designation string
            designationSelect.appendChild(option);
        });

        designationSelect.disabled = false;
        designationSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }

    // Re-calculate silently after specification change
    calculateWeight(false);
}

/**
 * Toggles the visibility of the advanced settings section
 */
function toggleAdvancedSection() {
    const advancedSettings = document.getElementById('advancedSettings');
    const advancedToggle = document.getElementById('advancedToggle');

    if (advancedSettings.classList.contains('hidden')) {
        // Show advanced settings
        advancedSettings.classList.remove('hidden');
        advancedToggle.textContent = '▲';
    } else {
        // Hide advanced settings
        advancedSettings.classList.add('hidden');
        advancedToggle.textContent = '▼';
        // Reset to basic mode when closing advanced section
        calculationMode = 'basic';
        calculateWeight(false);
    }
}

/**
 * Updates the calculation mode within the advanced section
 */
function updateAdvancedCalculationMode() {
    const engineeringModeRadio = document.getElementById('engineeringMode');
    const componentInputs = document.getElementById('componentInputs');

    advancedCalculationMode = engineeringModeRadio.checked ? 'engineering' : 'lookup';

    // Show/hide component input fields based on mode
    if (advancedCalculationMode === 'engineering') {
        componentInputs.classList.remove('hidden');
        calculationMode = 'advanced'; // Use advanced engineering calculations
    } else {
        componentInputs.classList.add('hidden');
        calculationMode = 'basic'; // Use lookup tables
    }

    // Re-calculate with the new mode
    calculateWeight(false);
}

/**
 * Resets all input and select fields to their default values
 * and recalculates/clears the result display.
 */
function clearForm() {
    // 1. Reset inputs to default values
    knownLengthInput.value = '500';
    lengthUnitSelect.value = 'm';
    tareWeightInput.value = '0';
    tareWeightUnitSelect.value = 'lbs';
    document.getElementById('skidTareWeight').value = '0';
    document.getElementById('skidTareWeightUnit').value = 'lbs';

    // 2. Reset the main selection dropdowns
    cableTypeSelect.value = '';

    // 3. Clear the dependent designation dropdown and set its disabled state
    updateDropdowns();

    // 4. Clear result displays and error box
    calculateWeight(false);
    hideError();
}


// ====================================================================
// CORE CALCULATION LOGIC
// ====================================================================

/**
 * Calculates the total wire weight and total shipment weight (including tare)
 * based on length and specifications.
 * @param {boolean} showErrors - If true, displays the red error box on validation failure.
 */
function calculateWeight(showErrors = false) {
    if (showErrors) {
        hideError();
    }

    const length = parseFloat(knownLengthInput.value);
    const lengthUnit = lengthUnitSelect.value;
    const cableType = cableTypeSelect.value;
    const designation = designationSelect.value;

    const tareWeightRaw = parseFloat(tareWeightInput.value || '0');
    const tareWeightUnit = tareWeightUnitSelect.value;
    let tareWeightLbs = tareWeightRaw;
    if (tareWeightUnit === 'kg') {
        tareWeightLbs = tareWeightRaw / LBS_TO_KG;  // convert kg to lbs
    }

    const skidTareWeightRaw = parseFloat(skidTareWeightInput.value || '0');
    const skidTareWeightUnit = skidTareWeightUnitSelect.value;
    let skidTareWeightLbs = skidTareWeightRaw;
    if (skidTareWeightUnit === 'kg') {
        skidTareWeightLbs = skidTareWeightRaw / LBS_TO_KG;  // convert kg to lbs
    }

    // 1. Validation
    if (isNaN(length) || length <= 0) {
        if (showErrors) {
            showFatalError('Please enter a valid, positive length for the wire cut.');
        }
        return;
    }
    if (isNaN(tareWeightLbs) || tareWeightLbs < 0) {
        if (showErrors) {
            showFatalError('Please enter a valid, non-negative Reel Tare Weight (empty reel weight).');
        }
        return;
    }
    if (isNaN(skidTareWeightLbs) || skidTareWeightLbs < 0) {
        if (showErrors) {
            showFatalError('Please enter a valid, non-negative Skid Tare Weight (empty skid weight).');
        }
        return;
    }
    if (!cableType || !designation) {
        if (showErrors) {
            showFatalError('Please select the Cable Type and the full Wire Designation to proceed.');
        }
        return;
    }

    // 2. Convert Length to Base Unit (Feet)
    let lengthInFeet = length;
    if (lengthUnit === 'm') {
        lengthInFeet = length * METERS_TO_FEET;
    }

    // 3. Calculate unit weight based on mode
    let unitWeightLbsPer1000Ft;
    let calculationMethod;

    const result = calculateEngineeringWeight(designation, cableType, calculationMode === 'advanced');

    if (result.method === 'unavailable') {
        if (showErrors) {
            showFatalError(`Error: Could not find unit weight for configuration: ${cableType} ${designation}.`);
        }
        return;
    }

    unitWeightLbsPer1000Ft = result.weight;
    calculationMethod = result.method;

    // For comparison, get published weight if using advanced mode
    let publishedWeight = null;
    if (calculationMethod === 'advanced') {
        let lookupKey = cableType;
        if (cableType === 'TK90') {
            lookupKey = 'TK 600V';
        } else if (cableType === 'BARE') {
            lookupKey = 'BARE 19STR';
        }
        publishedWeight = CABLE_UNIT_WEIGHTS[lookupKey]?.[designation];
    }

    if (!unitWeightLbsPer1000Ft) {
        if (showErrors) {
            showFatalError(`Error: Could not find unit weight for configuration: ${cableType} ${designation}.`);
        }
        return;
    }

    // 4. Calculation

    // Unit Weight Conversion: lbs/1000 ft -> kg/1000 m (kg/km)
    const unitWeightKgPer1000M = unitWeightLbsPer1000Ft * LBS_TO_KG * METERS_TO_FEET;

    // Total Wire Weight
    const totalWireWeightLbs = (lengthInFeet / 1000) * unitWeightLbsPer1000Ft;
    const totalWireWeightKg = totalWireWeightLbs * LBS_TO_KG;

    // Total Shipment Weight (Wire + Reel + Skid)
    const totalShipmentWeightLbs = totalWireWeightLbs + tareWeightLbs + skidTareWeightLbs;
    const totalShipmentWeightKg = totalShipmentWeightLbs * LBS_TO_KG;


    // 5. Display Results

    // Update Unit Weight Display
    unitWeightValueDisplay.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
    const span = document.createElement('span');
    span.className = 'text-blue-800';
    span.textContent = `${unitWeightLbsPer1000Ft.toFixed(0)} lbs / 1,000 ft | ${unitWeightKgPer1000M.toFixed(1)} kg / 1,000 m`;
    unitWeightValueDisplay.appendChild(span);

    // Update Wire Weight Display
    totalWireWeightLbsDisplay.textContent = `${totalWireWeightLbs.toFixed(2)} lbs`;
    totalWireWeightKgDisplay.textContent = `(${totalWireWeightKg.toFixed(2)} kg)`;

    // Update Shipment Weight Display
    totalShipmentWeightLbsDisplay.textContent = `${totalShipmentWeightLbs.toFixed(2)} lbs`;
    totalShipmentWeightKgDisplay.textContent = `(${totalShipmentWeightKg.toFixed(2)} kg)`;
}

/**
 * Prints the weight results using the shared print utility.
 */
function printWeightResults() {
    const totalShipmentWeight = document.getElementById('totalShipmentWeightLbs').textContent;
    const totalWireWeight = document.getElementById('totalWireWeightLbs').textContent;
    const unitWeight = document.getElementById('unitWeightValue').innerHTML;

    if (typeof printWireWeightResults === 'function') {
        printWireWeightResults(totalShipmentWeight, totalWireWeight, unitWeight);
    } else {
        // Fallback (same as original)
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>EECOL Wire Weight Results</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #0058B3; }
                    .result-section { margin: 20px 0; }
                    .result { margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; }
                    .label { font-weight: bold; color: #666; }
                    .value { font-size: 18px; color: #0058B3; font-weight: bold; margin-top: 5px; }
                    .shipment-weight { color: #dc2626; font-size: 20px; }
                    .wire-weight { color: #0058B3; font-size: 18px; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <h2>EECOL Wire Weight Estimator Results</h2>
                <div class="result-section">
                    <h3>Weight Calculations</h3>
                    <div class="result">
                        <div class="result">
                            <p class="label">Total Shipment Weight (Wire + Reel + Skid):</p>
                            <p class="value shipment-weight">${window.escapeHTML(totalShipmentWeight)}</p>
                        </div>
                        <div class="result">
                            <p class="label">Wire Weight Only:</p>
                            <p class="value wire-weight">${window.escapeHTML(totalWireWeight)}</p>
                        </div>
                        <div class="result">
                            <p class="label">Unit Weight:</p>
                            <p class="value">${unitWeight}</p>
                        </div>
                    </div>
                </div>
                <button onclick="window.print()">Print</button>
            </body>
            </html>
        `);
        printWindow.print();
    }
}

// ====================================================================
// INITIALIZATION
// ====================================================================

// ====================================================================
// INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Set default length unit to meters for EECOL precision measuring
    lengthUnitSelect.value = 'm';

    // Initial call to set the default 0.0 lbs display
    calculateWeight(false);

    // Add listeners for dynamic input changes
    knownLengthInput.addEventListener('input', () => calculateWeight(false));
    lengthUnitSelect.addEventListener('change', () => calculateWeight(false));
    designationSelect.addEventListener('change', () => calculateWeight(false));
    tareWeightInput.addEventListener('input', () => calculateWeight(false));
    tareWeightUnitSelect.addEventListener('change', () => calculateWeight(false));
    skidTareWeightInput.addEventListener('input', () => calculateWeight(false));
    skidTareWeightUnitSelect.addEventListener('change', () => calculateWeight(false));
});

// ============================================================================
// MOBILE MENU INITIALIZATION FOR WIRE WEIGHT ESTIMATOR PAGE
// ============================================================================

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Wire Weight Estimator'
    });
}
