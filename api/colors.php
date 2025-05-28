<?php
// colors.php - Direct database implementation for color settings

// Enable full error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include config file only for database settings
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Create dedicated log file for color operations
function logMessage($message) {
    //file_put_contents("color_debug.log", date("[Y-m-d H:i:s] ") . $message . PHP_EOL, FILE_APPEND);
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get database connection
try {
    $conn = getDbConnection();
    logMessage("Database connection established");
} catch (Exception $e) {
    logMessage("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Check if alpha column exists, if not add it
try {
    $result = $conn->query("SHOW COLUMNS FROM color_settings LIKE 'alpha'");
    if ($result->num_rows === 0) {
        // Alpha column doesn't exist, add it
        $conn->query("ALTER TABLE color_settings ADD COLUMN alpha FLOAT DEFAULT 1.0 NOT NULL");
        logMessage("Added alpha column to color_settings table");
    }
} catch (Exception $e) {
    logMessage("Error checking/adding alpha column: " . $e->getMessage());
    // Continue anyway, as we'll default to 1.0 for alpha if the column doesn't exist
}

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            logMessage("Processing GET request");
            
            // Get all color settings
            $stmt = $conn->prepare("SELECT name, value, alpha FROM color_settings");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $settings = [];
            while ($row = $result->fetch_assoc()) {
                // Return as object with hex and alpha properties
                $settings[$row['name']] = [
                    'hex' => $row['value'],
                    'alpha' => (float)($row['alpha'] ?? 1.0)
                ];
            }
            
            logMessage("Retrieved " . count($settings) . " color settings");
            echo json_encode($settings);
            $stmt->close();
        } catch (Exception $e) {
            logMessage("GET error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        try {
            logMessage("Processing POST request");
            
            // Get raw input
            $rawData = file_get_contents('php://input');
            logMessage("Received raw data: " . $rawData);
            
            // Parse JSON
            $data = json_decode($rawData, true);
            
            if (!$data || !is_array($data)) {
                throw new Exception("Invalid data format: " . json_last_error_msg());
            }
            
            logMessage("Processing " . count($data) . " color settings");
            
            // Process each color setting using prepared statements
            foreach ($data as $name => $value) {
                // Skip invalid data
                if (!is_string($name)) {
                    logMessage("Skipping invalid name: not a string");
                    continue;
                }
                
                // Handle new color format with hex and alpha
                $hex = '';
                $alpha = 1.0;
                
                if (is_array($value) && isset($value['hex'])) {
                    $hex = $value['hex'];
                    $alpha = isset($value['alpha']) ? (float)$value['alpha'] : 1.0;
                } else if (is_string($value)) {
                    $hex = $value;
                    $alpha = 1.0;
                } else {
                    logMessage("Skipping invalid value format for: $name");
                    continue;
                }
                
                // Check if setting exists
                $checkStmt = $conn->prepare("SELECT id FROM color_settings WHERE name = ?");
                $checkStmt->bind_param('s', $name);
                $checkStmt->execute();
                $checkResult = $checkStmt->get_result();
                
                if ($checkResult->num_rows > 0) {
                    // Update existing setting
                    $updateStmt = $conn->prepare("UPDATE color_settings SET value = ?, alpha = ? WHERE name = ?");
                    $updateStmt->bind_param('sds', $hex, $alpha, $name);
                    $updateStmt->execute();
                    $updateStmt->close();
                    logMessage("Updated setting: $name with hex: $hex, alpha: $alpha");
                } else {
                    // Insert new setting
                    $insertStmt = $conn->prepare("INSERT INTO color_settings (name, value, alpha) VALUES (?, ?, ?)");
                    $insertStmt->bind_param('ssd', $name, $hex, $alpha);
                    $insertStmt->execute();
                    $insertStmt->close();
                    logMessage("Inserted setting: $name with hex: $hex, alpha: $alpha");
                }
                
                $checkStmt->close();
            }
            
            logMessage("All settings saved successfully");
            echo json_encode(['success' => true, 'message' => 'Color settings saved successfully']);
        } catch (Exception $e) {
            logMessage("POST error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        try {
            logMessage("Processing DELETE request");
            
            // Delete all settings using prepared statement
            $stmt = $conn->prepare("DELETE FROM color_settings");
            $stmt->execute();
            $stmt->close();
            
            logMessage("All color settings deleted successfully");
            echo json_encode(['success' => true, 'message' => 'Color settings reset to defaults']);
        } catch (Exception $e) {
            logMessage("DELETE error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// Close connection
if (isset($conn)) {
    $conn->close();
}
logMessage("Request completed");