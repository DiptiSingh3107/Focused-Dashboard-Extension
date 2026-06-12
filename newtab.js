// newtab.js - FocusBoard core client-side controller

document.addEventListener('DOMContentLoaded', () => {
  initAffirmation();
  initClock();
  initGreeting();
  initWallpaper();
  initSettings();
  initFocus();
  initTasks();
  initFocusMode();
  initFocusStats();
  initTheme();
});

/**
 * Picks and displays a random daily affirmation from the embedded quotes array.
 * Source: Daily_Affirmations_50.xlsx
 */
function initAffirmation() {
  const AFFIRMATIONS = [
    "Today is full of new opportunities.",
    "I choose progress over perfection.",
    "Every small step counts.",
    "I am capable of amazing things.",
    "I finish what I start.",
    "Success comes from consistent effort.",
    "I embrace challenges with confidence.",
    "My future is created by what I do today.",
    "I am stronger than my excuses.",
    "I show up even when motivation is low.",
    "My focus creates my success.",
    "Deep work brings great results.",
    "I prioritize what truly matters.",
    "I work smarter every day.",
    "Every task completed moves me forward.",
    "I manage my time wisely.",
    "I stay calm under pressure.",
    "My work adds value.",
    "I improve with every project.",
    "Consistency beats intensity.",
    "My body deserves care and respect.",
    "I nourish my body with healthy choices.",
    "Movement is my daily medicine.",
    "I am becoming healthier every day.",
    "My mind and body work together.",
    "I choose energy over excuses.",
    "Rest is part of success.",
    "I am grateful for my health.",
    "Every healthy habit compounds.",
    "My health is my greatest investment.",
    "I believe in myself.",
    "I deserve success and happiness.",
    "My mindset shapes my reality.",
    "I learn from every mistake.",
    "I let go of self-doubt.",
    "Confidence grows with action.",
    "I am enough.",
    "I attract positive energy.",
    "My potential is limitless.",
    "I create the life I want.",
    "Opportunities find me every day.",
    "I am building financial freedom.",
    "My skills create value.",
    "I welcome abundance into my life.",
    "Every day I become more successful.",
    "I invest in my future self.",
    "Growth is my daily habit.",
    "I celebrate every win, big or small.",
    "Great things are on their way.",
    "Today, I become a better version of myself."
  ];

  const el = document.getElementById('affirmation-text');
  if (!el) return;

  const randomQuote = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  el.textContent = randomQuote;
}

/**
 * Initializes the live clock and date display.
 */
function initClock() {
  const clockDisplay = document.getElementById('clock-display');
  const dateDisplay = document.getElementById('date-display');

  function updateClock() {
    const now = new Date();
    
    // Time formatting (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;

    // Date formatting (e.g. "Saturday, June 13, 2026")
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString(undefined, options);
  }

  // Update immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Initializes and displays the focus mode stats.
 */
function initFocusStats() {
  const container = document.getElementById('focus-stats-container');
  const streakEl = document.getElementById('stat-current-streak');
  const highestStreakEl = document.getElementById('stat-highest-streak');
  const hoursEl = document.getElementById('stat-highest-hours');
  
  if (!container || !streakEl || !highestStreakEl || !hoursEl) return;
  
  function renderStats(stats) {
    if (!stats) stats = { currentStreak: 0, highestStreak: 0, highestDailyFocusTime: 0 };
    
    streakEl.textContent = stats.currentStreak || 0;
    highestStreakEl.textContent = stats.highestStreak || 0;
    
    // Convert highest ms to hours (e.g. 1.2h or 0m)
    const highestMs = stats.highestDailyFocusTime || 0;
    if (highestMs === 0) {
      hoursEl.textContent = '0h';
    } else {
      const totalMins = Math.floor(highestMs / (1000 * 60));
      if (totalMins < 60) {
        hoursEl.textContent = totalMins + 'm';
      } else {
        hoursEl.textContent = (totalMins / 60).toFixed(1) + 'h';
      }
    }
  }

  // Load initial
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['focusStats'], (result) => {
      renderStats(result.focusStats);
    });
    
    // Listen for live changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.focusStats) {
        renderStats(changes.focusStats.newValue);
      }
    });
  }
}

