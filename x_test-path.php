<?php
// Save this as test_path.php in your root directory

echo "Current script directory (__DIR__): " . __DIR__ . "<br>";
echo "Checking existence of potential config paths:<br>";

$paths = [
    __DIR__ . '/api/config.php',
    dirname(__DIR__) . '/api/config.php',
    __DIR__ . '/../api/config.php',
    __DIR__ . '/config/config.php'
];

foreach ($paths as $path) {
    echo "$path: " . (file_exists($path) ? "EXISTS" : "NOT FOUND") . "<br>";
}

// Try to directly include the config file
$configPath = __DIR__ . '/api/config.php';
echo "<br>Trying to load config from: $configPath<br>";
if (file_exists($configPath)) {
    $config = require($configPath);
    echo "Config loaded successfully. Host: " . $config['host'];
} else {
    echo "Failed to load config file.";
}