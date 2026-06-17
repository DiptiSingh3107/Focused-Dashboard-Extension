## Prompt for Antigravity: Add Pomodoro Timer Panel

I have an existing Chrome extension (focusboard) that replaces the new tab page with a productivity dashboard (wallpaper, greeting, clock, daily focus, task list, focus mode, period tracker, settings). I want to add a **Pomodoro Timer panel**.

### Placement
- Add as its own **separate panel/card** on the dashboard (do not merge into the task list).
- Match the existing dashboard's visual style (card background/blur, border-radius, fonts, spacing, color variables).
- Suggested location: near the task list or focus section — keep it visually balanced with other panels.

### Core Functionality
- **Classic Pomodoro cycle**: 25 minutes focus → 5 minutes break → repeat.
- Controls: **Start**, **Pause/Resume**, **Reset**.
- Large, clearly visible **countdown timer** (MM:SS format).
- Label showing current phase: "Focus" or "Break".
- A small indicator of completed Pomodoro count for the current session (e.g., "🍅🍅🍅" or "Pomodoros today: 3").

### Configurable Durations
- In the panel's settings (small gear icon or inline edit), allow the user to configure:
  - Focus duration (minutes) — default 25
  - Break duration (minutes) — default 5
- Persist these settings in `chrome.storage.local`.

### Phase Transitions
- When the Focus timer hits 0:
  - Fire a **Chrome notification** (e.g., "Focus session complete! Time for a break.")
  - Automatically start the Break timer (no extra click needed) — but show a brief "Starting break..." state so it doesn't feel abrupt.
- When the Break timer hits 0:
  - Fire a **Chrome notification** (e.g., "Break's over! Ready for another focus session?")
  - Do **not** auto-start the next focus session — require the user to click "Start" again (avoids endless background running when the user has stepped away).
- Increment the completed-Pomodoro counter each time a Focus phase completes.

### Timer Persistence Across Tab Close/Reload
- The timer state (phase, remaining time, running/paused, start timestamp) must be stored in `chrome.storage.local` so it persists if the new tab is closed and reopened.
- Use the **background service worker with `chrome.alarms`** to track actual elapsed time (don't rely solely on `setInterval` in the tab, since the new tab page can be closed/unloaded):
  - On Start, record `phaseStartTimestamp` and `phaseDurationSeconds` in storage, and set a `chrome.alarms` alarm for when the phase should end.
  - The new tab's UI computes remaining time on load/render as `phaseDurationSeconds - (Date.now() - phaseStartTimestamp) / 1000`, then uses a local `setInterval` (1s) just for the visible countdown while the tab is open.
  - When the `chrome.alarms` alarm fires (even if no new tab is open), the background service worker fires the Chrome notification and updates the stored phase/state (switching to break or marking ready-for-next-focus).
  - On Pause: clear the alarm, store `remainingSeconds` and set state to "paused". On Resume: recompute `phaseStartTimestamp = now`, re-set the alarm for the remaining duration.
  - On Reset: clear any alarm, reset state to initial Focus phase with full duration, not running.
- Make sure intervals (`setInterval`) are properly cleared on unmount/reload to avoid duplicate timers.

### Notifications
- Use `chrome.notifications.create` with a clear title/message for:
  - Focus phase complete → break starting
  - Break phase complete → ready for next focus
- Ensure `notifications` permission is already declared (it should be from the existing reminders feature) — reuse it.

### Visual States
- **Idle/Reset**: Shows full focus duration (e.g., "25:00"), "Start" button, phase label "Focus".
- **Running (Focus)**: Countdown ticking down, "Pause" and "Reset" buttons visible, phase label "Focus", maybe a subtle progress ring/bar.
- **Running (Break)**: Same as above but phase label "Break", different accent color (e.g., green vs red/orange for focus).
- **Paused**: Countdown frozen, "Resume" and "Reset" buttons visible.
- On phase completion: brief visual celebration (e.g., a short animation, checkmark, or color flash) in addition to the notification.

### Data Persistence (chrome.storage.local)
```json
{
  "pomodoro": {
    "focusDurationMin": 25,
    "breakDurationMin": 5,
    "phase": "focus" | "break",
    "status": "idle" | "running" | "paused",
    "phaseStartTimestamp": 1234567890,
    "remainingSeconds": 1500,
    "completedPomodoros": 0
  }
}
```

### Files to Touch
- Add new HTML markup for this panel inside `newtab.html`.
- New JS file (e.g., `pomodoro.js`) for UI rendering, button handlers, and countdown display logic — included alongside existing `newtab.js`.
- Extend `background.js` (service worker) to handle `chrome.alarms` for phase transitions and fire `chrome.notifications`.
- Add corresponding CSS to the existing stylesheet, matching current card styles and color variables.
- No new permissions required beyond `alarms` and `notifications` (already present from reminders feature).

### Success Criteria
- Clicking Start begins a 25-minute countdown that visibly ticks down.
- A Chrome notification fires when the Focus timer hits 0, and the Break timer (5 min) starts automatically.
- A Chrome notification fires when the Break timer hits 0.
- Pause/Resume and Reset work correctly at any point.
- Timer state survives closing and reopening the new tab (and even browser restart) without losing accuracy.
- Pomodoro count increments correctly after each completed focus session.

Please implement this incrementally and make sure it doesn't break the existing dashboard layout or other widgets.
