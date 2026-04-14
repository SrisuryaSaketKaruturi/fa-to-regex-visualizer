/**
 * app.js
 * Application entry point and shared utility functions.
 */

// ─────────────────────────────────────────────
//  TOAST NOTIFICATION
// ─────────────────────────────────────────────

/**
 * Displays a brief toast message at the bottom-right of the screen.
 * Auto-hides after 2.5 seconds.
 * @param {string} msg - Message text to display.
 */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────

/**
 * Bootstraps the application by loading the default preset on page load.
 */
window.onload = () => loadPreset('ab');
