<?php
/**
 * Database Functions
 * 
 * Core functions for interacting with the MySQL database for the Calendar Application.
 * This file provides the connection to the database and utility functions to perform
 * CRUD operations on the calendar data.
 */

// At the top of db.php
function debug_log($message) {
    error_log("DB DEBUG: " . $message);
    // Also write to a specific file for easier debugging
    file_put_contents(__DIR__ . '/db_debug.log', date('[Y-m-d H:i:s] ') . $message . "\n", FILE_APPEND);
}

// db_absolute.php - copy this file to your main directory
function getDbConfig() {
    static $config = null;
    
    if ($config === null) {
        // Use absolute path
        $configFile = '/Applications/XAMPP/xamppfiles/htdocs/einsatzplan/api/config.php';
        
        if (!file_exists($configFile)) {
            throw new Exception('Database configuration file not found at: ' . $configFile);
        }
        
        $config = require $configFile;
    }
    
    return $config;
}

function getDbConnection() {
    debug_log("getDbConnection called");
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $config = getDbConfig();
            debug_log("Got config, connecting to database: {$config['host']}, {$config['name']}");
            
            $dsn = "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
            debug_log("Database connection successful");
        } catch (PDOException $e) {
            debug_log("Database connection failed: " . $e->getMessage());
            throw new Exception('Failed to connect to the database. Please check your configuration.');
        }
    } else {
        debug_log("Using existing database connection");
    }
    
    return $pdo;
}

/**
 * Get table name with prefix
 * 
 * @param string $table Base table name
 * @return string Table name with prefix
 */
function getTableName($table) {
    $config = getDbConfig();
    return ($config['prefix'] ?? '') . $table;
}

/**
 * Get all users
 * 
 * @param bool $activeOnly Whether to return only active users
 * @return array Array of user records
 */
function getUsers($activeOnly = true) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    $sql = "SELECT * FROM {$tableName}";
    if ($activeOnly) {
        $sql .= " WHERE active = 1";
    }
    $sql .= " ORDER BY name ASC";
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll();
}

/**
 * Get user by ID
 * 
 * @param string $userId User ID
 * @return array|null User record or null if not found
 */
function getUserById($userId) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    $sql = "SELECT * FROM {$tableName} WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $userId]);
    
    return $stmt->fetch() ?: null;
}

/**
 * Get user by email
 * 
 * @param string $email User email
 * @return array|null User record or null if not found
 */
function getUserByEmail($email) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    $sql = "SELECT * FROM {$tableName} WHERE email = :email";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['email' => $email]);
    
    return $stmt->fetch() ?: null;
}


/**
 * Create a new user
 * 
 * @param array $userData User data (name, email, password, role, etc.)
 * @return int New user ID
 */
function createUser($userData) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    // Check if email already exists
    if (!empty($userData['email'])) {
        $existingUser = getUserByEmail($userData['email']);
        if ($existingUser) {
            throw new Exception('A user with this email already exists.');
        }
    }
    
    // Hash password if provided
    if (!empty($userData['password'])) {
        $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
    }
    
    // Prepare fields and values
    $fields = [];
    $placeholders = [];
    $values = [];
    
    foreach ($userData as $field => $value) {
        $fields[] = $field;
        $placeholders[] = ':' . $field;
        $values[$field] = $value;
    }
    
    $sql = "INSERT INTO {$tableName} (" . implode(', ', $fields) . ") 
            VALUES (" . implode(', ', $placeholders) . ")";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    return $pdo->lastInsertId();
}

/**
 * Update user
 * 
 * @param int $userId User ID
 * @param array $userData User data to update
 * @return bool Success status
 */
function updateUser($userId, $userData) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    // Check if user exists
    $user = getUserById($userId);
    if (!$user) {
        throw new Exception('User not found.');
    }
    
    // Check if email is already taken by another user
    if (!empty($userData['email']) && $userData['email'] !== $user['email']) {
        $existingUser = getUserByEmail($userData['email']);
        if ($existingUser && $existingUser['id'] != $userId) {
            throw new Exception('Email is already taken by another user.');
        }
    }
    
    // Hash password if provided
    if (!empty($userData['password'])) {
        $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
    }
    
    // Prepare update statement
    $updates = [];
    $values = [];
    
    foreach ($userData as $field => $value) {
        $updates[] = "{$field} = :{$field}";
        $values[$field] = $value;
    }
    
    $values['id'] = $userId;
    
    $sql = "UPDATE {$tableName} SET " . implode(', ', $updates) . " WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($values);
}

