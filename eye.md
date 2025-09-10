# Eye Graphic Implementation for Full Shifts

## Overview
This document describes the implementation of the eye.svg graphic overlay feature for full-shift calendar entries. The eye graphic appears on shifts with full capacity (both red and green background shifts) to provide visual indication when volunteer names are hidden.

## Files Modified

### 1. `/eye.svg`
- SVG graphic file with eye icon
- Fill color: `#fffcf7` (light cream color)
- Used as background image overlay on full shifts

### 2. `/styles.css`
Eye graphic overlay CSS rules added:

```css
/* Eye graphic overlay for red shifts */
.shift-left.red:not(.hide-eye-graphic),
.shift-right.red:not(.hide-eye-graphic) {
    background-image: url('eye.svg'), linear-gradient(to bottom, var(--color-empty), var(--color-empty)) !important;
    background-position: center, center !important;
    background-repeat: no-repeat, no-repeat !important;
    background-size: auto 80%, cover !important;
    background-blend-mode: normal, normal !important;
}

/* Eye graphic overlay for green shifts (full-shifts) */
.shift-left.green:not(.hide-eye-graphic),
.shift-right.green:not(.hide-eye-graphic) {
    background-image: url('eye.svg'), linear-gradient(to bottom, var(--color-full), var(--color-full)) !important;
    background-position: center, center !important;
    background-repeat: no-repeat, no-repeat !important;
    background-size: auto 80%, cover !important;
    background-blend-mode: normal, normal !important;
}

/* Hide eye graphic when names are toggled on */
.shift-left.red.hide-eye-graphic,
.shift-right.red.hide-eye-graphic,
.shift-left.green.hide-eye-graphic,
.shift-right.green.hide-eye-graphic {
    background-image: none !important;
}

/* Ensure all text content within shifts stays above eye graphic, but not holiday stripes */
.shift-left > *:not(.holiday-stripe),
.shift-right > *:not(.holiday-stripe) {
    position: relative;
    z-index: 5;
}
```

### 3. `/js/colorCustomization.js`
Dynamic CSS generation updated to include eye graphic rules:

```css
/* Eye graphic overlay for red shifts - when names are hidden */
.shift-left.red:not(.hide-eye-graphic), .shift-right.red:not(.hide-eye-graphic) {
    background-image: url('eye.svg'), linear-gradient(to bottom, var(--color-empty), var(--color-empty)) !important;
    background-position: center, center !important;
    background-repeat: no-repeat, no-repeat !important;
    background-size: auto 80%, cover !important;
    background-blend-mode: normal, normal !important;
}

/* Eye graphic overlay for green shifts (full-shifts) - when names are hidden */
.shift-left.green:not(.hide-eye-graphic), .shift-right.green:not(.hide-eye-graphic) {
    background-image: url('eye.svg'), linear-gradient(to bottom, var(--color-full), var(--color-full)) !important;
    background-position: center, center !important;
    background-repeat: no-repeat, no-repeat !important;
    background-size: auto 80%, cover !important;
    background-blend-mode: normal, normal !important;
}

/* Hide eye graphic when names are toggled on */
.shift-left.red.hide-eye-graphic, .shift-right.red.hide-eye-graphic,
.shift-left.green.hide-eye-graphic, .shift-right.green.hide-eye-graphic {
    background-image: none !important;
}
```

### 4. `/js/script.js`
Updated `updateEyeGraphicsVisibility()` function to target both red and green shifts:

```javascript
const shiftsWithEyeGraphic = calendar.querySelectorAll('.shift-left.red, .shift-right.red, .shift-left.green, .shift-right.green');
```

## Technical Implementation Details

### Background Layering
- Uses CSS multiple backgrounds with two layers:
  1. `url('eye.svg')` - The eye graphic
  2. `linear-gradient(to bottom, var(--color), var(--color))` - Solid color background
- Eye graphic is positioned at `center` with `auto 80%` size (80% height, auto width)
- Background color uses CSS custom properties for theme integration

### Visibility Control
- Eye graphic shows when shift has full capacity AND names are hidden
- Controlled by presence/absence of `.hide-eye-graphic` class
- `:not(.hide-eye-graphic)` selector ensures graphic only appears when appropriate

### Z-Index Management
- Text content within shifts has `z-index: 5` to stay above eye graphic
- Holiday stripes excluded from z-index rule with `:not(.holiday-stripe)` selector
- Eye graphic appears below text but above background colors

### Theme Integration
- Integrated with existing color customization system
- Uses CSS custom properties (`--color-empty`, `--color-full`) for dynamic theming
- Rules duplicated in both static CSS and dynamic JavaScript-generated CSS

## Behavior

### When Eye Graphic Appears
- Shift has full capacity (red or green background)
- Volunteer names are hidden (names toggle is off)
- Not overridden by other styling rules

### When Eye Graphic Hidden
- Names toggle is turned on (`.hide-eye-graphic` class added)
- Shift is not at full capacity
- Special cases like official holidays may override

## CSS Selectors Used

### Target Selectors
- `.shift-left.red:not(.hide-eye-graphic)` - Left red shifts without hide class
- `.shift-right.red:not(.hide-eye-graphic)` - Right red shifts without hide class  
- `.shift-left.green:not(.hide-eye-graphic)` - Left green shifts without hide class
- `.shift-right.green:not(.hide-eye-graphic)` - Right green shifts without hide class

### Hide Selectors
- `.shift-left.red.hide-eye-graphic` - Hide graphic on left red shifts
- `.shift-right.red.hide-eye-graphic` - Hide graphic on right red shifts
- `.shift-left.green.hide-eye-graphic` - Hide graphic on left green shifts
- `.shift-right.green.hide-eye-graphic` - Hide graphic on right green shifts

## Integration Points

1. **Color System**: Integrated with existing CSS custom properties and color customization feature
2. **Names Toggle**: Responds to existing name visibility toggle functionality
3. **Holiday System**: Positioned to not interfere with holiday stripe overlays
4. **Responsive Design**: Uses relative sizing (`auto 80%`) to work across different screen sizes

## Notes

- Eye graphic appears on both red and green full-shifts as requested
- Does not hide shift labels (E1, E2) - they remain visible with the graphic
- Background image approach allows for easy replacement of graphic file
- Uses `!important` declarations to override existing background styling
- Maintains compatibility with existing calendar functionality