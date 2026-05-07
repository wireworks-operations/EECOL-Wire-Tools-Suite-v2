/**
 * EECOL Wire Tools - Learning Hub Module Manager
 * Handles view toggling and module interactions for the education platform
 */

document.addEventListener('DOMContentLoaded', () => {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const modulesContainer = document.querySelector('.grid.grid-cols-1');

    if (!gridViewBtn || !listViewBtn || !modulesContainer) {
        console.warn('Learning Hub: View toggle elements not found');
        return;
    }

    gridViewBtn.addEventListener('click', () => {
        modulesContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6';
        gridViewBtn.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-[#0058B3] text-white transition-colors';
        listViewBtn.className = 'px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-[#0058B3] transition-colors';
    });

    listViewBtn.addEventListener('click', () => {
        modulesContainer.className = 'flex flex-col space-y-6';
        listViewBtn.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-[#0058B3] text-white transition-colors';
        gridViewBtn.className = 'px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-[#0058B3] transition-colors';
    });
});