/**
 * Update user password
 * 
 * @param int $userId User ID
 * @param string $password New password
 * @return bool Success status
 */
function updateUserPassword($userId, $password) {
    return updateUser($userId, ['password' => password_hash($password, PASSWORD_DEFAULT)]);
}

/**
 * Delete user
 * 
 * @param int $userId User ID
 * @return bool Success status
 */
function deleteUser($userId) {
    $pdo = getDbConnection();
    $tableName = getTableName('users');
    
    $sql = "DELETE FROM {$tableName} WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    return $stmt->execute(['id' => $userId]);
}

/**
 * Get monthly schedule
 * 
 * @param int $year Year
 * @param int $month Month
 * @return array Schedule data
 */
function getMonthlySchedule($year, $month) {
    $pdo = getDbConnection();
    $shiftsTable = getTableName('shifts');
    
    $sql = "SELECT * FROM {$shiftsTable} WHERE YEAR(date) = :year AND MONTH(date) = :month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'year' => $year,
        'month' => $month
    ]);
    
    $shifts = $stmt->fetchAll();
    
    // Format into structured data
    $schedule = [];
    foreach ($shifts as $shift) {
        $date = new DateTime($shift['date']);
        $day = $date->format('j'); // Day without leading zeros
        
        if (!isset($schedule[$day])) {
            $schedule[$day] = [
                'E1' => ['', ''],
                'E2' => ['', ''],
                'notes' => [
                    'E1' => ['', ''],
                    'E2' => ['', '']
                ]
            ];
        }
        
        if ($shift['shift_type'] == 'E1') {
            if ($shift['user1_id']) $schedule[$day]['E1'][0] = $shift['user1_id'];
            if ($shift['user2_id']) $schedule[$day]['E1'][1] = $shift['user2_id'];
            $schedule[$day]['notes']['E1'][0] = $shift['note1'] ?? '';
            $schedule[$day]['notes']['E1'][1] = $shift['note2'] ?? '';
        } else if ($shift['shift_type'] == 'E2') {
            if ($shift['user1_id']) $schedule[$day]['E2'][0] = $shift['user1_id'];
            if ($shift['user2_id']) $schedule[$day]['E2'][1] = $shift['user2_id'];
            $schedule[$day]['notes']['E2'][0] = $shift['note1'] ?? '';
            $schedule[$day]['notes']['E2'][1] = $shift['note2'] ?? '';
        }
    }
    
    return $schedule;
}

/**
 * Update shift assignment
 * 
 * @param int $year Year
 * @param int $month Month
 * @param int $day Day
 * @param string $shift Shift type (E1 or E2)
 * @param int $position Position (0 or 1)
 * @param string $userId User ID
 * @param string $note Note for this assignment
 * @return bool Success status
 */
function updateShiftAssignment($year, $month, $day, $shift, $position, $userId, $note = '') {
    $pdo = getDbConnection();
    $shiftsTable = getTableName('shifts');
    
    // Format date
    $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    
    // Check if shift record exists
    $sql = "SELECT id FROM {$shiftsTable} WHERE date = :date AND shift_type = :shift_type";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'date' => $date,
        'shift_type' => $shift
    ]);
    
    $shiftRecord = $stmt->fetch();
    
    if ($shiftRecord) {
        // Update existing record
        $field = $position === 0 ? 'user1_id' : 'user2_id';
        $noteField = $position === 0 ? 'note1' : 'note2';
        
        $sql = "UPDATE {$shiftsTable} SET {$field} = :user_id, {$noteField} = :note WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute([
            'user_id' => $userId,
            'note' => $note,
            'id' => $shiftRecord['id']
        ]);
    } else {
        // Create new record
        $sql = "INSERT INTO {$shiftsTable} (date, shift_type, user1_id, user2_id, note1, note2) VALUES (:date, :shift_type, :user1_id, :user2_id, :note1, :note2)";
        $stmt = $pdo->prepare($sql);
        
        $user1Id = $position === 0 ? $userId : null;
        $user2Id = $position === 1 ? $userId : null;
        $note1 = $position === 0 ? $note : '';
        $note2 = $position === 1 ? $note : '';
        
        return $stmt->execute([
            'date' => $date,
            'shift_type' => $shift,
            'user1_id' => $user1Id,
            'user2_id' => $user2Id,
            'note1' => $note1,
            'note2' => $note2
        ]);
    }
}

