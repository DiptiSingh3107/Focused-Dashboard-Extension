// period-tracker.js - Calendar and cycle logic for Period Tracker Widget

document.addEventListener('DOMContentLoaded', () => {
  initPeriodTracker();
});

let ptData = {
  cycleLength: 28,
  periodLength: 5,
  periodStartDate: null // 'YYYY-MM-DD'
};

let currentViewDate = new Date(); // Tracks which month the calendar is displaying

function initPeriodTracker() {
  loadPTData(() => {
    setupPTEventListeners();
    renderCalendar();
  });
}

function loadPTData(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['periodTracker'], (result) => {
      if (result.periodTracker) {
        ptData = { ...ptData, ...result.periodTracker };
      }
      callback();
    });
  } else {
    callback();
  }
}

function savePTData() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ periodTracker: ptData });
  }
}

function setupPTEventListeners() {
  // Navigation
  document.getElementById('pt-prev-month').addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('pt-next-month').addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    renderCalendar();
  });

  // Settings Modal
  const settingsBtn = document.getElementById('pt-settings-trigger');
  const settingsModal = document.getElementById('pt-settings-modal');
  const cancelBtn = document.getElementById('pt-settings-cancel');
  const form = document.getElementById('pt-settings-form');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('pt-cycle-length').value = ptData.cycleLength;
    document.getElementById('pt-period-length').value = ptData.periodLength;
    settingsModal.classList.toggle('hidden');
    document.getElementById('pt-context-menu').classList.add('hidden');
  });

  cancelBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ptData.cycleLength = parseInt(document.getElementById('pt-cycle-length').value, 10);
    ptData.periodLength = parseInt(document.getElementById('pt-period-length').value, 10);
    savePTData();
    settingsModal.classList.add('hidden');
    renderCalendar();
  });

  // Close modals on outside click
  document.addEventListener('click', (e) => {
    if (!settingsModal.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
      settingsModal.classList.add('hidden');
    }
    const contextMenu = document.getElementById('pt-context-menu');
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.add('hidden');
    }
  });

  // Context Menu Actions
  document.getElementById('pt-mark-btn').addEventListener('click', () => {
    const contextMenu = document.getElementById('pt-context-menu');
    const dateStr = contextMenu.dataset.date;
    if (dateStr) {
      ptData.periodStartDate = dateStr;
      savePTData();
      renderCalendar();
    }
    contextMenu.classList.add('hidden');
  });

  document.getElementById('pt-clear-btn').addEventListener('click', () => {
    ptData.periodStartDate = null;
    savePTData();
    renderCalendar();
    document.getElementById('pt-context-menu').classList.add('hidden');
  });
}

function renderCalendar() {
  const grid = document.getElementById('pt-calendar-grid');
  const monthLabel = document.getElementById('pt-month-label');
  const prevBtn = document.getElementById('pt-prev-month');
  const nextBtn = document.getElementById('pt-next-month');
  grid.innerHTML = '';

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), 1);

  // Disable arrows if out of bounds
  prevBtn.disabled = new Date(year, month - 1, 1) < oneYearAgo;
  nextBtn.disabled = new Date(year, month + 1, 1) > oneYearFuture;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  days.forEach(d => {
    const el = document.createElement('div');
    el.className = 'pt-day-header';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells for alignment
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'pt-cell pt-empty';
    grid.appendChild(el);
  }

  // Pre-calculate highlights to avoid math in loop
  const highlights = calculateHighlights(year, month, daysInMonth);
  updateLateIndicator();

  const todayStr = getLocalDateString(new Date());

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = getLocalDateString(new Date(year, month, i));
    const el = document.createElement('div');
    el.className = 'pt-cell';
    el.textContent = i;
    el.dataset.date = dateStr;

    if (dateStr === todayStr) {
      el.classList.add('pt-today');
    }

    if (highlights.periods.has(dateStr)) {
      el.classList.add('pt-period');
      el.title = "Period";
    } else if (highlights.expected.has(dateStr)) {
      el.classList.add('pt-expected');
      el.title = "Expected Period";
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openContextMenu(e, dateStr);
    });

    grid.appendChild(el);
  }
}