/**
 * Initializes and manages Light/Dark theme switching.
 */
function initTheme() {
  const lightRadio = document.getElementById('theme-light');
  const darkRadio = document.getElementById('theme-dark');
  if (!lightRadio || !darkRadio) return;

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      darkRadio.checked = true;
    } else {
      document.body.classList.remove('theme-dark');
      lightRadio.checked = true;
    }
  }

  // Load from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['themeMode'], (result) => {
      applyTheme(result.themeMode || 'light');
    });
  }

  // Listen to UI changes
  lightRadio.addEventListener('change', () => {
    if (lightRadio.checked) {
      applyTheme('light');
      if (typeof chrome !== 'undefined') chrome.storage.local.set({ themeMode: 'light' });
    }
  });

  darkRadio.addEventListener('change', () => {
    if (darkRadio.checked) {
      applyTheme('dark');
      if (typeof chrome !== 'undefined') chrome.storage.local.set({ themeMode: 'dark' });
    }
  });
}

/**
 * Initializes greeting text based on current hour and saved userName.
 */
function initGreeting() {
  const greetingText = document.getElementById('greeting-text');

  // We check for userName in chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['userName'], (result) => {
      const name = result.userName || 'friend';
      setGreetingText(name);
    });
  } else {
    setGreetingText('friend');
  }

  function setGreetingText(name) {
    const hour = new Date().getHours();
    let salutation = 'Hello';

    if (hour >= 5 && hour < 12) {
      salutation = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      salutation = 'Good afternoon';
    } else {
      salutation = 'Good evening';
    }

    greetingText.textContent = `${salutation}, ${name}`;
  }
}

/**
 * Initializes wallpaper from local storage if available.
 */
function initWallpaper() {
  const wallpaperContainer = document.getElementById('wallpaper-container');
  
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['wallpaperDataUrl'], (result) => {
      if (result.wallpaperDataUrl) {
        document.body.classList.add('has-wallpaper');
        wallpaperContainer.style.backgroundImage = `url('${result.wallpaperDataUrl}')`;
      } else {
        document.body.classList.remove('has-wallpaper');
        wallpaperContainer.style.backgroundImage = 'none';
      }
    });
  }
}

/**
 * Initializes the Settings modal interactions and logic.
 */