/**
 * Check if a month is frozen
 * 
 * @param int $year Year
 * @param int $month Month
 * @return bool True if frozen, false otherwise
 */
function isMonthFrozen($year, $month) {
    $pdo = getDbConnection();
    $statesTable = getTableName('calendar_states');
    
    $sql = "SELECT is_frozen FROM {$statesTable} WHERE year = :year AND month = :month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'year' => $year,
        'month' => $month
    ]);
    
    $result = $stmt->fetch();
    
    return $result && $result['is_frozen'] == 1;
}

/**
 * Freeze or unfreeze a month
 * 
 * @param int $year Year
 * @param int $month Month
 * @param bool $freeze True to freeze, false to unfreeze
 * @param int $userId User ID performing the action
 * @return bool Success status
 */
function setMonthFrozen($year, $month, $freeze = true, $userId = null) {
    $pdo = getDbConnection();
    $statesTable = getTableName('calendar_states');
    
    // Check if record exists
    $sql = "SELECT id FROM {$statesTable} WHERE year = :year AND month = :month";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'year' => $year,
        'month' => $month
    ]);
    
    $record = $stmt->fetch();
    
    if ($record) {
        // Update existing record
        if ($freeze) {
            $sql = "UPDATE {$statesTable} SET is_frozen = 1, frozen_at = NOW(), frozen_by = :user_id WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            
            return $stmt->execute([
                'user_id' => $userId,
                'id' => $record['id']
            ]);
        } else {
            $sql = "UPDATE {$statesTable} SET is_frozen = 0, frozen_at = NULL, frozen_by = NULL WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            
            return $stmt->execute([
                'id' => $record['id']
            ]);
        }
    } else {
        // Create new record
        if ($freeze) {
            $sql = "INSERT INTO {$statesTable} (year, month, is_frozen, frozen_at, frozen_by) VALUES (:year, :month, 1, NOW(), :user_id)";
            $stmt = $pdo->prepare($sql);
            
            return $stmt->execute([
                'year' => $year,
                'month' => $month,
                'user_id' => $userId
            ]);
        } else {
            $sql = "INSERT INTO {$statesTable} (year, month, is_frozen) VALUES (:year, :month, 0)";
            $stmt = $pdo->prepare($sql);
            
            return $stmt->execute([
                'year' => $year,
                'month' => $month
            ]);
        }
    }
}

/**
 * Get Schreibdienst events
 * 
 * @param int $year Year
 * @param int $month Month
 * @return array Events
 */
function getSchreibdienstEvents($year, $month) {
    $pdo = getDbConnection();
    $eventsTable = getTableName('schreibdienst_events');
    $usersTable = getTableName('users');
    
    $sql = "SELECT e.*, u.name as user_name FROM {$eventsTable} e 
            LEFT JOIN {$usersTable} u ON e.user_id = u.id 
            WHERE YEAR(e.date) = :year AND MONTH(e.date) = :month";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'year' => $year,
        'month' => $month
    ]);
    
    $events = $stmt->fetchAll();
    
    // Organize by date
    $result = [];
    foreach ($events as $event) {
        $date = new DateTime($event['date']);
        $day = $date->format('j'); // Day without leading zeros
        
        if (!isset($result[$day])) {
            $result[$day] = [];
        }
        
        $result[$day][] = [
            'id' => $event['id'],
            'details' => $event['details'],
            'time' => $event['time'],
            'shift' => $event['shift_type'],
            'userId' => $event['user_id'],
            'userName' => $event['user_name']
        ];
    }
    
    return $result;
}

/**
 * Add Schreibdienst event
 * 
 * @param array $eventData Event data
 * @return int New event ID
 */
function addSchreibdienstEvent($eventData) {
    $pdo = getDbConnection();
    $eventsTable = getTableName('schreibdienst_events');
    
    // Format date if provided as year, month, day
    if (isset($eventData['year']) && isset($eventData['month']) && isset($eventData['day'])) {
        $date = sprintf('%04d-%02d-%02d', $eventData['year'], $eventData['month'], $eventData['day']);
    } else {
        $date = $eventData['date'];
    }
    
    $sql = "INSERT INTO {$eventsTable} (date, time, shift_type, details, user_id) 
            VALUES (:date, :time, :shift_type, :details, :user_id)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'date' => $date,
        'time' => $eventData['time'],
        'shift_type' => $eventData['shift'],
        'details' => $eventData['details'],
        'user_id' => $eventData['userId']
    ]);
    
    return $pdo->lastInsertId();
}

