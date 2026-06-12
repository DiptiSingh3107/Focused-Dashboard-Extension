// background.js - FocusBoard Service Worker

const DEFAULT_BLOCKED_SITES = [
  'instagram.com',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'reddit.com'
];

// ─── Lifecycle Hooks ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  console.log('FocusBoard installed. Reason:', details.reason);

  // Set defaults on first install
  if (details.reason === 'install') {
    chrome.storage.local.get(['blockedSites', 'focusModeEnabled', 'reminderSettings'], (result) => {
      const updates = {};
      if (!result.blockedSites) {
        updates.blockedSites = DEFAULT_BLOCKED_SITES;
      }
      if (result.focusModeEnabled === undefined) {
        updates.focusModeEnabled = false;
      }
      if (!result.reminderSettings) {
        updates.reminderSettings = { dailyHoursTime: '18:00' };
      }
      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    });
  }

  // Re-apply rules if Focus Mode was ON before update/install
  applyRulesFromStorage();

  // Set up recurring reminder alarm (every 30 minutes)
  setupReminderAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('FocusBoard started with browser.');
  applyRulesFromStorage();
  setupReminderAlarm();
});

// ─── Storage Change Listener ───────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // React to focusModeEnabled toggle
  if (changes.focusModeEnabled !== undefined) {
    const enabled = changes.focusModeEnabled.newValue;
    if (enabled) {
      chrome.storage.local.get(['blockedSites'], (result) => {
        const sites = result.blockedSites || DEFAULT_BLOCKED_SITES;
        registerBlockingRules(sites);
      });
      handleFocusSessionStart();
    } else {
      clearBlockingRules();
      handleFocusSessionEnd();
    }
  }

  // React to blockedSites list update while Focus Mode is ON
  if (changes.blockedSites !== undefined) {
    chrome.storage.local.get(['focusModeEnabled'], (result) => {
      if (result.focusModeEnabled) {
        registerBlockingRules(changes.blockedSites.newValue || []);
      }
    });
  }
});

// ─── Stats Tracking Logic ──────────────────────────────────────────────────────

const DEFAULT_STATS = {
  currentStreak: 0,
  highestStreak: 0,
  totalFocusTime: 0,
  highestDailyFocusTime: 0,
  lastFocusDate: null,
  sessionStartTime: null,
  dailyFocusTimeMap: {}
};

function handleFocusSessionStart() {
  chrome.storage.local.get(['focusStats'], (result) => {
    let stats = result.focusStats || DEFAULT_STATS;
    const now = new Date();
    const todayStr = getTodayString(now);
    
    // Streak logic
    if (stats.lastFocusDate !== todayStr) {
      if (!stats.lastFocusDate) {
        stats.currentStreak = 1;
      } else {
        const lastDate = new Date(stats.lastFocusDate);
        // Compare just the dates
        const diffTime = Math.abs(now.setHours(0,0,0,0) - lastDate.setHours(0,0,0,0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          stats.currentStreak += 1;
        } else {
          stats.currentStreak = 1;
        }
      }
      stats.highestStreak = Math.max(stats.highestStreak, stats.currentStreak);
      stats.lastFocusDate = todayStr;
    }
    
    stats.sessionStartTime = new Date().getTime();
    chrome.storage.local.set({ focusStats: stats });
  });
}

function handleFocusSessionEnd() {
  chrome.storage.local.get(['focusStats'], (result) => {
    if (!result.focusStats || !result.focusStats.sessionStartTime) return;
    
    let stats = result.focusStats;
    const endTime = Date.now();
    const durationMs = endTime - stats.sessionStartTime;
    const todayStr = getTodayString(new Date(endTime));
    
    stats.totalFocusTime += durationMs;
    
    if (!stats.dailyFocusTimeMap) stats.dailyFocusTimeMap = {};
    if (!stats.dailyFocusTimeMap[todayStr]) stats.dailyFocusTimeMap[todayStr] = 0;
    stats.dailyFocusTimeMap[todayStr] += durationMs;
    
    stats.highestDailyFocusTime = Math.max(stats.highestDailyFocusTime || 0, stats.dailyFocusTimeMap[todayStr]);
    
    stats.sessionStartTime = null; // Clear session
    chrome.storage.local.set({ focusStats: stats });
  });
}

function getTodayString(dateObj = new Date()) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

// ─── Rule Helpers ──────────────────────────────────────────────────────────────

/**
 * Reads storage and applies or removes rules based on current focusModeEnabled state.
 */
function applyRulesFromStorage() {
  chrome.storage.local.get(['focusModeEnabled', 'blockedSites'], (result) => {
    if (result.focusModeEnabled) {
      const sites = result.blockedSites || DEFAULT_BLOCKED_SITES;
      registerBlockingRules(sites);
    } else {
      clearBlockingRules();
    }
  });
}

/**
 * Registers declarativeNetRequest dynamic rules to redirect blocked domains
 * to the blocked.html page inside this extension.
 * @param {string[]} domains
 */
function registerBlockingRules(domains) {
  // First remove all existing dynamic rules, then add fresh ones
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingIds = existingRules.map(r => r.id);

    const blockedPageUrl = chrome.runtime.getURL('blocked.html');

    // Build one rule per domain (handles with and without www.)
    const newRules = [];
    let ruleId = 1;

    domains.forEach((domain) => {
      const cleanDomain = domain.trim().toLowerCase().replace(/^www\./, '');
      if (!cleanDomain) return;

      // Match bare domain
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            url: `${blockedPageUrl}?url=https://${cleanDomain}/`
          }
        },
        condition: {
          urlFilter: `||${cleanDomain}^`,
          resourceTypes: ['main_frame']
        }
      });

      // Match www. variant
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            url: `${blockedPageUrl}?url=https://www.${cleanDomain}/`
          }
        },
        condition: {
          urlFilter: `||www.${cleanDomain}^`,
          resourceTypes: ['main_frame']
        }
      });
    });

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: newRules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to update blocking rules:', chrome.runtime.lastError.message);
      } else {
        console.log(`FocusBoard: ${newRules.length} blocking rules active.`);
      }
    });
  });
}

