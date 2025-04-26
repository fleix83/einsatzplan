<?php
// api/config.php - Wrapper file that loads configuration from the new location
// This file will replace the original config.php to ensure backward compatibility

// Check if we're in the 'api' directory
if (basename(dirname(__FILE__)) === 'api') {
    // Load from parent directory's config
    require_once(dirname(dirname(__FILE__)) . '/config/db.php');
} else {
    // Direct include
    require_once(dirname(__FILE__) . '/config/db.php');
}

// Set CORS headers for all API endpoints
// (keeping this here for backward compatibility)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}