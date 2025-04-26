<?php
// Database test script
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Database Connection Test</h1>";

// Step 1: Test if we can find the config file
$configFile = __DIR__ . '/api/config.php';
echo "<h2>1. Config File Test</h2>";
if (file_exists($configFile)) {
    echo "<p style='color:green'>✓ Config file found at: " . htmlspecialchars($configFile) . "</p>";
    
    // Show config file content
    echo "<h3>Config File Contents:</h3>";
    echo "<pre style='background:#f0f0f0;padding:10px;border:1px solid #ddd'>";
    echo htmlspecialchars(file_get_contents($configFile));
    echo "</pre>";
    
    // Load the config file
    require $configFile;
    
    echo "<h3>Loaded constants:</h3>";
    echo "<ul>";
    echo "<li>DB_HOST: " . (defined('DB_HOST') ? htmlspecialchars(DB_HOST) : "Not defined") . "</li>";
    echo "<li>DB_USER: " . (defined('DB_USER') ? htmlspecialchars(DB_USER) : "Not defined") . "</li>";
    echo "<li>DB_PASS: " . (defined('DB_PASS') ? "[Hidden]" : "Not defined") . "</li>";
    echo "<li>DB_NAME: " . (defined('DB_NAME') ? htmlspecialchars(DB_NAME) : "Not defined") . "</li>";
    echo "<li>DB_PREFIX: " . (defined('DB_PREFIX') ? htmlspecialchars(DB_PREFIX) : "Not defined") . "</li>";
    echo "</ul>";
} else {
    echo "<p style='color:red'>✗ Config file not found at: " . htmlspecialchars($configFile) . "</p>";
}

// Step 2: Try to connect using PDO
echo "<h2>2. PDO Connection Test</h2>";
try {
    if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        echo "<p>Attempting to connect to database: " . htmlspecialchars($dsn) . "</p>";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        echo "<p style='color:green'>✓ Successfully connected to the database using PDO!</p>";
        
        // Test a simple query
        $stmt = $pdo->query('SELECT 1');
        $result = $stmt->fetchColumn();
        echo "<p>Test query result: $result</p>";
    } else {
        echo "<p style='color:orange'>⚠ Cannot test connection - required constants not defined.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color:red'>✗ Failed to connect to database: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Step 3: Try the getDbConfig function from db.php
echo "<h2>3. Test db.php Functions</h2>";
if (file_exists(__DIR__ . '/db.php')) {
    echo "<p style='color:green'>✓ db.php file found</p>";
    
    try {
        require_once __DIR__ . '/db.php';
        echo "<p>Loaded db.php successfully</p>";
        
        if (function_exists('getDbConfig')) {
            echo "<p>Testing getDbConfig() function...</p>";
            $config = getDbConfig();
            echo "<p style='color:green'>✓ getDbConfig() executed successfully</p>";
            echo "<p>Retrieved configuration: </p>";
            echo "<ul>";
            foreach ($config as $key => $value) {
                echo "<li>" . htmlspecialchars($key) . ": " . 
                     ($key === 'pass' ? "[Hidden]" : htmlspecialchars($value)) . "</li>";
            }
            echo "</ul>";
            
            // Test database connection using the function
            echo "<p>Testing database connection using getDbConnection()...</p>";
            if (function_exists('getDbConnection')) {
                try {
                    $pdo = getDbConnection();
                    echo "<p style='color:green'>✓ Successfully connected using getDbConnection()</p>";
                } catch (Exception $e) {
                    echo "<p style='color:red'>✗ Error with getDbConnection(): " . 
                         htmlspecialchars($e->getMessage()) . "</p>";
                }
            } else {
                echo "<p style='color:orange'>⚠ getDbConnection() function not found in db.php</p>";
            }
        } else {
            echo "<p style='color:red'>✗ getDbConfig() function not found in db.php</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color:red'>✗ Error loading or testing db.php: " . 
             htmlspecialchars($e->getMessage()) . "</p>";
        
        // Show backtrace
        echo "<h3>Error Backtrace:</h3>";
        echo "<pre>";
        echo htmlspecialchars(print_r($e->getTraceAsString(), true));
        echo "</pre>";
    }
} else {
    echo "<p style='color:red'>✗ db.php file not found</p>";
}

// Step 4: File permissions and paths
echo "<h2>4. File Permissions and Paths</h2>";
echo "<p>Current working directory: " . htmlspecialchars(getcwd()) . "</p>";
echo "<p>Script directory: " . htmlspecialchars(__DIR__) . "</p>";
echo "<p>Config directory: " . htmlspecialchars(__DIR__ . '/config') . " - " . 
    (is_dir(__DIR__ . '/config') ? "Exists" : "Does not exist") . "</p>";

if (is_dir(__DIR__ . '/config')) {
    echo "<p>Config directory permissions: " . substr(sprintf('%o', fileperms(__DIR__ . '/config')), -4) . "</p>";
    echo "<p>Config file permissions: " . 
        (file_exists($configFile) ? substr(sprintf('%o', fileperms($configFile)), -4) : "File doesn't exist") . "</p>";
}

// Step 5: Look for old config files
echo "<h2>5. Check for Old Config Files</h2>";
$possibleConfigFiles = [
    'api/config.php',
    'config/database.php'
];

foreach ($possibleConfigFiles as $file) {
    $fullPath = __DIR__ . '/' . $file;
    if (file_exists($fullPath)) {
        echo "<p style='color:orange'>⚠ Found potential old config file: " . htmlspecialchars($file) . "</p>";
    } else {
        echo "<p style='color:green'>✓ No old config found at: " . htmlspecialchars($file) . "</p>";
    }
}
?>