<?php
/**
 * Installation Helper Functions
 * 
 * This file contains utility functions to assist with the installation process.
 */

// Function to import SQL schema
function importSqlSchema($conn, $schemaFile) {
    if (!file_exists($schemaFile)) {
        return [
            'success' => false,
            'error' => 'Schema file not found: ' . $schemaFile
        ];
    }
    
    try {
        $sql = file_get_contents($schemaFile);
        
        // Split SQL by semicolons to get individual statements
        // This is a simple approach and might not work for all SQL files
        $statements = explode(';', $sql);
        $executed = 0;
        $errors = [];
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) continue;
            
            if ($conn->query($statement)) {
                $executed++;
            } else {
                $errors[] = [
                    'statement' => $statement,
                    'error' => $conn->error
                ];
            }
        }
        
        if (empty($errors)) {
            return [
                'success' => true,
                'executed' => $executed
            ];
        } else {
            return [
                'success' => false,
                'executed' => $executed,
                'errors' => $errors
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Create database if it doesn't exist
function createDatabaseIfNotExists($host, $user, $pass, $dbname) {
    try {
        // Connect without specifying database
        $conn = new mysqli($host, $user, $pass);
        
        if ($conn->connect_error) {
            return [
                'success' => false,
                'error' => 'Connection failed: ' . $conn->connect_error
            ];
        }
        
        // Check if database exists
        $result = $conn->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbname'");
        
        if ($result->num_rows === 0) {
            // Database doesn't exist, try to create it
            if ($conn->query("CREATE DATABASE `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")) {
                $result = [
                    'success' => true,
                    'created' => true,
                    'message' => "Database '$dbname' created successfully"
                ];
            } else {
                $result = [
                    'success' => false,
                    'error' => 'Failed to create database: ' . $conn->error
                ];
            }
        } else {
            $result = [
                'success' => true,
                'created' => false,
                'message' => "Database '$dbname' already exists"
            ];
        }
        
        $conn->close();
        return $result;
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Verify database tables exist
function verifyDatabaseTables($conn, $requiredTables = ['users', 'shifts', 'holidays', 'schreibdienst_events', 'sessions', 'calendar_states']) {
    try {
        $result = $conn->query("SHOW TABLES");
        $existingTables = [];
        
        while ($row = $result->fetch_row()) {
            $existingTables[] = $row[0];
        }
        
        $missingTables = array_diff($requiredTables, $existingTables);
        
        return [
            'success' => empty($missingTables),
            'existingTables' => $existingTables,
            'missingTables' => array_values($missingTables),
            'complete' => count($existingTables) >= count($requiredTables)
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Create initial admin user
function createAdminUser($conn, $name, $email, $password) {
    try {
        // Check if users table exists
        $tableResult = $conn->query("SHOW TABLES LIKE 'users'");
        if ($tableResult->num_rows === 0) {
            return [
                'success' => false,
                'error' => 'Users table does not exist'
            ];
        }
        
        // Check if admin users already exist
        $adminCheck = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'Backoffice'");
        $adminCount = $adminCheck->fetch_assoc()['count'];
        
        if ($adminCount > 0) {
            return [
                'success' => true,
                'created' => false,
                'message' => 'Admin users already exist',
                'adminCount' => $adminCount
            ];
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Prepare statement
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, is_starter, is_schreibdienst, active) VALUES (?, ?, ?, 'Backoffice', 0, 0, 1)");
        
        if (!$stmt) {
            return [
                'success' => false,
                'error' => 'Failed to prepare statement: ' . $conn->error
            ];
        }
        
        $stmt->bind_param("sss", $name, $email, $hashedPassword);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'created' => true,
                'userId' => $conn->insert_id,
                'message' => 'Admin user created successfully'
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Failed to create admin user: ' . $stmt->error
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Create configuration files
function createConfigFiles($dbHost, $dbUser, $dbPass, $dbName) {
    try {
        // Create config directory if it doesn't exist
        $configDir = dirname(__FILE__) . '/config';
        if (!is_dir($configDir) && !mkdir($configDir, 0755, true)) {
            return [
                'success' => false,
                'error' => 'Failed to create config directory'
            ];
        }
        
        // Create config.php file
        $configContent = "<?php
// Database configuration - Created by installation wizard

define('DB_HOST', '$dbHost');
define('DB_USER', '$dbUser');
define('DB_PASS', '$dbPass');
define('DB_NAME', '$dbName');
";
        
        if (file_put_contents($configDir . '/config.php', $configContent) === false) {
            return [
                'success' => false,
                'error' => 'Failed to write config.php file'
            ];
        }
        
        // Backup original config.php if it exists
        $originalConfig = dirname(__FILE__) . '/api/config.php';
        $backupConfig = dirname(__FILE__) . '/api/config.php.bak';
        
        if (file_exists($originalConfig) && !file_exists($backupConfig)) {
            if (!copy($originalConfig, $backupConfig)) {
                return [
                    'success' => false,
                    'error' => 'Failed to backup original config.php file'
                ];
            }
        }
        
        // Create config wrapper
        $wrapperContent = "<?php
// This file loads configuration from the new location
// It ensures backward compatibility with existing code

require_once(dirname(__FILE__) . '/../config/db.php');

// Set CORS headers for all API endpoints
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
";
        
        if (file_put_contents($originalConfig, $wrapperContent) === false) {
            // Try to restore backup if update fails
            if (file_exists($backupConfig)) {
                copy($backupConfig, $originalConfig);
            }
            
            return [
                'success' => false,
                'error' => 'Failed to update original config.php file'
            ];
        }
        
        return [
            'success' => true,
            'message' => 'Configuration files created successfully'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}