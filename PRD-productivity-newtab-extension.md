# PRD: Personal Productivity New Tab Dashboard (Chrome Extension)

## 1. Overview

A Chrome extension (Manifest V3) that overrides the new tab page with a personalized productivity dashboard. It combines a wallpaper, greeting, clock, daily focus prompt, task list, and a "Focus Mode" site blocker, plus periodic reminders (weekly timesheet, daily hours log, monthly auto-payment check).

**Target platform:** Chrome (Manifest V3), local-only storage (no backend/server). All data stored via `chrome.storage.local`.

## 2. Goals

- Replace default new tab with a calming, personalized dashboard.
- Reduce distraction via a site-blocking Focus Mode.
- Provide lightweight daily task management.
- Surface recurring reminders (weekly/daily/monthly) without external services.

## 3. Non-Goals

- No cloud sync / multi-device sync (v1).
- No account/login system.
- No mobile browser support (Chrome desktop only for v1).
- No notification permissions beyond Chrome's built-in `notifications` API.

## 4. Tech Stack Recommendation

- Manifest V3
- Vanilla JS + HTML/CSS (no framework needed; keeps it lightweight). React optional if the coding tool prefers, but vanilla is simpler for this scope.
- `chrome.storage.local` for persistence (wallpaper image stored as base64 or object URL via IndexedDB if large).
- `chrome.alarms` API for daily/weekly/monthly checks.
- `chrome.notifications` API for reminder popups.
- `declarativeNetRequest` API for Focus Mode site blocking.

## 5. Permissions Needed

```json
"permissions": [
  "storage",
  "alarms",
  "notifications",
  "declarativeNetRequest",
  "tabs"
],
"host_permissions": ["<all_urls>"],
"chrome_url_overrides": { "newtab": "newtab.html" }
```

---

## 6. Feature Breakdown