function openContextMenu(e, dateStr) {
  const contextMenu = document.getElementById('pt-context-menu');
  contextMenu.dataset.date = dateStr;
  
  const widgetRect = document.getElementById('period-tracker-widget').getBoundingClientRect();
  
  // Display menu temporarily to get width/height
  contextMenu.classList.remove('hidden');
  const menuRect = contextMenu.getBoundingClientRect();
  
  // Default position: slightly bottom-right of cursor
  let left = e.clientX - widgetRect.left + 8;
  let top = e.clientY - widgetRect.top + 8;

  // Snap left if overflows right edge
  if (left + menuRect.width > widgetRect.width) {
    left = (e.clientX - widgetRect.left) - menuRect.width - 8;
  }
  
  // Snap up if overflows bottom edge
  if (top + menuRect.height > widgetRect.height) {
    top = widgetRect.height - menuRect.height - 8;
  }

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
}

/**
 * Calculates which days in a specific month are periods or expected periods.
 */
function calculateHighlights(year, month, daysInMonth) {
  const result = {
    periods: new Set(),
    expected: new Set()
  };

  if (!ptData.periodStartDate) return result;

  const startMs = parseLocalDate(ptData.periodStartDate).getTime();
  const cycleMs = ptData.cycleLength * 24 * 60 * 60 * 1000;
  
  // Determine start and end of this month
  const monthStartMs = new Date(year, month, 1).getTime();
  const monthEndMs = new Date(year, month, daysInMonth, 23, 59, 59).getTime();

  // We need to look backward and forward by enough cycles to cover this month
  // Find a cycle anchor near monthStart
  const diffCycles = Math.floor((monthStartMs - startMs) / cycleMs);
  
  // Check from a few cycles before to a few cycles after to handle overlap
  for (let i = diffCycles - 2; i <= diffCycles + 2; i++) {
    const cycleStartMs = startMs + (i * cycleMs);
    const isActualPeriod = (i === 0);

    // For each day of the period
    for (let dayOffset = 0; dayOffset < ptData.periodLength; dayOffset++) {
      const dayMs = cycleStartMs + (dayOffset * 24 * 60 * 60 * 1000);
      
      // If this day falls within the current month, mark it
      if (dayMs >= monthStartMs && dayMs <= monthEndMs) {
        const dateObj = new Date(dayMs);
        const dateStr = getLocalDateString(dateObj);
        
        if (isActualPeriod) {
          result.periods.add(dateStr);
        } else {
          result.expected.add(dateStr);
        }
      }
    }
  }

  return result;
}

function updateLateIndicator() {
  const badge = document.getElementById('pt-late-badge');
  if (!ptData.periodStartDate) {
    badge.classList.add('hidden');
    return;
  }

  const startMs = parseLocalDate(ptData.periodStartDate).getTime();
  const cycleMs = ptData.cycleLength * 24 * 60 * 60 * 1000;
  const periodMs = ptData.periodLength * 24 * 60 * 60 * 1000;
  
  const expectedNextStartMs = startMs + cycleMs;
  const expectedNextEndMs = expectedNextStartMs + periodMs - (24 * 60 * 60 * 1000); // inclusive

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayMs = today.getTime();

  // If today is strictly past the expected window end
  if (todayMs > expectedNextEndMs) {
    const daysLate = Math.floor((todayMs - expectedNextStartMs) / (24 * 60 * 60 * 1000));
    badge.textContent = `Period is ${daysLate} days late`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * Utility: Converts Date object to 'YYYY-MM-DD'
 */
function getLocalDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Utility: Parses 'YYYY-MM-DD' to Date object at local midnight
 */
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
