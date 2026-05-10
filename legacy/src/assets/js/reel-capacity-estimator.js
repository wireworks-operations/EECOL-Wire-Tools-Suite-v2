// ====================================================================
// DATABASE INITIALIZATION - Standardized with other tools
// ====================================================================

// Import standards and EECOL/Wesco product data and functions
import {
    getIndustryStandardReelOptions,
    getReelByKey,
    getIndustryStandardCableTypes,
    getAvailableCableDesignations as getIndustryStandardCableDesignations,
    CABLE_CONSTRUCTION_DATA
} from '../../core/modules/industry-standards.js';

// Import EECOL/Wesco specific product data
import {
    getAllEecolWescoProducts,
    getEecolWescoProductsByType,
    getEecolWescoProductDetails,
    getOrganizedEecolWescoProducts
} from '../../core/modules/wesco-eecol-products.js';

        // ====================================================================
        // CONSTANTS & UTILITY FUNCTIONS
        // ====================================================================

        const METERS_TO_FEET = 3.280839895; // Precise conversion factor
        const FEET_TO_METERS = 0.3048; // Precise conversion factor
        const INCHES_TO_METERS = 0.0254;
        const MM_TO_METERS = 0.001;
        const CM_TO_METERS = 0.01;
        const PI = Math.PI;

        const VOLUMETRIC_EFFICIENCY = 0.90; // Default efficiency
        const TURN_SPACING_FACTOR = 1.1; // Axial spacing = 1.1 * wire diameter for safe winding
        const REEL_FACTOR_CONSTANT = 0.262; // C_const for Imperial units

        // Specific Gravity Constants from AIO version
        const SPECIFIC_GRAVITY = {
            copper: 8.89,
            aluminum: 2.70,
            pvc: 1.40,
            xlpe: 0.92
        };
        const STRANDING_FACTOR = 1.03; // K for stranded conductors

        function metersToFeet(m) { return m * METERS_TO_FEET; }
        function feetToMeters(ft) { return ft / METERS_TO_FEET; }

        /**
         * Converts a value from any supported unit (in, cm, mm, ft, m) to a base unit (Meters).
         */
        function toMeters(value, unit) {
            switch (unit) {
                case 'in': return value * INCHES_TO_METERS;
                case 'cm': return value * CM_TO_METERS;
                case 'mm': return value * MM_TO_METERS;
                case 'ft': return feetToMeters(value);
                case 'm':
                default: return value;
            }
        }

        /**
         * Converts degrees to radians.
         */
        function degreesToRadians(degrees) {
            return degrees * (PI / 180);
        }

        // ====================================================================
        // TARGET LENGTH FUNCTION (Extracted from reel-size-estimator.html)
        // ====================================================================

        function calculateRequiredFlange(target_m, Dc_m, W_m, F_m, d_m) {
            // Start from minimum possible Df
            let Df_m = Dc_m + 2 * d_m + 2 * F_m; // initial guess: core + wire + freeboard

            while (true) {
                const capacity = calculateReelCapacity(Df_m, Dc_m, W_m, F_m, d_m);
                if (capacity.error) return capacity;
                if (capacity.recommendedCapacity_m >= target_m) {
                    return {
                        requiredDf_m: Df_m,
                        calculatedCapacity: capacity
                    };
                }
                Df_m += 0.01; // increment by 0.01m ≈ 0.4 inches
                if (Df_m > 10) return { error: 'Required flange diameter exceeds practical limits (> 10m). Check inputs.' }; // safety limit
            }
        }

        // ====================================================================
        // REEL ESTIMATOR LOGIC
        // ====================================================================

        const calculateCapacityBtn = document.getElementById('calculateCapacityBtn');
        const reelEstimatorResultContainer = document.getElementById('reelEstimatorResultContainer');
        const capacityWorking = document.getElementById('capacityWorking');
        const capacityTotal = document.getElementById('capacityTotal');
        const capacityAbsolute = document.getElementById('capacityAbsolute');
        const DdRatio = document.getElementById('DdRatio');
        const targetAchievement = document.getElementById('targetAchievement');
        const capacityWarning = document.getElementById('capacityWarning');
        const layerList = document.getElementById('layerList');

        const safetyStandardSelect = document.getElementById('safetyStandard');
        const freeboardInput = document.getElementById('freeboard');
        const freeboardUnitSelect = document.getElementById('freeboardUnit');
        const wireDiameterInput = document.getElementById('wireDiameter');
        const wireDiameterUnitSelect = document.getElementById('wireDiameterUnit');
        const freeboardStatusSpan = document.getElementById('freeboardStatus');

        // Error handling
        const errorBox = document.getElementById('errorBox');
        const errorMessageDisplay = document.getElementById('errorMessage');

        function clearReelResults() {
             if (capacityTotal) capacityTotal.textContent = '--';
             if (capacityWorking) capacityWorking.textContent = '--';
             if (capacityAbsolute) capacityAbsolute.textContent = '--';
             if (DdRatio) DdRatio.textContent = '--';
             if (targetAchievement) targetAchievement.textContent = '--';
             if (layerList) {
                 layerList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
                 const p = document.createElement('p');
                 p.className = 'text-sm text-gray-500';
                 p.textContent = 'Enter data and calculate to see layer breakdown.';
                 layerList.appendChild(p);
             }
             if (capacityWarning) capacityWarning.textContent = '';
             // Clear dynamic elements
             const capacityPercentage = document.getElementById('capacityPercentage');
             if (capacityPercentage) capacityPercentage.textContent = '--%';
             const capacityProgressBar = document.getElementById('capacityProgressBar');
             if (capacityProgressBar) {
                 capacityProgressBar.style.width = '0%';
                 capacityProgressBar.className = 'progress-bar h-3 rounded-full';
             }
             const safetyWarnings = document.getElementById('safetyWarnings');
             if (safetyWarnings) safetyWarnings.classList.add('hidden');
             // Clear provided specs
             const providedCoreDiameter = document.getElementById('providedCoreDiameter');
             if (providedCoreDiameter) providedCoreDiameter.textContent = '--';
             const providedFlangeDiameter = document.getElementById('providedFlangeDiameter');
             if (providedFlangeDiameter) providedFlangeDiameter.textContent = '--';
             const providedTraverseWidth = document.getElementById('providedTraverseWidth');
             if (providedTraverseWidth) providedTraverseWidth.textContent = '--';
             const providedTargetLength = document.getElementById('providedTargetLength');
             if (providedTargetLength) providedTargetLength.textContent = '--';
        }

        function updateFreeboardInput(triggerCalc = true) {
            const standard = safetyStandardSelect.value;
            const d = parseFloat(wireDiameterInput.value);
            const dUnit = wireDiameterUnitSelect.value;

            let disabled = false;
            let statusText = 'Custom';
            let F_in = parseFloat(freeboardInput.value);
            let F_unit = freeboardUnitSelect.value;

            const d_safe = isNaN(d) || d <= 0 ? 0 : d;
            const d_in = toMeters(d_safe, dUnit) / INCHES_TO_METERS;

            if (standard !== 'custom') {
                disabled = true;

                switch (standard) {
                    case 'full':
                        F_in = 0;
                        statusText = 'Full Drum (0 in)';
                        break;
                    case 'ansi_b307_05in':
                        F_in = 0.5;
                        statusText = 'ANSI B30.7 (0.5 in)';
                        break;
                    case 'ansi_a1022_2in':
                        F_in = 2.0;
                        statusText = 'ANSI A10.22 (2.0 in)';
                        break;
                    case 'uk_den_25x':
                        F_in = 2.5 * d_in;
                        statusText = `UK Den (2.5X D.) - ${F_in.toFixed(2)} in`;
                        break;
                    case '1x':
                        F_in = 1.0 * d_in;
                        statusText = `1X Wire D. - ${F_in.toFixed(2)} in`;
                        break;
                }

                F_unit = 'in';
            }

            freeboardInput.disabled = disabled;
            freeboardUnitSelect.disabled = disabled;
            freeboardStatusSpan.textContent = statusText;

            if (disabled) {
                freeboardInput.value = F_in.toFixed(3);
                freeboardUnitSelect.value = F_unit;
                freeboardInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                freeboardUnitSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                freeboardInput.value = F_in.toFixed(3);
                freeboardUnitSelect.value = F_unit;
                freeboardInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                freeboardUnitSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }

            if (triggerCalc && !reelEstimatorResultContainer.classList.contains('hidden')) {
                calculateReelCapacity(false);
            }
        }