/**
 * Delete Schreibdienst event
 * 
 * @param int $eventId Event ID
 * @return bool Success status
 */
function deleteSchreibdienstEvent($eventId) {
    $pdo = getDbConnection();
    $eventsTable = getTableName('schreibdienst_events');
    
    $sql = "DELETE FROM {$eventsTable} WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    return $stmt->execute(['id' => $eventId]);
}

/**
 * Get holidays for user
 * 
 * @param int $userId User ID
 * @return array Holidays
 */
function getUserHolidays($userId) {
    $pdo = getDbConnection();
    $holidaysTable = getTableName('holidays');
    
    $sql = "SELECT * FROM {$holidaysTable} WHERE user_id = :user_id ORDER BY start_date";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    
    $holidays = $stmt->fetchAll();
    
    // Format for the expected structure
    $result = [];
    foreach ($holidays as $holiday) {
        $result[] = [
            'id' => $holiday['id'],
            'start' => $holiday['start_date'],
            'end' => $holiday['end_date'],
            'approved' => (bool)$holiday['approved']
        ];
    }
    
    return $result;
}

/**
 * Add holiday
 * 
 * @param int $userId User ID
 * @param string $startDate Start date (YYYY-MM-DD)
 * @param string $endDate End date (YYYY-MM-DD)
 * @param bool $approved Approval status
 * @return int New holiday ID
 */
function addHoliday($userId, $startDate, $endDate, $approved = true) {
    $pdo = getDbConnection();
    $holidaysTable = getTableName('holidays');
    
    $sql = "INSERT INTO {$holidaysTable} (user_id, start_date, end_date, approved) 
            VALUES (:user_id, :start_date, :end_date, :approved)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_id' => $userId,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'approved' => $approved ? 1 : 0
    ]);
    
    return $pdo->lastInsertId();
}

/**
 * Delete holiday
 * 
 * @param int $holidayId Holiday ID
 * @return bool Success status
 */
function deleteHoliday($holidayId) {
    $pdo = getDbConnection();
    $holidaysTable = getTableName('holidays');
    
    $sql = "DELETE FROM {$holidaysTable} WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    return $stmt->execute(['id' => $holidayId]);
}

/**
 * Create a new session
 * 
 * @param int $userId User ID
 * @param int $expiresInHours Hours until session expires
 * @return array Session data with token
 */
function createSession($userId, $expiresInHours = 12) {
    $pdo = getDbConnection();
    $sessionsTable = getTableName('sessions');
    
    // Generate random token
    $token = bin2hex(random_bytes(32));
    
    // Calculate expiration
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiresInHours} hours"));
    
    $sql = "INSERT INTO {$sessionsTable} (user_id, token, expires_at) 
            VALUES (:user_id, :token, :expires_at)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'user_id' => $userId,
        'token' => $token,
        'expires_at' => $expiresAt
    ]);
    
    return [
        'token' => $token,
        'expires_at' => $expiresAt
    ];
}

/**
 * Validate session token
 * 
 * @param string $token Session token
 * @return array|null User data if valid, null otherwise
 */
function validateSessionToken($token) {
    $pdo = getDbConnection();
    $sessionsTable = getTableName('sessions');
    $usersTable = getTableName('users');
    
    $sql = "SELECT u.* FROM {$sessionsTable} s
            JOIN {$usersTable} u ON s.user_id = u.id
            WHERE s.token = :token AND s.expires_at > NOW() AND u.active = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['token' => $token]);
    
    return $stmt->fetch();
}

/**
 * Delete session (logout)
 * 
 * @param string $token Session token
 * @return bool Success status
 */
function deleteSession($token) {
    $pdo = getDbConnection();
    $sessionsTable = getTableName('sessions');
    
    $sql = "DELETE FROM {$sessionsTable} WHERE token = :token";
    $stmt = $pdo->prepare($sql);
    
    return $stmt->execute(['token' => $token]);
}

/**
 * Clean expired sessions
 * 
 * @return int Number of deleted sessions
 */
