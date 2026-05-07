/**
 * EECOL Industry Standards Module
 * Centralized data and utilities for industry standard reels and cable specifications
 */

// ====================================================================
// STANDARD INDUSTRY REEL DIMENSIONS (Imperial - inches)
// ====================================================================

export const STANDARD_REELS = [
    {name: "Small Spool", core: 12/39.37, flange: 24/39.37, width: 24/39.37, category: "prototype", key: "small_spool"},
    {name: "Medium Spool", core: 18/39.37, flange: 30/39.37, width: 30/39.37, category: "development", key: "medium_spool"},
    {name: "24/36 Reel", core: 24/39.37, flange: 36/39.37, width: 36/39.37, category: "production", key: "24_36_reel"},
    {name: "30/42 Reel", core: 30/39.37, flange: 42/39.37, width: 42/39.37, category: "production", key: "30_42_reel"},
    {name: "30/48 Reel", core: 30/39.37, flange: 48/39.37, width: 48/39.37, category: "production", key: "30_48_reel"},
    {name: "36/48 Reel", core: 36/39.37, flange: 48/39.37, width: 48/39.37, category: "production", key: "36_48_reel"},
    {name: "36/60 Reel", core: 36/39.37, flange: 60/39.37, width: 42/39.37, category: "production", key: "36_60_reel"},
    {name: "42/60 Reel", core: 42/39.37, flange: 60/39.37, width: 48/39.37, category: "production", key: "42_60_reel"},
    {name: "42/72 Reel", core: 42/39.37, flange: 72/39.37, width: 48/39.37, category: "industrial", key: "42_72_reel"},
    {name: "48/72 Reel", core: 48/39.37, flange: 72/39.37, width: 51/39.37, category: "industrial", key: "48_72_reel"},
    {name: "48/84 Reel", core: 48/39.37, flange: 84/39.37, width: 54/39.37, category: "industrial", key: "48_84_reel"},
    {name: "54/84 Reel", core: 54/39.37, flange: 84/39.37, width: 54/39.37, category: "industrial", key: "54_84_reel"},
    {name: "54/96 Reel", core: 54/39.37, flange: 96/39.37, width: 54/39.37, category: "bulk", key: "54_96_reel"}
];

// ====================================================================
// CABLE UNIT WEIGHTS (lbs per 1000 ft) - INDUSTRY STANDARD NAMING
// ====================================================================

