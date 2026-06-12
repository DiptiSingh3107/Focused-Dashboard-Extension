## Prompt for Antigravity: Add Period Tracker / Calendar Widget

I have an existing Chrome extension (Manifest V3) that replaces the new tab page with a productivity dashboard (wallpaper, greeting, clock, daily focus, task list, focus mode, settings). I want to add a new **Period Calculator widget**.

### Placement
- Add this as a new card/panel on the **right side of the dashboard**.
- Its top edge should **align with the top of the existing Task List panel**.
- Match the existing dashboard's visual style (same card background/blur, border-radius, fonts, spacing as other panels).

### Core Calendar UI
- Show a **monthly calendar grid** (Sun–Sat columns, current month by default).
- Header row above the grid:
  - Left arrow (`‹`) = go to previous month
  - Right arrow (`›`) = go to next month
  - Center: Month name + Year (e.g., "June 2026")
  - Allow navigation **1 year back and 1 year forward** from the current real-world month (disable/hide arrows beyond that range).
- A small **settings (gear) icon** in the **top-right corner of this widget**.

### Settings Panel (opened via gear icon)
A small modal/popover with:
- "Cycle length (days)" — number input, default 28
- "Period length (days)" — number input, default 5
- Save / Cancel buttons
- (No date field here — period start date is set directly from the calendar, see below)

### Setting Period Start Date via Calendar Click
- Clicking any date cell in the calendar opens a small popover/context menu near that cell with an option like **"Mark as Period Start Date"**.
- Selecting this sets `periodStartDate` to the clicked date, saves it to storage, closes the popover, and immediately recalculates/redraws all highlights (current period, expected next period, late indicator).
- This should work for dates in past, current, or future months (within the navigable 1-year range), allowing the user to log a period retroactively or correct it.
- Clicking on a date that is already marked as the period start should show an option to **unset/clear** it (or simply allow re-marking another date, which overwrites the previous value).

### Highlighting Logic
Based on `periodStartDate`, `periodLength`, and `cycleLength`:

1. **Current period days**: Highlight `periodStartDate` through `periodStartDate + (periodLength - 1)` days in one color (e.g., red/pink) labeled "Period".
2. **Next predicted period**: Calculate `nextPeriodStart = periodStartDate + cycleLength` days. Highlight `nextPeriodStart` through `nextPeriodStart + (periodLength - 1)` days in a lighter/different shade (e.g., light pink with dashed border) labeled "Expected".
3. Apply this same logic across month navigation — if the user navigates to a future/past month, show the corresponding highlighted ranges if they fall within that month (calculate cycles repeating every `cycleLength` days indefinitely in both directions for display purposes).
4. **"Period Late" indicator**: If today's date is **past** the `nextPeriodStart + periodLength` range (i.e., the predicted period window has fully passed) **and** the user has not updated `periodStartDate` since then (i.e., `periodStartDate` is still the old cycle's start), show a small badge/label on the widget, e.g., "Period is X days late" (where X = days since `nextPeriodStart`).
5. When the user opens settings and updates `periodStartDate` to a new date (logging their new period), recalculate everything from that new date and clear the "late" indicator.

### Data Persistence
Store in `chrome.storage.local` under a new key, e.g.:
```json
{
  "periodTracker": {
    "cycleLength": 28,
    "periodLength": 5,
    "periodStartDate": "YYYY-MM-DD"
  }
}
```

### Visual Notes
- Use a small legend below the calendar: a colored dot for "Period" and another for "Expected Next Period".
- Keep the calendar compact — date cells should be small (this is a side panel, not the main focus).
- Today's date should have a subtle outline/border regardless of highlight state.
- Ensure the highlight + late-indicator logic correctly handles multi-month overlaps (e.g., a period that starts in late June and continues into July).

### Files to touch
- Add new HTML markup for this widget inside `newtab.html` (right column/sidebar area).
- New JS file (e.g., `period-tracker.js`) handling calendar rendering, navigation, settings modal, and date calculations — keep logic isolated and import/include it alongside existing `newtab.js`.
- Add corresponding CSS to the existing stylesheet, matching current card styles, color variables, and fonts.
- No new permissions should be required (uses existing `storage` permission).

Please implement this incrementally and make sure it doesn't break the existing dashboard layout or other widgets.
