/**
 * EECOL Wire Tools Suite - Theme Loader
 * This script is intended to be placed in the <head> of the document.
 * It blocks rendering to prevent the "flash of unstyled content" (FOUC)
 * by applying the correct theme class ('dark-mode') to the <html> element
 * before the body is rendered.
 */
(function() {
    const storageKey = 'eecol-theme';
    const darkClass = 'dark-mode';

    function applyTheme() {
        try {
            const storedTheme = localStorage.getItem(storageKey);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = storedTheme === 'dark' || (storedTheme === null && prefersDark);

            if (isDark) {
                document.documentElement.classList.add(darkClass);
            } else {
                document.documentElement.classList.remove(darkClass);
            }
        } catch (e) {
            console.warn('Could not apply theme from theme-loader:', e);
        }
    }

    applyTheme();
})();

/**
 * Global utility to escape HTML special characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
};