export const CABLE_UNIT_WEIGHTS = {
    // ACWU90 Aluminum variants (600V, 3C + Ground)
    'ACWU90': {
        // Format: "Size/Material Voltage" or "Size Size/Material Voltage"
        '1/0 AL 600V': 847,
        '1 AL 600V': 753,
        '250 AL 600V': 1572,
        '1 CU 600V': 938,     // Copper variant
        '1/0 CU 600V': 1110,   // Copper variant
        '250 CU 600V': 2510,   // Copper variant
    },

    // TK90 Copper variants (600V and 1KV)
    'TK90': {
        // 600V variants
        '14/2CU 600V': 280,    // Estimate from partial data
        '14/3CU 600V': 280,
        '14/4CU 600V': 320,
        '14/5CU 600V': 320,
        '14/6CU 600V': 400,
        '14/7CU 600V': 400,
        '14/8CU 600V': 400,
        '14/10CU 600V': 400,
        '14/12CU 600V': 400,
        '14/15CU 600V': 400,
        '14/20CU 600V': 400,
        '14/25CU 600V': 400,
        '14/30CU 600V': 400,
        '14/40CU 600V': 400,
        '14/50CU 600V': 400,

        '12/2CU 600V': 380,
        '12/3CU 600V': 400,
        '12/4CU 600V': 450,
        '12/6CU 600V': 550,
        '12/8CU 600V': 550,
        '12/10CU 600V': 550,
        '12/12CU 600V': 550,
        '12/15CU 600V': 550,
        '12/20CU 600V': 550,

        '10/2CU 600V': 400,
        '10/3CU 600V': 400,
        '10/4CU 600V': 450,
        '10/6CU 600V': 450,
        '10/10CU 600V': 450,
        '10/20CU 600V': 450,

        // 1KV variants
        '1C350CU 1KV': 734,
        '1C500CU 1KV': 948,
        '1C750CU 1KV': 1250,

        '12/2CU 1KV': 369,
        '10/2CU 1KV': 425,
        '8/2CU 1KV': 663,

        '12/3CU 1KV': 425,
        '10/3CU 1KV': 520,
        '8/3CU 1KV': 663,
        '6/3CU 1KV': 663,
        '4/3CU 1KV': 663,
        '3/3CU 1KV': 663,
        '2/3CU 1KV': 663,
        '1/3CU 1KV': 663,
        '1/0-3CU 1KV': 738,
        '2/0-3CU 1KV': 875,
        '3/0-3CU 1KV': 1020,
        '4/0-3CU 1KV': 1140,
        '250-3CU 1KV': 1250,
        '350-3CU 1KV': 1500,
        '500-3CU 1KV': 2000,
    },

    // RW90 Aluminum (600V Single Conductor)
    'RW90': {
        '1/0 AL': 128,    // lbs/1000 ft from table
        '6 AL': 37,
        '4 AL': 55,
        '2 AL': 82,
        '1 AL': 104,
        '2/0 AL': 157,
        '3/0 AL': 193,
        '4/0 AL': 239,
        '250 AL': 286,
        '300 AL': 339,
        '350 AL': 397,
        '400 AL': 442,
        '500 AL': 544,
        '600 AL': 663,
        '750 AL': 816,
        '1000 AL': 1070,
    },

    // SOOW/SOOWJ Flexible Cords (600V/300V)
    'SOOW': {
        // SOOW (600V) variants
        '18/2C SOOW': 200,
        '18/3C SOOW': 280,
        '18/4C SOOW': 350,
        '18/5C SOOW': 420,
        '18/6C SOOW': 480,
        '16/2C SOOW': 240,
        '16/3C SOOW': 330,
        '16/4C SOOW': 420,
        '16/5C SOOW': 520,
        '14/2C SOOW': 320,
        '14/3C SOOW': 420,
        '14/4C SOOW': 550,
        '14/5C SOOW': 650,
        '14/6C SOOW': 750,
        '12/2C SOOW': 410,
        '12/3C SOOW': 550,
        '12/4C SOOW': 710,
        '10/2C SOOW': 650,
        '10/3C SOOW': 850,
        '10/4C SOOW': 1100,
        '10/5C SOOW': 1300,
        '8/2C SOOW': 800,
        '8/3C SOOW': 1100,
        '8/4C SOOW': 1400,
        '8/5C SOOW': 1700,
        '6/2C SOOW': 1250,
        '6/3C SOOW': 1550,
        '6/4C SOOW': 1900,
        '6/5C SOOW': 2300,
        '4/2C SOOW': 2250,
        '4/3C SOOW': 2800,
        '4/4C SOOW': 3400,
        '4/5C SOOW': 4000,
        '2/2C SOOW': 3300,
        '2/3C SOOW': 4100,
        '2/4C SOOW': 4800,
        '1/3C SOOW': 4200,
        '1/4C SOOW': 4800,
        '1/0C SOOW': 5500,
        '2/0C SOOW': 6500,
        '3/0C SOOW': 7500,
        '4/0C SOOW': 8500,

        // SOOWJ (300V - Junior Service) variants
        '18/2C SOOWJ': 55,
        '16/2C SOOWJ': 70,
        '14/2C SOOWJ': 105,
        '12/2C SOOWJ': 140,
    },

    // BARE Copper/BARE Aluminum (Combined stranding variants)
    'BARE': {
        // 19 Strand Copper (existing)
        '#6CU 19STR': 210,
        '#4CU 19STR': 340,
        '#3CU 19STR': 430,
        '#2CU 19STR': 540,
        '#1CU 19STR': 690,
        '1/0CU 19STR': 1040,
        '2/0CU 19STR': 1310,
        '3/0CU 19STR': 1600,
        '4/0CU 19STR': 1950,

        // 17 Strand Aluminum (AAC - All Aluminum Conductor)
        'Waxwing 17STR AAC': 290,
        'Merlin 17STR AAC': 365,
        'Chickadee 17STR AAC': 432,

        // 19 Strand Aluminum (AAC)
        'Partridge 19STR AAC': 367,
        'Ostrich 19STR AAC': 413,
        'Linnet 19STR AAC': 463,

        // ACSR (Aluminum Conductor Steel Reinforced)
        'Waxwing ACSR': 290,
        'Merlin ACSR': 365,
        'Chickadee ACSR': 432,
        'Partridge ACSR': 367,
        'Ostrich ACSR': 413,
        'Linnet ACSR': 463,
        'Teal ACSR': 939,
    },
};

// ====================================================================
// SUPPLIER CABLE SPECIFICATIONS (Detailed Reference Data)
// ====================================================================

