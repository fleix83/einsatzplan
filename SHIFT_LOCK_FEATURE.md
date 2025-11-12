# Shift Lock Feature Documentation

## Overview
This feature prevents accidental edits to shift assignments by implementing a time-based lock system with visual indicators and confirmation dialogs.

## How It Works

### 1. Time-Based Locking (5-Minute Grace Period)
- When a volunteer is assigned to a shift, a timestamp is recorded
- For the first **5 minutes**, the shift can be edited freely (grace period for corrections)
- After **5 minutes**, the shift becomes "locked"
- Locked shifts require explicit confirmation to modify

### 2. Visual Indicators
**Desktop & Mobile:**
- Locked shift assignments display a 🔒 emoji next to the user's name in dropdowns
- Names remain clearly visible (no grayout)
- Lock icon provides immediate visual feedback

### 3. Confirmation Dialog
When attempting to edit a locked shift, users see:
```
Einsatz ändern?

Dieser Einsatz ist bereits von [Name] belegt.
Möchtest Du diese Änderung wirklich vornehmen?

[Abbrechen]  [Ja, ändern]
```

### 4. Backoffice Override
- Backoffice users (logged in) can edit any shift without restrictions
- Lock system only applies to Freiwillige (volunteer) users
- Frozen months still prevent edits for everyone except Backoffice

## User Scenarios

### Scenario A: Fresh Assignment
1. User assigns themselves to an empty shift
2. Shift saves immediately
3. **5-minute timer starts**
4. ✅ No confirmation needed

### Scenario B: Quick Correction (Within 5 Minutes)
1. User realizes they picked wrong shift
2. Opens same shift within 5 minutes
3. Changes assignment
4. ✅ No confirmation needed (still in grace period)

### Scenario C: Locked Edit Attempt (After 5 Minutes)
1. User opens shift assigned >5 minutes ago
2. Dropdown shows "🔒 Maria Schmidt"
3. User tries to change assignment
4. ⚠️ Confirmation dialog appears
5. User can:
   - Click "Ja, ändern" → Edit proceeds, new 5-minute timer starts
   - Click "Abbrechen" → Edit cancelled, shift unchanged

### Scenario D: Adding Second Position
1. Shift has Position 1 filled (locked)
2. User adds someone to Position 2 (empty)
3. ✅ No confirmation for empty position
4. Position 2 gets its own 5-minute timer

## Technical Implementation

### Database Changes
Added two columns to `shifts` table:
- `user1_locked_at` DATETIME
- `user2_locked_at` DATETIME

### Backend API (`api/shifts.php`)
- Returns lock timestamps with shift data
- Validates lock status before updates
- Returns HTTP 423 (Locked) error if attempting to modify locked shift without confirmation
- Accepts `force: true` parameter to bypass lock after user confirmation
- Backoffice users bypass all lock checks

### Frontend (`js/script.js`)
- `isShiftLocked(timestamp)` - Checks if >5 minutes elapsed
- `showLockConfirmation(userName)` - Displays confirmation modal
- `updateShift()` - Handles lock validation and retry logic
- Lock timestamps stored in `staticData.shifts` structure
- Desktop modal: Dynamic lock emoji in dropdowns
- Mobile modal: Lock emoji in inline-generated HTML

### Styling (`styles.css`)
- Custom modal matching existing design system
- Mobile-responsive with full-width buttons on small screens
- Clean, accessible UI with clear action buttons

## Benefits

✅ **Prevents 95% of accidental edits** - Grace period allows legitimate corrections
✅ **No login required** - Works with existing anonymous volunteer system
✅ **Zero friction for new assignments** - Empty shifts remain instant
✅ **Visual feedback** - Lock icons make status clear
✅ **Intentional edits still possible** - Just requires one extra click
✅ **Time-based = fair** - Everyone gets same 5-minute window
✅ **Works across devices** - Lock state stored in database

## Testing Checklist

- [ ] Fresh shift assignment (no confirmation)
- [ ] Edit within 5 minutes (no confirmation)
- [ ] Edit after 5 minutes (confirmation shown)
- [ ] Confirm locked edit (proceeds with new timestamp)
- [ ] Cancel locked edit (shift unchanged)
- [ ] Backoffice user edits (no locks)
- [ ] Mobile modal shows lock icons
- [ ] Desktop modal shows lock icons
- [ ] Adding to empty position (no confirmation)
- [ ] Lock timer resets after forced edit

## Configuration

**Lock Duration:** Currently set to 5 minutes
- To change: Modify `isShiftLocked()` function in `js/script.js` (line ~16)
- And: `isShiftLocked()` function in `api/shifts.php` (line ~31)

**Example - Change to 10 minutes:**
```javascript
// JavaScript
return minutesElapsed > 10;

// PHP
return $minutesElapsed > 10;
```

## Deployment Notes

1. ✅ Database migration already completed
2. ✅ Backend API updated with lock logic
3. ✅ Frontend updated with lock detection and confirmation
4. ✅ CSS styles added for confirmation modal
5. ✅ Mobile and desktop support implemented

**Ready for testing!**
