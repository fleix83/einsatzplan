# Shift Lock Feature - Database Deployment Guide

## 1. Database Schema Changes

### Add Lock Timestamp Columns to `shifts` Table

Run this SQL to add the required columns to your production database:

```sql
-- Add lock timestamp columns for position 1 and position 2
ALTER TABLE shifts
ADD COLUMN user1_locked_at DATETIME DEFAULT NULL,
ADD COLUMN user2_locked_at DATETIME DEFAULT NULL;
```

**What this does:**
- Adds `user1_locked_at` column to track when position 1 was assigned
- Adds `user2_locked_at` column to track when position 2 was assigned
- Both columns are DATETIME type with NULL default (no lock for empty positions)

---

## 2. Backfill Existing Shift Assignments

After adding the columns, you need to set timestamps for existing shift assignments. Choose one of the options below:

### **Option A: Set All Existing Shifts to "Locked" (Recommended)**

Use this to immediately lock all existing assignments:

```sql
-- Set timestamp for all position 1 assignments that have a user but no timestamp
-- Sets to 10 minutes ago (immediately locked)
UPDATE shifts
SET user1_locked_at = DATE_SUB(NOW(), INTERVAL 10 MINUTE)
WHERE user1_id IS NOT NULL
  AND user1_locked_at IS NULL;

-- Set timestamp for all position 2 assignments that have a user but no timestamp
-- Sets to 10 minutes ago (immediately locked)
UPDATE shifts
SET user2_locked_at = DATE_SUB(NOW(), INTERVAL 10 MINUTE)
WHERE user2_id IS NOT NULL
  AND user2_locked_at IS NULL;
```

**Result:** All existing shifts immediately become locked and show 🔒 emoji.

---

### **Option B: Set All Existing Shifts to "Grace Period" (Gentler)**

Use this to give existing assignments a few minutes of grace period:

```sql
-- Set timestamp for all position 1 assignments to 2 minutes ago
-- Gives 3 minutes remaining in grace period before lock kicks in
UPDATE shifts
SET user1_locked_at = DATE_SUB(NOW(), INTERVAL 2 MINUTE)
WHERE user1_id IS NOT NULL
  AND user1_locked_at IS NULL;

-- Set timestamp for all position 2 assignments to 2 minutes ago
-- Gives 3 minutes remaining in grace period before lock kicks in
UPDATE shifts
SET user2_locked_at = DATE_SUB(NOW(), INTERVAL 2 MINUTE)
WHERE user2_id IS NOT NULL
  AND user2_locked_at IS NULL;
```

**Result:** Existing shifts have 3 minutes to edit freely, then become locked.

---

### **Option C: Set All Existing Shifts to "Just Assigned" (Most Forgiving)**

Use this to give existing assignments a full 5-minute grace period:

```sql
-- Set timestamp for all position 1 assignments to NOW
-- Gives full 5-minute grace period
UPDATE shifts
SET user1_locked_at = NOW()
WHERE user1_id IS NOT NULL
  AND user1_locked_at IS NULL;

-- Set timestamp for all position 2 assignments to NOW
-- Gives full 5-minute grace period
UPDATE shifts
SET user2_locked_at = NOW()
WHERE user2_id IS NOT NULL
  AND user2_locked_at IS NULL;
```

**Result:** Existing shifts can be edited freely for 5 minutes before locking.

---

## 3. Deployment Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Test feature on development/staging environment
- [ ] Verify all code files are uploaded:
  - [ ] `api/shifts.php` (updated)
  - [ ] `js/script.js` (updated)
  - [ ] `index.html` (updated with modal)
  - [ ] `styles.css` (updated with modal styles)

### Deployment Steps
1. [ ] Run SQL to add columns (Section 1)
2. [ ] Upload all updated code files
3. [ ] Clear browser caches (or use hard refresh: Ctrl+F5 / Cmd+Shift+R)
4. [ ] Run SQL backfill (Section 2 - choose Option A, B, or C)
5. [ ] Test the feature (see Section 4)

### Post-Deployment
- [ ] Monitor for errors in browser console
- [ ] Monitor for errors in server logs
- [ ] Gather user feedback
- [ ] Adjust lock duration if needed (see Section 5)

---

## 4. Testing Instructions

After deployment, test these scenarios:

### Test 1: Fresh Assignment (No Confirmation)
1. Open an empty shift
2. Assign a user
3. ✅ Should save immediately without confirmation

### Test 2: Lock Indicator
1. Open a shift assigned >5 minutes ago
2. ✅ Should see 🔒 emoji next to user's name in dropdown

### Test 3: Lock Confirmation (Critical Test)
1. Open a shift assigned >5 minutes ago
2. Try to change the assignment
3. ✅ Confirmation dialog should appear:
   ```
   Einsatz ändern?

   Dieser Einsatz ist bereits von [Name] belegt.
   Möchtest Du diese Änderung wirklich vornehmen?

   [Abbrechen]  [Ja, ändern]
   ```
4. Click "Ja, ändern"
5. ✅ Edit should proceed
6. ✅ New assignment gets fresh 5-minute timer

### Test 4: Cancel Locked Edit
1. Try to edit locked shift
2. Confirmation dialog appears
3. Click "Abbrechen"
4. ✅ Dropdown should revert to original user
5. ✅ No changes saved

### Test 5: Grace Period (Within 5 Minutes)
1. Assign a user to empty shift
2. Immediately (within 5 min) change assignment
3. ✅ Should work without confirmation

### Test 6: Backoffice Override
1. Login as Backoffice user
2. Try to edit any locked shift
3. ✅ Should work without confirmation
4. ✅ Backoffice bypasses all locks