export const SUPPLIER_CABLE_SPECIFICATIONS = {
    'nexans': {
        'acwu90_600v': {
            // Single Conductor (1C) - Aluminum 600V
            '1c350': { conductor_mm: 15.60, cable_od_mm: 31.4, weight_kgkm: 333, conductor_weight_kgkm: 273 },
            '1c500': { conductor_mm: 18.70, cable_od_mm: 34.8, weight_kgkm: 444, conductor_weight_kgkm: 360 },
            '1c600': { conductor_mm: 20.70, cable_od_mm: 38.1, weight_kgkm: 550, conductor_weight_kgkm: 445 },
            '1c750': { conductor_mm: 23.10, cable_od_mm: 40.6, weight_kgkm: 700, conductor_weight_kgkm: 565 },
            '1c1000': { conductor_mm: 26.90, cable_od_mm: 44.4, weight_kgkm: 920, conductor_weight_kgkm: 740 },

            // Three Conductor (3C) - Aluminum 600V
            '3c6': { cable_od_mm: 23.6 },
            '3c4': { cable_od_mm: 25.9 },
            '3c2': { cable_od_mm: 28.7 },
            '3c1': { cable_od_mm: 31.7 },
            '3c1_0': { cable_od_mm: 33.5 },
            '3c2_0': { cable_od_mm: 35.8 },
            '3c3_0': { cable_od_mm: 38.3 },
            '3c4_0': { cable_od_mm: 41.9 },
            '3c250': { cable_od_mm: 45.5 },
            '3c300': { cable_od_mm: 48.8 },
            '3c350': { cable_od_mm: 51.6 },
            '3c500': { cable_od_mm: 58.2 },
            '3c750': { cable_od_mm: 72.0 },

            // Four Conductor (4C) - Aluminum 600V
            '4c8': { cable_od_mm: 26.1 },
            '4c6': { cable_od_mm: 32.5 },
            '4c4': { cable_od_mm: 34.3 },
            '4c3': { cable_od_mm: 36.6 },
            '4c2': { cable_od_mm: 38.1 },
            '4c2_0': { cable_od_mm: 47.4 },
            '4c3_0': { cable_od_mm: 49.8 },
            '4c4_0': { cable_od_mm: 54.4 },
            '4c250': { cable_od_mm: 59.6 },
            '4c350': { cable_od_mm: 67.4 },
            '4c500': { cable_od_mm: 76.7 }
        },

        'teck90_600v': {
            voltage: '600V',
            conductor_mm: {
                '14': 1.84,
                '12': 2.32,
                '10': 2.95
            },

            '2c': {
                '14': { cable_od_mm: 17.5 },
                '12': { cable_od_mm: 18.4 },
                '10': { cable_od_mm: 19.5 }
            },

            '3c': {
                '14': { cable_od_mm: { '2': 17.5, '3': 18.0, '4': 19.3, '5': 20.0, '6': 21.0, '7': 21.4, '8': 23.1, '10': 25.0, '12': 25.7, '15': 27.7, '20': 30.2, '25': 33.7, '30': 35.5, '40': 38.9, '50': 41.7 } },
                '12': { cable_od_mm: { '2': 18.4, '3': 18.9, '4': 20.8, '6': 23.2, '8': 24.7, '10': 27.4, '12': 28.6, '15': 30.2, '20': 33.6 } },
                '10': { cable_od_mm: { '2': 19.5, '3': 20.3, '4': 22.0, '6': 25.0, '10': 30.2, '20': 36.7 } }
            }
        },

        'teck90_1kv': {
            voltage: '1kV',
            conductor_mm: {
                '14': 1.84,
                '12': 2.32,
                '10': 2.95
            },

            '1c': {
                '350': { conductor_mm: 17.30, cable_od_mm: 36.7 },
                '500': { conductor_mm: 20.65, cable_od_mm: 40.3 },
                '750': { conductor_mm: 25.35, cable_od_mm: 46.0 }
            },

            '2c': {
                '12': { conductor_mm: 2.32, cable_od_mm: 20.2 },
                '10': { conductor_mm: 2.95, cable_od_mm: 21.1 },
                '8': { cable_od_mm: 23.5 },
                '6': { cable_od_mm: 26.8 }
            },

            '3c': {
                '12': { conductor_mm: 2.32, cable_od_mm: 20.9 },
                '10': { conductor_mm: 2.95, cable_od_mm: 22.6 },
                '8': { cable_od_mm: 23.9 },
                '6': { cable_od_mm: 28.6 },
                '4': { cable_od_mm: 32.1 },
                '3': { cable_od_mm: 33.7 },
                '2': { cable_od_mm: 35.3 },
                '1': { cable_od_mm: 39.3 },
                '1_0': { cable_od_mm: 42.0 },
                '2_0': { cable_od_mm: 43.9 },
                '3_0': { cable_od_mm: 46.6 },
                '4_0': { cable_od_mm: 48.9 },
                '250': { cable_od_mm: 57.2 },
                '350': { cable_od_mm: 62.5 },
                '500': { cable_od_mm: 70.0 }
            },

            '4c': {
                '8': { cable_od_mm: 26.1 },
                '6': { cable_od_mm: 32.5 },
                '4': { cable_od_mm: 34.3 },
                '3': { cable_od_mm: 36.6 },
                '2': { cable_od_mm: 38.1 },
                '2_0': { cable_od_mm: 47.4 },
                '3_0': { cable_od_mm: 49.8 },
                '4_0': { cable_od_mm: 54.4 },
                '250': { cable_od_mm: 59.6 },
                '350': { cable_od_mm: 67.4 },
                '500': { cable_od_mm: 76.7 }
            }
        }
    },

    'southwire': {
        'copper_conductors': {
            'bare': {
                '14_1': { nominal_mm: 1.63 },
                '12_1': { nominal_mm: 2.05 },
                '10_7': { nominal_mm: 3.61 },
                '8_7': { nominal_mm: 4.55 },
                '6_7': { nominal_mm: 5.72 },
                '4_7': { nominal_mm: 7.19 },
                '3_7': { nominal_mm: 7.95 },
                '2_7': { nominal_mm: 8.94 },
                '1_19': { nominal_mm: 10.03 },
                '1_0_19': { nominal_mm: 11.25 },
                '2_0_19': { nominal_mm: 12.65 },
                '3_0_19': { nominal_mm: 13.77 },
                '4_0_19': { nominal_mm: 15.09 },
                '250_37': { nominal_mm: 16.28 },
                '300_37': { nominal_mm: 17.40 },
                '350_37': { nominal_mm: 19.46 },
                '400_37': { nominal_mm: 21.34 },
                '500_37': { nominal_mm: 23.85 },
                '600_61': { nominal_mm: 28.37 },
                '750_61': { nominal_mm: null }, // No data
                '1000_61': { nominal_mm: null }  // No data
            }
        }
    }
};

// ====================================================================
// GLOBAL INDUSTRY STANDARDS - NEMA Reel Standards
// ====================================================================

export const STANDARD_REEL_SIZES = {
    'nema_wc26_2008': {
        'small': { flange_in: 18, traverse_in: 8, hub_in: 4, max_weight_lbs: 500 },
        'medium': { flange_in: 24, traverse_in: 12, hub_in: 6, max_weight_lbs: 1500 },
        'large': { flange_in: 36, traverse_in: 18, hub_in: 8, max_weight_lbs: 3000 },
        'x_large': { flange_in: 48, traverse_in: 24, hub_in: 10, max_weight_lbs: 5000 }
    },
    'heavy_duty': {
        'flange_min': 60,
        'flange_max': 96,
        'max_weight_lbs': 10000,
        'note': 'Steel reels for large conductors, 20x conductor OD minimum drum diameter'
    }
};

