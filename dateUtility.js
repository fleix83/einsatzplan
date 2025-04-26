// German date formatting utility
const GermanDateFormatter = {
    // German names for days and months
    weekdays: [
        'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 
        'Donnerstag', 'Freitag', 'Samstag'
    ],
    weekdaysShort: [
        'So', 'Mo', 'Di', 'Mi', 
        'Do', 'Fr', 'Sa'
    ],
    months: [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ],
    monthsShort: [
        'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
        'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ],
    
    // Format a date to a specific pattern
    formatDate: function(date, pattern = 'dd.MM.yyyy') {
        if (!(date instanceof Date)) {
            // Try to convert to Date if it's not already
            try {
                date = new Date(date);
            } catch (error) {
                console.error('Invalid date:', date);
                return '';
            }
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.error('Invalid date object:', date);
            return '';
        }
        
        const day = date.getDate();
        const month = date.getMonth(); // 0-based
        const year = date.getFullYear();
        const weekday = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Instead of using string replacements that can conflict, 
        // let's build the string pattern by pattern
        let result = '';
        let i = 0;
        
        while (i < pattern.length) {
            // Check for each pattern starting at current position
            if (pattern.substring(i, i + 4) === 'EEEE') {
                result += this.weekdays[weekday];
                i += 4;
            } else if (pattern.substring(i, i + 3) === 'EEE') {
                result += this.weekdaysShort[weekday];
                i += 3;
            } else if (pattern.substring(i, i + 4) === 'MMMM') {
                result += this.months[month];
                i += 4;
            } else if (pattern.substring(i, i + 3) === 'MMM') {
                result += this.monthsShort[month];
                i += 3;
            } else if (pattern.substring(i, i + 2) === 'MM') {
                result += (month + 1).toString().padStart(2, '0');
                i += 2;
            } else if (pattern.substring(i, i + 1) === 'M') {
                result += (month + 1).toString();
                i += 1;
            } else if (pattern.substring(i, i + 2) === 'dd') {
                result += day.toString().padStart(2, '0');
                i += 2;
            } else if (pattern.substring(i, i + 1) === 'd') {
                result += day.toString();
                i += 1;
            } else if (pattern.substring(i, i + 4) === 'yyyy') {
                result += year.toString();
                i += 4;
            } else if (pattern.substring(i, i + 2) === 'yy') {
                result += year.toString().slice(-2);
                i += 2;
            } else {
                // For any other character, just add it as is
                result += pattern[i];
                i += 1;
            }
        }
        
        return result;
    },
    
    // Short date format: dd.MM.yyyy (15.03.2025)
    formatShortDate: function(date) {
        return this.formatDate(date, 'dd.MM.yyyy');
    },
    
    // Medium date format: dd. MMMM yyyy (15. März 2025)
    formatMediumDate: function(date) {
        return this.formatDate(date, 'dd. MMMM yyyy');
    },
    
    // Long date format: EEEE, dd. MMMM yyyy (Samstag, 15. März 2025)
    formatLongDate: function(date) {
        return this.formatDate(date, 'EEEE, dd. MMMM yyyy');
    },
    
    // Format for month and year: MMMM yyyy (März 2025)
    formatMonthYear: function(date) {
        return this.formatDate(date, 'MMMM yyyy');
    },
    
    // Get month name
    getMonthName: function(month) {
        // Adjust for 0-based index if needed
        const monthIndex = month - 1;
        return this.months[monthIndex];
    },
    
    // Get weekday name
    getWeekdayName: function(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return this.weekdays[date.getDay()];
    }
};

// Example usage:
// GermanDateFormatter.formatShortDate(new Date(2025, 2, 15)); // "15.03.2025"
// GermanDateFormatter.formatLongDate(new Date(2025, 2, 15));  // "Samstag, 15. März 2025"
// GermanDateFormatter.getMonthName(3);                        // "März"