### Test 7: Mobile Support
1. Open calendar on mobile device
2. Test locks show 🔒 emoji
3. Test confirmation dialog appears
4. ✅ Should work identically to desktop

---

## 5. Configuration & Troubleshooting

### Change Lock Duration

Current setting: **5 minutes**

To change to a different duration (e.g., 10 minutes):

**JavaScript** (`js/script.js` around line 16):
```javascript
function isShiftLocked(lockedTimestamp) {
    if (!lockedTimestamp) return false;
    const lockedTime = new Date(lockedTimestamp);
    const now = new Date();
    const minutesElapsed = (now - lockedTime) / 1000 / 60;
    return minutesElapsed > 10; // Change 5 to 10 for 10-minute lock
}
```

**PHP** (`api/shifts.php` around line 38):
```php
function isShiftLocked($lockedAt) {
    if (!$lockedAt) {
        return false;
    }
    $lockedTime = strtotime($lockedAt);
    $now = time();
    $minutesElapsed = ($now - $lockedTime) / 60;
    return $minutesElapsed > 10; // Change 5 to 10 for 10-minute lock
}
```

**Note:** Both JavaScript and PHP must have the same value!

---

### Troubleshooting: Confirmation Dialog Not Appearing

**Problem:** Changed locked shift but no dialog appears

**Checklist:**
1. ✅ Run SQL backfill (Section 2) - existing shifts need timestamps
2. ✅ Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
3. ✅ Check browser console for JavaScript errors
4. ✅ Check Network tab - API should return HTTP 423 status
5. ✅ Verify modal HTML exists in page source

**Debug in Browser Console:**
```javascript
// Test lock function
const testTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
console.log('Should be locked:', isShiftLocked(testTimestamp)); // Should return: true

// Test confirmation dialog
showLockConfirmation('Test User').then(result => {
    console.log('User confirmed:', result);
});

// Check modal elements exist
console.log('Modal exists:', !!document.getElementById('lockConfirmModal'));
console.log('Overlay exists:', !!document.getElementById('lockConfirmOverlay'));
```

---

### Troubleshooting: Lock Icons Not Showing

**Problem:** No 🔒 emoji in dropdowns

**Checklist:**
1. ✅ Run SQL backfill - NULL timestamps won't show locks
2. ✅ Wait 5 minutes after assignment (or use Option A for immediate locks)
3. ✅ Refresh the page to reload shift data
4. ✅ Check browser console for errors in `staticData.shifts` structure

**Debug in Browser Console:**
```javascript
// Check if shift metadata is loaded
console.log('Shifts metadata:', staticData.shifts);

// Check specific shift
const year = currentYear;
const month = currentMonth;
const day = 15; // Change to day you're testing
console.log(`Shift data for day ${day}:`, staticData.shifts?.[year]?.[month]?.[day]);
```

---

### Troubleshooting: Backoffice Users Still See Locks

**Problem:** Backoffice users should bypass locks but see confirmation dialogs

**Solution:** Ensure user is properly logged in as Backoffice role.

**Debug in Browser Console:**
```javascript
// Check if user is authenticated as Backoffice
console.log('Auth data:', AuthManager.getAuthData());
console.log('Is Backoffice:', AuthManager.getCurrentUser()?.role === 'Backoffice');
```

---

## 6. Rollback Plan

If you need to disable the feature:

### Option 1: Disable Locks Temporarily (Keep Code)
```sql
-- Set all locks to NULL (disables feature without removing columns)
UPDATE shifts SET user1_locked_at = NULL, user2_locked_at = NULL;
```

### Option 2: Remove Columns Completely
```sql
-- WARNING: This permanently removes the lock feature
ALTER TABLE shifts
DROP COLUMN user1_locked_at,
DROP COLUMN user2_locked_at;
```

Then restore previous versions of:
- `api/shifts.php`
- `js/script.js`
- `index.html`
- `styles.css`

---

## 7. Monitoring & Maintenance

### Check Lock Statistics
```sql
-- Count how many shifts are currently locked (>5 min old)
SELECT
    COUNT(*) as total_assignments,
    SUM(CASE WHEN user1_locked_at IS NOT NULL
             AND TIMESTAMPDIFF(MINUTE, user1_locked_at, NOW()) > 5
        THEN 1 ELSE 0 END) as pos1_locked,
    SUM(CASE WHEN user2_locked_at IS NOT NULL
             AND TIMESTAMPDIFF(MINUTE, user2_locked_at, NOW()) > 5
        THEN 1 ELSE 0 END) as pos2_locked
FROM shifts
WHERE user1_id IS NOT NULL OR user2_id IS NOT NULL;
```

### Check Recent Lock Updates
```sql
-- See recently assigned/updated shifts
SELECT
    date,
    shift_type,
    user1_id,
    user1_locked_at,
    TIMESTAMPDIFF(MINUTE, user1_locked_at, NOW()) as minutes_ago,
    CASE
        WHEN TIMESTAMPDIFF(MINUTE, user1_locked_at, NOW()) > 5 THEN 'LOCKED'
        ELSE 'GRACE PERIOD'
    END as lock_status
FROM shifts
WHERE user1_id IS NOT NULL
ORDER BY user1_locked_at DESC
LIMIT 20;
```

---

## 8. Documentation References

- **Feature Documentation:** `SHIFT_LOCK_FEATURE.md`
- **User Guide:** *(Create if needed for volunteers)*
- **Code Comments:** See inline comments in modified files

---

## Support

If issues persist after following this guide:
1. Check browser console for JavaScript errors
2. Check server error logs for PHP errors
3. Verify database columns exist: `DESCRIBE shifts;`
4. Test with browser developer tools Network tab to see API responses

**Emergency Contact:** *(Add your contact info here)*