// ====================================================================
// CABLE CONSTRUCTION DATA (with OD inches) - INDUSTRY STANDARD NAMING
// ====================================================================

export const CABLE_CONSTRUCTION_DATA = {
    // TK90 variants (600V and 1KV)
    'TK90': {
        '600V': {
            // 600V TK90 Copper cable ODs
            od_inches: {
                '14/2CU 600V': 0.69, '14/3CU 600V': 0.71, '14/4CU 600V': 0.76, '14/5CU 600V': 0.79,
                '14/6CU 600V': 0.83, '14/7CU 600V': 0.84, '14/8CU 600V': 0.91, '14/10CU 600V': 0.98,
                '14/12CU 600V': 1.01, '14/15CU 600V': 1.09, '14/20CU 600V': 1.19, '14/25CU 600V': 1.33,
                '14/30CU 600V': 1.40, '14/40CU 600V': 1.52, '14/50CU 600V': 1.64,

                '12/2CU 600V': 0.72, '12/3CU 600V': 0.75, '12/4CU 600V': 0.82, '12/6CU 600V': 0.91,
                '12/8CU 600V': 0.97, '12/10CU 600V': 1.08, '12/12CU 600V': 1.13, '12/15CU 600V': 1.19,
                '12/20CU 600V': 1.32,

                '10/2CU 600V': 0.77, '10/3CU 600V': 0.80, '10/4CU 600V': 0.87, '10/6CU 600V': 0.99,
                '10/10CU 600V': 1.19, '10/20CU 600V': 1.45,
            }
        },
        '1KV': {
            // 1KV TK90 Copper cable ODs
            od_inches: {
                '1C350CU 1KV': 1.45, '1C500CU 1KV': 1.59, '1C750CU 1KV': 1.81,

                '12/2CU 1KV': 0.79, '10/2CU 1KV': 0.83, '8/2CU 1KV': 0.93, '6/2CU 1KV': 1.06,

                '12/3CU 1KV': 0.82, '10/3CU 1KV': 0.89, '8/3CU 1KV': 0.94, '6/3CU 1KV': 1.13,
                '4/3CU 1KV': 1.27, '3/3CU 1KV': 1.33, '2/3CU 1KV': 1.39, '1/3CU 1KV': 1.55,
                '1/0-3CU 1KV': 1.65, '2/0-3CU 1KV': 1.73, '3/0-3CU 1KV': 1.84, '4/0-3CU 1KV': 1.93,
                '250-3CU 1KV': 2.25, '350-3CU 1KV': 2.46, '500-3CU 1KV': 2.76,

                '8/4CU 1KV': 1.03, '6/4CU 1KV': 1.28, '4/4CU 1KV': 1.35, '3/4CU 1KV': 1.44,
                '2/4CU 1KV': 1.50, '2/0-4CU 1KV': 1.87, '3/0-4CU 1KV': 1.96, '4/0-4CU 1KV': 2.14,
                '250-4CU 1KV': 2.42, '350-4CU 1KV': 2.65, '500-4CU 1KV': 3.02,
            }
        },
        layers: [
            { type: 'conductor', material: 'copper' },
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.65 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.2 },
            { type: 'armor', material: 'steel', thickness_mm: 0.76 }
        ]
    },

    // ACWU90 Aluminum variants (600V)
    'ACWU90': {
        '600V': {
            od_inches: {
                '1/0 AL 600V': 1.46, '1 AL 600V': 1.38, '250 AL 600V': 1.93,
                '1 CU 600V': 1.38, '1/0 CU 600V': 1.46, '250 CU 600V': 1.93,
                // Additional ACWU90 variants from Nexans data
                '4C8 AL 600V': 1.03, '4C6 AL 600V': 1.28, '4C4 AL 600V': 1.35, '4C3 AL 600V': 1.44,
                '4C2 AL 600V': 1.50, '4C2/0 AL 600V': 1.87, '4C3/0 AL 600V': 1.96, '4C4/0 AL 600V': 2.14,
                '4C250 AL 600V': 2.42, '4C350 AL 600V': 2.65, '4C500 AL 600V': 3.02,

                '3C6 AL 600V': 0.93, '3C4 AL 600V': 1.02, '3C2 AL 600V': 1.13, '3C1 AL 600V': 1.25,
                '3C1/0 AL 600V': 1.32, '3C2/0 AL 600V': 1.41, '3C3/0 AL 600V': 1.51, '3C4/0 AL 600V': 1.65,
                '3C250 AL 600V': 1.79, '3C300 AL 600V': 1.92, '3C350 AL 600V': 2.03, '3C500 AL 600V': 2.29,
                '3C750 AL 600V': 2.83,
            }
        },
        layers: [
            { type: 'conductor', material: 'aluminum' },
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.65 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.2 }
        ]
    },

    // RW90 Aluminum (600V Single Conductor)
    'RW90': {
        '600V': {
            od_inches: {
                '1/0 AL': 0.446, '6 AL': 0.259, '4 AL': 0.303, '2 AL': 0.358, '1 AL': 0.409,
                '2/0 AL': 0.486, '3/0 AL': 0.533, '4/0 AL': 0.585, '250 AL': 0.650, '300 AL': 0.703,
                '350 AL': 0.749, '400 AL': 0.792, '500 AL': 0.869, '600 AL': 0.976, '750 AL': 0.996, // Adjusted for data
                '1000 AL': 1.223,
            }
        },
        layers: [
            { type: 'conductor', material: 'aluminum' },
            { type: 'insulation', material: 'xlpe', thickness_mm: 1.40 },
            { type: 'jacket', material: 'pvc', thickness_mm: 1.27 }
        ]
    },

    // SOOW/SOOWJ Flexible Cords (600V/300V)
    'SOOW': {
        '600V': {
            od_inches: {
                '18/2C SOOW': 0.35, '18/3C SOOW': 0.38, '18/4C SOOW': 0.42, '18/5C SOOW': 0.45, '18/6C SOOW': 0.48,
                '16/2C SOOW': 0.38, '16/3C SOOW': 0.42, '16/4C SOOW': 0.48, '16/5C SOOW': 0.52,
                '14/2C SOOW': 0.42, '14/3C SOOW': 0.48, '14/4C SOOW': 0.52, '14/5C SOOW': 0.55, '14/6C SOOW': 0.58,
                '12/2C SOOW': 0.48, '12/3C SOOW': 0.52, '12/4C SOOW': 0.58,
                '10/2C SOOW': 0.55, '10/3C SOOW': 0.62, '10/4C SOOW': 0.68, '10/5C SOOW': 0.72,
                '8/2C SOOW': 0.62, '8/3C SOOW': 0.72, '8/4C SOOW': 0.78, '8/5C SOOW': 0.82,
                '6/2C SOOW': 0.72, '6/3C SOOW': 0.78, '6/4C SOOW': 0.85, '6/5C SOOW': 0.92,
                '4/2C SOOW': 0.88, '4/3C SOOW': 0.95, '4/4C SOOW': 1.02, '4/5C SOOW': 1.08,
                '2/2C SOOW': 1.05, '2/3C SOOW': 1.12, '2/4C SOOW': 1.18,
                '1/3C SOOW': 1.15, '1/4C SOOW': 1.18, '1/0C SOOW': 1.25,
                '2/0C SOOW': 1.32, '3/0C SOOW': 1.42, '4/0C SOOW': 1.52,
            }
        },
        '300V': {
            od_inches: {
                '18/2C SOOWJ': 0.30, '16/2C SOOWJ': 0.32, '14/2C SOOWJ': 0.38, '12/2C SOOWJ': 0.43,
            }
        },
        layers: [
            { type: 'conductor', material: 'copper' },
            { type: 'insulation', material: 'rubber', thickness_mm: 1.2 },
            { type: 'jacket', material: 'soow', thickness_mm: 2.4 }
        ]
    },

    // BARE Copper/Aluminum conductors
    'BARE': {
        od_inches: {
            '#6CU 19STR': 0.22, '#4CU 19STR': 0.26, '#3CU 19STR': 0.29, '#2CU 19STR': 0.32,
            '#1CU 19STR': 0.36, '1/0CU 19STR': 0.42, '2/0CU 19STR': 0.48, '3/0CU 19STR': 0.54, '4/0CU 19STR': 0.60,

            // AAC (All Aluminum Conductor) with 17/19 strand variants
            'Waxwing 17STR AAC': 0.609, 'Merlin 17STR AAC': 0.683, 'Chickadee 17STR AAC': 0.743,
            'Partridge 19STR AAC': 0.642, 'Ostrich 19STR AAC': 0.680, 'Linnet 19STR AAC': 0.720,

            // ACSR (Aluminum Conductor Steel Reinforced)
            'Waxwing ACSR': 0.609, 'Merlin ACSR': 0.683, 'Chickadee ACSR': 0.743,
            'Partridge ACSR': 0.642, 'Ostrich ACSR': 0.680, 'Linnet ACSR': 0.720, 'Teal ACSR': 0.994,
        },
        layers: [
            { type: 'conductor', material: 'conductor' }
        ]
    }
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Get available cable types for dropdown - DYNAMIC VERSION (future-proof)
 * @returns {string[]} Array of cable type keys
 */
