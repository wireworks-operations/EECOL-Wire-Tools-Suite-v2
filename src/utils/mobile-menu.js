/**
 * EECOL Wire Tools Suite - Shared Mobile Menu System
 * Enterprise PWA
 */

// Mobile menu state
let mobileMenuOpen = false;

/**
 * Initialize mobile menu for a page
 * @param {Object} options - Configuration options
 * @param {Array} options.menuItems - Array of menu item objects {text, href, class} or {text, action: 'click', selector, class}
 * @param {string} options.version - Version string to display
 * @param {string} options.credits - Credits text
 * @param {string} options.title - Page title for branding
 */
function initMobileMenu(options = {}) {
    const {
        menuItems = [],
        version = 'v0.8.0.4',
        credits = 'Made With ❤️ By: Lucas and Cline 🤖',
        title = 'EECOL Wire Tools'
    } = options;

    // Load Dark Mode Script dynamically if not present
    if (typeof window.DarkMode === 'undefined' && !document.querySelector('script[src*="dark-mode.js"]')) {
        const script = document.createElement('script');
        // Determine path based on current location
        // If we are in src/pages/x/x.html, utils is at ../../utils/
        // If we are in index.html, utils is at src/utils/
        const isRoot = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/pages/');
        const path = isRoot ? 'src/utils/dark-mode.js' : '../../utils/dark-mode.js';

        // Simple heuristic: if window.location.href contains '/pages/', we need ../../
        // If it's just index.html at root, we need src/utils/

        // Let's rely on how mobile-menu.js itself is included usually?
        // No, mobile-menu.js doesn't know its own path easily without some tricks.
        // We'll use the relative path that seems most common or try to detect.

        // Better yet: check the script tag that loaded mobile-menu.js
        const scripts = document.getElementsByTagName('script');
        let basePath = '../../utils/'; // default for pages
        for (let s of scripts) {
            if (s.src.includes('mobile-menu.js')) {
                basePath = s.src.replace('mobile-menu.js', '');
                break;
            }
        }

        script.src = basePath + 'dark-mode.js';
        script.onload = () => {
            // Re-render menu to include toggle if needed, or update toggle state
            if (window.DarkMode) window.DarkMode.updateToggleIcons();
        };
        document.head.appendChild(script);
    }

    // Create mobile menu HTML
    createMobileMenu(menuItems, version, credits, title);

    // Initialize event listeners
    setupMobileMenuEvents();
}

/**
 * Create and inject mobile menu HTML into the DOM
 */