// STANDALONE VERSION calculateReelCapacity FUNCTION WITH EXACT MATCHING
        function calculateReelCapacity(showErrors = false) {
            if (showErrors) {
                errorBox.classList.add('hidden');
                reelEstimatorResultContainer.classList.add('hidden');
            }

            updateFreeboardInput(false);

            const efficiency = parseFloat(document.getElementById('windingEfficiency').value);

            const Df = parseFloat(document.getElementById('flangeDiameter').value);
            const Dc = parseFloat(document.getElementById('coreDiameter').value);
            const W = parseFloat(document.getElementById('traverseWidth').value);

            const DfUnit = document.getElementById('flangeDiameterUnit').value;
            const DcUnit = document.getElementById('coreDiameterUnit').value;
            const WUnit = document.getElementById('traverseWidthUnit').value;

            const F = parseFloat(freeboardInput.value);
            const FUnit = freeboardUnitSelect.value;
            const d = parseFloat(wireDiameterInput.value);
            const dUnit = wireDiameterUnitSelect.value;

            if (isNaN(Df) || isNaN(Dc) || isNaN(W) || isNaN(F) || isNaN(d) || Df <= 0 || Dc <= 0 || W <= 0 || d <= 0 || F < 0) {
                if (showErrors) {
                    errorMessageDisplay.textContent = 'Please enter valid positive numbers for all required fields.';
                    errorBox.classList.remove('hidden');
                }
                clearReelResults();
                reelEstimatorResultContainer.classList.remove('hidden');
                return;
            }

            try {
                const Df_m = toMeters(Df, DfUnit);
                const Dc_m = toMeters(Dc, DcUnit);
                const W_m = toMeters(W, WUnit);
                const F_m = toMeters(F, FUnit);
                const d_m = toMeters(d, dUnit);

                const DEAD_WRAPS = 3;

                // Calculate absolute total capacity (no freeboard subtraction)
                const D_absolute_m = Df_m; // Full flange diameter
                const N_layers_absolute = Math.floor((D_absolute_m - Dc_m) / (2 * d_m));

                let C_absolute_total_m_by_layer = 0;
                const SEGMENTS_PER_LAYER_absolute = Math.floor(W_m / (TURN_SPACING_FACTOR * d_m));

                for (let n = 1; n <= N_layers_absolute; n++) {
                    const D_n_m = Dc_m + (2 * n - 1) * d_m;
                    const L_n_m_theoretical = SEGMENTS_PER_LAYER_absolute * PI * D_n_m;
                    const L_n_m = L_n_m_theoretical * efficiency;
                    C_absolute_total_m_by_layer += L_n_m;
                }

                // Calculate freeboard-based capacity (current working capacity with freeboard applied)
                const D_usable_m = Df_m - (2 * F_m);

                if (D_usable_m <= Dc_m + d_m) {
                    if (showErrors) {
                        errorMessageDisplay.textContent = 'Error: The Core Diameter plus the wire diameter and freeboard is greater than or equal to the Flange Diameter. No wire can be spooled.';
                        errorBox.classList.remove('hidden');
                    }
                    clearReelResults();
                    reelEstimatorResultContainer.classList.remove('hidden');
                    return;
                }

                const Dd_ratio_value = Dc_m / d_m;
                const N_layers = Math.floor((D_usable_m - Dc_m) / (2 * d_m));

                let C_total_m_by_layer = 0;
                let C_working_m = 0;
                let layersHtml = '';

                const SEGMENTS_PER_LAYER = Math.floor(W_m / (TURN_SPACING_FACTOR * d_m));

                // First, calculate dead wraps length for the summary
                let C_dead_m = 0;
                for (let n = 1; n <= Math.min(DEAD_WRAPS, N_layers); n++) {
                    const D_n_m = Dc_m + (2 * n - 1) * d_m;
                    const L_n_m_theoretical = SEGMENTS_PER_LAYER * PI * D_n_m;
                    const L_n_m = L_n_m_theoretical * efficiency;
                    C_dead_m += L_n_m;
                }

                layerList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

                // Show all physical layers that actually fit in the freeboard-limited space
                for (let n = 1; n <= N_layers; n++) {
                    const D_n_m = Dc_m + (2 * n - 1) * d_m;
                    const L_n_m_theoretical = SEGMENTS_PER_LAYER * PI * D_n_m;
                    const L_n_m = L_n_m_theoretical * efficiency; // Use selected efficiency

                    // Always add to total capacity (all physical layers)
                    C_total_m_by_layer += L_n_m;

                    // Only add to working capacity if not a dead wrap
                    if (n > DEAD_WRAPS) {
                        C_working_m += L_n_m;
                    }

                    const L_n_ft = metersToFeet(L_n_m);

                    const layerP = document.createElement('p');
                    layerP.className = 'text-xs font-medium';

                    const mStr = L_n_m.toLocaleString('en-US', {maximumFractionDigits: 0});
                    const ftStr = L_n_ft.toLocaleString('en-US', {maximumFractionDigits: 0});

                    // Style based on whether layer is a dead wrap or usable
                    if (n <= DEAD_WRAPS) {
                        // Dead wrap layer - red styling
                        layerP.classList.add('text-red-600');
                        layerP.textContent = `📍 Layer ${n} [DEAD WRAP]: ${mStr} m (${ftStr} ft)`;
                    } else {
                        // Usable layer - green styling
                        layerP.classList.add('text-green-600');
                        layerP.textContent = `✅ Layer ${n}: ${mStr} m (${ftStr} ft)`;
                    }
                    layerList.appendChild(layerP);
                }

                if (N_layers === 0) {
                    const p = document.createElement('p');
                    p.className = 'text-sm text-gray-500';
                    p.textContent = 'Zero full layers fit on the drum.';
                    layerList.appendChild(p);
                }

                // Add summary container
                const breakdownElement = document.createElement('div');
                breakdownElement.id = 'capacityBreakdownSummary';
                breakdownElement.className = 'mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg';
                layerList.appendChild(breakdownElement);

                const C_total_final_m = C_total_m_by_layer; // Freeboard-based total (was absolute total before)
                const C_working_final_m = C_total_final_m - C_dead_m;
                const C_working_final_m_safe = Math.max(0, C_working_final_m);
                const C_absolute_final_m = C_absolute_total_m_by_layer; // Absolute total capacity

                const C_total_ft = metersToFeet(C_total_final_m);
                const C_working_ft = metersToFeet(C_working_final_m_safe);
                const C_absolute_ft = metersToFeet(C_absolute_final_m);

                if (capacityTotal) capacityTotal.textContent = `${C_absolute_final_m.toLocaleString('en-US', {maximumFractionDigits: 0})} m (${C_absolute_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)`;
                if (capacityWorking) capacityWorking.textContent = `${C_working_final_m_safe.toLocaleString('en-US', {maximumFractionDigits: 0})} m (${C_working_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)`;
                if (capacityAbsolute) capacityAbsolute.textContent = `${C_total_final_m.toLocaleString('en-US', {maximumFractionDigits: 0})} m (${C_total_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)`;
                if (DdRatio) DdRatio.textContent = `${Dd_ratio_value.toFixed(1)}:1`;

                // Fill in the capacity breakdown summary
                const usableLayersCount = Math.max(0, N_layers - DEAD_WRAPS);
                const deadWrapsLength = C_dead_m;
                const deadWrapsLengthFt = metersToFeet(deadWrapsLength);

                breakdownElement.innerHTML = `
                    <p class="text-xs font-bold text-blue-800 mb-1">🎯 Capacity Breakdown Summary</p>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-white p-2 rounded border">
                            <span class="font-semibold text-red-600">Dead Wraps (3 layers):</span><br>
                            <span class="font-bold">${deadWrapsLength.toLocaleString('en-US', {maximumFractionDigits: 0})} m</span><br>
                            <span class="text-gray-600">(${deadWrapsLengthFt.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)</span>
                        </div>
                        <div class="bg-white p-2 rounded border">
                            <span class="font-semibold text-green-600">Usable Capacity:</span><br>
                            <span class="font-bold">${C_working_final_m_safe.toLocaleString('en-US', {maximumFractionDigits: 0})} m</span><br>
                            <span class="text-gray-600">(${C_working_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)</span>
                        </div>
                    </div>
                    <p class="text-xs text-blue-700 mt-2 leading-relaxed">
                        <strong>Why dead wraps?</strong> The first 3 layers provide structural stability and proper tension for the working layers above. This engineering requirement ensures safe, reliable winding operations.
                    </p>
                `;

                capacityWarning.textContent = `Note: Estimates include a ${efficiency * 100}% Winding Efficiency Factor.`;

                // Update efficiency labels (with null checks)
                const efficiencyLabelTotal = document.getElementById('efficiencyLabelTotal');
                if (efficiencyLabelTotal) efficiencyLabelTotal.textContent = `${(efficiency * 100).toFixed(0)}%`;
                const efficiencyLabelWorking = document.getElementById('efficiencyLabelWorking');
                if (efficiencyLabelWorking) efficiencyLabelWorking.textContent = `${(efficiency * 100).toFixed(0)}%`;
                const efficiencyLabelAbsolute = document.getElementById('efficiencyLabelAbsolute');
                if (efficiencyLabelAbsolute) efficiencyLabelAbsolute.textContent = `${(efficiency * 100).toFixed(0)}%`;
                const efficiencyLabelLayer = document.getElementById('efficiencyLabelLayer');
                if (efficiencyLabelLayer) efficiencyLabelLayer.textContent = `${(efficiency * 100).toFixed(0)}%`;

                // Update dynamic elements
                updateDynamicElements(C_total_final_m, C_working_final_m_safe, C_working_final_m_safe, Dd_ratio_value, F_m, d_m);

                generateReelSVG(Df_m, Dc_m, W_m, d_m, F_m, N_layers);

                calculateVolumetricWeightEstimation();

                // Update freeboard tolerance analysis
                const targetValue = parseFloat(document.getElementById('targetLength').value);
                const targetUnit = document.getElementById('targetLengthUnit').value;
                const target_m = targetUnit === 'm' ? targetValue : feetToMeters(targetValue);

                updateFreeboardTolerance(C_absolute_final_m, C_total_final_m, target_m, F_m, safetyStandardSelect.value);

                const targetElement = document.getElementById('targetAchievement');

                if (isNaN(targetValue) || targetValue <= 0) {
                    targetElement.textContent = 'No target set';
                    targetElement.className = 'text-sm font-extrabold text-[#0058B3]';
                } else {
                    const met = C_total_final_m >= target_m;
                    targetElement.textContent = `${met ? 'TARGET MET' : 'TARGET NOT MET'} (${C_total_final_m.toFixed(0)} m vs ${target_m.toFixed(0)} m needed)`;
                    targetElement.className = `text-sm font-extrabold ${met ? 'text-green-600' : 'text-red-600'}`;
                }

                // Populate provided specs
                document.getElementById('providedCoreDiameter').textContent = `${parseFloat(document.getElementById('coreDiameter').value)} ${DcUnit}`;
                document.getElementById('providedFlangeDiameter').textContent = `${parseFloat(document.getElementById('flangeDiameter').value)} ${DfUnit}`;
                document.getElementById('providedTraverseWidth').textContent = `${parseFloat(document.getElementById('traverseWidth').value)} ${WUnit}`;
                if (isNaN(targetValue) || targetValue <= 0) {
                    document.getElementById('providedTargetLength').textContent = 'Not specified';
                } else {
                    document.getElementById('providedTargetLength').textContent = `${targetValue} ${targetUnit}`;
                }

                reelEstimatorResultContainer.classList.remove('hidden');

            } catch (error) {
                console.error("Reel Capacity calculation failed:", error);
                if (showErrors) {
                    errorMessageDisplay.textContent = 'An unexpected error occurred during the Reel Capacity calculation.';
                    errorBox.classList.remove('hidden');
                }
            }
        }

        // Make calculateReelCapacity available globally for inline onclick handlers
        window.calculateReelCapacity = calculateReelCapacity;

        function generateReelSVG(Df_m, Dc_m, W_m, d_m, F_m, numLayers) {
            const svgVisualization = document.getElementById('svgVisualization');
            if (!svgVisualization) return;
            svgVisualization.innerHTML = '';

            const svgWidth = svgVisualization.clientWidth || 300;
            const svgHeight = svgVisualization.clientHeight || 200;
            const padding = 20;

            const scale = Math.min((svgWidth - 2 * padding) / W_m, (svgHeight - 2 * padding) / Df_m);

            const scaledDf = Df_m * scale;
            const scaledDc = Dc_m * scale;
            const scaledW = W_m * scale;
            const scaledd = d_m * scale;
            const scaledF = F_m * scale;

            const startX = (svgWidth - scaledW) / 2;
            const startY = (svgHeight - scaledDf) / 2;

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", svgWidth);
            svg.setAttribute("height", svgHeight);
            svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

            // Define arrow marker
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.setAttribute("id", "arrowhead");
            marker.setAttribute("markerWidth", "10");
            marker.setAttribute("markerHeight", "7");
            marker.setAttribute("refX", "9");
            marker.setAttribute("refY", "3.5");
            marker.setAttribute("orient", "auto");
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("points", "10 0, 0 3.5, 10 7");
            polygon.setAttribute("fill", "#000");
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);

            const coreY = startY + (scaledDf - scaledDc) / 2;

            const coreRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            coreRect.setAttribute("x", startX);
            coreRect.setAttribute("y", coreY);
            coreRect.setAttribute("width", scaledW);
            coreRect.setAttribute("height", scaledDc);
            coreRect.setAttribute("fill", "#CCC");
            coreRect.setAttribute("stroke", "#666");
            coreRect.setAttribute("stroke-width", "1");
            svg.appendChild(coreRect);

            for (let i = 0; i < numLayers; i++) {
                const layerY = coreY - (i + 1) * scaledd;
                if (layerY < startY + scaledF) break;

                const layerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                layerRect.setAttribute("x", startX);
                layerRect.setAttribute("y", layerY);
                layerRect.setAttribute("width", scaledW);
                layerRect.setAttribute("height", scaledd);
                layerRect.setAttribute("fill", "#0058B3");
                layerRect.setAttribute("fill-opacity", "0.7");
                layerRect.setAttribute("stroke", "#004a99");
                layerRect.setAttribute("stroke-width", "0.5");
                svg.appendChild(layerRect);
            }

            const leftFlange = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            leftFlange.setAttribute("x", startX - 5);
            leftFlange.setAttribute("y", startY);
            leftFlange.setAttribute("width", "5");
            leftFlange.setAttribute("height", scaledDf);
            leftFlange.setAttribute("fill", "#333");
            svg.appendChild(leftFlange);

            const rightFlange = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rightFlange.setAttribute("x", startX + scaledW);
            rightFlange.setAttribute("y", startY);
            rightFlange.setAttribute("width", "5");
            rightFlange.setAttribute("height", scaledDf);
            rightFlange.setAttribute("fill", "#333");
            svg.appendChild(rightFlange);

            const freeboardLineY = startY + scaledF;
            const freeboardLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            freeboardLine.setAttribute("x1", startX - 5);
            freeboardLine.setAttribute("y1", freeboardLineY);
            freeboardLine.setAttribute("x2", startX + scaledW + 5);
            freeboardLine.setAttribute("y2", freeboardLineY);
            freeboardLine.setAttribute("stroke", "#D97706");
            freeboardLine.setAttribute("stroke-width", "1");
            freeboardLine.setAttribute("stroke-dasharray", "3,3");
            svg.appendChild(freeboardLine);

            const freeboardText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            freeboardText.setAttribute("x", startX + scaledW + 10);
            freeboardText.setAttribute("y", freeboardLineY + 5);
            freeboardText.setAttribute("font-size", "10");
            freeboardText.setAttribute("fill", "#D97706");
            freeboardText.textContent = "Freeboard";
            svg.appendChild(freeboardText);

            svgVisualization.appendChild(svg);
        }

        function calculateVolumetricWeightEstimation() {
            const advancedDetails = document.getElementById('advancedWeightSection');
            if (!advancedDetails || !advancedDetails.open) {
                const weightSection = document.getElementById('weightEstimationSection');
                if (weightSection) weightSection.style.display = 'none';
                return;
            }

            // Check inputs
            const conductorMaterial = document.getElementById('conductorMaterial').value;
            const insulationMaterial = document.getElementById('insulationMaterial').value;
            const dc = parseFloat(document.getElementById('conductorDiameter').value);
            const dcUnit = document.getElementById('conductorDiameterUnit').value;
            const d = parseFloat(wireDiameterInput.value);
            const dUnit = wireDiameterUnitSelect.value;

            if (!conductorMaterial || !insulationMaterial || isNaN(dc) || dc <= 0 || isNaN(d) || d <= 0) {
                const weightSection = document.getElementById('weightEstimationSection');
                if (weightSection) weightSection.style.display = 'none';
                const currentEfficiency = parseFloat(document.getElementById('windingEfficiency').value);
            capacityWarning.textContent = `Note: Estimates include a ${currentEfficiency * 100}% winding efficiency factor.`;
                return;
            }

            const G_conductor = SPECIFIC_GRAVITY[conductorMaterial];
            const G_insulation = SPECIFIC_GRAVITY[insulationMaterial];
            const dc_m = toMeters(dc, dcUnit);
            const d_m = toMeters(d, dUnit);
            const dc_in = dc_m / INCHES_TO_METERS;
            const d_in = d_m / INCHES_TO_METERS;

            const W_conductor = 340.5 * (dc_in ** 2) * G_conductor * STRANDING_FACTOR;
            const W_insulation = 340.5 * (d_in ** 2 - dc_in ** 2) * G_insulation;
            const W_total = W_conductor + W_insulation;

            const conductorWeight = document.getElementById('conductorWeight');
            if (conductorWeight) conductorWeight.textContent = `${W_conductor.toFixed(2)} lbs/1000 ft`;
            const insulationWeight = document.getElementById('insulationWeight');
            if (insulationWeight) insulationWeight.textContent = `${W_insulation.toFixed(2)} lbs/1000 ft`;
            const totalCableWeight = document.getElementById('totalCableWeight');
            if (totalCableWeight) totalCableWeight.textContent = `${W_total.toFixed(2)} lbs/1000 ft`;

            const weightSection = document.getElementById('weightEstimationSection');
            if (weightSection) weightSection.style.display = 'block';
        }

