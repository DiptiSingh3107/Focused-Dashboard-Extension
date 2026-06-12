// blocked.js — FocusBoard blocked page controller

document.addEventListener('DOMContentLoaded', () => {
  loadFocusMessage();
  showBlockedDomain();
  bindDisableButton();
  bindBackButton();
});

/**
 * Navigates the current tab to the FocusBoard dashboard (newtab.html).
 * chrome://newtab cannot be navigated to directly from extension pages,
 * so we use chrome.runtime.getURL to resolve the extension's own newtab page.
 */
function goToDashboard() {
  window.location.href = chrome.runtime.getURL('newtab.html');
}

/**
 * Loads today's focus text from storage and displays it.
 */
function loadFocusMessage() {
  const focusTextEl = document.getElementById('focus-message-text');

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['focus'], (result) => {
      if (result.focus && result.focus.text) {
        focusTextEl.textContent = result.focus.text;
      } else {
        focusTextEl.textContent = 'Stay focused and productive!';
      }
    });
  }
}

/**
 * Extracts and displays the domain that was blocked from URL params.
 */
function showBlockedDomain() {
  const domainEl = document.getElementById('blocked-domain-text');
  try {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url) {
      const hostname = new URL(decodeURIComponent(url)).hostname;
      domainEl.textContent = `You tried to visit: ${hostname}`;
    }
  } catch {
    // Silently ignore if no URL param present
  }
}

/**
 * Binds the "Disable Focus Mode" button — turns off blocking then auto-redirects to dashboard.
 */
function bindDisableButton() {
  const disableBtn = document.getElementById('disable-focus-btn');

  disableBtn.addEventListener('click', () => {
    // Show brief loading state
    disableBtn.textContent = 'Disabling...';
    disableBtn.disabled = true;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ focusModeEnabled: false }, () => {
        // Background worker picks this up via storage.onChanged and clears rules.
        // Navigate to dashboard immediately after disabling.
        goToDashboard();
      });
    }
  });
}

/**
 * Binds the "Back to Dashboard" button — navigates without changing Focus Mode state.
 */
function bindBackButton() {
  const backBtn = document.getElementById('back-to-dashboard-btn');
  if (!backBtn) return;

  backBtn.addEventListener('click', () => {
    goToDashboard();
  });
}