function cleanExpiredSessions() {
    $pdo = getDbConnection();
    $sessionsTable = getTableName('sessions');
    
    $sql = "DELETE FROM {$sessionsTable} WHERE expires_at < NOW()";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    return $stmt->rowCount();
}

/**
 * Verify user login
 * 
 * @param string $email User email
 * @param string $password Password
 * @return array|null User data if login successful, null otherwise
 */
function verifyLogin($email, $password) {
    $user = getUserByEmail($email);
    
    if (!$user || !$user['active']) {
        return null;
    }
    
    if (password_verify($password, $user['password'])) {
        // Remove password from result
        unset($user['password']);
        return $user;
    }
    
    return null;
}

/**
 * Import data from localStorage JSON
 * 
 * @param string $jsonData JSON data
 * @return array Import statistics
 */
function importFromLocalStorage($jsonData) {
    $data = json_decode($jsonData, true);
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    $pdo = getDbConnection();
    $pdo->beginTransaction();
    
    $stats = [
        'users' => 0,
        'schedules' => 0,
        'schreibdienstEvents' => 0,
        'holidays' => 0
    ];
    
    try {
        // Import users
        if (!empty($data['users'])) {
            $usersTable = getTableName('users');
            foreach ($data['users'] as $user) {
                $stmt = $pdo->prepare("SELECT id FROM {$usersTable} WHERE name = :name");
                $stmt->execute(['name' => $user['name']]);
                
                if (!$stmt->fetch()) {
                    $sql = "INSERT INTO {$usersTable} 
                           (name, role, is_starter, is_schreibdienst, active) 
                           VALUES (:name, :role, :is_starter, :is_schreibdienst, :active)";
                           
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        'name' => $user['name'],
                        'role' => $user['role'] ?? 'Freiwillige',
                        'is_starter' => $user['isStarter'] ? 1 : 0,
                        'is_schreibdienst' => $user['isSchreibdienst'] ? 1 : 0,
                        'active' => $user['active'] ?? 1
                    ]);
                    
                    $stats['users']++;
                }
            }
        }
        
        // Import schedules
        if (!empty($data['schedules'])) {
            $shiftsTable = getTableName('shifts');
            
            foreach ($data['schedules'] as $year => $months) {
                foreach ($months as $month => $days) {
                    foreach ($days as $day => $shifts) {
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        
                        // Import E1 shift
                        if (!empty($shifts['E1'])) {
                            $sql = "INSERT INTO {$shiftsTable} 
                                   (date, shift_type, user1_id, user2_id, note1, note2) 
                                   VALUES (:date, 'E1', :user1_id, :user2_id, :note1, :note2)
                                   ON DUPLICATE KEY UPDATE 
                                   user1_id = :user1_id, user2_id = :user2_id, 
                                   note1 = :note1, note2 = :note2";
                                   
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute([
                                'date' => $date,
                                'user1_id' => $shifts['E1'][0] ?? null,
                                'user2_id' => $shifts['E1'][1] ?? null,
                                'note1' => $shifts['notes']['E1'][0] ?? '',
                                'note2' => $shifts['notes']['E1'][1] ?? ''
                            ]);
                            
                            $stats['schedules']++;
                        }
                        
                        // Import E2 shift
                        if (!empty($shifts['E2'])) {
                            $sql = "INSERT INTO {$shiftsTable} 
                                   (date, shift_type, user1_id, user2_id, note1, note2) 
                                   VALUES (:date, 'E2', :user1_id, :user2_id, :note1, :note2)
                                   ON DUPLICATE KEY UPDATE 
                                   user1_id = :user1_id, user2_id = :user2_id, 
                                   note1 = :note1, note2 = :note2";
                                   
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute([
                                'date' => $date,
                                'user1_id' => $shifts['E2'][0] ?? null,
                                'user2_id' => $shifts['E2'][1] ?? null,
                                'note1' => $shifts['notes']['E2'][0] ?? '',
                                'note2' => $shifts['notes']['E2'][1] ?? ''
                            ]);
                            
                            $stats['schedules']++;
                        }
                    }
                }
            }
        }
        
        // Import schreibdienst events
        if (!empty($data['schreibdienstEvents'])) {
            $eventsTable = getTableName('schreibdienst_events');
            
            foreach ($data['schreibdienstEvents'] as $year => $months) {
                foreach ($months as $month => $days) {
                    foreach ($days as $day => $events) {
                        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
                        
                        foreach ($events as $event) {
                            $sql = "INSERT INTO {$eventsTable} 
                                   (date, time, shift_type, details, user_id) 
                                   VALUES (:date, :time, :shift_type, :details, :user_id)";
                                   
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute([
                                'date' => $date,
                                'time' => $event['time'],
                                'shift_type' => $event['shift'],
                                'details' => $event['details'],
                                'user_id' => $event['userId']
                            ]);
                            
                            $stats['schreibdienstEvents']++;
                        }
                    }
                }
            }
        }
        
        // Import holidays
        if (!empty($data['holidays'])) {
            $holidaysTable = getTableName('holidays');
            
            foreach ($data['holidays'] as $userId => $holidays) {
                foreach ($holidays as $holiday) {
                    $sql = "INSERT INTO {$holidaysTable} 
                           (user_id, start_date, end_date, approved) 
                           VALUES (:user_id, :start_date, :end_date, :approved)";
                           
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        'user_id' => $userId,
                        'start_date' => $holiday['start'],
                        'end_date' => $holiday['end'],
                        'approved' => $holiday['approved'] ? 1 : 0
                    ]);
                    
                    $stats['holidays']++;
                }
            }
        }
        
        $pdo->commit();
        return $stats;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Convert the database data structure to localStorage format for backward compatibility
 * 
 * @return array Data in localStorage format
 */