export function getIndustryStandardCableTypes() {
    // Dynamically extract all available cable types from the existing data structures
    const typesFromWeights = Object.keys(CABLE_UNIT_WEIGHTS);
    const typesFromConstruction = Object.keys(CABLE_CONSTRUCTION_DATA);

    // Combine and remove duplicates
    const allTypes = [...new Set([...typesFromWeights, ...typesFromConstruction])];

    // Sort alphabetically for consistent ordering
    return allTypes.sort();
}

/**
 * Get available cable types for dropdown - LEGACY FUNCTION (kept for compatibility)
 * @returns {string[]} Array of cable type keys
 */
export function getAvailableCableTypes() {
    return getIndustryStandardCableTypes();
}

/**
 * Get available designations for a specific cable type
 * @param {string} cableType - The cable type (e.g., 'TK90', 'SOOW')
 * @returns {string[]} Array of designation strings
 */
export function getAvailableCableDesignations(cableType) {
    if (!cableType || !CABLE_UNIT_WEIGHTS[cableType]) {
        return [];
    }
    return Object.keys(CABLE_UNIT_WEIGHTS[cableType]).sort();
}

/**
 * Get overall diameter in inches for a specific cable type/designation
 * @param {string} cableType - The cable type
 * @param {string} designation - The designation (e.g., '4/3CU 600V', '1/0 AL')
 * @returns {number} Diameter in inches, or 0 if not found
 */
