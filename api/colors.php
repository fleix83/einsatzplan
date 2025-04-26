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
    file_put_contents("color_debug.log", date("[Y-m-d H:i:s] ") . $message . PHP_EOL, FILE_APPEND);
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

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            logMessage("Processing GET request");
            
            // Get all color settings
            $query = "SELECT name, value FROM color_settings";
            logMessage("Executing query: $query");
            
            $result = $conn->query($query);
            
            if (!$result) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
            $settings = [];
            while ($row = $result->fetch_assoc()) {
                $settings[$row['name']] = $row['value'];
            }
            
            logMessage("Retrieved " . count($settings) . " color settings");
            echo json_encode($settings);
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
            
            // Process each color setting
            foreach ($data as $name => $value) {
                // Skip invalid data
                if (!is_string($name) || !is_string($value)) {
                    logMessage("Skipping invalid data: $name = " . print_r($value, true));
                    continue;
                }
                
                logMessage("Processing color: $name = $value");
                
                // Check if setting exists
                $checkQuery = "SELECT id FROM color_settings WHERE name = '$name'";
                logMessage("Checking if setting exists: $checkQuery");
                
                $result = $conn->query($checkQuery);
                
                if (!$result) {
                    throw new Exception("Check query failed: " . $conn->error);
                }
                
                if ($result->num_rows > 0) {
                    // Update existing setting
                    $query = "UPDATE color_settings SET value = '$value' WHERE name = '$name'";
                    logMessage("Updating setting: $query");
                } else {
                    // Insert new setting
                    $query = "INSERT INTO color_settings (name, value) VALUES ('$name', '$value')";
                    logMessage("Inserting setting: $query");
                }
                
                // Execute query
                if (!$conn->query($query)) {
                    throw new Exception("Query failed: " . $conn->error);
                }
                
                logMessage("Successfully saved setting: $name");
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
            
            // Delete all settings
            $query = "DELETE FROM color_settings";
            logMessage("Executing query: $query");
            
            if (!$conn->query($query)) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
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