function exportToLocalStorageFormat() {
    $result = [
        'users' => [],
        'schedules' => [],
        'schreibdienstEvents' => [],
        'holidays' => [],
        'settings' => [
            'shiftsPerDay' => 2,
            'usersPerShift' => 2,
            'shiftNames' => ['E1', 'E2'],
            'workingDays' => [1, 2, 3, 4, 5]
        ]
    ];
    
    // Get users
    $users = getUsers(false); // Get all users including inactive
    foreach ($users as $user) {
        $result['users'][] = [
            'id' => $user['id'],
            'name' => $user['name'],
            'active' => (bool)$user['active'],
            'role' => $user['role'],
            'isStarter' => (bool)$user['is_starter'],
            'isSchreibdienst' => (bool)$user['is_schreibdienst'],
            'maxShiftsPerWeek' => $user['max_shifts_per_week']
        ];
    }
    
    // Get schedules for current and next month
    $currentYear = date('Y');
    $currentMonth = date('n');
    
    // Function to add month data to result
    $addMonthData = function($year, $month) use (&$result) {
        $schedule = getMonthlySchedule($year, $month);
        if (!isset($result['schedules'][$year])) {
            $result['schedules'][$year] = [];
        }
        $result['schedules'][$year][$month] = $schedule;
        
        // Get schreibdienst events
        $events = getSchreibdienstEvents($year, $month);
        if (!empty($events)) {
            if (!isset($result['schreibdienstEvents'][$year])) {
                $result['schreibdienstEvents'][$year] = [];
            }
            $result['schreibdienstEvents'][$year][$month] = $events;
        }
    };
    
    // Add current month
    $addMonthData($currentYear, $currentMonth);
    
    // Add next month (handling year change)
    $nextMonth = $currentMonth == 12 ? 1 : $currentMonth + 1;
    $nextYear = $currentMonth == 12 ? $currentYear + 1 : $currentYear;
    $addMonthData($nextYear, $nextMonth);
    
    // Add holidays for all users
    foreach ($users as $user) {
        $holidays = getUserHolidays($user['id']);
        if (!empty($holidays)) {
            $result['holidays'][$user['id']] = $holidays;
        }
    }
    
    return $result;
}

/**
 * Generate iCalendar format for calendar export
 * 
 * @param int $year Year
 * @param int $month Month
 * @param int $userId User ID (optional - to filter by user)
 * @return string iCalendar data
 */
