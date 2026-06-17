// pomodoro.js - Logic for Pomodoro Timer Widget

const POMODORO_DEFAULT_STATE = {
  focusDurationMin: 25,
  breakDurationMin: 5,
  phase: 'focus', // 'focus' | 'break'
  status: 'idle', // 'idle' | 'running' | 'paused'
  phaseStartTimestamp: null,
  remainingSeconds: 25 * 60,
  completedPomodoros: 0
};

// DOM Elements
const pomPhaseLabel = document.getElementById('pomodoro-phase-label');
const pomTimerDisplay = document.getElementById('pomodoro-timer-display');
const pomStartBtn = document.getElementById('pomodoro-start-btn');
const pomPauseBtn = document.getElementById('pomodoro-pause-btn');
const pomResumeBtn = document.getElementById('pomodoro-resume-btn');
const pomResetBtn = document.getElementById('pomodoro-reset-btn');
const pomCountDisplay = document.getElementById('pomodoro-count-display');
const pomSettingsTrigger = document.getElementById('pomodoro-settings-trigger');
const pomSettingsModal = document.getElementById('pomodoro-settings-modal');
const pomSettingsForm = document.getElementById('pomodoro-settings-form');
const pomSettingsCancel = document.getElementById('pomodoro-settings-cancel');
const pomFocusInput = document.getElementById('pomodoro-focus-length');
const pomBreakInput = document.getElementById('pomodoro-break-length');

let pomLocalInterval = null;
let currentPomState = { ...POMODORO_DEFAULT_STATE };

// ─── Initialization ────────────────────────────────────────────────────────────

function initPomodoro() {
  chrome.storage.local.get(['pomodoro'], (result) => {
    if (result.pomodoro) {
      currentPomState = result.pomodoro;
    } else {
      currentPomState = { ...POMODORO_DEFAULT_STATE };
      savePomodoroState(currentPomState);
    }
    
    // Sync settings form
    pomFocusInput.value = currentPomState.focusDurationMin;
    pomBreakInput.value = currentPomState.breakDurationMin;

    updatePomodoroUI();
    startLocalTimerIfRunning();
  });

  // Listen for background state changes (e.g., alarm fired)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.pomodoro) {
      currentPomState = changes.pomodoro.newValue;
      updatePomodoroUI();
      startLocalTimerIfRunning();
    }
  });

  setupPomodoroEventListeners();
}

// ─── Core Logic ────────────────────────────────────────────────────────────────

function savePomodoroState(state) {
  chrome.storage.local.set({ pomodoro: state });
}

function handleStart() {
  currentPomState.status = 'running';
  currentPomState.phaseStartTimestamp = Date.now();
  // Ensure remaining time matches duration if starting fresh
  const durationMin = currentPomState.phase === 'focus' ? currentPomState.focusDurationMin : currentPomState.breakDurationMin;
  if (currentPomState.remainingSeconds === undefined || currentPomState.remainingSeconds <= 0 || currentPomState.remainingSeconds === durationMin * 60) {
     currentPomState.remainingSeconds = durationMin * 60;
  }
  
  savePomodoroState(currentPomState);
  
  chrome.alarms.create('pomodoroAlarm', {
    delayInMinutes: currentPomState.remainingSeconds / 60
  });
}

function handlePause() {
  chrome.alarms.clear('pomodoroAlarm');
  
  // Calculate exactly how much time is left
  const elapsed = Math.floor((Date.now() - currentPomState.phaseStartTimestamp) / 1000);
  currentPomState.remainingSeconds = Math.max(0, currentPomState.remainingSeconds - elapsed);
  currentPomState.status = 'paused';
  currentPomState.phaseStartTimestamp = null;
  
  savePomodoroState(currentPomState);
}

function handleResume() {
  currentPomState.status = 'running';
  currentPomState.phaseStartTimestamp = Date.now();
  
  savePomodoroState(currentPomState);
  
  chrome.alarms.create('pomodoroAlarm', {
    delayInMinutes: currentPomState.remainingSeconds / 60
  });
}

function handleReset() {
  chrome.alarms.clear('pomodoroAlarm');
  
  currentPomState.phase = 'focus';
  currentPomState.status = 'idle';
  currentPomState.phaseStartTimestamp = null;
  currentPomState.remainingSeconds = currentPomState.focusDurationMin * 60;
  
  savePomodoroState(currentPomState);
}