export function getCableOverallDiameter(cableType, designation) {
    if (!cableType || !designation || !CABLE_CONSTRUCTION_DATA[cableType]) {
        return 0;
    }

    const cableData = CABLE_CONSTRUCTION_DATA[cableType];

    // Handle nested voltage structure (TK90, ACWU90, RW90, SOOW)
    if (cableData['600V'] || cableData['1KV'] || cableData['300V']) {
        // Determine voltage from designation
        let voltage = '600V'; // default
        if (designation.includes('600V')) voltage = '600V';
        if (designation.includes('1KV') || designation.includes('1kV')) voltage = '1KV';
        if (designation.includes('300V')) voltage = '300V';

        if (cableData[voltage] && cableData[voltage].od_inches) {
            return cableData[voltage].od_inches[designation] || 0;
        }
    }

    // Handle flat od_inches structure (BARE)
    if (cableData.od_inches && cableData.od_inches[designation]) {
        return cableData.od_inches[designation];
    }

    return 0;
}

/**
 * Get industry standard reel options formatted for select dropdown
 * @returns {Object[]} Array of reel options with name, value, and description
 */
export function getIndustryStandardReelOptions() {
    const options = [];

    // Add standard cylindrical reels
    STANDARD_REELS.forEach(reel => {
        const flangeIn = Math.round(reel.flange / 0.0254);
        const coreIn = Math.round(reel.core / 0.0254);
        options.push({
            name: reel.name,
            value: reel.key,
            description: `${flangeIn}"x${coreIn}" (${reel.category})`,
            data: reel
        });
    });

    // Add NEMA W-C26-2008 compliant reels
    if (STANDARD_REEL_SIZES['nema_wc26_2008']) {
        const nemaReels = STANDARD_REEL_SIZES['nema_wc26_2008'];
        Object.entries(nemaReels).forEach(([size, specs]) => {
            // Skip if this isn't a proper reel spec object (includes traverse_in property)
            if (typeof specs === 'object' && specs.traverse_in) {
                options.push({
                    name: `NEMA ${size.charAt(0).toUpperCase() + size.slice(1)}`,
                    value: `nema_${size}`,
                    description: `${specs.flange_in}"x${specs.traverse_in}" (${specs.max_weight_lbs}lbs)`,
                    data: {
                        name: `NEMA ${size.charAt(0).toUpperCase() + size.slice(1)}`,
                        key: `nema_${size}`,
                        category: "nema_wc26_2008",
                        flange: specs.flange_in * 0.0254, // convert to meters
                        core: specs.hub_in * 0.0254,        // convert to meters
                        width: specs.traverse_in * 0.0254,  // convert to meters
                        max_weight_lbs: specs.max_weight_lbs
                    }
                });
            }
        });
    }

    // Add Heavy Duty reel range (approximate dimensions)
    if (STANDARD_REEL_SIZES['heavy_duty']) {
        const heavyDuty = STANDARD_REEL_SIZES['heavy_duty'];
        options.push({
            name: "Heavy Duty Reel",
            value: "heavy_duty_reel",
            description: `${heavyDuty.flange_min}"–${heavyDuty.flange_max}" (${heavyDuty.max_weight_lbs}lbs max)`,
            data: {
                name: "Heavy Duty Reel",
                key: "heavy_duty_reel",
                category: "heavy_duty",
                // Use average dimensions for calculations
                flange: ((heavyDuty.flange_min + heavyDuty.flange_max) / 2) * 0.0254,
                core: 12 * 0.0254, // typical hub size
                width: 48 * 0.0254, // typical traverse width
                max_weight_lbs: heavyDuty.max_weight_lbs,
                note: heavyDuty.note
            }
        });
    }

    return options;
}

/**
 * Get a specific reel by key (comprehensive for all reel types)
 * @param {string} reelKey - The reel's unique key
 * @returns {Object|null} Reel data or null if not found
 */
export function getReelByKey(reelKey) {
    if (!reelKey) return null;

    // First check standard cylindrical reels
    const standardReel = STANDARD_REELS.find(reel => reel.key === reelKey);
    if (standardReel) return standardReel;

    // Check NEMA reels
    if (STANDARD_REEL_SIZES['nema_wc26_2008']) {
        const nemaReels = STANDARD_REEL_SIZES['nema_wc26_2008'];

        // Map size name to NEMA key format (e.g., "small" -> "nema_small")
        for (const [size, specs] of Object.entries(nemaReels)) {
            const expectedKey = `nema_${size}`;
            if (reelKey === expectedKey && typeof specs === 'object' && specs.traverse_in) {
                return {
                    name: `NEMA ${size.charAt(0).toUpperCase() + size.slice(1)}`,
                    key: reelKey,
                    category: "nema_wc26_2008",
                    flange: specs.flange_in * 0.0254, // convert to meters
                    core: specs.hub_in * 0.0254,        // convert to meters
                    width: specs.traverse_in * 0.0254,  // convert to meters
                    max_weight_lbs: specs.max_weight_lbs
                };
            }
        }
    }

    // Check heavy duty reel
    if (reelKey === 'heavy_duty_reel' && STANDARD_REEL_SIZES['heavy_duty']) {
        const heavyDuty = STANDARD_REEL_SIZES['heavy_duty'];
        return {
            name: "Heavy Duty Reel",
            key: "heavy_duty_reel",
            category: "heavy_duty",
            // Use average dimensions for calculations
            flange: ((heavyDuty.flange_min + heavyDuty.flange_max) / 2) * 0.0254,
            core: 12 * 0.0254, // typical hub size
            width: 48 * 0.0254, // typical traverse width
            max_weight_lbs: heavyDuty.max_weight_lbs,
            note: heavyDuty.note
        };
    }

    return null;
}

