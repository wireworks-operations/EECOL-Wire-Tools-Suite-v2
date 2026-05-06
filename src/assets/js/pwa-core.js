/**
 * EECOL Wire Tools Suite - PWA Core Functionality
 * Enterprise PWA v0.8.0.0
 */

// ===== PWA SERVICE WORKER REGISTRATION =====
function registerPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Find root path for service worker
            // GitHub Pages support: handles both domain root and subdirectory
            const swPath = window.location.pathname.includes('/EECOL-Wire-Tools-Suite/')
                ? '/EECOL-Wire-Tools-Suite/sw.js'
                : '/sw.js';

            navigator.serviceWorker.register(swPath)
                .then(registration => {
                    console.log('✅ EECOL PWA: Service Worker registered successfully:', registration.scope);

                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    if (confirm('👋 New version of EECOL Tools available! Refresh to update?')) {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });


                })
                .catch(error => {
                    console.error('❌ EECOL PWA: Service Worker registration failed:', error);
                });
        });
    }
}

// ===== PWA EVENT HANDLERS =====
function setupPWAEvents() {
    // Handle PWA install prompt
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install button or banner
        showInstallPrompt();

        console.log('📱 EECOL PWA: Install prompt saved');
    });

    // Handle successful installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('🎉 EECOL PWA: App installed successfully');
        hideInstallPrompt();
        deferredPrompt = null;
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log('🌐 EECOL PWA: Online mode activated');
        updateNetworkStatus(true);
    });

    window.addEventListener('offline', () => {
        console.log('🔌 EECOL PWA: Offline mode activated');
        updateNetworkStatus(false);
    });
}

// ===== INSTALL PROMPT FUNCTIONS =====
function showInstallPrompt() {
    // Create and show install banner/button
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 bg-eecol-blue text-white p-4 rounded-lg shadow-xl z-50 flex items-center justify-between';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'flex items-center';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'text-2xl mr-3';
    iconDiv.textContent = '📱';
    leftDiv.appendChild(iconDiv);

    const textDiv = document.createElement('div');
    const titleDiv = document.createElement('div');
    titleDiv.className = 'font-bold';
    titleDiv.textContent = 'Install EECOL Wire Tools';
    textDiv.appendChild(titleDiv);

    const subtitleDiv = document.createElement('div');
    subtitleDiv.className = 'text-sm opacity-90';
    subtitleDiv.textContent = 'Install as app for better experience';
    textDiv.appendChild(subtitleDiv);
    leftDiv.appendChild(textDiv);
    banner.appendChild(leftDiv);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'flex gap-2';

    const cancelBtn = document.createElement('button');
    cancelBtn.onclick = () => hideInstallPrompt();
    cancelBtn.className = 'px-3 py-2 bg-transparent border border-white rounded text-sm';
    cancelBtn.textContent = 'Not Now';
    btnGroup.appendChild(cancelBtn);

    const installBtn = document.createElement('button');
    installBtn.onclick = () => installPWA();
    installBtn.className = 'px-4 py-2 bg-white text-eecol-blue rounded font-bold text-sm';
    installBtn.textContent = 'Install';
    btnGroup.appendChild(installBtn);

    banner.appendChild(btnGroup);
    document.body.appendChild(banner);
}

function hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.remove();
    }
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('🎉 EECOL PWA: User accepted install prompt');
            } else {
                console.log('❌ EECOL PWA: User dismissed install prompt');
            }
            deferredPrompt = null;
            hideInstallPrompt();
        });
    }
}

// ===== NETWORK STATUS FUNCTIONS =====
function updateNetworkStatus(online) {
    const statusIndicators = document.querySelectorAll('.network-status');

    if (online) {
        // Remove offline indicators
        statusIndicators.forEach(el => {
            if (el.classList.contains('offline')) {
                el.remove();
            }
        });
    } else {
        // Add offline indicators if they don't exist
        document.querySelectorAll('[data-offline-indicator]').forEach(container => {
            if (!container.querySelector('.network-status.offline')) {
                const indicator = document.createElement('div');
                indicator.className = 'network-status offline bg-orange-100 border-l-4 border-orange-500 text-orange-700 px-4 py-2 mb-4 text-sm';
                indicator.textContent = '⚠️ You are currently offline. Some features may be limited.';
                container.appendChild(indicator);
            }
        });
    }
}

// ===== PWA UPDATE CHECK =====
function checkForUpdates() {
    if ('serviceWorker' in navigator && 'caches' in window) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.update();
            }
        });
    }
}

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
if (typeof window !== 'undefined') {
    window.registerPWA = registerPWA;
    window.setupPWAEvents = setupPWAEvents;
    window.installPWA = installPWA;
    window.hideInstallPrompt = hideInstallPrompt;
    window.updateNetworkStatus = updateNetworkStatus;
    window.checkForUpdates = checkForUpdates;
}

// ===== AUTO-INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
    registerPWA();
    setupPWAEvents();
    checkForUpdates();

    // Set initial network status
    updateNetworkStatus(navigator.onLine);
});
