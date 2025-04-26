<?php
/**
 * Calendar Application Installation Wizard
 * 
 * This script guides the user through the process of setting up the calendar
 * application database, creating required tables, and configuring the initial
 * admin user.
 */

// Start session for storing installation data between steps
session_start();

// Enable error reporting for easier debugging during installation
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set default timezone
date_default_timezone_set('Europe/Zurich');

// Define installation steps
$steps = [
    1 => 'Welcome',
    2 => 'System Check',
    3 => 'Database Configuration',
    4 => 'Database Setup',
    5 => 'Admin Account',
    6 => 'Installation Complete'
];

// Get current step from URL or default to step 1
$currentStep = isset($_GET['step']) ? (int)$_GET['step'] : 1;

// Ensure valid step
if (!isset($steps[$currentStep])) {
    $currentStep = 1;
}

// Store for form action URLs
$scriptName = basename($_SERVER['SCRIPT_NAME']);

// Initialize messages
$errors = [];
$success = [];

// Define configuration paths - using ONLY the new location
$apiDir = __DIR__ . '/api';
$configFile = $apiDir . '/config.php';
$installedFile = $apiDir . '/installed';


// Check if installation is already completed
if (file_exists($installedFile) && $currentStep < 6) {
    $currentStep = 6;
    $success[] = "Installation already completed. You can use your calendar application now.";
}