/**
 * Query detailed cable specifications from supplier catalogs
 * @param {string} supplier - The supplier name (e.g., 'nexans', 'southwire')
 * @param {string} cableType - The cable type within supplier catalog
 * @param {string} designation - Specific cable designation
 * @returns {Object|null} Cable specification data or null if not found
 */
export function getDetailedCableSpec(supplier, cableType, designation) {
    if (!supplier || !cableType || !designation) {
        return null;
    }

    const supplierData = SUPPLIER_CABLE_SPECIFICATIONS[supplier.toLowerCase()];
    if (!supplierData) {
        return null;
    }

    const cableTypeData = supplierData[cableType.toLowerCase()];
    if (!cableTypeData) {
        return null;
    }

    return cableTypeData[designation.toLowerCase()] || null;
}

/**
 * Get all available suppliers from the detailed catalog
 * @returns {string[]} Array of supplier names
 */
export function getAvailableSuppliers() {
    return Object.keys(SUPPLIER_CABLE_SPECIFICATIONS).sort();
}

/**
 * Get cable types for a specific supplier
 * @param {string} supplier - The supplier name
 * @returns {string[]} Array of cable type names for that supplier
 */
export function getSupplierCableTypes(supplier) {
    if (!supplier) return [];
    const supplierData = SUPPLIER_CABLE_SPECIFICATIONS[supplier.toLowerCase()];
    return supplierData ? Object.keys(supplierData).sort() : [];
}

/**
 * Get cable diameter in MM from detailed supplier catalog
 * @param {string} supplier - Supplier name
 * @param {string} cableType - Cable type
 * @param {string} designation - Cable designation
 * @returns {number|null} Diameter in mm, or null if not found
 */
export function getDetailedCableDiameter(supplier, cableType, designation) {
    const spec = getDetailedCableSpec(supplier, cableType, designation);
    return spec && spec.cable_od_mm ? spec.cable_od_mm : null;
}

/**
 * Get conductor diameter in MM from detailed supplier catalog
 * @param {string} supplier - Supplier name
 * @param {string} cableType - Cable type
 * @param {string} designation - Cable designation
 * @returns {number|null} Conductor diameter in mm, or null if not found
 */
export function getDetailedConductorDiameter(supplier, cableType, designation) {
    const spec = getDetailedCableSpec(supplier, cableType, designation);
    return spec && spec.conductor_mm ? spec.conductor_mm : null;
}

/**
 * Get standard reel sizes by category
 * @param {string} category - Category like 'nema_wc26_2008' or 'heavy_duty'
 * @returns {Object} Reel size specifications for the category
 */
export function getReelSizeStandards(category) {
    return STANDARD_REEL_SIZES[category] || null;
}

/**
 * Parse cable designation into meaningful parts
 * @param {string} designation - The cable designation (e.g., '4/3CU 600V', 'Waxwing 17STR AAC')
 * @param {string} cableType - The cable type for context
 * @returns {Object} Parsed designation data
 */
export function parseCableDesignation(designation, cableType) {
    if (!designation) {
        return {
            gauge: '',
            material: 'copper',
            conductors: 1,
            voltage: '600V',
            stranding: '',
            fullDesignation: designation,
            overallDiameter: 0
        };
    }

    // Clean up designation text
    const designationText = designation.trim().toUpperCase();

    // Extract voltage rating
    let voltage = '600V'; // default
    if (designationText.includes('1KV') || designationText.includes('1K') || designationText.includes('1000V')) {
        voltage = '1KV';
    } else if (designationText.includes('300V')) {
        voltage = '300V';
    } else if (designationText.includes('600V') || designationText.includes('600')) {
        voltage = '600V';
    }

    // Determine material
    let material = 'copper'; // default
    if (designationText.includes('CU') || designationText.includes('COPPER')) {
        material = 'copper';
    } else if (designationText.includes('AL') || designationText.includes('ALUMINUM')) {
        material = 'aluminum';
    } else if (designationText.includes('AAC') || designationText.includes('ALL ALUMINUM')) {
        material = 'aluminum';
    }

    // Extract stranding information
    let stranding = '';
    if (designationText.includes('17STR')) {
        stranding = '17STR';
    } else if (designationText.includes('19STR')) {
        stranding = '19STR';
    } else if (designationText.includes('37STR')) {
        stranding = '37STR';
    }

    // Parse gauge and conductors for standard formats
    let gauge = '';
    let conductors = 1;

    // Handle conductor counts in SOOW/SOOWJ (e.g., '18/2C SOOW')
    if (cableType === 'SOOW' && designationText.includes('/')) {
        const parts = designationText.split('/');
        if (parts.length >= 2) {
            gauge = parts[0];
            conductors = parseInt(parts[1].replace(/C|SOOW|SOOWJ/g, '')) || 1;
        }
    }
    // Handle standard format like 4/3CU
    else if (designationText.match(/\d+\/\d+[A-Z]+/)) {
        const parts = designationText.split('/');
        if (parts.length >= 2) {
            gauge = parts[0];
            const conductorPart = parts[parts.length - 1];

            // Extract string before material code (e.g., '3' from '3CU')
            if (conductorPart.match(/\d+/)) {
                conductors = parseInt(conductorPart.match(/\d+/)[0]) || 1;
            }

            // Handle cases like '1/0-3CU'
            if (conductorPart.includes('-')) {
                conductors = parseInt(conductorPart.split('-')[1].replace(/[^\d]/g, '')) || 1;
            }
        }
    }
    // Handle AAC/ACSR designations (e.g., 'Waxwing 17STR AAC')
    else if (designationText.includes('AAC') || designationText.includes('ACSR')) {
        // For named aluminum conductors, gauge is typically not standard AWG
        gauge = 'custom';
    }

    return {
        gauge: gauge,
        material: material,
        conductors: conductors,
        voltage: voltage,
        stranding: stranding,
        cableType: cableType,
        fullDesignation: designation,
        overallDiameter: getCableOverallDiameter(cableType, designation)
    };
}