// ===== MODULAR FEATURES PRESERVED =====

// ====================================================================
// INDEXEDDB CONFIGURATION LOADING FUNCTIONS (same as other tools)
// ====================================================================

let reelConfigurations = []; // Store available reel configurations from IndexedDB
let isManualMode = false; // Track if user intentionally switched to manual mode

async function loadReelConfigurations() {
    try {
        if (typeof EECOLIndexedDB === 'undefined') {
            console.log('⚠️ EECOLIndexedDB not available, skipping reel configuration loading');
            return;
        }

        const db = EECOLIndexedDB.getInstance();
        await db.ready;

        // Get all reel capacity estimator configurations
        reelConfigurations = await db.getAll('reelcapacityEstimator') || [];

        // Sort by most recent timestamp
        reelConfigurations.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Loaded ${reelConfigurations.length} reel configurations`);

        // Populate the configuration selector
        populateReelConfigurationSelector();

    } catch (error) {
        console.error('❌ Failed to load reel configurations:', error);
        reelConfigurations = [];
    }
}

function populateReelConfigurationSelector() {
    const selector = document.getElementById('reelConfigurationSelector');
    const refreshBtn = document.getElementById('refreshConfigurationsBtn');

    if (!selector) {
        console.warn('⚠️ Reel configuration selector not found in DOM');
        return;
    }

    // Clear existing options except the default
    const defaultOption = selector.querySelector('option[value=""]');
    selector.innerHTML = '';
    if (defaultOption) {
        selector.appendChild(defaultOption);
    } else {
        const newDefault = document.createElement('option');
        newDefault.value = '';
        newDefault.textContent = '-- Select Saved Specification --';
        selector.appendChild(newDefault);
    }

    // Add configurations
    reelConfigurations.forEach((config, index) => {
        const option = document.createElement('option');
        option.value = index;

        // Format display text
        const date = new Date(config.timestamp).toLocaleDateString();
        const flange = config.flangeDiameter ? `${config.flangeDiameter.value} ${config.flangeDiameter.unit}` : 'N/A';
        const core = config.coreDiameter ? `${config.coreDiameter.value} ${config.coreDiameter.unit}` : 'N/A';
        const traverse = config.traverseWidth ? `${config.traverseWidth.value} ${config.traverseWidth.unit}` : 'N/A';

        option.textContent = `Config ${date} - Flange: ${flange}`;
        option.title = `Flange: ${flange} | Core: ${core} | Traverse: ${traverse}`;
        selector.appendChild(option);
    });

    console.log(`✅ Populated reel configuration selector with ${reelConfigurations.length} options`);
}

function handleReelConfigurationChange(event) {
    const selectedIndex = event.target.value;

    if (!selectedIndex && selectedIndex !== '0') {
        // No selection made
        return;
    }

    const config = reelConfigurations[parseInt(selectedIndex)];
    if (!config) {
        showAlert('Selected configuration not found.', 'Error');
        return;
    }

    // Clear/reset the industry standard reel selection to resolve conflicts
    // Loaded configurations should take full priority over any previously selected standard reel
    const industryStandardReelSelect = document.getElementById('industryStandardReelSelect');
    if (industryStandardReelSelect) {
        industryStandardReelSelect.value = ''; // Clear selection
    }

    // Fill in only the basic reel dimensions (A, B, C)
    const updates = [];

    if (config.flangeDiameter) {
        document.getElementById('flangeDiameter').value = config.flangeDiameter.value;
        document.getElementById('flangeDiameterUnit').value = config.flangeDiameter.unit;
        updates.push(`Flange: ${config.flangeDiameter.value} ${config.flangeDiameter.unit}`);
    }

    if (config.coreDiameter) {
        document.getElementById('coreDiameter').value = config.coreDiameter.value;
        document.getElementById('coreDiameterUnit').value = config.coreDiameter.unit;
        updates.push(`Core: ${config.coreDiameter.value} ${config.coreDiameter.unit}`);
    }

    if (config.traverseWidth) {
        document.getElementById('traverseWidth').value = config.traverseWidth.value;
        document.getElementById('traverseWidthUnit').value = config.traverseWidth.unit;
        updates.push(`Traverse: ${config.traverseWidth.value} ${config.traverseWidth.unit}`);
    }

    // Clear any calculated results when loading different reel configuration
    clearReelResults();

    // Show success message
    if (updates.length > 0) {
        const configDate = new Date(config.timestamp).toLocaleDateString();
        showAlert(`Configuration loaded from ${configDate}:\n${updates.join('\n')}`, 'Configuration Auto-Filled');
    }
}

// Add event listeners for configuration selector
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for database initialization
    //await initializeDatabase();

    // Initialize reel configurations loading
    await loadReelConfigurations();

    // Initialize collapsible sections
    initializeCollapsibleSections();

    // Clear results and set up UI
    clearReelResults();

    // Hide results container initially - user must click Calculate first
    reelEstimatorResultContainer.classList.add('hidden');

    // Set up button event listeners after DOM is ready
    setupButtonEventListeners();
});

document.addEventListener('DOMContentLoaded', () => {
    // Add hover highlight functionality for SVG dimension lines
    const inputGroups = document.querySelectorAll('#leftColumn .input-group');
    inputGroups.forEach(group => {
        group.addEventListener('mouseenter', () => {
            // Remove active class from all highlights
            document.querySelectorAll('.svg-dimension-line').forEach(el => {
                el.classList.remove('active');
            });
            // Determine which highlight class to activate based on input-group index
            // Skip target length (index 0), then map A, B, C, D, E inputs to highlights
            const index = Array.from(inputGroups).indexOf(group);
            if (index >= 1) { // Skip target length at index 0
                const dimensionIndex = index - 1; // Adjust index after skipping target length
                const highlightClasses = ['highlight-A', 'highlight-B', 'highlight-C', 'highlight-D', 'highlight-E'];
                if (dimensionIndex >= 0 && dimensionIndex < highlightClasses.length) {
                    const highlightClass = highlightClasses[dimensionIndex];
                    const highlightElement = document.querySelector(`.svg-dimension-line.${highlightClass}`);
                    if (highlightElement) {
                        highlightElement.classList.add('active');
                    }
                }
            }
        });
        group.addEventListener('mouseleave', () => {
            // Remove active class on mouse leave
            document.querySelectorAll('.svg-dimension-line').forEach(el => {
                el.classList.remove('active');
            });
        });
    });
});

function updateDynamicElements(C_total_m, C_working_m, C_recommended_m, Dd_ratio_value, F_m, d_m) {
    // Update capacity progress bar
    const capacityElement = document.getElementById('capacityProgressBar');
    const percentageElement = document.getElementById('capacityPercentage');
    const safetyWarnings = document.getElementById('safetyWarnings');
    const safetyWarningText = document.getElementById('safetyWarningText');

    // Reset states
    capacityElement.classList.remove('safe', 'warning', 'danger');
    safetyWarnings.classList.add('hidden');

    // Calculate utilization percentage based on recommended capacity
    const maxCapacity = C_total_m; // Use total capacity as 100%
    const utilizationPct = maxCapacity > 0 ? Math.min((C_recommended_m / maxCapacity) * 100, 100) : 0;

    // Animate progress bar
    percentageElement.textContent = `${utilizationPct.toFixed(0)}%`;
    capacityElement.style.width = `${utilizationPct}%`;

    // Determine color based on utilization
    let colorClass = 'safe';
    if (utilizationPct > 90) {
        colorClass = 'danger';
    } else if (utilizationPct > 75) {
        colorClass = 'warning';
    }
    capacityElement.classList.add(colorClass);

    // Update towperknot indicators
    updateTowperknotIndicators(Dd_ratio_value, F_m, d_m);
}

function updateTowperknotIndicators(Dd_ratio, F_m, d_m) {
    const safetyWarnings = document.getElementById('safetyWarnings');
    const safetyWarningText = document.getElementById('safetyWarningText');

    // Hide warnings by default
    safetyWarnings.classList.add('hidden');

    // Check D/d ratio (should be 21:1 or higher for good spooling)
    const ddThreshold = 21;
    if (Dd_ratio < 12) {
        safetyWarnings.classList.remove('hidden');
        safetyWarningText.textContent = 'WARNING: Core-to-cable diameter ratio too low (<12:1). Poor winding performance expected.';
        return;
    } else if (Dd_ratio < 21) {
        safetyWarnings.classList.remove('hidden');
        safetyWarningText.textContent = 'Caution: Low core-to-cable diameter ratio (<21:1). Consider larger core or smaller cable.';
        return;
    }

    // Check freeboard safety
    const F_inches = F_m / INCHES_TO_METERS;
    if (F_inches < 0.25) {
        safetyWarnings.classList.remove('hidden');
        safetyWarningText.textContent = 'WARNING: Freeboard too small. Cable may contact flanges during winding.';
    }
}

function updateFreeboardTolerance(C_absolute_m, C_freeboard_m, target_m, F_m, safetyStandard) {
    const freeboardToleranceSection = document.getElementById('freeboardToleranceSection');
    const freeboardTolerance = document.getElementById('freeboardTolerance');
    const safetyMarginStatus = document.getElementById('safetyMarginStatus');
    const freeboardAnalysis = document.getElementById('freeboardAnalysis');

    if (!freeboardToleranceSection || !freeboardTolerance || !safetyMarginStatus || !freeboardAnalysis) return;

    if (isNaN(target_m) || target_m <= 0) {
        freeboardToleranceSection.classList.add('hidden');
        return;
    }

    freeboardToleranceSection.classList.remove('hidden');

    // Left side: Show the freeboard setting in inches
    const F_inches = F_m / INCHES_TO_METERS;
    freeboardTolerance.textContent = `${F_inches.toFixed(1)} in`;
    freeboardTolerance.className = `text-sm font-bold text-blue-600`;

    // Right side: Safety margin status based on target length
    let statusText = 'Safe';
    let statusColor = 'text-green-600';
    let analysisText = 'Freeboard setting provides adequate clearance for safe winding.';

    if (target_m > C_absolute_m) {
        // Target exceeds absolute maximum capacity
        statusText = 'Unsafe, too much wire for reel';
        statusColor = 'text-red-600';
        analysisText = 'Target length exceeds the maximum possible capacity of this reel, even without freeboard restrictions.';
    } else if (safetyStandard === 'full') {
        // Full drum selected (zero clearance)
        statusText = 'Full drum, zero clearance, not within safety standards';
        statusColor = 'text-red-600';
        analysisText = 'Full drum winding provides no clearance margin. Wire may contact flanges, violating safety standards.';
    } else if (F_inches <= 0) {
        // No freeboard calculated
        statusText = 'No freeboard';
        statusColor = 'text-orange-600';
        analysisText = 'No freeboard clearance calculated. Wire may contact flanges during winding.';
    }

    safetyMarginStatus.textContent = statusText;
    safetyMarginStatus.className = `text-sm font-bold ${statusColor}`;

    freeboardAnalysis.textContent = analysisText;
}

// ====================================================================
// INITIALIZATION & EVENT LISTENERS ADDED
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal close functionality (this might already be handled by showModal functions)
    // const modalBackdrop = document.getElementById('modalBackdrop');
    // if (modalBackdrop) modalBackdrop.addEventListener('click', hideModal);

    // Wire Diameter Preset Dropdown Event Listeners
    document.getElementById('wireDiameterPresetInch').addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue && selectedValue !== "") {
            const inchValue = parseFloat(selectedValue);
            const targetUnit = wireDiameterUnitSelect.value;
            let convertedValue;

            // Convert from inches to target unit
            if (targetUnit === 'in') {
                convertedValue = inchValue; // already in inches
            } else if (targetUnit === 'cm') {
                convertedValue = inchValue * 2.54; // inches to cm
            } else if (targetUnit === 'mm') {
                convertedValue = inchValue * 25.4; // inches to mm
            } else {
                convertedValue = inchValue; // fallback
            }

            wireDiameterInput.value = convertedValue.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
            updateFreeboardInput(true);
        }
    });

    document.getElementById('wireDiameterPresetMm').addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue && selectedValue !== "") {
            const mmValue = parseFloat(selectedValue);
            const targetUnit = wireDiameterUnitSelect.value;
            let convertedValue;

            // Convert from mm to target unit
            if (targetUnit === 'mm') {
                convertedValue = mmValue; // already in mm
            } else if (targetUnit === 'cm') {
                convertedValue = mmValue / 10; // mm to cm
            } else if (targetUnit === 'in') {
                convertedValue = mmValue / 25.4; // mm to inches
            } else {
                convertedValue = mmValue; // fallback
            }

            wireDiameterInput.value = convertedValue.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
            updateFreeboardInput(true);
        }
    });

    // Add event listeners for the missing buttons
    setupButtonEventListeners();
});

// ====================================================================
// BUTTON EVENT LISTENERS SETUP
// ====================================================================

function setupButtonEventListeners() {
    // Print Results Button
    const printResultsBtn = document.getElementById('printResultsBtn');
    if (printResultsBtn) {
        printResultsBtn.addEventListener('click', handlePrintResults);
    }

    // Save Reel Specifications Button
    const exportToCuttingRecordsBtn = document.getElementById('exportToCuttingRecordsBtn');
    if (exportToCuttingRecordsBtn) {
        exportToCuttingRecordsBtn.addEventListener('click', handleSaveReelSpecifications);
    }

    // Refresh Configurations Button
    const refreshConfigurationsBtn = document.getElementById('refreshConfigurationsBtn');
    if (refreshConfigurationsBtn) {
        refreshConfigurationsBtn.addEventListener('click', loadReelConfigurations);
    }

    // New collapsible section buttons
    const clearReelSpecificationsBtn = document.getElementById('clearReelSpecificationsBtn');
    if (clearReelSpecificationsBtn) {
        clearReelSpecificationsBtn.addEventListener('click', clearReelSpecifications);
    }

    // New preset-related buttons
    const clearCablePresetBtn = document.getElementById('clearCablePresetBtn');
    if (clearCablePresetBtn) {
        clearCablePresetBtn.addEventListener('click', clearCablePreset);
    }
}

// ====================================================================
// NEW COLLAPSIBLE SECTION HANDLERS
// ====================================================================

// Industry Standard Reels Handler
function handleIndustryStandardReelChange(event) {
    const reelKey = event.target.value;
    if (!reelKey) return;

    const reel = getReelByKey(reelKey);
    if (!reel) {
        console.warn('Reel not found:', reelKey);
        return;
    }

    // Convert meters to inches for display
    const coreIn = Math.round(reel.core / 0.0254);
    const flangeIn = Math.round(reel.flange / 0.0254);
    const traverseIn = Math.round(reel.width / 0.0254);

    // Auto-fill the form fields
    document.getElementById('coreDiameter').value = coreIn;
    document.getElementById('coreDiameterUnit').value = 'in';
    document.getElementById('flangeDiameter').value = flangeIn;
    document.getElementById('flangeDiameterUnit').value = 'in';
    document.getElementById('traverseWidth').value = traverseIn;
    document.getElementById('traverseWidthUnit').value = 'in';

    // Show success feedback
    showAlert(`Industry standard reel "${reel.name}" loaded successfully!\nCore: ${coreIn}"\nFlange: ${flangeIn}"\nTraverse: ${traverseIn}"`, 'Reel Specifications Auto-Filled');
}

// Local implementations of cable functions using EECOL/Wesco products
function getAvailableCableTypes() {
    // Aggregate both EECOL/Wesco and Industry Standards databases dynamically

    // Get EECOL/Wesco cables (prioritized)
    const eecolWescoProducts = getOrganizedEecolWescoProducts();
    const eecolCableTypes = Object.keys(eecolWescoProducts);

    // Get Industry Standards cables
    const industryStandardCableTypes = getIndustryStandardCableTypes();

    // Combine and remove duplicates, prioritizing EECOL first
    const allCableTypes = [...new Set([...industryStandardCableTypes, ...eecolCableTypes])];

    // Sort alphabetically for consistent ordering
    const sortedTypes = allCableTypes.sort();

    console.log('📊 Aggregated cable types:', sortedTypes); // For debugging

    return sortedTypes;
}

function getAvailableCableDesignations(cableType) {
    // Aggregate designations from both EECOL/Wesco and Industry Standards databases

    const allDesignations = new Set(); // Use Set to avoid duplicates

    // Get from EECOL/Wesco database
    const organizedProducts = getOrganizedEecolWescoProducts();
    if (organizedProducts[cableType]) {
        Object.keys(organizedProducts[cableType]).forEach(designation => {
            allDesignations.add(designation);
        });
    }

    // Get from Industry Standards database using imported function
    const standardDesignations = getIndustryStandardCableDesignations(cableType);
    standardDesignations.forEach(designation => {
        allDesignations.add(designation);
    });

    // Sort alphabetically and return as array
    return Array.from(allDesignations).sort();
}

// Enhanced function to get cable diameter from aggregated databases (EECOL + Industry Standards)
function getCableOverallDiameter(cableType, designation) {
    if (!cableType || !designation) {
        return 0;
    }

    // First try EECOL/Wesco database
    const eecolProductDetails = getEecolWescoProductDetails(designation);
    if (eecolProductDetails && eecolProductDetails.od_inches) {
        return eecolProductDetails.od_inches;
    }

    // Fallback to Industry Standards database using imported data
    const cableConstructionData = CABLE_CONSTRUCTION_DATA || {};

    if (!cableConstructionData[cableType]) {
        return 0;
    }

    const cableData = cableConstructionData[cableType];

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

// Legacy function for backward compatibility
function getCableDiameterFromEecolProducts(productName) {
    const productDetails = getEecolWescoProductDetails(productName);
    if (productDetails && productDetails.od_inches) {
        return productDetails.od_inches;
    }
    return 0;
}

// Clear all reel specifications
function clearReelSpecifications() {
    document.getElementById('coreDiameter').value = '';
    document.getElementById('flangeDiameter').value = '';
    document.getElementById('traverseWidth').value = '';
    document.getElementById('industryStandardReelSelect').value = '';
    document.getElementById('reelConfigurationSelector').value = '';
    clearReelResults();
    showAlert('All reel specifications cleared.', 'Specifications Cleared');
}

// Cable Type Change Handler
function handleCableTypeChange(event) {
    const cableType = event.target.value;
    const designationSelect = document.getElementById('cableDesignationSelect');

    if (!cableType) {
        designationSelect.disabled = true;
        designationSelect.innerHTML = '<option value="">-- Select cable type first --</option>';
        clearCablePreset();
        return;
    }

    // Populate designation dropdown
    const designations = getAvailableCableDesignations(cableType);
    designationSelect.innerHTML = '<option value="">-- Select specific designation --</option>';

    designations.forEach(designation => {
        const option = document.createElement('option');
        option.value = designation;
        option.textContent = designation;
        designationSelect.appendChild(option);
    });

    designationSelect.disabled = false;
}

// Cable Designation Change Handler
function handleCableDesignationChange(event) {
    const cableType = document.getElementById('cableTypeSelect').value;
    const designation = event.target.value;

    if (!designation || !cableType) {
        clearCablePreset();
        return;
    }

    // Get cable diameter and set it
    const diameter = getCableOverallDiameter(cableType, designation);
    if (diameter > 0) {
        // Convert to current unit setting
        const currentUnit = wireDiameterUnitSelect.value;
        let displayDiameter = diameter;

        if (currentUnit === 'cm') {
            displayDiameter = diameter * 2.54; // inches to cm
        } else if (currentUnit === 'mm') {
            displayDiameter = diameter * 25.4; // inches to mm
        } else if (currentUnit === 'm') {
            displayDiameter = diameter * 0.0254; // inches to meters
        } else if (currentUnit === 'ft') {
            displayDiameter = diameter * 0.0254; // inches to meters, will be displayed as feet equivalent
            displayDiameter *= 3.28084; // meters to feet
        }

        // Set the wire diameter
        wireDiameterInput.value = displayDiameter.toFixed(5).replace(/\.?0+$/, '');

    // Only disable inputs if user hasn't switched to manual mode
    if (!isManualMode) {
        wireDiameterInput.disabled = true;
        wireDiameterUnitSelect.disabled = true;
        document.getElementById('wireDiameterPresetInch').disabled = true;
        document.getElementById('wireDiameterPresetMm').disabled = true;

        // Show preset mode indicator with both buttons
        const indicator = document.getElementById('presetModeIndicator');
        indicator.classList.remove('hidden');
        indicator.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

        const titleSpan = document.createElement('span');
        titleSpan.className = 'font-semibold';
        titleSpan.textContent = '📏 Preset Mode Active: ';
        indicator.appendChild(titleSpan);

        indicator.appendChild(document.createTextNode(`Wire diameter locked to ${cableType} ${designation} (${(diameter * 25.4).toFixed(2)}mm / ${(diameter).toFixed(3)}")`));

        const btnGroup = document.createElement('div');
        btnGroup.className = 'flex gap-2 mt-2';

        const manualBtn = document.createElement('button');
        manualBtn.id = 'switchToManualBtn';
        manualBtn.className = 'px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors';
        manualBtn.textContent = '🔓 Switch to Manual Input';
        manualBtn.onclick = switchToManualMode;
        btnGroup.appendChild(manualBtn);

        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearAllCableBtn';
        clearBtn.className = 'px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors';
        clearBtn.textContent = '🗑️ Clear All';
        clearBtn.onclick = clearAllCableSelections;
        btnGroup.appendChild(clearBtn);

        indicator.appendChild(btnGroup);
    }

        // Update freeboard and trigger calculation
        updateFreeboardInput(true);
    }
}

// Clear cable preset and restore manual input
function clearCablePreset() {
    // Enable manual mode - user intentionally switched to manual
    isManualMode = true;

    // Re-enable manual inputs
    wireDiameterInput.disabled = false;
    wireDiameterUnitSelect.disabled = false;
    document.getElementById('wireDiameterPresetInch').disabled = false;
    document.getElementById('wireDiameterPresetMm').disabled = false;

    // Clear selections to prevent auto-disable on subsequent changes
    document.getElementById('cableTypeSelect').value = '';
    document.getElementById('cableDesignationSelect').innerHTML = '<option value="">-- Select cable type first --</option>';
    document.getElementById('cableDesignationSelect').disabled = true;

    // Hide preset mode indicator
    document.getElementById('presetModeIndicator').classList.add('hidden');
}

// Switch to manual mode (from preset mode button)
function switchToManualMode() {
    // Set manual mode flag
    isManualMode = true;

    // Re-enable all wire diameter inputs
    wireDiameterInput.disabled = false;
    wireDiameterUnitSelect.disabled = false;
    document.getElementById('wireDiameterPresetInch').disabled = false;
    document.getElementById('wireDiameterPresetMm').disabled = false;

    // Hide preset mode indicator
    document.getElementById('presetModeIndicator').classList.add('hidden');

    // Show feedback
    showAlert('Switched to manual input mode. You can now edit all wire diameter fields.', 'Manual Mode Enabled');
}

// Clear all cable selections and reset to manual mode
function clearAllCableSelections() {
    // Reset to manual mode
    isManualMode = true;

    // Re-enable all wire diameter inputs
    wireDiameterInput.disabled = false;
    wireDiameterUnitSelect.disabled = false;
    document.getElementById('wireDiameterPresetInch').disabled = false;
    document.getElementById('wireDiameterPresetMm').disabled = false;

    // Clear all cable selections
    document.getElementById('cableTypeSelect').value = '';
    document.getElementById('cableDesignationSelect').innerHTML = '<option value="">-- Select cable type first --</option>';
    document.getElementById('cableDesignationSelect').disabled = true;

    // Hide preset mode indicator
    document.getElementById('presetModeIndicator').classList.add('hidden');

    // Clear wire diameter fields to blank slate
    wireDiameterInput.value = '';

    // Show feedback
    showAlert('All cable selections cleared. You can now start fresh with manual input.', 'Selections Cleared');
}

// Initialize collapsible sections
function initializeCollapsibleSections() {
    // Populate industry standard reels dropdown
    const reelSelect = document.getElementById('industryStandardReelSelect');
    if (reelSelect) {
        const reelOptions = getIndustryStandardReelOptions();
        reelOptions.forEach(option => {
            const element = document.createElement('option');
            element.value = option.value;
            element.textContent = `${option.name} (${option.description})`;
            reelSelect.appendChild(element);
        });
        reelSelect.addEventListener('change', handleIndustryStandardReelChange);
    }

    // Populate cable types dropdown
    const cableTypeSelect = document.getElementById('cableTypeSelect');
    if (cableTypeSelect) {
        const cableTypes = getAvailableCableTypes();
        cableTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            cableTypeSelect.appendChild(option);
        });
        cableTypeSelect.addEventListener('change', handleCableTypeChange);
    }

    // Cable designation change handler
    const cableDesignationSelect = document.getElementById('cableDesignationSelect');
    if (cableDesignationSelect) {
        cableDesignationSelect.addEventListener('change', handleCableDesignationChange);
    }

    // Saved configurations change handler
    const reelConfigurationSelector = document.getElementById('reelConfigurationSelector');
    if (reelConfigurationSelector) {
        reelConfigurationSelector.addEventListener('change', handleReelConfigurationChange);
    }
}

