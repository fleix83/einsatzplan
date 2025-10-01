# Color Preset Feature Implementation Plan

## Overview
Add functionality to save, load, and manage color configuration presets in the calendar application's color customizer.

---

## Requirements

### 1. Database Changes

Create a new table `color_presets`:

```sql
CREATE TABLE `color_presets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `colors` text NOT NULL COMMENT 'JSON blob with all color values',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'System presets cannot be deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Fields:**
- `id` - Primary key
- `name` - Preset name (e.g., "Dark Mode", "Summer Theme", "High Contrast")
- `colors` - JSON string containing all color values
- `created_at` - Timestamp for sorting
- `is_default` - Boolean flag for system presets (prevents deletion)

---

### 2. Backend (PHP API)

Create new file `api/color_presets.php` with the following endpoints:

#### GET - List all presets
```php
GET /api/color_presets.php
Response: [
  { id: 1, name: "Default", colors: {...}, is_default: true },
  { id: 2, name: "Dark Mode", colors: {...}, is_default: false }
]
```

#### POST - Save new preset
```php
POST /api/color_presets.php
Body: { name: "My Theme", colors: {...} }
Response: { success: true, id: 3 }
```

#### DELETE - Delete preset
```php
DELETE /api/color_presets.php?id=3
Response: { success: true }
Note: Prevent deletion of is_default=1 presets
```

#### PUT - Load preset colors
```php
PUT /api/color_presets.php?id=2
Response: { success: true, colors: {...} }
```

---

### 3. Frontend UI Changes

Add to the color customization modal (top section):

```
┌─────────────────────────────────────────────────┐
│ Color Presets:  [Dropdown ▼]  [Load] [Save As] │
│                                                   │
│ [Save Current Configuration]                      │
│   Preset Name: [__________]  [💾 Save]           │
└─────────────────────────────────────────────────┘
```

**Components:**
1. **Preset Dropdown** - Shows all saved presets
   - System presets (not deletable) shown first
   - User presets shown below
   - Each user preset has a delete icon (🗑️)

2. **Action Buttons**
   - "Load Preset" - Apply selected preset
   - "Save As Preset" - Shows save form

3. **Save Form** (toggleable)
   - Text input for preset name
   - Save button
   - Cancel button

---

### 4. JavaScript Updates

Modify `js/colorCustomization.js`:

#### New Functions

```javascript
// Load all presets from database
loadColorPresets: async function() {
    const response = await fetch('api/color_presets.php');
    const presets = await response.json();
    this.populatePresetDropdown(presets);
}

// Populate dropdown with presets
populatePresetDropdown: function(presets) {
    // Create dropdown options
    // System presets first, then user presets
    // Add delete icons for non-default presets
}

// Save current colors as new preset
saveColorPreset: async function(name) {
    const colors = this.getCurrentColorsFromForm();
    const response = await fetch('api/color_presets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colors })
    });
    // Reload preset list
    await this.loadColorPresets();
    // Show success notification
}

// Delete a preset
deleteColorPreset: async function(id) {
    const response = await fetch(`api/color_presets.php?id=${id}`, {
        method: 'DELETE'
    });
    // Reload preset list
    await this.loadColorPresets();
}

// Apply a preset
applyColorPreset: async function(id) {
    const response = await fetch(`api/color_presets.php?id=${id}`, {
        method: 'PUT'
    });
    const data = await response.json();
    // Populate form with preset colors
    this.populateFormWithColors(data.colors);
    // Apply preview
    this.previewColorPreferences(data.colors);
}
```

#### UI Integration

Add HTML to color modal (after modal header):

```html
<div class="color-preset-section">
    <div class="preset-controls">
        <label>Farbschema:</label>
        <select id="colorPresetDropdown" class="preset-dropdown">
            <option value="">-- Wählen --</option>
        </select>
        <button id="loadPresetBtn" class="button-secondary">Laden</button>
        <button id="savePresetBtn" class="button-secondary">Speichern als...</button>
    </div>

    <div id="savePresetForm" class="save-preset-form" style="display: none;">
        <input type="text" id="presetName" placeholder="Schema-Name eingeben...">
        <button id="confirmSavePresetBtn" class="button-primary">💾 Speichern</button>
        <button id="cancelSavePresetBtn" class="button-secondary">Abbrechen</button>
    </div>
</div>
```

---

## Estimated Complexity

### Time Estimate: 2-3 hours

**Breakdown:**
- Database table creation: 15 min
- API endpoints: 45 min
- UI/HTML additions: 30 min
- JavaScript implementation: 60 min
- Testing & debugging: 30 min

### Files to Modify

1. **Database**
   - `calendar.sql` (add table definition)
   - Or create migration script

2. **Backend**
   - `api/color_presets.php` (new file)

3. **Frontend**
   - `js/colorCustomization.js` (modify)

4. **Styling** (optional)
   - `styles.css` (add preset UI styles)

---

## Implementation Steps

1. ✅ Create database table `color_presets`
2. ✅ Create API endpoints in `api/color_presets.php`
3. ✅ Add UI elements to color customization modal
4. ✅ Implement JavaScript functions in `colorCustomization.js`
5. ✅ Add CSS styling for preset controls
6. ✅ Add default system presets (optional)
7. ✅ Test save/load/delete functionality
8. ✅ Test with existing color customization features

---

## Optional Enhancements

- **Export/Import**: Allow users to export presets as JSON files
- **Preview Thumbnails**: Show small color swatches in dropdown
- **Preset Categories**: Group presets (Dark, Light, Colorful, etc.)
- **Sharing**: Allow sharing presets between users
- **Preset History**: Track when presets were last used

---

## Notes

- System presets (`is_default=1`) should be pre-populated with sensible defaults
- Validate preset names (no duplicates, max length)
- Consider adding user-specific presets in future (add `user_id` column)
- Ensure preset deletion confirmation for user safety