// Process form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($currentStep) {
        case 2: // System check - just proceed
            header("Location: $scriptName?step=3");
            exit;
            break;
            
        case 3: // Database configuration
            // Get and validate database credentials
            $dbHost = trim($_POST['db_host'] ?? '');
            $dbUser = trim($_POST['db_user'] ?? '');
            $dbPass = $_POST['db_pass'] ?? '';
            $dbName = trim($_POST['db_name'] ?? '');
            $dbPrefix = trim($_POST['db_prefix'] ?? '');
            
            // Validation
            if (empty($dbHost)) $errors[] = "Database host is required";
            if (empty($dbUser)) $errors[] = "Database username is required";
            if (empty($dbName)) $errors[] = "Database name is required";
            
            // Try connecting to database
            if (empty($errors)) {
                try {
                    // First connect without database to check if we can create it
                    $dsn = "mysql:host=$dbHost";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ];
                    
                    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
                    
                    // Check if database exists
                    $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbName'");
                    $dbExists = $stmt->fetchColumn();
                    
                    if (!$dbExists) {
                        // Try to create database
                        $pdo->exec("CREATE DATABASE `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
                        $success[] = "Database '$dbName' created successfully.";
                    } else {
                        $success[] = "Database '$dbName' already exists. Will use existing database.";
                    }
                    
                    // Try connecting to the specified database
                    $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
                    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
                    
                    // Store database configuration in session
                    $_SESSION['db_config'] = [
                        'host' => $dbHost,
                        'user' => $dbUser,
                        'pass' => $dbPass,
                        'name' => $dbName,
                        'prefix' => $dbPrefix
                    ];
                    
                    // Go to next step
                    header("Location: $scriptName?step=4");
                    exit;
                    
                } catch (PDOException $e) {
                    $errors[] = "Database connection failed: " . $e->getMessage();
                }
            }
            break;
            
        case 4: // Database setup
            if (!isset($_SESSION['db_config'])) {
                $errors[] = "Database configuration not found. Please go back to the previous step.";
                break;
            }
            
            $config = $_SESSION['db_config'];
            
            try {
                // Connect to database
                $dsn = "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4";
                $pdo = new PDO($dsn, $config['user'], $config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
                
                // Read SQL file content
                $sqlFile = file_get_contents(__DIR__ . '/calendar.sql');
                
                if (!$sqlFile) {
                    throw new Exception("Could not read SQL file. Make sure 'calendar.sql' exists in the same directory.");
                }
                
                // Replace table names with prefix if specified
                if (!empty($config['prefix'])) {
                    // Tables to be prefixed
                    $tables = ['users', 'calendar_states', 'holidays', 'schreibdienst_events', 'sessions', 'shifts'];
                    
                    foreach ($tables as $table) {
                        $sqlFile = str_replace("`$table`", "`{$config['prefix']}$table`", $sqlFile);
                        // Also replace foreign key references
                        $sqlFile = str_replace("REFERENCES `$table`", "REFERENCES `{$config['prefix']}$table`", $sqlFile);
                    }
                }
                
                // Split SQL file into individual statements
                $sqlStatements = preg_split('/;\s*$/m', $sqlFile);
                
                // Execute each statement
                $statementCount = 0;
                foreach ($sqlStatements as $statement) {
                    $statement = trim($statement);
                    if (!empty($statement)) {
                        $pdo->exec($statement);
                        $statementCount++;
                    }
                }

                // Create api directory if it doesn't exist
                if (!is_dir($apiDir)) {
                    mkdir($apiDir, 0755, true);
                }
                
                // Create the config file with constants
                // First check if the config.php exists
$existingConfigFile = __DIR__ . '/config.php';

if (file_exists($existingConfigFile)) {
    // Read the existing config file
    $configContent = file_get_contents($existingConfigFile);
    
    // Replace the credentials
    $configContent = preg_replace(
        "/define\('DB_HOST', '.*?'\);/",
        "define('DB_HOST', '{$config['host']}');",
        $configContent
    );
    
    $configContent = preg_replace(
        "/define\('DB_USER', '.*?'\);/",
        "define('DB_USER', '{$config['user']}');",
        $configContent
    );
    
    $configContent = preg_replace(
        "/define\('DB_PASS', '.*?'\);/",
        "define('DB_PASS', '{$config['pass']}');",
        $configContent
    );
    
    $configContent = preg_replace(
        "/define\('DB_NAME', '.*?'\);/",
        "define('DB_NAME', '{$config['name']}');",
        $configContent
    );
    
    // Write the updated content back to config.php
    file_put_contents($existingConfigFile, $configContent);
    
    $success[] = "Configuration file updated with new database credentials.";
} else {
    // If the config.php doesn't exist, create it with the structure your application expects
    $configContent = "<?php\n";
    $configContent .= "// Database configuration generated by installation wizard\n";
    $configContent .= "// Generated on: " . date('Y-m-d H:i:s') . "\n\n";
    $configContent .= "// Database connection settings\n";
    $configContent .= "define('DB_HOST', '{$config['host']}');\n";
    $configContent .= "define('DB_USER', '{$config['user']}');\n";
    $configContent .= "define('DB_PASS', '{$config['pass']}');\n";
    $configContent .= "define('DB_NAME', '{$config['name']}');\n\n";
    $configContent .= "// Set timezone\n";
    $configContent .= "date_default_timezone_set('Europe/Zurich');\n\n";
    $configContent .= "// Helper function to get database connection\n";
    $configContent .= "function getDbConnection() {\n";
    $configContent .= "    \$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);\n";
    $configContent .= "    \n";
    $configContent .= "    if (\$conn->connect_error) {\n";
    $configContent .= "        http_response_code(500);\n";
    $configContent .= "        echo json_encode(['error' => 'Database connection failed: ' . \$conn->connect_error]);\n";
    $configContent .= "        exit;\n";
    $configContent .= "    }\n";
    $configContent .= "    \n";
    $configContent .= "    // Set charset to UTF-8\n";
    $configContent .= "    \$conn->set_charset('utf8mb4');\n";
    $configContent .= "    \n";
    $configContent .= "    return \$conn;\n";
    $configContent .= "}\n\n";
    $configContent .= "// Helper function to get the current user (if authenticated)\n";
    $configContent .= "function getCurrentUser() {\n";
    $configContent .= "    // Check for Authorization header\n";
    $configContent .= "    \$headers = getallheaders();\n";
    $configContent .= "    \$authHeader = isset(\$headers['Authorization']) ? \$headers['Authorization'] : '';\n";
    $configContent .= "    \n";
    $configContent .= "    // If no auth header, return null (public access)\n";
    $configContent .= "    if (empty(\$authHeader)) {\n";
    $configContent .= "        return null;\n";
    $configContent .= "    }\n";
    $configContent .= "    \n";
    $configContent .= "    // Try to authenticate the user\n";
    $configContent .= "    return validateToken();\n";
    $configContent .= "}\n\n";
    $configContent .= "// Helper function to send JSON response\n";
    $configContent .= "function sendJsonResponse(\$data, \$statusCode = 200) {\n";
    $configContent .= "    http_response_code(\$statusCode);\n";
    $configContent .= "    header('Content-Type: application/json');\n";
    $configContent .= "    echo json_encode(\$data);\n";
    $configContent .= "    exit;\n";
    $configContent .= "}\n\n";
    $configContent .= "// Helper function to handle errors\n";
    $configContent .= "function handleError(\$message, \$statusCode = 500) {\n";
    $configContent .= "    http_response_code(\$statusCode);\n";
    $configContent .= "    header('Content-Type: application/json');\n";
    $configContent .= "    echo json_encode(['error' => \$message]);\n";
    $configContent .= "    exit;\n";
    $configContent .= "}\n\n";
    $configContent .= "// Helper function to check if a date is a weekend\n";
    $configContent .= "function isWeekend(\$date) {\n";
    $configContent .= "    \$dayOfWeek = date('N', strtotime(\$date));\n";
    $configContent .= "    return (\$dayOfWeek >= 6); // 6 = Saturday, 7 = Sunday\n";
    $configContent .= "}\n\n";
    $configContent .= "// Set CORS headers for all API endpoints\n";
    $configContent .= "header('Access-Control-Allow-Origin: *');\n";
    $configContent .= "header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');\n";
    $configContent .= "header('Access-Control-Allow-Headers: Content-Type, Authorization');\n\n";
    $configContent .= "// Handle preflight OPTIONS request\n";
    $configContent .= "if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {\n";
    $configContent .= "    http_response_code(200);\n";
    $configContent .= "    exit;\n";
    $configContent .= "}\n";
    
    file_put_contents($existingConfigFile, $configContent);
    
    $success[] = "Configuration file created with database credentials.";
}
            
        case 5: // Admin account creation
            if (!isset($_SESSION['db_config'])) {
                $errors[] = "Database configuration not found. Please go back to step 3.";
                break;
            }
            
            $adminName = trim($_POST['admin_name'] ?? '');
            $adminEmail = trim($_POST['admin_email'] ?? '');
            $adminPassword = $_POST['admin_password'] ?? '';
            $adminPasswordConfirm = $_POST['admin_password_confirm'] ?? '';
            
            // Validate
            if (empty($adminName)) $errors[] = "Admin name is required";
            if (empty($adminEmail)) $errors[] = "Admin email is required";
            if (empty($adminPassword)) $errors[] = "Admin password is required";
            if ($adminPassword !== $adminPasswordConfirm) $errors[] = "Passwords do not match";
            
            if (empty($errors)) {
                try {
                    $config = $_SESSION['db_config'];
                    
                    // Connect to database
                    $dsn = "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4";
                    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                    
                    // Hash password
                    $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
                    
                    // Insert admin user
                    $table = $config['prefix'] . 'users';
                    $stmt = $pdo->prepare("INSERT INTO `$table` 
                        (name, email, password, role, is_starter, is_schreibdienst, active) 
                        VALUES (?, ?, ?, 'Backoffice', 0, 0, 1)");
                    
                    $stmt->execute([$adminName, $adminEmail, $hashedPassword]);
                    
                    // Mark installation as complete by writing to config/installed
                    file_put_contents($installedFile, date('Y-m-d H:i:s'));
                    ?>
                    
                    // Add localStorage clear script to help with migration
                    $clearLocalStorageScript = "<?php
// Script to clear localStorage to prevent old data from showing in the new installation
header('Content-Type: text/html');
?>
<html>
<head>
    <title>Clearing localStorage</title>
    <script>
        // Clear any existing localStorage data
        if(window.localStorage) {
            console.log('Clearing localStorage to prevent using old data');
            localStorage.clear();
        }
        
        // Redirect to calendar application
        window.location.href = 'index.php';
    </script>
</head>
<body>
    <p>Redirecting to calendar application...</p>
</body>
</html>";
                    file_put_contents(__DIR__ . '/clear-storage.php', $clearLocalStorageScript);
                    
                    // Generate .htaccess file for pretty URLs in the root path
                    $htaccessContent = "# Enable URL rewriting\n";
                    $htaccessContent .= "RewriteEngine On\n\n";
                    $htaccessContent .= "# Set base directory for rewrites\n";
                    $htaccessContent .= "RewriteBase /\n\n";
                    $htaccessContent .= "# Redirect all requests that are not existing files or directories to index.php\n";
                    $htaccessContent .= "RewriteCond %{REQUEST_FILENAME} !-f\n";
                    $htaccessContent .= "RewriteCond %{REQUEST_FILENAME} !-d\n";
                    $htaccessContent .= "RewriteRule ^(.*)$ index.php [QSA,L]\n";

                    file_put_contents(__DIR__ . '/.htaccess', $htaccessContent);
                    
                    // Store protection flag for final step
                    $_SESSION['protect_after_install'] = true;
                    
                    $success[] = "Admin account created successfully.";
                    
                    // Go to final step
                    header("Location: $scriptName?step=6");
                    exit;
                    
                } catch (Exception $e) {
                    $errors[] = "Error creating admin account: " . $e->getMessage();
                }
            }
            break;
            
        case 6: // Final protection
            // Only execute this if we got here from a form submission
            if (isset($_POST['protect_installer']) && $_POST['protect_installer'] == 'yes') {
                createHtaccess();
                $success[] = "Installation script protected. It can no longer be accessed directly.";
            }
            break;
    }
}

// Function to create .htaccess file for protection
function createHtaccess() {
    $scriptName = basename($_SERVER['SCRIPT_NAME']);
    $htaccess = __DIR__ . '/.htaccess';
    
    // Create or append to .htaccess
    $content = "\n# Protect installation wizard\n";
    $content .= "<Files \"$scriptName\">\n";
    $content .= "    Order Allow,Deny\n";
    $content .= "    Deny from all\n";
    $content .= "</Files>\n";
    
    // Check if file exists
    if (file_exists($htaccess)) {
        // Check if protection already exists
        $currentContent = file_get_contents($htaccess);
        if (strpos($currentContent, "Protect installation wizard") === false) {
            file_put_contents($htaccess, $content, FILE_APPEND);
        }
    } else {
        file_put_contents($htaccess, $content);
    }
}

// Function to check system requirements
function checkSystemRequirements() {
    $requirements = [
        'php_version' => [
            'name' => 'PHP Version',
            'required' => '7.4.0',
            'current' => PHP_VERSION,
            'passed' => version_compare(PHP_VERSION, '7.4.0', '>=')
        ],
        'pdo' => [
            'name' => 'PDO Extension',
            'required' => 'Enabled',
            'current' => extension_loaded('pdo') ? 'Enabled' : 'Disabled',
            'passed' => extension_loaded('pdo')
        ],
        'pdo_mysql' => [
            'name' => 'PDO MySQL Extension',
            'required' => 'Enabled',
            'current' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Disabled',
            'passed' => extension_loaded('pdo_mysql')
        ],
        'json' => [
            'name' => 'JSON Extension',
            'required' => 'Enabled',
            'current' => extension_loaded('json') ? 'Enabled' : 'Disabled',
            'passed' => extension_loaded('json')
        ],
        'write_permission' => [
            'name' => 'Write Permission',
            'required' => 'Writable',
            'current' => is_writable(__DIR__) ? 'Writable' : 'Not Writable',
            'passed' => is_writable(__DIR__)
        ],
        'config_dir_writable' => [
            'name' => 'Config Directory',
            'required' => 'Writable',
            'current' => (is_dir(__DIR__ . '/config') && is_writable(__DIR__ . '/config')) || is_writable(__DIR__) ? 'Writable' : 'Not Writable',
            'passed' => (is_dir(__DIR__ . '/config') && is_writable(__DIR__ . '/config')) || is_writable(__DIR__)
        ]
    ];
    
    $allPassed = true;
    foreach ($requirements as $requirement) {
        if (!$requirement['passed']) {
            $allPassed = false;
            break;
        }
    }
    
    return [
        'requirements' => $requirements,
        'all_passed' => $allPassed
    ];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Installation - <?= htmlspecialchars($steps[$currentStep]) ?></title>
    <style>
        :root {
            --primary-color: #1760ff;
            --success-color: #4caf50;
            --warning-color: #ff9800;
            --danger-color: #f44336;
            --light-bg: #f8f9fa;
            --border-color: #dee2e6;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7f9;
            padding: 0;
            margin: 0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background-color: var(--primary-color);
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
        }
        
        header h1 {
            margin: 0;
            padding: 0;
            font-size: 24px;
            font-weight: 500;
        }
        
        .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }
        
        .card-header {
            background-color: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .card-body {
            padding: 20px;
        }
        
        .steps {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            overflow-x: auto;
        }
        
        .step {
            padding: 8px 16px;
            margin-right: 5px;
            background-color: #e9ecef;
            border-radius: 4px;
            font-size: 14px;
            white-space: nowrap;
        }
        
        .step.active {
            background-color: var(--primary-color);
            color: white;
        }
        
        .step.complete {
            background-color: var(--success-color);
            color: white;
        }
        
        h2 {
            color: var(--primary-color);
            margin-bottom: 20px;
        }
        
        p {
            margin-bottom: 15px;
        }
        
        ul, ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        input[type="text"],
        input[type="email"],
        input[type="password"],
        select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 16px;
        }
        
        small {
            display: block;
            margin-top: 5px;
            color: #6c757d;
        }
        
        .btn {
            display: inline-block;
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            font-size: 16px;
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .btn-success {
            background-color: var(--success-color);
        }
        
        .alert {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .alert-danger {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .alert-success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .check-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .check-item.passed {
            background-color: #d4edda;
            border-left: 4px solid var(--success-color);
        }
        
        .check-item.failed {
            background-color: #f8d7da;
            border-left: 4px solid var(--danger-color);
        }
        
        .check-status {
            font-weight: bold;
        }
        
        .check-status.passed {
            color: var(--success-color);
        }
        
        .check-status.failed {
            color: var(--danger-color);
        }
        
        .complete-panel {
            text-align: center;
            padding: 30px 0;
        }
        
        .complete-icon {
            font-size: 64px;
            color: var(--success-color);
            margin-bottom: 20px;
        }
        
        .action-buttons {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            header {
                padding: 15px 0;
                margin-bottom: 20px;
            }
            
            .steps {
                padding-bottom: 5px;
            }
            
            .step {
                padding: 6px 12px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Calendar Application Installation</h1>
        </div>
    </header>
    
    <div class="container">
        <!-- Steps Navigation -->
        <div class="steps">
            <?php foreach ($steps as $stepNum => $stepName): ?>
                <div class="step <?= $currentStep > $stepNum ? 'complete' : ($currentStep == $stepNum ? 'active' : '') ?>">
                    <?= $stepNum ?>. <?= htmlspecialchars($stepName) ?>
                </div>
            <?php endforeach; ?>
        </div>
        
        <!-- Errors and Success Messages -->
        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger">
                <ul>
                    <?php foreach ($errors as $error): ?>
                        <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($success)): ?>
            <div class="alert alert-success">
                <ul>
                    <?php foreach ($success as $message): ?>
                        <li><?= htmlspecialchars($message) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <!-- Step Content -->
        <div class="card">
            <div class="card-header">
                <h2><?= htmlspecialchars($steps[$currentStep]) ?></h2>
            </div>
            
            <div class="card-body">
                <?php if ($currentStep === 1): // Welcome step ?>
                    <p>Welcome to the Calendar Application installation wizard. This process will guide you through setting up your calendar application with a MySQL database.</p>
                    
                    <p>Before you begin, please ensure you have the following information ready:</p>
                    <ul>
                        <li>Database credentials (hostname, username, password)</li>
                        <li>Permission to create databases or an existing database</li>
                        <li>Information for the administrator account</li>
                    </ul>
                    
                    <p>Click "Begin Installation" to start the setup process.</p>
                    
                    <div class="action-buttons">
                        <span></span>
                        <a href="<?= htmlspecialchars($scriptName) ?>?step=2" class="btn">Begin Installation</a>
                    </div>
                    
                <?php elseif ($currentStep === 2): // System Check step ?>
                    <p>The system will now check if your server meets all the requirements for running the Calendar Application.</p>
                    
                    <?php 
                    $systemCheck = checkSystemRequirements();
                    $requirements = $systemCheck['requirements'];
                    ?>
                    
                    <?php foreach ($requirements as $requirement): ?>
                        <div class="check-item <?= $requirement['passed'] ? 'passed' : 'failed' ?>">
                            <div>
                                <strong><?= htmlspecialchars($requirement['name']) ?></strong>
                                <div>Required: <?= htmlspecialchars($requirement['required']) ?></div>
                                <div>Current: <?= htmlspecialchars($requirement['current']) ?></div>
                            </div>
                            <div class="check-status <?= $requirement['passed'] ? 'passed' : 'failed' ?>">
                                <?= $requirement['passed'] ? '✓ Passed' : '✗ Failed' ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                    
                    <div class="action-buttons">
                        <a href="<?= htmlspecialchars($scriptName) ?>?step=1" class="btn">Back</a>
                        
                        <form method="post" action="<?= htmlspecialchars($scriptName) ?>?step=2">
                            <button type="submit" class="btn" <?= $systemCheck['all_passed'] ? '' : 'disabled' ?>>
                                Continue
                            </button>
                        </form>
                    </div>
                    
                <?php elseif ($currentStep === 3): // Database Configuration step ?>
                    <p>Please enter your database connection details below:</p>
                    
                    <form method="post" action="<?= htmlspecialchars($scriptName) ?>?step=3">
                        <div class="form-group">
                            <label for="db_host">Database Host:</label>
                            <input type="text" id="db_host" name="db_host" value="localhost" required>
                            <small>Usually "localhost" or provided by your hosting company</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="db_user">Database Username:</label>
                            <input type="text" id="db_user" name="db_user" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="db_pass">Database Password:</label>
                            <input type="password" id="db_pass" name="db_pass">
                        </div>
                        
                        <div class="form-group">
                            <label for="db_name">Database Name:</label>
                            <input type="text" id="db_name" name="db_name" value="calendar" required>
                            <small>The database will be created if it doesn't exist</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="db_prefix">Table Prefix:</label>
                            <input type="text" id="db_prefix" name="db_prefix" value="cal_">
                            <small>Add a prefix to all tables (recommended)</small>
                        </div>
                        
                        <div class="action-buttons">
                            <a href="<?= htmlspecialchars($scriptName) ?>?step=2" class="btn">Back</a>
                            <button type="submit" class="btn">Continue</button>
                        </div>
                    </form>
                    
                <?php elseif ($currentStep === 4): // Database Setup step ?>
                    <p>The installation wizard will now create the necessary database tables for your calendar application.</p>
                    
                    <p>The following tables will be created:</p>
                    <ul>
                        <li>Users</li>
                        <li>Calendar States</li>
                        <li>Holidays</li>
                        <li>Schreibdienst Events</li>
                        <li>Sessions</li>
                        <li>Shifts</li>
                    </ul>
                    
                    <p>Click "Create Tables" to proceed with the database setup.</p>
                    
                    <form method="post" action="<?= htmlspecialchars($scriptName) ?>?step=4">
                        <div class="action-buttons">
                            <a href="<?= htmlspecialchars($scriptName) ?>?step=3" class="btn">Back</a>
                            <button type="submit" class="btn">Create Tables</button>
                        </div>
                    </form>
                    
                <?php elseif ($currentStep === 5): // Admin Account step ?>
                    <p>Create an administrator account for your calendar application. This account will have full access to manage the system.</p>
                    
                    <form method="post" action="<?= htmlspecialchars($scriptName) ?>?step=5">
                        <div class="form-group">
                            <label for="admin_name">Admin Name:</label>
                            <input type="text" id="admin_name" name="admin_name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin_email">Admin Email:</label>
                            <input type="email" id="admin_email" name="admin_email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin_password">Password:</label>
                            <input type="password" id="admin_password" name="admin_password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="admin_password_confirm">Confirm Password:</label>
                            <input type="password" id="admin_password_confirm" name="admin_password_confirm" required>
                        </div>
                        
                        <div class="action-buttons">
                            <a href="<?= htmlspecialchars($scriptName) ?>?step=4" class="btn">Back</a>
                            <button type="submit" class="btn">Create Admin Account</button>
                        </div>
                    </form>
                    
                <?php elseif ($currentStep === 6): // Installation Complete step ?>
                    <div class="complete-panel">
                        <div class="complete-icon">✓</div>
                        <h2>Installation Complete!</h2>
                        <p>Your Calendar Application has been successfully installed and configured.</p>
                        
                        <p>You can now log in with your administrator account and start using the application.</p>
                        
                        <div style="margin-top: 30px;">
                            <a href="einsatzplan/" class="btn btn-success">Go to Calendar Application</a>
                        </div>
                        
                        <form method="post" action="<?= htmlspecialchars($scriptName) ?>?step=6" style="margin-top: 30px;">
                            <div class="form-group" style="text-align: center;">
                                <label style="display: inline-block;">
                                    <input type="checkbox" name="protect_installer" value="yes" checked> 
                                    Protect the installation script from future access (recommended)
                                </label>
                            </div>
                            <button type="submit" class="btn">Finalize Installation</button>
                        </form>
                        
                        <p style="margin-top: 20px; font-size: 0.9em; color: #6c757d;">
                            Note: For extra security, you can manually delete this installation file
                            once you've completed the setup process.
                        </p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>