// ====================================================================
// SAVE REEL SPECIFICATIONS FUNCTIONALITY
// ====================================================================

async function handleSaveReelSpecifications() {
    try {
        // Check if IndexedDB is available
        if (typeof EECOLIndexedDB === 'undefined') {
            showAlert('Database not available. Please ensure the application is fully loaded.', 'Database Error');
            return;
        }

        // Collect all the reel specification data
        const reelSpecs = collectReelSpecifications();

        if (!reelSpecs) {
            showAlert('Please calculate reel capacity first to save specifications.', 'No Data');
            return;
        }

        // Initialize database connection
        const db = EECOLIndexedDB.getInstance();
        await db.ready;

        // Save to IndexedDB
        const result = await db.saveReelCapacityEstimator(reelSpecs);

        if (result) {
            // Refresh the configuration selector to show the new saved spec
            await loadReelConfigurations();

            // Show success message
            const timestamp = new Date(reelSpecs.timestamp).toLocaleDateString();
            showAlert(`Reel specifications saved successfully!\nSaved: ${timestamp}\nFlange: ${reelSpecs.flangeDiameter.value} ${reelSpecs.flangeDiameter.unit}\nCore: ${reelSpecs.coreDiameter.value} ${reelSpecs.coreDiameter.unit}\nTraverse: ${reelSpecs.traverseWidth.value} ${reelSpecs.traverseWidth.unit}`, 'Specifications Saved');
        } else {
            throw new Error('Save operation returned no result');
        }

    } catch (error) {
        console.error('Failed to save reel specifications:', error);
        showAlert('Failed to save reel specifications. Please try again.', 'Save Error');
    }
}

