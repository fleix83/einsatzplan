<?php
// color_presets.php - API for color preset management

// Enable full error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include config file
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get database connection
try {
    $conn = getDbConnection();
} catch (Exception $e) {
    handleError('Database connection failed: ' . $e->getMessage(), 500);
}

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // List all presets
        try {
            $stmt = $conn->prepare("SELECT id, name, colors, created_at, is_default FROM color_presets ORDER BY is_default DESC, created_at DESC");
            $stmt->execute();
            $result = $stmt->get_result();

            $presets = [];
            while ($row = $result->fetch_assoc()) {
                $presets[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'colors' => json_decode($row['colors'], true),
                    'created_at' => $row['created_at'],
                    'is_default' => (bool)$row['is_default']
                ];
            }

            $stmt->close();
            sendJsonResponse($presets);
        } catch (Exception $e) {
            handleError('Error fetching presets: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Save new preset
        try {
            $rawData = file_get_contents('php://input');
            $data = json_decode($rawData, true);

            if (!$data || !isset($data['name']) || !isset($data['colors'])) {
                handleError('Invalid data format. Name and colors are required.', 400);
            }

            $name = trim($data['name']);
            $colors = $data['colors'];

            if (empty($name)) {
                handleError('Preset name cannot be empty.', 400);
            }

            // Check if preset name already exists
            $checkStmt = $conn->prepare("SELECT id FROM color_presets WHERE name = ?");
            $checkStmt->bind_param('s', $name);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows > 0) {
                $checkStmt->close();
                handleError('A preset with this name already exists.', 409);
            }
            $checkStmt->close();

            // Insert new preset
            $colorsJson = json_encode($colors);
            $stmt = $conn->prepare("INSERT INTO color_presets (name, colors, is_default) VALUES (?, ?, 0)");
            $stmt->bind_param('ss', $name, $colorsJson);
            $stmt->execute();

            $presetId = $conn->insert_id;
            $stmt->close();

            sendJsonResponse(['success' => true, 'id' => $presetId, 'message' => 'Preset saved successfully']);
        } catch (Exception $e) {
            handleError('Error saving preset: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        // Load/apply preset (just return the colors)
        try {
            if (!isset($_GET['id'])) {
                handleError('Preset ID is required.', 400);
            }

            $presetId = (int)$_GET['id'];

            $stmt = $conn->prepare("SELECT colors FROM color_presets WHERE id = ?");
            $stmt->bind_param('i', $presetId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                $stmt->close();
                handleError('Preset not found.', 404);
            }

            $row = $result->fetch_assoc();
            $colors = json_decode($row['colors'], true);

            $stmt->close();

            sendJsonResponse(['success' => true, 'colors' => $colors]);
        } catch (Exception $e) {
            handleError('Error loading preset: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Delete preset
        try {
            if (!isset($_GET['id'])) {
                handleError('Preset ID is required.', 400);
            }

            $presetId = (int)$_GET['id'];

            // Check if preset is a default preset (cannot be deleted)
            $checkStmt = $conn->prepare("SELECT is_default FROM color_presets WHERE id = ?");
            $checkStmt->bind_param('i', $presetId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows === 0) {
                $checkStmt->close();
                handleError('Preset not found.', 404);
            }

            $row = $checkResult->fetch_assoc();
            if ($row['is_default'] == 1) {
                $checkStmt->close();
                handleError('Cannot delete system presets.', 403);
            }
            $checkStmt->close();

            // Delete the preset
            $stmt = $conn->prepare("DELETE FROM color_presets WHERE id = ?");
            $stmt->bind_param('i', $presetId);
            $stmt->execute();
            $stmt->close();

            sendJsonResponse(['success' => true, 'message' => 'Preset deleted successfully']);
        } catch (Exception $e) {
            handleError('Error deleting preset: ' . $e->getMessage(), 500);
        }
        break;

    default:
        handleError('Method not allowed', 405);
        break;
}

// Close connection
if (isset($conn)) {
    $conn->close();
}
