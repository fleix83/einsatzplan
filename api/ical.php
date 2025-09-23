<?php
require_once 'config.php';
require_once 'auth_middleware.php'; 

// Check if year and month are provided for monthly export, otherwise use continuous mode
$isContinuousMode = !isset($_GET['year']) || !isset($_GET['month']);

if ($isContinuousMode) {
    // Continuous subscription mode: no year/month needed
    $year = null;
    $month = null;
} else {
    // Monthly export mode: validate parameters
    $year = (int)$_GET['year'];
    $month = (int)$_GET['month'];
    
    if ($year < 2020 || $year > 2030 || $month < 1 || $month > 12) {
        http_response_code(400);
        exit('Invalid year or month parameters');
    }
}

// Check for user_id parameter - this is optional for filtering by user
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

// Check if this is a feed request (for subscribable feed) or a download
$isFeed = isset($_GET['feed']) && $_GET['feed'] === 'true';

// Set headers for calendar file download or feed
if ($isFeed || $isContinuousMode) {
    header('Content-Type: text/calendar; charset=utf-8');
    // Shorter cache time for continuous feeds
    header('Cache-Control: max-age=3600');
} else {
    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename="calendar-' . $year . '-' . $month . '.ics"');
}

// Get database connection
$conn = getDbConnection();

// Calculate date range based on mode
if ($isContinuousMode) {
    // Continuous mode: rolling 15-month window (3 months past + 12 months future)
    $firstDay = date('Y-m-01', strtotime('-3 months'));
    $lastDay = date('Y-m-t', strtotime('+12 months'));
} else {
    // Monthly mode: specific month
    $firstDay = sprintf('%04d-%02d-01', $year, $month);
    $lastDay = date('Y-m-t', strtotime($firstDay));
}

// Start building the iCalendar content
$icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' . ($isContinuousMode ? 'Einsatzplan Wegweiser' : 'Schedule ' . date('F Y', strtotime($firstDay))),
    'X-WR-TIMEZONE:Europe/Zurich',
];

// Get all ALS shifts for the month
$sql = "
    SELECT 
        s.date, 
        s.shift_type, 
        s.user1_id, 
        s.user2_id, 
        s.note1, 
        s.note2,
        u1.name as user1_name,
        u2.name as user2_name,
        u1.is_starter as user1_is_starter,
        u2.is_starter as user2_is_starter,
        u1.is_schreibdienst as user1_is_schreibdienst,
        u2.is_schreibdienst as user2_is_schreibdienst
    FROM 
        shifts s
    LEFT JOIN 
        users u1 ON s.user1_id = u1.id
    LEFT JOIN 
        users u2 ON s.user2_id = u2.id
    WHERE 
        s.date BETWEEN ? AND ?
";

// Add user filtering if a user ID is provided
$params = [$firstDay, $lastDay];
$types = 'ss';

if ($userId !== null) {
    $sql .= " AND (s.user1_id = ? OR s.user2_id = ?)";
    $params[] = $userId;
    $params[] = $userId;
    $types .= 'ii';
}

$sql .= " ORDER BY s.date, s.shift_type";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

