## Prompt for Antigravity: Wallpaper Rotation Feature

I have an existing Chrome extension (Manifest V3) productivity dashboard that currently supports uploading **a single wallpaper** stored in `chrome.storage.local`. I want to extend this feature to support **multiple wallpapers with rotation options** — without breaking any existing functionality.

---

### What's Changing (Existing Feature Extension)
- Currently: one wallpaper image stored as a single base64 string under `"wallpaperDataUrl"` in `chrome.storage.local`.
- New: support an **array of wallpapers** (up to 8 max) with a rotation mode setting.
- Backwards compatible: if the user has an existing single `wallpaperDataUrl` stored, migrate it on extension load into the new array format automatically so nothing breaks.

---

### Storage (chrome.storage.local)
Replace the single `wallpaperDataUrl` key with:
```json
{
  "wallpapers": [
    { "id": "uuid1", "dataUrl": "base64..." },
    { "id": "uuid2", "dataUrl": "base64..." }
  ],
  "wallpaperRotation": {
    "mode": "newTab" | "daily" | "manual",
    "currentIndex": 0,
    "lastRotatedDate": "YYYY-MM-DD"
  }
}
```
- **Migration**: On extension load, if `wallpaperDataUrl` exists in storage but `wallpapers` array does not, move `wallpaperDataUrl` into `wallpapers[0]` and delete the old key.
- Use **`chrome.storage.local`** (not sync) since images are large. The `unlimitedStorage` permission should be declared to avoid hitting the default 10MB quota with multiple high-quality images.

---

### Rotation Modes
Three modes, user-selectable in Settings:

1. **Every New Tab** (`newTab`): Each time the new tab page is opened, advance to the next wallpaper (sequential). Wrap around at the end of the array.
2. **Daily** (`daily`): Change wallpaper once per calendar day. On new tab load, check `lastRotatedDate` vs today — if different, advance index and update `lastRotatedDate`. Same wallpaper shows all day no matter how many tabs are opened.
3. **Manual** (`manual`): No automatic rotation. User picks a specific wallpaper as the active one from the Settings gallery (click to set active). Effectively the same as the old single-wallpaper behavior.

Selection is always **sequential** cycling through the array in order (not random), so the user knows what to expect.

---

### Settings Panel Changes
Extend the existing Settings modal with a **Wallpapers section**:

#### Upload
- File input accepting images (jpg, png, webp).
- Upload button labeled "Add Wallpaper" (or drag-and-drop if easy to implement).
- On upload, read the file as base64, assign a UUID, push to `wallpapers` array in storage.
- **Cap at 8 wallpapers max**: if 8 are already stored, show a message "Maximum 8 wallpapers reached. Delete one to add more." and disable the upload button.
- No compression — preserve original image quality as requested.

#### Gallery / Preview Grid
- Display all uploaded wallpapers as a **thumbnail grid** inside Settings (each approx 100–120px wide, aspect ratio preserved, object-fit: cover).
- Each thumbnail has:
  - A **delete (×) button** in the top-right corner. On delete: remove from array, update storage, re-render gallery, update `currentIndex` if needed (if deleted image was the active one, set index to 0).
  - A **"Preview" button** (or click-to-preview): temporarily apply the wallpaper as the full-screen background behind the Settings modal so the user can see how it looks — without saving as active. Clicking outside or pressing Cancel restores the previous wallpaper.
  - A visual indicator (e.g., a checkmark badge or highlighted border) on whichever wallpaper is currently active/selected.
- In **manual mode**: clicking a thumbnail (not the × button) sets it as the active wallpaper immediately.

#### Rotation Mode Selector
- A segmented control or dropdown below the gallery with three options: "Every New Tab", "Daily", "Manual".
- Persists to `wallpaperRotation.mode` in storage.
- If switching to Manual mode, show a hint: "Click a wallpaper above to set it as active."

---

### New Tab Page Logic Changes
On every new tab load:
1. Load `wallpapers` array and `wallpaperRotation` from storage.
2. If array is empty: show default gradient background (existing fallback behavior).
3. If array has items:
   - **newTab mode**: set wallpaper to `wallpapers[currentIndex]`, then increment `currentIndex` (mod array length), save updated index to storage.
   - **daily mode**: if `lastRotatedDate !== today`, increment `currentIndex`, update `lastRotatedDate`, save. Use `wallpapers[currentIndex]` as wallpaper.
   - **manual mode**: use `wallpapers[currentIndex]` as wallpaper (index is set by user click in gallery, not auto-advanced).
4. Apply the selected wallpaper's `dataUrl` as `background-image` on the dashboard root element.

---

### Edge Cases to Handle
- Deleting the currently active wallpaper: reset `currentIndex` to 0.
- Deleting all wallpapers: fall back to default gradient background.
- Array length changes (deletion) while `currentIndex` is out of bounds: clamp index to `array.length - 1`.
- User uploads same image twice: allow it (no duplicate detection needed in v1).
- Storage write failures (quota exceeded): catch the error and show a user-facing message in Settings: "Could not save wallpaper — storage full. Please delete an existing wallpaper first."

---

### Files to Touch
- **`newtab.js`**: Update wallpaper-loading logic to use new array/rotation system instead of single `wallpaperDataUrl`. Add migration logic.
- **`settings.js`** (or the settings section of `newtab.js`): Replace single upload field with gallery UI, upload button, rotation mode selector.
- **`newtab.css`**: Add thumbnail grid styles, gallery layout, active/preview indicator styles.
- **`manifest.json`**: Add `"unlimitedStorage"` to permissions array.
- No changes to `background.js` needed for this feature.

---

### Success Criteria
- Upload 3 wallpapers: all 3 appear as thumbnails in the Settings gallery.
- Set rotation to "Every New Tab": each new tab open shows the next wallpaper in sequence.
- Set rotation to "Daily": same wallpaper shows all day; changes the next calendar day.
- Delete a wallpaper: it is removed from the gallery and from rotation immediately.
- Deleting all wallpapers: dashboard falls back to default background without errors.
- Existing single-wallpaper users: their wallpaper is auto-migrated and still appears correctly.
- Image quality is preserved (no compression applied).
- Cap of 8 wallpapers is enforced with a clear UI message.

Please implement this incrementally and ensure it does not break any existing dashboard features (greeting, clock, focus, tasks, period tracker, Pomodoro, focus mode, reminders).
