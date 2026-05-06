/**
 * EECOL Wire Tools Suite - Dark Mode System
 * Handles theme toggling, persistence, and UI injection
 */

const DarkMode = {
    // Configuration
    config: {
        storageKey: 'eecol-theme',
        darkClass: 'dark-mode',
        toggleId: 'darkModeToggle',
        mobileToggleId: 'mobileDarkModeToggle'
    },

    // Initialize the system
    init() {
        this.applyTheme();
        this.injectDesktopToggle();
        // Mobile toggle is handled by mobile-menu.js integration or we can try to inject it if menu exists
        this.setupListeners();
    },

    // Check if dark mode is active
    isDark() {
        return localStorage.getItem(this.config.storageKey) === 'dark';
    },

    // Apply the current theme
    applyTheme() {
        const isDark = this.isDark();
        if (isDark) {
            document.documentElement.classList.add(this.config.darkClass);
        } else {
            document.documentElement.classList.remove(this.config.darkClass);
        }
        this.updateToggleIcons();
        this.updateToggleStyling();
    },

    // Update button styling based on current theme
    updateToggleStyling() {
        const isDark = this.isDark();
        const desktopBtn = document.getElementById(this.config.toggleId);
        if (desktopBtn) {
            if (isDark) {
                desktopBtn.style.backgroundColor = 'rgb(51, 65, 85)'; // slate-700
                desktopBtn.style.borderColor = 'rgb(71, 85, 105)'; // slate-600
                desktopBtn.style.color = '#fde047'; // yellow-300
            } else {
                desktopBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // light mode
                desktopBtn.style.borderColor = '#d1d5db'; // gray-300
                desktopBtn.style.color = '#374151'; // gray-700
            }
        }
    },

    // Toggle the theme
    toggle() {
        const isDark = this.isDark();
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem(this.config.storageKey, newTheme);
        this.applyTheme();
    },

    // Update icons for all toggles
    updateToggleIcons() {
        const isDark = this.isDark();
        const icon = isDark ? '🌞' : '🌙'; // Sun for dark mode (to switch to light), Moon for light mode

        // Update Desktop Toggle
        const desktopBtn = document.getElementById(this.config.toggleId);
        if (desktopBtn) {
            desktopBtn.innerHTML = icon;
            desktopBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }

        // Update Mobile Toggle (if it exists independently)
        const mobileBtn = document.getElementById(this.config.mobileToggleId);
        if (mobileBtn) {
            mobileBtn.innerHTML = `${icon} <span class="ml-2">${isDark ? 'Light Mode' : 'Dark Mode'}</span>`;
        }
    },

    // Inject the desktop toggle button into the main container
    injectDesktopToggle() {
        // Look for the main container relative wrapper
        // Most pages have a div with class 'relative' inside body or as the main wrapper
        // We'll try to find the specific "Made With" footer or the Logo to anchor to,
        // OR just append to the first main container found.

        // Common pattern in these pages:
        // <div class="flex-1 w-full max-w... relative ...">

        const mainContainer = document.querySelector('.max-w-md, .max-w-xl, .max-w-7xl, .max-w-9xl');

        if (mainContainer && !document.getElementById(this.config.toggleId)) {
            const btn = document.createElement('button');
            btn.id = this.config.toggleId;
            btn.className = 'absolute top-4 right-4 z-30 p-2 rounded-full shadow-md transition-all duration-200 text-xl leading-none';
            btn.style.cssText = 'position: absolute; top: 16px; right: 16px; z-index: 30; padding: 8px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s; font-size: 20px; background-color: rgba(255, 255, 255, 0.2); color: #374151; border: 1px solid #d1d5db;';

            btn.onclick = () => this.toggle();

            // If the container is relative, absolute positioning works.
            // If not, we might need to make it relative.
            const style = window.getComputedStyle(mainContainer);
            if (style.position === 'static') {
                mainContainer.style.position = 'relative';
            }

            mainContainer.appendChild(btn);
            this.updateToggleIcons();
        }
    },

    setupListeners() {
        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.storageKey) {
                this.applyTheme();
            }
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarkMode.init());
} else {
    DarkMode.init();
}

// Expose globally
window.DarkMode = DarkMode;