function initSettings() {
  const triggerBtn = document.getElementById('settings-trigger');
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('settings-close');
  const cancelBtn = document.getElementById('settings-cancel');
  const form = document.getElementById('settings-form');
  const usernameInput = document.getElementById('username-input');
  const wallpaperInput = document.getElementById('wallpaper-input');
  const fileNameLabel = document.getElementById('file-name-label');
  const blocklistInput = document.getElementById('blocklist-input');
  const blocklistFeedback = document.getElementById('blocklist-feedback');
  const reminderTimeInput = document.getElementById('reminder-time-input');
  const testDailyBtn = document.getElementById('test-daily-btn');
  const testWeeklyBtn = document.getElementById('test-weekly-btn');
  const testMonthlyBtn = document.getElementById('test-monthly-btn');

  let selectedWallpaperDataUrl = null;

  // Open modal
  triggerBtn.addEventListener('click', () => {
    // Load current settings from storage and pre-populate
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['userName', 'blockedSites', 'reminderSettings'], (result) => {
        usernameInput.value = result.userName || '';
        const sites = result.blockedSites || [];
        blocklistInput.value = sites.join('\n');
        const rs = result.reminderSettings || {};
        reminderTimeInput.value = rs.dailyHoursTime || '18:00';
      });
    } else {
      usernameInput.value = usernameInput.value || '';
      blocklistInput.value = '';
      reminderTimeInput.value = '18:00';
    }
    
    // Reset file selection details and feedback
    wallpaperInput.value = '';
    fileNameLabel.textContent = 'No file chosen';
    selectedWallpaperDataUrl = null;
    blocklistFeedback.textContent = '';
    blocklistFeedback.className = 'blocklist-feedback';

    modal.style.display = 'flex';
  });

  // Close modal functions
  function closeModal() {
    modal.style.display = 'none';
  }

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });

  // Handle file input changes for wallpaper
  wallpaperInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      fileNameLabel.textContent = 'No file chosen';
      selectedWallpaperDataUrl = null;
      return;
    }

    fileNameLabel.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(event) {
      compressWallpaper(event.target.result, (compressedBase64) => {
        selectedWallpaperDataUrl = compressedBase64;
      });
    };
    reader.readAsDataURL(file);
  });

  // Handle Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = usernameInput.value.trim();

    // Parse, validate and deduplicate blocked sites
    const rawLines = blocklistInput.value.split('\n');
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    const validDomains = [];
    const invalidDomains = [];

    rawLines.forEach(line => {
      const domain = line.trim().toLowerCase().replace(/^www\./, '');
      if (!domain) return;
      if (domainRegex.test(domain)) {
        if (!validDomains.includes(domain)) validDomains.push(domain);
      } else {
        invalidDomains.push(line.trim());
      }
    });

    if (invalidDomains.length > 0) {
      blocklistFeedback.textContent = `Skipped invalid: ${invalidDomains.join(', ')}`;
      blocklistFeedback.className = 'blocklist-feedback error';
    } else if (validDomains.length > 0) {
      blocklistFeedback.textContent = `${validDomains.length} site${validDomains.length > 1 ? 's' : ''} saved.`;
      blocklistFeedback.className = 'blocklist-feedback success';
    } else {
      blocklistFeedback.textContent = '';
      blocklistFeedback.className = 'blocklist-feedback';
    }

    const dataToSave = {
      userName: name,
      blockedSites: validDomains,
      reminderSettings: { dailyHoursTime: reminderTimeInput.value || '18:00' }
    };

    if (selectedWallpaperDataUrl) {
      dataToSave.wallpaperDataUrl = selectedWallpaperDataUrl;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(dataToSave, () => {
        // Update greeting and background without reloading
        initGreeting();
        if (selectedWallpaperDataUrl) {
          initWallpaper();
        }
        closeModal();
      });
    } else {
      // Fallback for non-extension mock testing
      console.log('Saved settings (mock):', dataToSave);
      // Mock update
      const greetingText = document.getElementById('greeting-text');
      const hour = new Date().getHours();
      let salutation = 'Hello';
      if (hour >= 5 && hour < 12) salutation = 'Good morning';
      else if (hour >= 12 && hour < 17) salutation = 'Good afternoon';
      else salutation = 'Good evening';
      greetingText.textContent = `${salutation}, ${name || 'friend'}`;

      if (selectedWallpaperDataUrl) {
        document.body.classList.add('has-wallpaper');
        document.getElementById('wallpaper-container').style.backgroundImage = `url('${selectedWallpaperDataUrl}')`;
      }
      closeModal();
    }
  });

  // ── Test Notification Buttons ─────────────────────────────────────────────
  function sendTestNotification(type) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'testNotification', type });
    }
  }

  testDailyBtn.addEventListener('click', () => sendTestNotification('daily'));
  testWeeklyBtn.addEventListener('click', () => sendTestNotification('weekly'));
  testMonthlyBtn.addEventListener('click', () => sendTestNotification('monthly'));
}

/**
 * Compresses an image to fit within local storage limits (max 1920px bounding box, JPEG, 0.85 quality).
 */
function compressWallpaper(dataUrl, callback) {
  const img = new Image();
  img.src = dataUrl;
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxDim = 1920;
    let width = img.width;
    let height = img.height;
    
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to JPEG with 0.85 quality
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    callback(compressedDataUrl);
  };
}

/**
 * Initializes the Daily Focus Prompt and display.
 */
