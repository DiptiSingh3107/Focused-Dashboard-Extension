# Focused Dashboard - Chrome Extension

A lightweight productivity-focused Google Chrome extension that transforms every new tab into a beautiful personal dashboard designed to help you stay focused, organized, and motivated throughout the day.

Manage your daily focus, tasks, Pomodoro sessions, affirmations, wallpapers, and personal wellness—all from your browser's new tab page.

---

# Features

### 🎯 Daily Focus

Set your primary focus for the day and keep it visible every time you open a new tab. Your focus automatically resets the next day to encourage daily planning.

### ✅ Task Management

Create, complete, and remove tasks with a simple, distraction-free task manager. All tasks are stored locally in your browser.

### 🍅 Pomodoro Timer

Stay productive using the built-in Pomodoro timer with focus and break sessions.

### 🚫 Focus Mode

Reduce distractions by blocking selected websites while Focus Mode is enabled. Instead of the website, a motivational focus page is displayed.

### 💬 Daily Affirmations

Receive motivational affirmations every day to help build consistency and maintain a positive mindset.

### 🖼️ Dynamic Wallpapers

Enjoy beautiful full-screen wallpapers that create a clean and calming workspace.

### ❤️ Period Tracker

Track menstrual cycles with built-in period prediction and reminders. Your information remains completely private and is stored locally.

### 🕒 Live Clock & Greeting

Displays a real-time clock and a personalized greeting based on the time of day.

### 🔒 Privacy First

All data is stored locally using Chrome Storage APIs. No analytics, tracking, or external servers are used.

---

# Installation Guide (Developer Mode)

Since this extension is not currently available on the Chrome Web Store, you can install it manually by following these steps.

1. Download or clone this repository.

2. Open Google Chrome and navigate to:

   ```
   chrome://extensions
   ```

3. Enable **Developer Mode** using the toggle in the top-right corner.

4. Click **Load unpacked**.

5. Select the project folder (the folder containing `manifest.json`).

6. The extension will now replace your Chrome New Tab with the Focused Dashboard.

---

# How to Use

### Set Your Daily Focus

* Open a new tab.
* Enter your main focus for the day.
* Your focus remains visible until the next day.

### Manage Tasks

* Add new tasks.
* Mark completed tasks.
* Delete completed or unwanted tasks.

### Start a Pomodoro Session

* Click the Pomodoro timer.
* Start a focus session.
* Take scheduled breaks to maintain productivity.

### Enable Focus Mode

* Turn on Focus Mode.
* Selected distracting websites will be blocked.
* Stay focused on your current work.

### Track Your Cycle

* Enter your cycle information.
* View upcoming period predictions directly from the dashboard.

---

# Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Chrome Extensions API
* Manifest V3
* Chrome Storage API

---

# Project Structure

```
Focused-Dashboard-Extension
│
├── icons/
├── manifest.json
├── background.js
├── newtab.html
├── newtab.css
├── newtab.js
├── blocked.html
├── blocked.css
├── blocked.js
├── pomodoro.js
├── period-tracker.js
└── README.md
```

---

# Privacy

Focused Dashboard operates entirely within your browser.

* No user accounts
* No cloud storage
* No external APIs
* No advertisements
* No analytics
* No tracking

Everything—including tasks, focus, settings, affirmations, and period tracking data—is securely stored using Chrome's built-in Storage API.

---

# Future Enhancements

* Google Calendar integration
* Habit Tracker
* AI Productivity Assistant
* Daily Notes
* Goal Tracking
* Weather Widget
* Spotify Widget
* Cross-device synchronization
* Custom themes

---

# Author

**Dipti Singh**

GitHub: https://github.com/DiptiSingh3107

LinkedIn: https://www.linkedin.com/in/dipti-singh/
