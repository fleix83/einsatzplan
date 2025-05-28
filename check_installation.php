<?php
// check_installation.php - Utility to check installation status and database connectivity
header('Content-Type: application/json');

// Load full path to current directory
$baseDir = dirname(__FILE__);

// Check if config directory exists
$configDirExists = is_dir($baseDir . '/config');

// Check if config file exists
$configFileExists = file_exists($baseDir . '/config/config.php');

// Check if db.php exists
$dbFileExists = file_exists($baseDir . '/config/db.php');

// Check database connectivity
$dbConnected = false;
$dbInfo = 'Not tested';

if ($configFileExists) {
    try {
        // Include the db.php file
        require_once($baseDir . '/config/db.php');
        
        // Test connection
        $conn = getDbConnection();
        if ($conn && !$conn->connect_error) {
            $dbConnected = true;
            
            // Get database info
            $tables = [];
            $result = $conn->query("SHOW TABLES");
            while ($row = $result->fetch_row()) {
                $tables[] = $row[0];
            }
            
            // Check users table
            $usersExist = in_array('users', $tables);
            $usersCount = 0;
            
            if ($usersExist) {
                $userResult = $conn->query("SELECT COUNT(*) as count FROM users WHERE active = 1");
                if ($userResult && $row = $userResult->fetch_assoc()) {
                    $usersCount = $row['count'];
                }
            }
            
            $dbInfo = [
                'tables' => $tables,
                'tablesCount' => count($tables),
                'usersExist' => $usersExist,
                'activeUsers' => $usersCount
            ];
            
            $conn->close();
        } else {
            $dbInfo = 'Connection failed: ' . ($conn ? $conn->connect_error : 'Unknown error');
        }
    } catch (Exception $e) {
        $dbInfo = 'Error: ' . $e->getMessage();
    }
}

// Check if original config.php was backed up
$configBackupExists = file_exists($baseDir . '/api/config.php.bak');

// Check file permissions
$configDirWritable = is_writable($baseDir) || (is_dir($baseDir . '/config') && is_writable($baseDir . '/config'));
$apiDirWritable = is_dir($baseDir . '/api') && is_writable($baseDir . '/api');

// Return status as JSON
echo json_encode([
    'installed' => $configDirExists && $configFileExists && $dbFileExists,
    'configDirExists' => $configDirExists,
    'configFileExists' => $configFileExists,
    'dbFileExists' => $dbFileExists,
    'configBackupExists' => $configBackupExists,
    'dbConnected' => $dbConnected,
    'dbInfo' => $dbInfo,
    'filePermissions' => [
        'configDirWritable' => $configDirWritable,
        'apiDirWritable' => $apiDirWritable
    ],
    'serverInfo' => [
        'phpVersion' => PHP_VERSION,
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'documentRoot' => $_SERVER['DOCUMENT_ROOT'],
        'scriptPath' => __FILE__
    ]
]);