function generateICalendar($year, $month, $userId = null) {
    $pdo = getDbConnection();
    $shiftsTable = getTableName('shifts');
    $usersTable = getTableName('users');
    $eventsTable = getTableName('schreibdienst_events');
    
    // Start building the iCalendar content
    $icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendar App//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Calendar ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)),
        'X-WR-TIMEZONE:Europe/Zurich',
    ];
    
    // Calculate the first and last day of the month
    $firstDay = sprintf('%04d-%02d-01', $year, $month);
    $lastDay = date('Y-m-t', strtotime($firstDay));
    
    // Get all shifts for the month
    $sql = "SELECT s.*, 
            u1.name as user1_name, 
            u2.name as user2_name,
            u1.is_starter as user1_is_starter,
            u2.is_starter as user2_is_starter,
            u1.is_schreibdienst as user1_is_schreibdienst,
            u2.is_schreibdienst as user2_is_schreibdienst
            FROM {$shiftsTable} s
            LEFT JOIN {$usersTable} u1 ON s.user1_id = u1.id
            LEFT JOIN {$usersTable} u2 ON s.user2_id = u2.id
            WHERE s.date BETWEEN :first_day AND :last_day";
    
    // Add user filter if specified
    if ($userId) {
        $sql .= " AND (s.user1_id = :user_id OR s.user2_id = :user_id)";
    }
    
    $stmt = $pdo->prepare($sql);
    
    $params = [
        'first_day' => $firstDay,
        'last_day' => $lastDay
    ];
    
    if ($userId) {
        $params['user_id'] = $userId;
    }
    
    $stmt->execute($params);
    $shifts = $stmt->fetchAll();
    
    foreach ($shifts as $shift) {
        $date = $shift['date'];
        $dateFormatted = str_replace('-', '', $date);
        
        // Define shift times
        $startTime = $shift['shift_type'] === 'E1' ? '110000' : '143000'; // 11:00 for E1, 14:30 for E2
        $endTime = $shift['shift_type'] === 'E1' ? '143000' : '180000';   // 14:30 for E1, 18:00 for E2
        
        // Create user string
        $users = [];
        if ($shift['user1_id'] && $shift['user1_name']) {
            $users[] = $shift['user1_name'] . ($shift['note1'] ? ' (' . $shift['note1'] . ')' : '');
        }
        if ($shift['user2_id'] && $shift['user2_name']) {
            $users[] = $shift['user2_name'] . ($shift['note2'] ? ' (' . $shift['note2'] . ')' : '');
        }
        
        $userString = implode(', ', $users);
        $summary = $shift['shift_type'] . ': ' . ($userString ?: 'Not assigned');
        
        // Create unique ID for event
        $uid = md5($date . $shift['shift_type'] . rand()) . '@calendar-app';
        
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
        
        // Add the event to the calendar
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
    $sql = "SELECT e.*, u.name as user_name
            FROM {$eventsTable} e
            JOIN {$usersTable} u ON e.user_id = u.id
            WHERE e.date BETWEEN :first_day AND :last_day";
    
    // Add user filter if specified
    if ($userId) {
        $sql .= " AND e.user_id = :user_id";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();
    
    foreach ($events as $event) {
        $date = $event['date'];
        $dateFormatted = str_replace('-', '', $date);
        
        // Format time
        $timeFormatted = str_replace(':', '', $event['time']);
        if (strlen($timeFormatted) === 4) {
            $timeFormatted .= '00';
        }
        
        // Event duration (default 1 hour)
        $endTime = date('His', strtotime($event['time']) + 3600);
        
        // Create unique ID for event
        $uid = md5($date . $event['time'] . rand()) . '@calendar-app';
        
        // Create summary
        $summary = 'Schreibdienst: ' . $event['details'];
        
        // Add the event to the calendar
        $icalContent[] = 'BEGIN:VEVENT';
        $icalContent[] = 'UID:' . $uid;
        $icalContent[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
        $icalContent[] = 'DTSTART:' . $dateFormatted . 'T' . $timeFormatted;
        $icalContent[] = 'DTEND:' . $dateFormatted . 'T' . $endTime;
        $icalContent[] = 'SUMMARY:' . $summary;
        $icalContent[] = 'LOCATION:';
        $icalContent[] = 'DESCRIPTION:Created by ' . $event['user_name'];
        
        // Add color for Schreibdienst events
        $icalContent[] = 'COLOR:#6ae09e';
        $icalContent[] = 'X-APPLE-CALENDAR-COLOR:#6ae09e';
        $icalContent[] = 'X-MICROSOFT-CDO-BUSYSTATUS:BUSY';
        
        $icalContent[] = 'END:VEVENT';
    }
    
    // End the calendar
    $icalContent[] = 'END:VCALENDAR';
    
    return implode("\r\n", $icalContent);
}