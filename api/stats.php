<?php
require_once 'config.php';
require_once 'auth_middleware.php'; 

// Set content type to JSON
header('Content-Type: application/json');

// Add this line to require authentication (user can be any role)
$currentUser = requireAuth();

// Get database connection
$conn = getDbConnection();

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Check which type of stats to return
        if (isset($_GET['user_shifts'])) {
            // Get user shift counts for a month
            if (!isset($_GET['year']) || !isset($_GET['month'])) {
                handleError('Year and month parameters are required', 400);
            }
            
            $year = (int)$_GET['year'];
            $month = (int)$_GET['month'];
            
            // Calculate the first and last day of the month
            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));
            
            // Get shift counts for all users
            $stmt = $conn->prepare("
                SELECT 
                    u.id AS user_id,
                    u.name AS user_name,
                    COUNT(CASE WHEN s.user1_id = u.id THEN 1 END) +
                    COUNT(CASE WHEN s.user2_id = u.id THEN 1 END) AS shift_count
                FROM 
                    users u
                LEFT JOIN 
                    shifts s ON (s.user1_id = u.id OR s.user2_id = u.id) AND s.date BETWEEN ? AND ?
                WHERE 
                    u.active = 1
                GROUP BY 
                    u.id, u.name
                ORDER BY 
                    u.name
            ");
            
            $stmt->bind_param('ss', $firstDay, $lastDay);
            
            if (!$stmt->execute()) {
                handleError('Failed to execute query: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $userShifts = [];
            
            while ($row = $result->fetch_assoc()) {
                $userShifts[] = $row;
            }
            
            sendJsonResponse($userShifts);
        } else {
            // Default summary stats
            if (isset($_GET['year']) && isset($_GET['month'])) {
                // Get stats for a specific month
                $year = (int)$_GET['year'];
                $month = (int)$_GET['month'];
                
                // Calculate the first and last day of the month
                $firstDay = sprintf('%04d-%02d-01', $year, $month);
                $lastDay = date('Y-m-t', strtotime($firstDay));
                
                // Get basic calendar stats
                $summaryStats = [
                    'year' => $year,
                    'month' => $month,
                    'workdays' => 0,
                    'shifts' => [
                        'total' => 0,
                        'filled' => 0,
                        'percentage' => 0
                    ],
                    'users' => [
                        'total' => 0,
                        'active' => 0,
                        'with_shifts' => 0
                    ],
                    'events' => [
                        'schreibdienst' => 0
                    ]
                ];
                
                // Count workdays in the month
                $currentDay = $firstDay;
                while ($currentDay <= $lastDay) {
                    if (!isWeekend($currentDay)) {
                        $summaryStats['workdays']++;
                    }
                    $currentDay = date('Y-m-d', strtotime($currentDay . ' +1 day'));
                }
                
                // Total possible shifts (2 shifts per workday, 2 users per shift)
                $summaryStats['shifts']['total'] = $summaryStats['workdays'] * 4;
                
                // Count filled shifts
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(CASE WHEN user1_id != '' AND user1_id IS NOT NULL THEN 1 END) +
                        COUNT(CASE WHEN user2_id != '' AND user2_id IS NOT NULL THEN 1 END) AS filled_shifts
                    FROM 
                        shifts
                    WHERE 
                        date BETWEEN ? AND ?
                ");
                
                $stmt->bind_param('ss', $firstDay, $lastDay);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $summaryStats['shifts']['filled'] = (int)$result['filled_shifts'];
                
                // Calculate percentage
                if ($summaryStats['shifts']['total'] > 0) {
                    $summaryStats['shifts']['percentage'] = round(
                        ($summaryStats['shifts']['filled'] / $summaryStats['shifts']['total']) * 100, 1
                    );
                }
                
                // Count users
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) AS total_users,
                        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_users
                    FROM 
                        users
                ");
                
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $summaryStats['users']['total'] = (int)$result['total_users'];
                $summaryStats['users']['active'] = (int)$result['active_users'];
                
                // Count users with shifts
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(DISTINCT CASE WHEN user1_id != '' AND user1_id IS NOT NULL THEN user1_id 
                                      WHEN user2_id != '' AND user2_id IS NOT NULL THEN user2_id END) AS users_with_shifts
                    FROM 
                        shifts
                    WHERE 
                        date BETWEEN ? AND ?
                ");
                
                $stmt->bind_param('ss', $firstDay, $lastDay);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $summaryStats['users']['with_shifts'] = (int)$result['users_with_shifts'];
                
                // Count Schreibdienst events
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) AS schreibdienst_events
                    FROM 
                        schreibdienst_events
                    WHERE 
                        date BETWEEN ? AND ?
                ");
                
                $stmt->bind_param('ss', $firstDay, $lastDay);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $summaryStats['events']['schreibdienst'] = (int)$result['schreibdienst_events'];
                
                sendJsonResponse($summaryStats);
            } else {
                // Return global stats (across all time)
                $globalStats = [
                    'users' => [
                        'total' => 0,
                        'active' => 0,
                        'schreibdienst' => 0,
                        'starter' => 0
                    ],
                    'shifts' => [
                        'total' => 0,
                        'filled' => 0,
                        'percentage' => 0
                    ],
                    'events' => [
                        'schreibdienst' => 0
                    ],
                    'holidays' => 0
                ];
                
                // Count users
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) AS total_users,
                        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_users,
                        SUM(CASE WHEN is_schreibdienst = 1 THEN 1 ELSE 0 END) AS schreibdienst_users,
                        SUM(CASE WHEN is_starter = 1 THEN 1 ELSE 0 END) AS starter_users
                    FROM 
                        users
                ");
                
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $globalStats['users']['total'] = (int)$result['total_users'];
                $globalStats['users']['active'] = (int)$result['active_users'];
                $globalStats['users']['schreibdienst'] = (int)$result['schreibdienst_users'];
                $globalStats['users']['starter'] = (int)$result['starter_users'];
                
                // Count shifts
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) * 2 AS total_shifts,
                        SUM(CASE WHEN user1_id != '' AND user1_id IS NOT NULL THEN 1 ELSE 0 END) +
                        SUM(CASE WHEN user2_id != '' AND user2_id IS NOT NULL THEN 1 ELSE 0 END) AS filled_shifts
                    FROM 
                        shifts
                ");
                
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $globalStats['shifts']['total'] = (int)$result['total_shifts'];
                $globalStats['shifts']['filled'] = (int)$result['filled_shifts'];
                
                // Calculate percentage
                if ($globalStats['shifts']['total'] > 0) {
                    $globalStats['shifts']['percentage'] = round(
                        ($globalStats['shifts']['filled'] / $globalStats['shifts']['total']) * 100, 1
                    );
                }
                
                // Count Schreibdienst events
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) AS schreibdienst_events
                    FROM 
                        schreibdienst_events
                ");
                
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $globalStats['events']['schreibdienst'] = (int)$result['schreibdienst_events'];
                
                // Count holidays
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(*) AS holidays
                    FROM 
                        holidays
                ");
                
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $globalStats['holidays'] = (int)$result['holidays'];
                
                sendJsonResponse($globalStats);
            }
        }
        
        break;
        
    default:
        handleError('Method not allowed', 405);
}

$conn->close();