/**
 * Get cable types with their variants for organized dropdown display
 * @returns {Object} Organized cable types with variants
 */
export function getOrganizedCableTypes() {
    const organized = {};

    // TK90 with voltage variants
    organized['TK90'] = {
        name: 'TK90 - Copper Armored Cable',
        variants: {
            '600V': [
                '14/2CU 600V', '14/3CU 600V', '14/4CU 600V', '12/2CU 600V', '12/3CU 600V',
                '12/4CU 600V', '10/2CU 600V', '10/3CU 600V', '10/4CU 600V', '8/2CU 600V',
                '8/3CU 600V', '6/3CU 600V', '4/3CU 600V', '3/3CU 600V', '2/3CU 600V', '1/3CU 600V'
            ],
            '1KV': [
                '350CU 1KV', '500CU 1KV', '750CU 1KV', '12/2CU 1KV', '10/2CU 1KV', '8/2CU 1KV',
                '12/3CU 1KV', '10/3CU 1KV', '8/3CU 1KV', '6/3CU 1KV', '4/3CU 1KV', '3/3CU 1KV',
                '2/3CU 1KV', '1/3CU 1KV', '1/0-3CU 1KV', '2/0-3CU 1KV', '3/0-3CU 1KV'
            ]
        }
    };

    // ACWU90 aluminum variants
    organized['ACWU90'] = {
        name: 'ACWU90 - Aluminum Armored Cable',
        variants: {
            '600V': [
                '1 AL 600V', '1/0 AL 600V', '250 AL 600V'
            ]
        }
    };

    // RW90 aluminum variants
    organized['RW90'] = {
        name: 'RW90 - Aluminum Conductor',
        variants: {
            '600V': [
                '1000 AL', '750 AL', '600 AL', '500 AL', '400 AL', '350 AL', '300 AL', '250 AL',
                '4/0 AL', '3/0 AL', '2/0 AL', '1/0 AL', '1 AL', '2 AL', '4 AL', '6 AL'
            ]
        }
    };

    // SOOW flexible cords
    organized['SOOW'] = {
        name: 'SOOW - Flexible Portable Cords',
        variants: {
            '600V': [
                '18/2C SOOW', '18/3C SOOW', '18/4C SOOW', '16/2C SOOW', '16/3C SOOW', '16/4C SOOW',
                '16/5C SOOW', '14/2C SOOW', '14/3C SOOW', '14/4C SOOW', '14/5C SOOW', '12/2C SOOW',
                '12/3C SOOW', '12/4C SOOW', '10/2C SOOW', '10/3C SOOW', '10/4C SOOW', '8/2C SOOW',
                '8/3C SOOW', '8/4C SOOW', '6/2C SOOW', '6/3C SOOW', '6/4C SOOW', '4/2C SOOW',
                '4/3C SOOW', '4/4C SOOW', '2/2C SOOW', '2/3C SOOW', '2/4C SOOW'
            ],
            '300V': [
                '18/2C SOOWJ', '16/2C SOOWJ', '14/2C SOOWJ', '12/2C SOOWJ'
            ]
        }
    };

    // BARE conductors with stranding variants
    organized['BARE'] = {
        name: 'BARE Conductors',
        variants: {
            '19STR': ['#6CU 19STR', '#4CU 19STR', '#3CU 19STR', '#2CU 19STR', '#1CU 19STR', '1/0CU 19STR', '2/0CU 19STR', '3/0CU 19STR', '4/0CU 19STR'],
            '17STR': ['Waxwing 17STR AAC', 'Merlin 17STR AAC', 'Chickadee 17STR AAC'],
            '19STR-AAC': ['Partridge 19STR AAC', 'Ostrich 19STR AAC', 'Linnet 19STR AAC'],
            'ACSR': ['Waxwing ACSR', 'Merlin ACSR', 'Chickadee ACSR', 'Partridge ACSR', 'Ostrich ACSR', 'Linnet ACSR', 'Teal ACSR']
        }
    };

    return organized;
}

/**
 * Get all designations for a specific cable type and voltage variant
 * @param {string} cableType - The cable type (e.g., 'TK90')
 * @param {string} voltageVariant - The voltage variant (e.g., '600V', '1KV')
 * @returns {string[]} Array of designation strings for that variant
 */
export function getCableTypeVariants(cableType, voltageVariant = null) {
    const organized = getOrganizedCableTypes();

    if (!organized[cableType]) {
        return [];
    }

    // If voltageVariant specified, return only that variant
    if (voltageVariant) {
        return organized[cableType].variants[voltageVariant] || [];
    }

    // Return all variants for the cable type
    const allVariants = [];
    Object.values(organized[cableType].variants).forEach(variantList => {
        allVariants.push(...variantList);
    });

    return allVariants;
}