function collectReelSpecifications() {
    // Get basic reel dimensions
    const flangeDiameter = parseFloat(document.getElementById('flangeDiameter').value);
    const flangeDiameterUnit = document.getElementById('flangeDiameterUnit').value;
    const coreDiameter = parseFloat(document.getElementById('coreDiameter').value);
    const coreDiameterUnit = document.getElementById('coreDiameterUnit').value;
    const traverseWidth = parseFloat(document.getElementById('traverseWidth').value);
    const traverseWidthUnit = document.getElementById('traverseWidthUnit').value;

    // Validate that we have the required dimensions
    if (isNaN(flangeDiameter) || isNaN(coreDiameter) || isNaN(traverseWidth) ||
        flangeDiameter <= 0 || coreDiameter <= 0 || traverseWidth <= 0) {
        return null;
    }

    // Get additional specifications
    const wireDiameter = parseFloat(document.getElementById('wireDiameter').value);
    const wireDiameterUnit = document.getElementById('wireDiameterUnit').value;
    const targetLength = parseFloat(document.getElementById('targetLength').value);
    const targetLengthUnit = document.getElementById('targetLengthUnit').value;
    const freeboard = parseFloat(document.getElementById('freeboard').value);
    const freeboardUnit = document.getElementById('freeboardUnit').value;
    const safetyStandard = document.getElementById('safetyStandard').value;
    const windingEfficiency = document.getElementById('windingEfficiency').value;

    // Get calculated results if available
    const capacityTotal = document.getElementById('capacityTotal').textContent;
    const capacityWorking = document.getElementById('capacityWorking').textContent;
    const capacityAbsolute = document.getElementById('capacityAbsolute').textContent;
    const ddRatio = document.getElementById('DdRatio').textContent;

    // Collect the specifications object
    const specs = {
        // Basic reel dimensions (the 3 main ones requested)
        flangeDiameter: {
            value: flangeDiameter,
            unit: flangeDiameterUnit
        },
        coreDiameter: {
            value: coreDiameter,
            unit: coreDiameterUnit
        },
        traverseWidth: {
            value: traverseWidth,
            unit: traverseWidthUnit
        },

        // Additional specifications
        wireDiameter: {
            value: wireDiameter,
            unit: wireDiameterUnit
        },
        targetLength: {
            value: targetLength,
            unit: targetLengthUnit
        },
        freeboard: {
            value: freeboard,
            unit: freeboardUnit
        },
        safetyStandard: safetyStandard,
        windingEfficiency: windingEfficiency,

        // Calculated results
        calculatedResults: {
            totalCapacity: capacityTotal,
            workingCapacity: capacityWorking,
            absoluteCapacity: capacityAbsolute,
            coreToCableRatio: ddRatio
        },

        // Metadata
        timestamp: Date.now(),
        tool: 'reelCapacityEstimator',
        version: '0.8.0.0'
    };

    return specs;
}