### 6.1 New Tab Dashboard
- Full-screen background image (user-uploaded; falls back to default gradient/color if none set).
- Greeting: "Good morning/afternoon/evening, [Name]" based on time of day.
- Live clock (HH:MM:SS, updates every second) and date.
- Daily Focus Prompt:
  - On first new-tab load of a new calendar day, show a modal/input: "What is your main focus today?"
  - Save the answer with the date it was set.
  - Display the focus text prominently on the dashboard for the rest of the day.
  - At midnight (or next day's first load), clear/reset and prompt again.

### 6.2 Task List
- Add task (text input + enter/button).
- Mark task done (checkbox; strikethrough style).
- Delete task (x button).
- Persisted in `chrome.storage.local`. Tasks do NOT auto-reset daily (persist until deleted).

### 6.3 Focus Mode
- Toggle switch on dashboard (ON/OFF).
- When ON:
  - Uses `declarativeNetRequest` to redirect requests to blocked domains (default list: instagram.com, youtube.com, facebook.com, twitter.com/x.com, tiktok.com, reddit.com — user-editable) to a local "blocked" page.
  - Blocked page displays today's Focus message (e.g., "Stay focused: [focus text]") instead of a generic error, with a button to return to new tab or disable Focus Mode.
- When OFF: rules removed, normal browsing resumes.
- State persisted so toggle survives browser restarts.

### 6.4 Settings Panel
- Gear icon opens a settings overlay/modal with:
  - Name input (used in greeting).
  - Wallpaper upload (image file -> stored locally, resized/compressed before storage to avoid quota issues).
  - Block list management (add/remove domains as plain text list, one per line or tag-style).
  - Save/Cancel buttons.

### 6.5 Reminders (via `chrome.alarms` + `chrome.notifications`)
- **Daily reminder**: Every day (configurable time, default e.g. 6 PM), notification: "Don't forget to log today's hours in your Timesheet."
- **Weekly reminder (Fridays)**: Notification: "Reminder: Submit your timesheet for this week."
- **Monthly reminder (last day of month)**: Notification: "Reminder: Check your Auto-Payments for this month."
- All reminders fire via `chrome.alarms` (background service worker), shown via `chrome.notifications.create`.
- Last-day-of-month logic: compute by checking if `tomorrow.getDate() === 1`.

---

## 7. Data Model (chrome.storage.local keys)

```json
{
  "userName": "string",
  "wallpaperDataUrl": "string (base64 image)",
  "focus": { "text": "string", "date": "YYYY-MM-DD" },
  "tasks": [
    { "id": "uuid", "text": "string", "done": false }
  ],
  "focusModeEnabled": false,
  "blockedSites": ["instagram.com", "youtube.com", "..."],
  "reminderSettings": {
    "dailyHoursTime": "18:00",
    "lastNotifiedDates": {
      "dailyHours": "YYYY-MM-DD",
      "weeklyTimesheet": "YYYY-MM-DD",
      "monthlyAutoPay": "YYYY-MM-DD"
    }
  }
}
```

---

## 8. Build Phases

### Phase 1 — Project Scaffolding & Basic New Tab
- Set up Manifest V3 project structure (`manifest.json`, `newtab.html`, `newtab.js`, `newtab.css`, `background.js`/service worker, `icons/`).
- Override new tab page with a basic HTML page.
- Implement live clock and date display.
- Implement greeting using a hardcoded name placeholder.
- Verify extension loads correctly via `chrome://extensions` (Developer mode, "Load unpacked").

**Deliverable:** Extension installs and shows a blank-styled new tab with clock + placeholder greeting.

---

### Phase 2 — Settings: Name & Wallpaper
- Build settings gear icon + modal/overlay UI.
- Add "Your Name" input field; save to `chrome.storage.local`; update greeting dynamically.
- Add wallpaper upload (file input, accept images); read as base64, compress/resize if needed, save to storage, apply as full-screen `background-image`.
- Provide default fallback background if no wallpaper set.

**Deliverable:** User can set their name (greeting updates) and upload a wallpaper that persists across sessions.

---

### Phase 3 — Daily Focus Prompt
- On new tab load, check stored `focus.date` vs today's date.
- If different (or empty), show a modal prompting "What is your main focus today?" with a text input and submit button.
- Save focus text + today's date to storage.
- Display the focus text prominently on the dashboard (e.g., below greeting).
- If `focus.date` === today, skip the modal and just show the saved focus.

**Deliverable:** Daily focus prompt appears once per day, persists visibly all day, resets next day.

---

### Phase 4 — Task List
- Build task list UI: input field + "Add" button, list of tasks below.
- Each task row: checkbox (toggle done -> strikethrough), text, delete (x) button.
- Persist tasks array to `chrome.storage.local` on every change.
- Load tasks on page load and render.

**Deliverable:** Fully functional add/complete/delete task list, persisted between sessions.

---

### Phase 5 — Focus Mode & Site Blocking
- Add Focus Mode toggle UI on dashboard.
- Implement `declarativeNetRequest` dynamic rules in the background service worker:
  - On toggle ON: register rules that redirect requests to domains in `blockedSites` to a local `blocked.html` page.
  - On toggle OFF: remove those rules.
- Build `blocked.html`: displays today's focus text (e.g., "Stay focused on: {focus}") and a button/link back to new tab.
- Persist `focusModeEnabled` state and re-apply rules on browser startup (service worker init).

**Deliverable:** Toggling Focus Mode blocks listed sites and shows the custom focus page; toggling off restores normal access.

---

### Phase 6 — Settings: Block List Management
- Extend settings modal with a textarea or tag-input for managing `blockedSites` (add/remove domains).
- Provide sensible defaults (instagram.com, youtube.com, facebook.com, x.com, tiktok.com, reddit.com) pre-populated on first install.
- On save, update storage and re-apply `declarativeNetRequest` rules if Focus Mode is currently ON.

**Deliverable:** User can fully customize which sites get blocked, with changes taking effect immediately.

---

### Phase 7 — Reminders (Alarms + Notifications)
- In background service worker, register `chrome.alarms`:
  - A recurring alarm that fires periodically (e.g., every 30–60 min) to check current date/time against reminder conditions.
- Logic on each alarm fire:
  - **Daily hours reminder**: if current time >= configured `dailyHoursTime` and `lastNotifiedDates.dailyHours !== today`, show notification "Add today's hours to your Timesheet" and update `lastNotifiedDates.dailyHours`.
  - **Weekly timesheet reminder**: if today is Friday and `lastNotifiedDates.weeklyTimesheet !== today`, show notification "Submit your timesheet for this week" and update timestamp.
  - **Monthly auto-payment reminder**: if tomorrow's date is the 1st (i.e., today is last day of month) and `lastNotifiedDates.monthlyAutoPay !== today`, show notification "Check your Auto-Payments for this month" and update timestamp.
- Use `chrome.notifications.create` with basic icon/title/message for each.
- Ensure alarms are re-registered on `chrome.runtime.onStartup` and `onInstalled`.

**Deliverable:** All three reminder types fire correctly at the right times, each only once per applicable day.

---

### Phase 8 — Polish & Edge Cases
- Style pass: layout consistency, responsive sizing for different screen resolutions, readable text over wallpaper (add overlay/gradient for contrast).
- Handle storage quota: ensure wallpaper image size is compressed (e.g., max ~1–2MB after compression) to avoid `chrome.storage.local` limits; consider `chrome.storage.local` quota increase via `unlimitedStorage` permission if needed.
- Handle empty states (no tasks, no wallpaper, no focus set yet).
- Test Focus Mode against URL variants (with/without `www.`, subdomains, mobile vs desktop YouTube domains, etc.).
- Add a "Disable Focus Mode" quick action on the blocked page.
- Final QA: fresh install flow, daily reset behavior across a simulated day change (test by changing system date or mocking date logic).

**Deliverable:** Polished, stable v1 ready for personal daily use.

---

## 9. Open Questions / Future Enhancements (Not in v1)
- Sync across devices via `chrome.storage.sync` (note: image wallpapers won't fit in sync storage quota).
- Customizable reminder times for weekly/monthly reminders.
- Task list categories or due dates.
- Pomodoro timer integration with Focus Mode.
- Multiple wallpapers / rotation.

---

## 10. Acceptance Criteria Summary

| Feature | Acceptance Criteria |
|---|---|
| Wallpaper | User-uploaded image displays full-screen and persists after browser restart |
| Greeting | Shows correct name and time-of-day-appropriate greeting |
| Clock | Updates live, accurate to the second |
| Daily Focus | Prompted once per calendar day; visible all day; resets at next day |
| Task List | Add/complete/delete works and persists |
| Focus Mode | Toggling blocks configured sites and shows focus message instead of error |
| Settings | Name, wallpaper, and block list are all editable and persist |
| Friday Reminder | Notification fires once on Fridays |
| Daily Hours Reminder | Notification fires once daily at configured time |
| Month-End Reminder | Notification fires once on the last day of each month |
