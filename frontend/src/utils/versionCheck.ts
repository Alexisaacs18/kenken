/**
 * Version check utility to detect stale cached versions
 * and force a hard reload if the version has changed
 * 
 * IMPORTANT: This only uses 'kenken_app_version' key in localStorage.
 * It does NOT touch puzzle session data ('kenken_sessions_v1') or any other keys.
 * Page reloads preserve localStorage, so puzzle sessions remain intact.
 */

const CURRENT_VERSION = import.meta.env.APP_VERSION || '1.0.0';
const VERSION_STORAGE_KEY = 'kenken_app_version'; // Separate from session keys - never conflicts

/**
 * Check if the app version has changed and force a reload if needed
 * This helps users get the latest version even if their browser cached the old HTML
 */
export function checkVersionAndReload(): void {
  if (typeof window === 'undefined') return;

  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

  // If no stored version, this is first load - store current version
  if (!storedVersion) {
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    return;
  }

  // If versions don't match, force a hard reload to get the new HTML
  if (storedVersion !== CURRENT_VERSION) {
    console.log(`[Version Check] Version changed from ${storedVersion} to ${CURRENT_VERSION}. Forcing reload...`);
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    
    // Force a hard reload (bypasses cache)
    window.location.reload();
  }
}

/**
 * Initialize version checking
 * Call this early in the app lifecycle
 */
export function initVersionCheck(): void {
  // Check immediately
  checkVersionAndReload();

  // Also check periodically (every 5 minutes) in case user has tab open for a long time
  setInterval(() => {
    checkVersionAndReload();
  }, 5 * 60 * 1000); // 5 minutes
}

