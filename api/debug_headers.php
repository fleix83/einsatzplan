<?php
// Simple debug endpoint to check headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$debug = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'server_vars' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    ],
    'getallheaders_exists' => function_exists('getallheaders'),
    'all_server_vars' => []
];

// Add all HTTP_* server variables
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $debug['all_server_vars'][$key] = $value;
    }
}

if (function_exists('getallheaders')) {
    $debug['all_headers'] = getallheaders();
} else {
    $debug['all_headers'] = 'getallheaders() function not available';
}

echo json_encode($debug, JSON_PRETTY_PRINT);
?>