function initFocus() {
  const focusForm = document.getElementById('focus-form');
  const focusInput = document.getElementById('focus-input');
  const focusDisplayContainer = document.getElementById('focus-display-container');
  const focusText = document.getElementById('focus-text');
  const focusClearBtn = document.getElementById('focus-clear');

  const todayStr = getTodayDateString();

  // Load focus from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['focus'], (result) => {
      const savedFocus = result.focus;
      if (savedFocus && savedFocus.date === todayStr) {
        showFocusText(savedFocus.text);
      } else {
        // If it's a new day or focus doesn't exist, reset/show prompt
        showFocusForm();
      }
    });
  } else {
    // Fallback/mock logic for standalone testing
    const savedMockFocus = JSON.parse(localStorage.getItem('mock_focus'));
    if (savedMockFocus && savedMockFocus.date === todayStr) {
      showFocusText(savedMockFocus.text);
    } else {
      showFocusForm();
    }
  }

  // Handle Form Submit
  focusForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = focusInput.value.trim();
    if (!text) return;

    const focusData = { text: text, date: todayStr };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ focus: focusData }, () => {
        showFocusText(text);
      });
    } else {
      localStorage.setItem('mock_focus', JSON.stringify(focusData));
      showFocusText(text);
    }
  });

  // Handle Clear click
  focusClearBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['focus'], () => {
        showFocusForm();
      });
    } else {
      localStorage.removeItem('mock_focus');
      showFocusForm();
    }
  });

  function showFocusText(text) {
    focusText.textContent = text;
    focusForm.style.display = 'none';
    focusDisplayContainer.style.display = 'flex';
  }

  function showFocusForm() {
    focusInput.value = '';
    focusDisplayContainer.style.display = 'none';
    focusForm.style.display = 'flex';
  }
}

/**
 * Returns the current date in YYYY-MM-DD local format.
 */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initializes the Task List widget: load, render, add, toggle, delete.
 */
function initTasks() {
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const taskCount = document.getElementById('task-count');

  let tasks = [];

  // Load tasks from storage
  loadTasks();

  // Handle Add Task form submit
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now().toString(),
      text: text,
      done: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
  });

  // Event delegation for checkbox and delete actions
  taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      const id = e.target.dataset.id;
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.done = e.target.checked;
        saveTasks();
        // Toggle done class on parent item
        const item = e.target.closest('.task-item');
        if (item) item.classList.toggle('done', task.done);
        updateCount();
      }
    }
  });

  taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('task-delete-btn')) {
      const id = e.target.dataset.id;
      const item = e.target.closest('.task-item');
      // Animate out before removing
      if (item) {
        item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-12px)';
        setTimeout(() => {
          tasks = tasks.filter(t => t.id !== id);
          saveTasks();
          renderTasks();
        }, 200);
      } else {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
      }
    }
  });

  function loadTasks() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['tasks'], (result) => {
        tasks = result.tasks || [];
        renderTasks();
      });
    } else {
      tasks = JSON.parse(localStorage.getItem('mock_tasks') || '[]');
      renderTasks();
    }
  }

  function saveTasks() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ tasks });
    } else {
      localStorage.setItem('mock_tasks', JSON.stringify(tasks));
    }
  }

  function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'task-empty-state';
      empty.textContent = 'No tasks yet — add one above!';
      taskList.appendChild(empty);
      updateCount();
      return;
    }

    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = `task-item${task.done ? ' done' : ''}`;
      li.dataset.id = task.id;
      li.style.animationDelay = `${index * 0.05}s`;
      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.done ? 'checked' : ''} aria-label="Mark task done">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="task-delete-btn" data-id="${task.id}" aria-label="Delete task">&times;</button>
      `;
      taskList.appendChild(li);
    });

    updateCount();
  }

  function updateCount() {
    const remaining = tasks.filter(t => !t.done).length;
    taskCount.textContent = remaining;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }
}

/**
 * Initializes the Focus Mode toggle switch — reads state, binds clicks, persists to storage.
 */
function initFocusMode() {
  const toggle = document.getElementById('focus-mode-switch');
  if (!toggle) return;

  // Load initial state from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['focusModeEnabled'], (result) => {
      toggle.checked = result.focusModeEnabled === true;
    });
  }

  // Save new state when toggled
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ focusModeEnabled: enabled });
      // Background service worker will react via storage.onChanged
    }
  });
}