// ====================================================================
// PRINT RESULTS FUNCTIONALITY
// ====================================================================

function handlePrintResults() {
    try {
        // Check if there are calculation results to print
        const hasResults = document.getElementById('reelEstimatorResultContainer') &&
                          !document.getElementById('reelEstimatorResultContainer').classList.contains('hidden');

        if (!hasResults) {
            showAlert('Please calculate reel capacity first to print results.', 'No Results');
            return;
        }

        // Collect all the data to print
        const printData = collectPrintData();

        if (!printData) {
            showAlert('No data available to print. Please ensure calculations are complete.', 'Print Error');
            return;
        }

        // Use the existing print utility function
        printReelCapacityResults(printData);

    } catch (error) {
        console.error('Failed to print results:', error);
        showAlert('Failed to print results. Please try again.', 'Print Error');
    }
}

function collectPrintData() {
    // Get basic specifications
    const flangeDiameter = document.getElementById('flangeDiameter').value;
    const flangeDiameterUnit = document.getElementById('flangeDiameterUnit').value;
    const coreDiameter = document.getElementById('coreDiameter').value;
    const coreDiameterUnit = document.getElementById('coreDiameterUnit').value;
    const traverseWidth = document.getElementById('traverseWidth').value;
    const traverseWidthUnit = document.getElementById('traverseWidthUnit').value;

    // Get results
    const totalCapacity = document.getElementById('capacityTotal').textContent;
    const workingCapacity = document.getElementById('capacityWorking').textContent;
    const absoluteCapacity = document.getElementById('capacityAbsolute').textContent;
    const ddRatio = document.getElementById('DdRatio').textContent;
    const targetAchievement = document.getElementById('targetAchievement').textContent;

    // Get layer breakdown
    const layerList = document.getElementById('layerList');
    const layerBreakdown = layerList ? layerList.textContent || layerList.innerText : '';

    // Get provided specs
    const providedCore = document.getElementById('providedCoreDiameter').textContent;
    const providedFlange = document.getElementById('providedFlangeDiameter').textContent;
    const providedTraverse = document.getElementById('providedTraverseWidth').textContent;
    const providedTarget = document.getElementById('providedTargetLength').textContent;

    return {
        title: 'EECOL Reel Capacity Estimator Results',
        specifications: {
            flangeDiameter: `${flangeDiameter} ${flangeDiameterUnit}`,
            coreDiameter: `${coreDiameter} ${coreDiameterUnit}`,
            traverseWidth: `${traverseWidth} ${traverseWidthUnit}`
        },
        results: {
            totalCapacity: totalCapacity,
            workingCapacity: workingCapacity,
            absoluteCapacity: absoluteCapacity,
            coreToCableRatio: ddRatio,
            targetAchievement: targetAchievement
        },
        layerBreakdown: layerBreakdown,
        providedSpecs: {
            core: providedCore,
            flange: providedFlange,
            traverse: providedTraverse,
            target: providedTarget
        },
        timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
}

// Custom print function for reel capacity results using existing print utilities
function printReelCapacityResults(data) {
    const printWindow = window.open('', '_blank');

    const formattedTitle = data.title;
    const specs = data.specifications;
    const results = data.results;
    const layers = data.layerBreakdown;
    const provided = data.providedSpecs;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${window.escapeHTML(formattedTitle)}</title>
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
                .section {
                    margin: 20px 0;
                    padding: 15px;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                .section-title {
                    font-weight: bold;
                    color: #0058B3;
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #0058B3;
                    padding-bottom: 5px;
                }
                .spec-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #ddd;
                }
                .spec-label {
                    font-weight: bold;
                    color: #666;
                }
                .spec-value {
                    font-weight: bold;
                    color: #0058B3;
                }
                .results-section {
                    background: #e0f0ff;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }
                .layer-info {
                    background: #f0f8ff;
                    border-left: 4px solid #0058B3;
                    padding: 10px;
                    margin: 10px 0;
                    font-size: 12px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${window.escapeHTML(formattedTitle)}</div>
            </div>

            <div class="section">
                <div class="section-title">📐 Reel Specifications</div>
                <div class="spec-row">
                    <span class="spec-label">Flange Diameter:</span>
                    <span class="spec-value">${window.escapeHTML(specs.flangeDiameter)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Core Diameter:</span>
                    <span class="spec-value">${window.escapeHTML(specs.coreDiameter)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Traverse Width:</span>
                    <span class="spec-value">${window.escapeHTML(specs.traverseWidth)}</span>
                </div>
            </div>

            <div class="results-section">
                <div class="section-title">📊 Calculation Results</div>
                <div class="spec-row">
                    <span class="spec-label">Total Capacity:</span>
                    <span class="spec-value">${window.escapeHTML(results.totalCapacity)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Working Capacity:</span>
                    <span class="spec-value">${window.escapeHTML(results.workingCapacity)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Absolute Capacity:</span>
                    <span class="spec-value">${window.escapeHTML(results.absoluteCapacity)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Core-to-Cable Ratio:</span>
                    <span class="spec-value">${window.escapeHTML(results.coreToCableRatio)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Target Achievement:</span>
                    <span class="spec-value">${window.escapeHTML(results.targetAchievement)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📋 Provided Specifications</div>
                <div class="spec-row">
                    <span class="spec-label">Core Diameter:</span>
                    <span class="spec-value">${window.escapeHTML(provided.core)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Flange Diameter:</span>
                    <span class="spec-value">${window.escapeHTML(provided.flange)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Traverse Width:</span>
                    <span class="spec-value">${window.escapeHTML(provided.traverse)}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Target Length:</span>
                    <span class="spec-value">${window.escapeHTML(provided.target)}</span>
                </div>
            </div>

            ${layers ? `
            <div class="section">
                <div class="section-title">🔍 Layer Breakdown</div>
                <div class="layer-info">
                    ${window.escapeHTML(layers).replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}

            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${window.escapeHTML(data.timestamp)}
            </div>

            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `);

    printWindow.print();
}

// ============================================================================
// MOBILE MENU INITIALIZATION FOR REEL CAPACITY ESTIMATOR PAGE
// ============================================================================

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.4',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📐 Size Estimator', href: '../reel-size-estimator/reel-size-estimator.html', class: 'bg-amber-600 hover:bg-amber-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Reel Capacity Estimator'
    });
}
