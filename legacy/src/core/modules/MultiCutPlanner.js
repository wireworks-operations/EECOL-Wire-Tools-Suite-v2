/**
 * MultiCutPlanner Core Logic
 * Handles calculations for reel capacity, fill percentages, and cut planning.
 */
export class MultiCutPlanner {
    constructor() {
        this.reels = [];
        this.reelIdCounter = 0;
        this.units = 'metric'; // 'metric' or 'imperial'
        this.wireDiameter = 1.5; // Default mm
        this.startMark = 0;

        // Constants
        this.PACKING_FACTOR = 0.8; // Conservative estimate for random winding
    }

    setUnits(mode) {
        this.units = mode;
        // Adjust defaults if needed when switching
        if (mode === 'metric') {
            if (this.wireDiameter < 1) this.wireDiameter = 1.5;
        } else {
            if (this.wireDiameter > 1) this.wireDiameter = 0.06;
        }
    }

    addReel(length, dims = {}) {
        const reel = {
            id: `${Date.now()}-${++this.reelIdCounter}`,
            length: parseFloat(length),
            flange: parseFloat(dims.flange) || 0,
            barrel: parseFloat(dims.barrel) || 0,
            traverse: parseFloat(dims.traverse) || 0
        };
        this.reels.push(reel);
        return reel;
    }

    removeReel(id) {
        this.reels = this.reels.filter(r => r.id !== id);
    }

    clearReels() {
        this.reels = [];
    }

    calculateCapacity(flange, barrel, traverse, wireD) {
        // Ensure inputs are numbers
        flange = parseFloat(flange);
        barrel = parseFloat(barrel);
        traverse = parseFloat(traverse);
        wireD = parseFloat(wireD);

        if (!flange || !barrel || !traverse || !wireD) return 0;

        // Apply a 5% freeboard (margin from edge of flange)
        let effectiveFlange = flange * 0.95;

        let r_out = effectiveFlange / 2;
        let r_in = barrel / 2;
        let w_radius = wireD / 2;

        // Volume of Reel Area = PI * (R_outer^2 - R_inner^2) * Width
        let reelVolume = Math.PI * (Math.pow(r_out, 2) - Math.pow(r_in, 2)) * traverse;

        // Wire Area = PI * (d/2)^2
        let wireCrossSectionArea = Math.PI * Math.pow(w_radius, 2);

        // Total Wire Length Capacity = (Reel Volume * Packing Factor) / Wire Area
        let capacity = (reelVolume * this.PACKING_FACTOR) / wireCrossSectionArea;

        // Convert result based on units
        if (this.units === 'metric') {
            return capacity / 1000; // mm to meters
        } else {
            return capacity / 12; // inches to feet
        }
    }

    getPlan() {
        let currentMark = this.startMark;
        let totalLength = 0;

        return this.reels.map((reel, index) => {
            const start = currentMark;
            const end = currentMark + reel.length;
            currentMark = end;
            totalLength += reel.length;

            let capacity = 0;
            let fillPercent = 0;
            let status = 'unknown'; // unknown, ok, warning, overfill

            if (reel.flange > 0 && this.wireDiameter > 0) {
                capacity = this.calculateCapacity(reel.flange, reel.barrel, reel.traverse, this.wireDiameter);
                if (capacity > 0) {
                    fillPercent = (reel.length / capacity) * 100;

                    if (fillPercent > 100) status = 'overfill';
                    else if (fillPercent > 85) status = 'warning';
                    else status = 'ok';
                }
            }

            return {
                ...reel,
                index: index + 1,
                startMark: start,
                endMark: end,
                capacity,
                fillPercent,
                status
            };
        });
    }

    getTotals() {
        return {
            count: this.reels.length,
            length: this.reels.reduce((sum, r) => sum + r.length, 0)
        };
    }
}
