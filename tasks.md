# Project Task List: Personal Productivity New Tab Dashboard (Chrome Extension)

This document breaks down the implementation of the Personal Productivity New Tab Dashboard into atomic-level tasks grouped by phase, showing clear dependencies.

---

## Phase 1: Project Scaffolding & Basic New Tab

### Scaffolding & Configuration
- [x] Create extension directory structure with the following files:
  - [manifest.json](file:///d:/CodeBasics/focusboard/manifest.json)
  - [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html)
  - [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css)
  - [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js)
  - [background.js](file:///d:/CodeBasics/focusboard/background.js)
  - Create directory `icons/` and populate with standard extension icons (`icon16.png`, `icon48.png`, `icon128.png`).
- [x] Write [manifest.json](file:///d:/CodeBasics/focusboard/manifest.json) with basic Manifest V3 structure:
  - Define metadata (name, version, description).
  - Add Chrome URL overrides for `newtab` linking to [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html).
  - Declare required permissions: `"storage"`, `"alarms"`, `"notifications"`, `"declarativeNetRequest"`, `"tabs"`.
  - Add host permissions for dynamic site redirect: `"host_permissions": ["<all_urls>"]`.
  - Register [background.js](file:///d:/CodeBasics/focusboard/background.js) as a background service worker.

### UI Base Structure & Styles
- [x] Construct base layout in [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html):
  - Add wrappers for background wallpaper, dashboard center layout, and bottom widgets.
  - Create layout containers for the Clock, Greeting, Daily Focus Prompt, Task List, and Settings gear icon.
- [x] Build core design tokens and reset styles in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css):
  - Set CSS variables for typography (Google Font 'Inter' or 'Outfit'), transitions, and color palette.
  - Apply standard reset, box-sizing, full-screen flex layout, and center alignment.
  - Add placeholder full-screen CSS gradient background.

### Live Clock & Greetings logic
- [x] Implement the Live Clock inside [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Create a function to format current date details and time (`HH:MM:SS`).
  - Wire up a `setInterval` timer updating the clock display container every 1000ms.
- [x] Implement Date Display inside [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Display formatted date string (e.g. "Saturday, June 13, 2026").
- [x] Create Greetings mechanism inside [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Parse current system hour to select appropriate greeting text:
    - 5 AM - 11:59 AM -> "Good morning"
    - 12 PM - 4:59 PM -> "Good afternoon"
    - 5 PM - 4:59 AM -> "Good evening"
  - Concatenate placeholder name "friend" (e.g. "Good morning, friend").

### Validation
- [ ] Install unpacking extension in Chrome Developer Mode (`chrome://extensions`) and verify:
  - The default new tab loads [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html).
  - Clock updates dynamically.
  - Greeting renders correctly based on local time.

---

## Phase 2: Settings: Name & Wallpaper
*Dependency: Completion of Phase 1*

### Modal UI & Shell
- [x] Create Settings modal elements in [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html):
  - Form structure with Name text field, Wallpaper file input, Save button, and Cancel button.
  - Create gear icon button for triggering settings.
- [x] Style settings modal overlay and components in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css):
  - Position gear icon in top/bottom right corners.
  - Apply semitransparent frosted glass backdrop overlay styling.
  - Ensure responsive layout, form alignments, and smooth transition animations.
- [x] Implement settings visibility toggling in [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Open modal on gear icon click.
  - Hide modal on Cancel button click, backdrop click, or Escape key press.

### Personalization Logic
- [x] Implement Greeting personalization:
  - Fetch `userName` from `chrome.storage.local` on page startup.
  - Render greeting using fetched name; default to "friend" if blank.
  - Update input field value inside the modal to match storage.
- [x] Implement Wallpaper file input handler:
  - Add event listener to file input.
  - Use HTML5 FileReader to read selected file as Data URL (base64).
  - Implement canvas compression function to downscale large files (keeping under ~1.5MB to avoid storage limitation issues).
- [x] Implement Save operations:
  - Save `userName` and `wallpaperDataUrl` to `chrome.storage.local`.
  - Instantly apply updated name to greeting dashboard.
  - Apply base64 image as body CSS background-image on save.
- [x] Implement fallback logic:
  - If `wallpaperDataUrl` is empty, apply default gradient background styles on load.

---

## Phase 3: Daily Focus Prompt
*Dependency: Completion of Phase 1 & Phase 2*

### UI Components
- [ ] Create Focus Prompt UI markup in [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html):
  - An input form: "What is your main focus today?" with text input and submit button.
  - A dashboard prompt display container showing the active focus text with an edit/delete button.
- [ ] Add style rules in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css):
  - Animate visibility changes (fade in/out, scaling shifts) for toggling between the prompt input form and the display text.
  - Style focus prompt text to stand out, with high contrast readability.

### Focus Controller Logic
- [ ] Code focus check logic in [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js) on initialization:
  - Retrieve `focus` object from `chrome.storage.local` (expected format: `{ text: string, date: "YYYY-MM-DD" }`).
  - Calculate today's local date string (`YYYY-MM-DD`).
  - Check if `focus.date === todayString`.
  - If date matches, hide prompt input form and display saved focus text.
  - If date does not match (or is null), show prompt input form and hide active text.
- [ ] Implement submit handler:
  - Sanitize input text.
  - Save object `{ text: focusText, date: todayDateString }` to `chrome.storage.local`.
  - Smoothly swap elements to display focus text.
- [ ] Implement focus reset handler:
  - Clean focus item in storage.
  - Display blank prompt input form.

---

## Phase 4: Task List
*Dependency: Completion of Phase 1*

### Task List UI Setup
- [x] Add Task List containers in [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html):
  - Input field + Add button.
  - Task collection item element (`<ul>` or `<div>`).
- [x] Design styles in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css):
  - Glassmorphism layout for task container card.
  - Flexible rows showing task text, check status, and delete action.
  - Checked styling adjustments (strikethrough text decoration, muted opacity).

### Task Operations
- [x] Implement Add Task logic in [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Catch form submits (input key Enter/button click).
  - Construct task entry: `{ id: DOMString (UUID or timestamp), text: taskText, done: false }`.
  - Fetch existing list, append item, and save to `chrome.storage.local` under `tasks` key.
  - Render list immediately.
- [x] Implement Task Toggle State logic:
  - Attach change listener via event delegation to checkboxes.
  - Match item ID and flip `done` boolean.
  - Save checklist updates to storage and re-apply styles.
- [x] Implement Delete Task functionality:
  - Add click event delegation for deletion icons.
  - Filter list array to exclude deleted item ID.
  - Commit array back to storage and update DOM.
- [x] Implement initialization rendering:
  - Fetch `tasks` array from storage on page load and draw list.

---

## Phase 5: Focus Mode & Site Blocking
*Dependency: Completion of Phase 1, Phase 2, & Phase 3*

### Focus Toggle UI
- [x] Add Switch UI element in [newtab.html](file:///d:/CodeBasics/focusboard/newtab.html) representing Focus Mode toggle.
- [x] Add toggle switch style transitions in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css).

### Block Page Scaffolding
- [x] Create [blocked.html](file:///d:/CodeBasics/focusboard/blocked.html) page structure:
  - Add title and heading warning.
  - Add container to draw current focus message.
  - Add action button: "Disable Focus Mode".
- [x] Create [blocked.css](file:///d:/CodeBasics/focusboard/blocked.css) with high-contrast, minimalist focus styles.
- [x] Create [blocked.js](file:///d:/CodeBasics/focusboard/blocked.js) script logic:
  - Query `focus` object from `chrome.storage.local` and display active focus message.
  - Bind disable button to update `focusModeEnabled: false` in `chrome.storage.local` and redirect tab back or notify current active pages.

### Service Worker & DeclarativeNetRequest Rules
- [x] Write rule management functions in [background.js](file:///d:/CodeBasics/focusboard/background.js):
  - Implement helper to parse list of domains and register them dynamically as `declarativeNetRequest` rules.
  - Dynamic rules must redirect targeted requests to `chrome-extension://[extension_id]/blocked.html`.
  - Implement helper to clear active declarative rules.
- [x] Wire switch triggers in [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js):
  - Handle toggle clicks: save boolean state to `chrome.storage.local` under `focusModeEnabled` key.
- [x] Implement Service Worker monitoring:
  - Add event listener for storage changes (`chrome.storage.onChanged`) inside [background.js](file:///d:/CodeBasics/focusboard/background.js).
  - When `focusModeEnabled` is updated:
    - If `true`, read `blockedSites` array from storage and call dynamic rule registration.
    - If `false`, remove declarative rules.
- [x] Handle persistence on startup:
  - On `chrome.runtime.onStartup` and `chrome.runtime.onInstalled`, read storage state and re-apply blocking rules if `focusModeEnabled` remains true.

---

## Phase 6: Settings: Block List Management
*Dependency: Completion of Phase 2 & Phase 5*

### Management Interface
- [x] Add block list customization field in settings modal ([newtab.html](file:///d:/CodeBasics/focusboard/newtab.html)):
  - Textarea element allowing entry of domains (one domain per line).
- [x] Style textarea field and validation feedback in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css).
- [x] Implement initial startup default configuration:
  - Inside [background.js](file:///d:/CodeBasics/focusboard/background.js) `onInstalled` block, verify if `blockedSites` array is set.
  - If unset, set default sites list: `["instagram.com", "youtube.com", "facebook.com", "twitter.com", "x.com", "tiktok.com", "reddit.com"]`.

### Save & Real-Time Sync
- [x] Handle load details in Settings modal:
  - On gear icon open, read `blockedSites` array from `chrome.storage.local`.
  - Convert domain array to line-separated string and place in textarea input.
- [x] Implement save operations:
  - Parse inputs, trim whitespace, remove duplicates, and filter out invalid domain names.
  - Save updated domain array to `chrome.storage.local` under `blockedSites` key.
- [x] Sync dynamic rules immediately:
  - In [background.js](file:///d:/CodeBasics/focusboard/background.js) storage listener, check if `blockedSites` changes.
  - If `focusModeEnabled` is currently `true`, dynamically update blocking rules to use the new domains.

---

## Phase 7: Reminders (Alarms & Notifications)
*Dependency: Completion of Phase 1*

### System Setup
- [x] Double-check `"alarms"` and `"notifications"` presence in [manifest.json](file:///d:/CodeBasics/focusboard/manifest.json).
- [x] Save fallback notification icon as `icons/icon128.png`.
- [x] Initialize alarms in [background.js](file:///d:/CodeBasics/focusboard/background.js):
  - On `chrome.runtime.onInstalled` and `chrome.runtime.onStartup`, set up a recurring alarm (e.g. `checkRemindersAlarm`, run every 30 minutes).

### Reminder Alarms Handler
- [x] Write event listener for `chrome.alarms.onAlarm` in [background.js](file:///d:/CodeBasics/focusboard/background.js):
  - Pull `reminderSettings` and `lastNotifiedDates` from `chrome.storage.local`.
  - Get today's local date details (date string, day of week, time representation).
- [x] Program Daily Hours Check:
  - Compare current hours/minutes against configured trigger time (default `18:00`).
  - Verify `lastNotifiedDates.dailyHours !== todayString`.
  - Call helper to display notification: "Don't forget to log today's hours in your Timesheet."
  - Set `lastNotifiedDates.dailyHours = todayString` in storage on success.
- [x] Program Weekly Friday Check:
  - Check if today's day of week is Friday (5).
  - Verify `lastNotifiedDates.weeklyTimesheet !== todayString`.
  - Display notification: "Reminder: Submit your timesheet for this week."
  - Set `lastNotifiedDates.weeklyTimesheet = todayString` in storage.
- [x] Program Monthly Auto-Payment Check:
  - Check if tomorrow's calendar date is the 1st of the month (signifying today is month-end).
  - Verify `lastNotifiedDates.monthlyAutoPay !== todayString`.
  - Display notification: "Reminder: Check your Auto-Payments for this month."
  - Set `lastNotifiedDates.monthlyAutoPay = todayString` in storage.
- [x] Implement Settings interface:
  - Add trigger time input field inside settings modal markup.
  - Load/Save configured time into `reminderSettings.dailyHoursTime` (format `HH:MM`).

---

## Phase 8: Polish & Edge Cases
*Dependency: Completion of all previous phases*

### Aesthetic Enhancements & UX Polish
- [x] Apply dark visual overlays and drop-shadows on overlay container variables in [newtab.css](file:///d:/CodeBasics/focusboard/newtab.css) to maintain contrast against bright wallpaper image uploads.
- [x] Complete CSS layout passes: check alignments, sizing limits, margins, responsive scaling, scroll heights, and element cursor changes.
- [x] Build transitions and hover effects to make user action controls feel organic and highly premium.

### Code Robustness
- [x] Implement File Uploader compression utility:
  - Set maximum image width/height (e.g. 1920px) using canvas resizing when parsing data in [newtab.js](file:///d:/CodeBasics/focusboard/newtab.js).
- [x] Add "Deactivate Focus Mode" click handlers inside [blocked.js](file:///d:/CodeBasics/focusboard/blocked.js) settings to offer quick escapes.
- [x] Check fallback variables for missing storage definitions (fresh install logic path checks).
- [x] Build manual mock test settings switches inside settings panels to trigger Daily, Weekly, and Monthly notifications instantly for testing purposes.