function createMobileMenu(menuItems, version, credits, title) {
    // Hamburger button HTML
    const hamburgerButton = `
        <button id="mobileMenuBtn" aria-label="Open Navigation Menu" aria-expanded="false" class="sm:hidden fixed bottom-4 left-4 z-40 bg-[#0058B3] hover:bg-[#004a99] text-white p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0058B3] focus:ring-opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path id="hamburgerIcon" d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path id="closeIcon" class="hidden" d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;

    // Mobile menu overlay HTML
    const menuItemsHtml = menuItems.map((item, index) => {
        if (item.action === 'click' && item.selector) {
            // Action button that clicks on a target element
            return `
                <button data-action="click" data-selector="${item.selector}" class="block px-6 py-3 ${item.class || 'bg-[#0058B3] hover:bg-[#004a99]'} text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-opacity-50 text-center text-sm w-full" style="max-width: 300px;">
                    ${item.text}
                </button>
            `;
        } else {
            // Navigation link
            return `
                <a href="${item.href || '#'}" class="block px-6 py-3 ${item.class || 'bg-[#0058B3] hover:bg-[#004a99]'} text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-opacity-50 text-center text-sm no-underline" style="width: calc(100% - 3rem); max-width: 300px;">
                    ${item.text}
                </a>
            `;
        }
    }).join('');

    const mobileMenu = `
        <div id="mobileMenuOverlay" class="fixed inset-0 z-50 sm:hidden transform -translate-x-full transition-transform duration-300 ease-out">
            <!-- Backdrop -->
            <div id="mobileMenuBackdrop" class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

            <!-- Menu Panel -->
            <div class="absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-[#F0F8FF] shadow-2xl border-r-2 border-[#0058B3] flex flex-col">

                <!-- Header -->
                <div class="p-6 border-b border-blue-200 text-center">
                    <div class="flex justify-center mb-3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-[#0058B3] drop-shadow-lg eecol-logo-tilt">
                            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" stroke-width="2"/>
                            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h2 class="text-xl font-black text-[#0058B3] header-gradient">${title}</h2>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end p-4">
                    <button id="mobileMenuCloseBtn" aria-label="Close Navigation Menu" class="p-2 text-[#0058B3] hover:text-[#004a99] rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>

                <!-- Navigation -->
                <div class="flex-1 px-6 py-2 space-y-4 overflow-y-auto">
                    ${menuItemsHtml}
                </div>

                <!-- Footer Info -->
                <div class="p-6 border-t border-blue-200 text-center">
                    <!-- Mobile Dark Mode Toggle -->
                    <button id="mobileDarkModeToggle" class="mb-4 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center mx-auto w-full max-w-[200px] transition-colors">
                        🌙 Dark Mode
                    </button>

                    <p class="text-xs text-gray-500 font-mono mb-2">${version}</p>
                    <p class="font-medium text-[#0058B3] text-sm mb-1">${credits}</p>
                    <p class="text-xs font-semibold header-gradient">EECOL Wire Tools 2025 - Enterprise Edition</p>
                </div>
            </div>
        </div>
    `;

    // Inject elements into DOM
    document.body.insertAdjacentHTML('beforeend', hamburgerButton);
    document.body.insertAdjacentHTML('beforeend', mobileMenu);

    // Setup listener for mobile dark mode toggle if script is ready
    const mobileToggle = document.getElementById('mobileDarkModeToggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (window.DarkMode) {
                window.DarkMode.toggle();
            } else {
                console.warn('Dark Mode script not loaded yet');
            }
        });
    }
}

/**
 * Setup event listeners for mobile menu
 */
function setupMobileMenuEvents() {
    const hamburgerBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('mobileMenuCloseBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const closeIcon = document.getElementById('closeIcon');

    if (!hamburgerBtn || !overlay) return;

    // Toggle menu on hamburger button click
    hamburgerBtn.addEventListener('click', () => toggleMobileMenu());

    // Close menu on close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeMobileMenu());
    }

    // Close menu on backdrop click
    if (backdrop) {
        backdrop.addEventListener('click', () => closeMobileMenu());
    }

    // ESC key to close menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOpen) {
            closeMobileMenu();
        }
    });

    // Handle action button clicks
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (button && button.getAttribute('data-action') === 'click') {
            e.preventDefault();
            const selector = button.getAttribute('data-selector');
            if (selector) {
                const targetElement = document.querySelector(selector);
                if (targetElement) {
                    targetElement.click();
                    closeMobileMenu(); // Close menu after action
                }
            }
        }
    });

    // Prevent scrolling when menu is open
    overlay.addEventListener('wheel', (e) => {
        if (mobileMenuOpen) {
            e.preventDefault();
        }
    });
}

/**
 * Toggle mobile menu open/close state
 */
function toggleMobileMenu() {
    if (mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Open mobile menu
 */
function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerBtn = document.getElementById('mobileMenuBtn');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const closeIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = true;
    overlay.classList.remove('-translate-x-full');
    overlay.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Update ARIA state
    if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        hamburgerBtn.setAttribute('aria-label', 'Close Navigation Menu');
    }

    // Toggle icon (hamburger to X)
    if (hamburgerIcon && closeIcon) {
        hamburgerIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerBtn = document.getElementById('mobileMenuBtn');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const closeIcon = document.getElementById('closeIcon');

    if (!overlay) return;

    mobileMenuOpen = false;
    overlay.classList.remove('translate-x-0');
    overlay.classList.add('-translate-x-full');
    document.body.style.overflow = ''; // Restore scrolling

    // Update ARIA state
    if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open Navigation Menu');
    }

    // Toggle icon (X to hamburger)
    if (hamburgerIcon && closeIcon) {
        closeIcon.classList.add('hidden');
        hamburgerIcon.classList.remove('hidden');
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.initMobileMenu = initMobileMenu;
    window.toggleMobileMenu = toggleMobileMenu;
    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
}