while ($shift = $result->fetch_assoc()) {
    $date = $shift['date'];
    $shiftType = $shift['shift_type'];
    
    // Format date components for iCal
    $dateFormatted = str_replace('-', '', $date);
    
    // Define shift times based on shift type
    $startTime = $shiftType === 'E1' ? '110000' : '143000'; // 11:00 for E1, 14:30 for E2
    $endTime = $shiftType === 'E1' ? '143000' : '180000';   // 14:30 for E1, 18:00 for E2
    
    // Create user string
    $users = [];
    if (!empty($shift['user1_id']) && !empty($shift['user1_name'])) {
        $users[] = $shift['user1_name'] . ($shift['note1'] ? ' (' . $shift['note1'] . ')' : '');
    }
    if (!empty($shift['user2_id']) && !empty($shift['user2_name'])) {
        $users[] = $shift['user2_name'] . ($shift['note2'] ? ' (' . $shift['note2'] . ')' : '');
    }
    
    $userString = implode(', ', $users);
    $summary = $shiftType . ': ' . ($userString ?: 'Not assigned');
    
    // Create unique ID for event (deterministic for consistent subscriptions)
    $uid = md5($date . $shiftType . ($shift['user1_id'] ?? '') . ($shift['user2_id'] ?? '')) . '@calendar-scheduler';
    
    // Determine event color based on user types
    $color = null;
    
    // Check if any user is a Schreibdienst
    $hasSchreibdienst = !empty($shift['user1_is_schreibdienst']) || !empty($shift['user2_is_schreibdienst']);
    
    // Check if any user is a Starter
    $hasStarter = !empty($shift['user1_is_starter']) || !empty($shift['user2_is_starter']);
    
    // Set color based on user types
    if ($hasSchreibdienst) {
        $color = '#6ae09e'; // Green color for Schreibdienst
    } else if ($hasStarter) {
        $color = '#ffd000'; // Yellow color for Starter
    } else if (!empty($shift['user1_id']) || !empty($shift['user2_id'])) {
        $color = '#1760ff'; // Blue color for normal assigned shifts
    } else {
        $color = '#f5f5f5'; // Light grey for unassigned shifts
    }
    
    // Add the event
    $icalContent[] = 'BEGIN:VEVENT';
    $icalContent[] = 'UID:' . $uid;
    $icalContent[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
    $icalContent[] = 'DTSTART:' . $dateFormatted . 'T' . $startTime;
    $icalContent[] = 'DTEND:' . $dateFormatted . 'T' . $endTime;
    $icalContent[] = 'SUMMARY:' . $summary;
    $icalContent[] = 'LOCATION:';
    $icalContent[] = 'DESCRIPTION:' . 
        ($shift['note1'] ? 'Note 1: ' . $shift['note1'] . '\\n' : '') . 
        ($shift['note2'] ? 'Note 2: ' . $shift['note2'] . '\\n' : '');
    
    // Add color if we have one
    if ($color) {
        $icalContent[] = 'COLOR:' . $color;
        // Apple Calendar uses X-APPLE-CALENDAR-COLOR
        $icalContent[] = 'X-APPLE-CALENDAR-COLOR:' . $color;
        // Microsoft Outlook and some others use X-MICROSOFT-CDO-BUSYSTATUS
        $icalContent[] = 'X-MICROSOFT-CDO-BUSYSTATUS:BUSY';
    }
    
    $icalContent[] = 'END:VEVENT';
}

// Get Schreibdienst events for the month
$schreibdienstSql = "
    SELECT 
        e.date, 
        e.time, 
        e.shift_type, 
        e.details,
        e.user_id,
        u.name as user_name
    FROM 
        schreibdienst_events e
    JOIN 
        users u ON e.user_id = u.id
    WHERE 
        e.date BETWEEN ? AND ?
";

// Add user filtering for Schreibdienst events if a user ID is provided
$schreibdienstParams = [$firstDay, $lastDay];
$schreibdienstTypes = 'ss';

if ($userId !== null) {
    $schreibdienstSql .= " AND e.user_id = ?";
    $schreibdienstParams[] = $userId;
    $schreibdienstTypes .= 'i';
}

$schreibdienstSql .= " ORDER BY e.date, e.time";

$stmt = $conn->prepare($schreibdienstSql);
$stmt->bind_param($schreibdienstTypes, ...$schreibdienstParams);
$stmt->execute();
$result = $stmt->get_result();

while ($event = $result->fetch_assoc()) {
    $date = $event['date'];
    $time = $event['time'];
    
    // Format date and time components for iCal
    $dateFormatted = str_replace('-', '', $date);
    $timeFormatted = str_replace(':', '', $time);
    
    // Add padding for time if needed
    if (strlen($timeFormatted) === 4) {
        $timeFormatted .= '00';
    }
    
    // Event duration (default 1 hour)
    $endTime = date('His', strtotime($time) + 3600);
    
    // Create unique ID for event (deterministic for consistent subscriptions)
    $uid = md5($date . $time . $event['user_id'] . $event['details']) . '@calendar-scheduler';
    
    // Create summary
    $summary = 'Schreibdienst: ' . $event['details'];
    
    // Set color for Schreibdienst events
    $color = '#6ae09e'; // Green for Schreibdienst
    
    // Add the event
    $icalContent[] = 'BEGIN:VEVENT';
    $icalContent[] = 'UID:' . $uid;
    $icalContent[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
    $icalContent[] = 'DTSTART:' . $dateFormatted . 'T' . $timeFormatted;
    $icalContent[] = 'DTEND:' . $dateFormatted . 'T' . $endTime;
    $icalContent[] = 'SUMMARY:' . $summary;
    $icalContent[] = 'LOCATION:';
    $icalContent[] = 'DESCRIPTION:Created by ' . $event['user_name'];
    
    // Add color
    $icalContent[] = 'COLOR:' . $color;
    $icalContent[] = 'X-APPLE-CALENDAR-COLOR:' . $color;
    $icalContent[] = 'X-MICROSOFT-CDO-BUSYSTATUS:BUSY';
    
    $icalContent[] = 'END:VEVENT';
}

// End the calendar
$icalContent[] = 'END:VCALENDAR';

// Output the iCalendar content
echo implode("\r\n", $icalContent);

$conn->close();