// ─── UI Rendering ──────────────────────────────────────────────────────────────

function updatePomodoroUI() {
  // Update Phase Label
  pomPhaseLabel.textContent = currentPomState.phase === 'focus' ? 'Focus' : 'Break';
  if (currentPomState.phase === 'break') {
    pomPhaseLabel.classList.add('break');
  } else {
    pomPhaseLabel.classList.remove('break');
  }

  // Update Tomatoes
  pomCountDisplay.innerHTML = '';
  for (let i = 0; i < currentPomState.completedPomodoros; i++) {
    const tomato = document.createElement('span');
    tomato.textContent = '🍅';
    pomCountDisplay.appendChild(tomato);
  }

  // Update Time
  renderTimeDisplay();

  // Update Buttons
  pomStartBtn.classList.add('hidden');
  pomPauseBtn.classList.add('hidden');
  pomResumeBtn.classList.add('hidden');
  pomResetBtn.classList.add('hidden');

  if (currentPomState.status === 'idle') {
    pomStartBtn.classList.remove('hidden');
  } else if (currentPomState.status === 'running') {
    pomPauseBtn.classList.remove('hidden');
    pomResetBtn.classList.remove('hidden');
  } else if (currentPomState.status === 'paused') {
    pomResumeBtn.classList.remove('hidden');
    pomResetBtn.classList.remove('hidden');
  }
}

function renderTimeDisplay() {
  let secondsLeft = currentPomState.remainingSeconds;
  
  if (currentPomState.status === 'running' && currentPomState.phaseStartTimestamp) {
    const elapsed = Math.floor((Date.now() - currentPomState.phaseStartTimestamp) / 1000);
    secondsLeft = Math.max(0, currentPomState.remainingSeconds - elapsed);
  }

  const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const s = (secondsLeft % 60).toString().padStart(2, '0');
  pomTimerDisplay.textContent = `${m}:${s}`;
}

function startLocalTimerIfRunning() {
  if (pomLocalInterval) {
    clearInterval(pomLocalInterval);
    pomLocalInterval = null;
  }
  
  if (currentPomState.status === 'running') {
    pomLocalInterval = setInterval(() => {
      renderTimeDisplay();
      // Safety: if it reaches 0, the background alarm should fire shortly. 
      // We can stop the local interval visually so it doesn't go negative.
      if (pomTimerDisplay.textContent === '00:00') {
        clearInterval(pomLocalInterval);
      }
    }, 1000);
  }
}

// ─── Event Listeners ───────────────────────────────────────────────────────────

function setupPomodoroEventListeners() {
  pomStartBtn.addEventListener('click', handleStart);
  pomPauseBtn.addEventListener('click', handlePause);
  pomResumeBtn.addEventListener('click', handleResume);
  pomResetBtn.addEventListener('click', handleReset);

  // Settings
  pomSettingsTrigger.addEventListener('click', () => {
    pomSettingsModal.classList.toggle('hidden');
  });

  pomSettingsCancel.addEventListener('click', () => {
    pomSettingsModal.classList.add('hidden');
    // Reset form values to current state
    pomFocusInput.value = currentPomState.focusDurationMin;
    pomBreakInput.value = currentPomState.breakDurationMin;
  });

  pomSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newFocus = parseInt(pomFocusInput.value, 10);
    const newBreak = parseInt(pomBreakInput.value, 10);

    if (newFocus && newBreak) {
      currentPomState.focusDurationMin = newFocus;
      currentPomState.breakDurationMin = newBreak;
      
      // If currently idle and in focus phase, update remaining time immediately
      if (currentPomState.status === 'idle' && currentPomState.phase === 'focus') {
        currentPomState.remainingSeconds = newFocus * 60;
      }
      
      savePomodoroState(currentPomState);
      pomSettingsModal.classList.add('hidden');
    }
  });

  // Close settings when clicking outside
  document.addEventListener('click', (e) => {
    if (!pomSettingsModal.classList.contains('hidden') &&
        !pomSettingsModal.contains(e.target) &&
        !pomSettingsTrigger.contains(e.target)) {
      pomSettingsModal.classList.add('hidden');
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', initPomodoro);
