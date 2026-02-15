/**
 * Service Worker registration and management
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            showUpdateNotification();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }

    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

function showUpdateNotification() {
  // Show update notification to user
  const updateBanner = document.createElement('div');
  updateBanner.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50';
  updateBanner.innerHTML = `
    <div class="flex items-center gap-4">
      <span>New version available!</span>
      <button onclick="window.location.reload()" class="px-4 py-2 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100">
        Update
      </button>
    </div>
  `;
  document.body.appendChild(updateBanner);
}

// Check if app is running as PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

// Prompt user to install PWA
export function promptInstall() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button
    showInstallButton(deferredPrompt);
  });
}

function showInstallButton(deferredPrompt: any) {
  const installButton = document.createElement('button');
  installButton.className = 'fixed bottom-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-semibold hover:shadow-xl transition-all';
  installButton.textContent = '📱 Install App';

  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);

      deferredPrompt = null;
      installButton.remove();
    }
  });

  document.body.appendChild(installButton);
}

// Online/Offline status
export function setupOnlineStatus() {
  window.addEventListener('online', () => {
    console.log('App is online');
    showOnlineNotification();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    showOfflineNotification();
  });
}

function showOnlineNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  notification.textContent = '✓ Back online';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showOfflineNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  notification.textContent = '⚠ You are offline';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}
