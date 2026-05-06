# Bolt's Journal - Performance Optimizations

## 2026-03-07 - Single-pass Dashboard Data Processing
**Learning:** The live dashboard was performing approximately 30 full passes (filters, reduces, forEach) over the datasets (`inventoryItems` and `cutRecords`) every time it updated. As the IndexedDB grows, this O(N) multiplication leads to visible UI lag and battery drain on mobile devices.
**Action:** Consolidate all metric calculations into a single pass over each dataset. This reduces complexity from ~30 O(N) to 2 O(N), making the dashboard scale much better with data volume.

## 2025-05-16 - Single-pass Inventory Reports
**Learning:** `updateDashboard` and `updateReportsTable` in `inventory-reports.js` were performing multiple O(N) passes (7+ and 2+ respectively) over the inventory datasets. Consolidating these into single-pass loops ensures the reporting dashboard remains responsive even with thousands of records.
**Action:** Consolidate multiple filter/reduce calls into a single `for...of` loop in `updateDashboard` and `updateReportsTable`.

## 2025-06-12 - Single-pass Cutting Records Statistics
**Learning:** `updateStats` in `cutting-records.js` was performing six separate O(N) passes (filter, reduce, forEach) to update basic dashboard metrics. Consolidating these into a single iteration ensures the record-keeping interface remains responsive as the user's local history grows.
**Action:** Consolidate 6 O(N) passes into a single `for...of` loop in `updateStats`.

## 2025-05-14 - Single-pass Inventory Reports Charts
**Learning:** The `updateCharts` function in `inventory-reports.js` was triggering four separate chart creation functions, performing approximately 9 redundant O(N) passes (multiple `filter()`, `forEach()`, and `groupRecordsByPeriod()` calls) over the inventory dataset.
**Action:** Consolidated all chart data collection into a single `for...of` loop in `updateCharts`, reducing complexity from ~9 O(N) to 1 O(N) and minimizing temporary memory allocations.

## 2025-07-22 - Single-pass Cutting Reports Data Aggregation
**Learning:** `updateCharts` and `updateReportsTable` in `cutting-reports.js` were performing approximately 10+ redundant O(N) passes over the `cutRecords` dataset, including expensive `groupRecordsByPeriod` calls that created nested array structures. This caused measurable UI lag when switching chart types or date ranges with large datasets.
**Action:** Consolidated all chart data aggregation and period comparison metrics into a single `for...of` loop in `updateCharts`, reducing complexity from ~10 O(N) to 1 O(N).

## 2025-08-04 - Search Debouncing and Formatter Optimization
**Learning:** The cutting records search was triggering full O(N) re-renders on every keystroke, and the filtering logic was creating temporary objects for each record. Additionally, repeated calls to `toLocaleString()` in render loops are significantly slower than using a pre-initialized `Intl.DateTimeFormat`.
**Action:** Implemented a 250ms debounce on the search input, optimized `getFilteredRecords` to avoid object allocation, and pre-initialized `Intl.DateTimeFormat` for consistent, high-performance date string generation. Decoupled `updateStats()` from the render loop to ensure it only runs on data mutation.