/**
 * Removes all dynamic declarativeNetRequest rules (disables blocking).
 */
function clearBlockingRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingIds = existingRules.map(r => r.id);
    if (existingIds.length === 0) return;

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: []
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to clear blocking rules:', chrome.runtime.lastError.message);
      } else {
        console.log('FocusBoard: All blocking rules cleared.');
      }
    });
  });
}

// ─── Message Handler (test notifications from settings UI) ────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.action !== 'testNotification') return;

  if (message.type === 'daily') {
    showNotification(
      'focusboard-test-daily',
      '⏱ Time to log your hours',
      "Don't forget to log today's hours in your Timesheet."
    );
  } else if (message.type === 'weekly') {
    showNotification(
      'focusboard-test-weekly',
      '📋 Weekly Timesheet Due',
      'Reminder: Submit your timesheet for this week.'
    );
  } else if (message.type === 'monthly') {
    showNotification(
      'focusboard-test-monthly',
      '💳 Month-End Auto-Payments',
      'Reminder: Check your Auto-Payments for this month.'
    );
  }
});

// ─── Reminder Alarm System ────────────────────────────────────────────────────

const ALARM_NAME = 'checkRemindersAlarm';

/**
 * Creates (or re-creates) the recurring 30-minute reminder alarm.
 */
function setupReminderAlarm() {
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: 1,       // first fire after 1 min
        periodInMinutes: 30      // then every 30 minutes
      });
      console.log('FocusBoard: Reminder alarm created.');
    }
  });
}

/**
 * Alarm event handler — checks which reminders are due and fires notifications.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.storage.local.get(['reminderSettings', 'lastNotifiedDates'], (result) => {
    const settings = result.reminderSettings || { dailyHoursTime: '18:00' };
    const lastNotified = result.lastNotifiedDates || {};

    const now = new Date();
    const todayStr = getTodayString();
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const currentHH = now.getHours();
    const currentMM = now.getMinutes();
    const [targetHH, targetMM] = (settings.dailyHoursTime || '18:00').split(':').map(Number);

    const updates = {};

    // ── Daily Hours Reminder ──────────────────────────────────────────────────
    const afterTriggerTime = (currentHH > targetHH) || (currentHH === targetHH && currentMM >= targetMM);
    if (afterTriggerTime && lastNotified.dailyHours !== todayStr) {
      showNotification(
        'focusboard-daily-hours',
        '⏱ Time to log your hours',
        "Don't forget to log today's hours in your Timesheet."
      );
      updates.lastNotifiedDates = { ...lastNotified, dailyHours: todayStr };
      Object.assign(lastNotified, updates.lastNotifiedDates);
    }

    // ── Weekly Friday Timesheet Reminder ─────────────────────────────────────
    if (dayOfWeek === 5 && lastNotified.weeklyTimesheet !== todayStr) {
      showNotification(
        'focusboard-weekly-timesheet',
        '📋 Weekly Timesheet Due',
        'Reminder: Submit your timesheet for this week.'
      );
      updates.lastNotifiedDates = { ...lastNotified, weeklyTimesheet: todayStr };
      Object.assign(lastNotified, updates.lastNotifiedDates);
    }

    // ── Monthly Auto-Payment Reminder (fires on the last day of the month) ───
    const isLastDayOfMonth = tomorrowDate.getDate() === 1;
    if (isLastDayOfMonth && lastNotified.monthlyAutoPay !== todayStr) {
      showNotification(
        'focusboard-monthly-autopay',
        '💳 Month-End Auto-Payments',
        'Reminder: Check your Auto-Payments for this month.'
      );
      updates.lastNotifiedDates = { ...lastNotified, monthlyAutoPay: todayStr };
      Object.assign(lastNotified, updates.lastNotifiedDates);
    }

    // Persist updated notification dates
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

/**
 * Fires a Chrome desktop notification.
 * @param {string} id - Unique notification ID (prevents duplicates)
 * @param {string} title
 * @param {string} message
 */
function showNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 1
  });
}

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
