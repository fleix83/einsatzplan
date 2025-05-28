<?php
// install.php - Calendar Application Installation Wizard
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Detect if installation is already completed
if (file_exists('config/config.php') && !isset($_GET['force'])) {
    $installed = true;
    // Check if we should redirect to the main app
    if (!isset($_GET['check'])) {
        header('Location: index.html');
        exit;
    }
} else {
    $installed = false;
}

// Define installation steps
$steps = [
    1 => 'Welcome & Requirements',
    2 => 'Database Configuration',
    3 => 'Admin User Creation',
    4 => 'Finalize Installation'
];

// Get current step
$currentStep = isset($_GET['step']) ? (int)$_GET['step'] : 1;
if ($currentStep < 1 || $currentStep > count($steps)) {
    $currentStep = 1;
}

// Handle form submissions
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($currentStep) {
        case 1:
            // Requirements check submitted, move to next step
            $currentStep = 2;
            break;
        
        case 2:
            // Database configuration submitted
            if (empty($_POST['db_host']) || empty($_POST['db_name']) || empty($_POST['db_user'])) {
                $error = 'Please fill in all required database fields.';
            } else {
                // Test database connection
                $dbHost = $_POST['db_host'];
                $dbName = $_POST['db_name'];
                $dbUser = $_POST['db_user'];
                $dbPass = $_POST['db_pass'];
                
                try {
                    $conn = new mysqli($dbHost, $dbUser, $dbPass);
                    
                    if ($conn->connect_error) {
                        $error = "Database connection failed: " . $conn->connect_error;
                    } else {
                        // Check if database exists, create if not
                        $dbExists = $conn->select_db($dbName);
                        
                        if (!$dbExists) {
                            // Try to create the database
                            if ($conn->query("CREATE DATABASE `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")) {
                                $conn->select_db($dbName);
                                $success = "Database '$dbName' created successfully.";
                            } else {
                                $error = "Failed to create database: " . $conn->error;
                            }
                        }
                        
                        if (empty($error)) {
                            // Store the database configuration for next steps
                            $_SESSION['db_config'] = [
                                'host' => $dbHost,
                                'name' => $dbName,
                                'user' => $dbUser,
                                'pass' => $dbPass
                            ];
                            
                            // Check if tables exist, if not, import SQL
                            $result = $conn->query("SHOW TABLES");
                            if ($result->num_rows == 0) {
                                // Import SQL file
                                $sqlFile = file_get_contents('calendar.sql');
                                $sqlStatements = explode(';', $sqlFile);
                                
                                foreach ($sqlStatements as $sql) {
                                    $sql = trim($sql);
                                    if (!empty($sql)) {
                                        if (!$conn->query($sql . ';')) {
                                            $error = "Error importing SQL: " . $conn->error;
                                            break;
                                        }
                                    }
                                }
                                
                                if (empty($error)) {
                                    $success .= " Database tables created successfully.";
                                }
                            } else {
                                $success .= " Connected to existing database with tables.";
                            }
                            
                            if (empty($error)) {
                                // Move to next step
                                $currentStep = 3;
                            }
                        }
                        $conn->close();
                    }
                } catch (Exception $e) {
                    $error = "Database connection error: " . $e->getMessage();
                }
            }
            break;
            
        case 3:
            // Admin user creation
            if (empty($_POST['admin_name']) || empty($_POST['admin_email']) || empty($_POST['admin_password'])) {
                $error = 'Please fill in all admin user fields.';
            } else {
                // Create admin user
                $adminName = $_POST['admin_name'];
                $adminEmail = $_POST['admin_email'];
                $adminPassword = password_hash($_POST['admin_password'], PASSWORD_DEFAULT);
                
                // Connect to database using stored configuration
                if (isset($_SESSION['db_config'])) {
                    $config = $_SESSION['db_config'];
                    try {
                        $conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['name']);
                        
                        if ($conn->connect_error) {
                            $error = "Database connection failed: " . $conn->connect_error;
                        } else {
                            // Check if users table exists
                            $result = $conn->query("SHOW TABLES LIKE 'users'");
                            if ($result->num_rows > 0) {
                                // Insert admin user
                                $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, is_starter, is_schreibdienst, active) VALUES (?, ?, ?, 'Backoffice', 0, 0, 1)");
                                $stmt->bind_param("sss", $adminName, $adminEmail, $adminPassword);
                                
                                if ($stmt->execute()) {
                                    // Create config directory and files
                                    if (!is_dir('config')) {
                                        if (!mkdir('config', 0755, true)) {
                                            $error = "Failed to create config directory. Please check permissions.";
                                        }
                                    }
                                    
                                    if (empty($error)) {
                                        // Create config.php file
                                        $configContent = "<?php
                                        // Database configuration - Created by installation wizard

                                        define('DB_HOST', '{$config['host']}');
                                        define('DB_USER', '{$config['user']}');
                                        define('DB_PASS', '{$config['pass']}');
                                        define('DB_NAME', '{$config['name']}');
                                        ";
                                                                                
                                        if (file_put_contents('config/config.php', $configContent) === false) {
                                            $error = "Failed to write config file. Please check permissions.";
                                        } else {
                                            // Create db.php file that will be included by the application
                                            $dbFileContent = "<?php
                                            // Database connection functions

                                            // Set timezone
                                            date_default_timezone_set('Europe/Zurich');

                                            // Load configuration
                                            if (file_exists(dirname(__FILE__) . '/config.php')) {
                                                require_once(dirname(__FILE__) . '/config.php');
                                            } else {
                                                // Fall back to old config if new one doesn't exist
                                                require_once(dirname(__FILE__) . '/api/config.php');
                                            }

                                            // Helper function to get database connection
                                            function getDbConnection() {
                                                \$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
                                                
                                                if (\$conn->connect_error) {
                                                    http_response_code(500);
                                                    echo json_encode(['error' => 'Database connection failed: ' . \$conn->connect_error]);
                                                    exit;
                                                }
                                                
                                                // Set charset to UTF-8
                                                \$conn->set_charset('utf8mb4');
                                                
                                                return \$conn;
                                            }

                                            // Helper function to send JSON response
                                            function sendJsonResponse(\$data, \$statusCode = 200) {
                                                http_response_code(\$statusCode);
                                                header('Content-Type: application/json');
                                                echo json_encode(\$data);
                                                exit;
                                            }

                                            // Helper function to handle errors
                                            function handleError(\$message, \$statusCode = 500) {
                                                http_response_code(\$statusCode);
                                                header('Content-Type: application/json');
                                                echo json_encode(['error' => \$message]);
                                                exit;
                                            }

                                            // Helper function to check if a date is a weekend
                                            function isWeekend(\$date) {
                                                \$dayOfWeek = date('N', strtotime(\$date));
                                                return (\$dayOfWeek >= 6); // 6 = Saturday, 7 = Sunday
                                            }
                                            ";
                                                                                        if (file_put_contents('config/db.php', $dbFileContent) === false) {
                                                                                            $error = "Failed to write db.php file. Please check permissions.";
                                                                                        } else {
                                                                                            // Create wrapper file that will replace old config.php
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
                                                if (!copy('api/config.php', 'api/config.php.bak')) {
                                                    $error = "Failed to backup original config file.";
                                                } else if (file_put_contents('api/config.php', $wrapperContent) === false) {
                                                    $error = "Failed to update API config wrapper. Please check permissions.";
                                                    // Restore backup
                                                    copy('api/config.php.bak', 'api/config.php');
                                                } else {
                                                    // Installation successful
                                                    $success = "Admin user created and configuration files set up successfully.";
                                                    $currentStep = 4;
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    $error = "Failed to create admin user: " . $stmt->error;
                                }
                            } else {
                                $error = "Users table not found. Please reinstall the application.";
                            }
                            $conn->close();
                        }
                    } catch (Exception $e) {
                        $error = "Database error: " . $e->getMessage();
                    }
                } else {
                    $error = "Database configuration not found. Please go back to step 2.";
                }
            }
            break;
    }
}

// Generate navigation URL for steps
function getStepUrl($step) {
    return 'install.php?step=' . $step;
}

// Check system requirements
function checkRequirements() {
    $requirements = [
        'PHP Version >= 7.4' => version_compare(PHP_VERSION, '7.4.0', '>='),
        'MySQLi Extension' => extension_loaded('mysqli'),
        'PDO Extension' => extension_loaded('pdo'),
        'JSON Extension' => extension_loaded('json'),
        'File Permissions' => is_writable('.') && is_writable('api')
    ];
    
    return $requirements;
}

$requirementsMet = true;
$requirements = checkRequirements();
foreach ($requirements as $met) {
    if (!$met) {
        $requirementsMet = false;
        break;
    }
}

// Page HTML starts here
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Application - Installation Wizard</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&display=swap">
    <style>
        :root {
            --primary-color: #1760ff;
            --primary-hover: #0a4bd4;
            --secondary-color: #6ae09e;
            --error-color: #f44336;
            --success-color: #4CAF50;
            --warning-color: #ff9800;
            --text-color: #333;
            --text-muted: #666;
            --bg-color: #f8f9fe;
            --card-bg: #ffffff;
            --border-color: #e0e0e0;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
            --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.1);
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --transition-default: all 0.2s ease-in-out;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Nunito Sans', 'Open Sans', sans-serif;
            background: linear-gradient(180deg, #eceef8 -9%, #f8f9fe 100%);
            color: var(--text-color);
            line-height: 1.6;
            padding: 0;
            margin: 0;
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .header h1 {
            color: var(--primary-color);
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .header p {
            color: var(--text-muted);
            font-size: 16px;
        }
        
        .stepper-container {
            margin: 40px 0;
        }
        
        .stepper {
            display: flex;
            justify-content: space-between;
            position: relative;
            margin: 0 auto;
            max-width: 600px;
        }
        
        .stepper::before {
            content: '';
            position: absolute;
            top: 15px;
            left: 30px;
            right: 30px;
            height: 3px;
            background-color: var(--border-color);
            z-index: 1;
        }
        
        .step {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background-color: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            z-index: 2;
            position: relative;
            border: 2px solid #e0e0e0;
            transition: var(--transition-default);
        }
        
        .step.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
            transform: scale(1.1);
            box-shadow: 0 0 0 5px rgba(23, 96, 255, 0.2);
        }
        
        .step.completed {
            background-color: var(--success-color);
            color: white;
            border-color: var(--success-color);
        }
        
        .step-label {
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 600;
            text-align: center;
            width: 120px;
            margin-top: 5px;
        }
        
        .content {
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-color);
        }
        
        input[type="text"],
        input[type="password"],
        input[type="email"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: var(--radius-sm);
            font-size: 16px;
            transition: var(--transition-default);
        }
        
        input[type="text"]:focus,
        input[type="password"]:focus,
        input[type="email"]:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(23, 96, 255, 0.2);
        }
        
        .btn {
            padding: 12px 24px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: var(--transition-default);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
        }
        
        .btn:hover {
            background-color: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn-secondary {
            background-color: #6c757d;
        }
        
        .btn-secondary:hover {
            background-color: #5a6268;
        }
        
        .btn-success {
            background-color: var(--success-color);
        }
        
        .btn-success:hover {
            background-color: #3d8b40;
        }
        
        .alert {
            padding: 15px;
            border-radius: var(--radius-sm);
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .alert-danger {
            background-color: #ffebee;
            color: var(--error-color);
            border-left: 4px solid var(--error-color);
        }
        
        .alert-success {
            background-color: #e8f5e9;
            color: var(--success-color);
            border-left: 4px solid var(--success-color);
        }
        
        .alert-warning {
            background-color: #fff8e1;
            color: var(--warning-color);
            border-left: 4px solid var(--warning-color);
        }
        
        .requirement-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
        }
        
        .requirement-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            align-items: center;
        }
        
        .requirement-item:last-child {
            border-bottom: none;
        }
        
        .requirement-status {
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .status-passed {
            color: var(--success-color);
        }
        
        .status-passed::before {
            content: '✓';
        }
        
        .status-failed {
            color: var(--error-color);
        }
        
        .status-failed::before {
            content: '✗';
        }
        
        .navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }
        
        .actions {
            display: flex;
            justify-content: flex-end;
            gap: 15px;
            margin-top: 30px;
        }
        
        .installed-badge {
            display: inline-block;
            background-color: var(--success-color);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 15px;
            font-weight: 600;
            box-shadow: var(--shadow-sm);
        }
        
        .step-title {
            font-size: 22px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .step-description {
            margin-bottom: 20px;
            color: var(--text-muted);
        }
        
        .form-row {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .form-col {
            flex: 1;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }
            
            .card {
                padding: 20px;
            }
            
            .form-row {
                flex-direction: column;
                gap: 0;
            }
            
            .stepper::before {
                left: 20px;
                right: 20px;
            }
            
            .step-label {
                font-size: 10px;
                width: 80px;
            }
            
            .actions {
                flex-direction: column;
                gap: 10px;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Calendar Application - Installation Wizard</h1>
            <p>Follow the steps below to set up your calendar application</p>
            <?php if ($installed): ?>
                <div class="installed-badge">
                    <strong>Application is already installed!</strong>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card">
            <div class="stepper-container">
                <div class="stepper">
                    <?php foreach ($steps as $num => $name): ?>
                    <div class="step <?php echo $num < $currentStep ? 'completed' : ($num == $currentStep ? 'active' : ''); ?>">
                        <?php echo $num; ?>
                        <div class="step-label"><?php echo $name; ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <?php if ($error): ?>
            <div class="alert alert-danger">
                <strong>Error:</strong> <?php echo $error; ?>
            </div>
            <?php endif; ?>
            
            <?php if ($success): ?>
            <div class="alert alert-success">
                <strong>Success:</strong> <?php echo $success; ?>
            </div>
            <?php endif; ?>
            
            <div class="content">
                <?php if ($currentStep == 1): ?>
                <!-- Step 1: Welcome & Requirements -->
                <div class="step-title">Welcome to Calendar Application Installation</div>
                <div class="step-description">
                    Before we begin, the installation wizard will check if your server meets the requirements 
                    for running the Calendar Application. Please ensure all requirements are met before proceeding.
                </div>
                
                <ul class="requirement-list">
                    <?php foreach (checkRequirements() as $requirement => $met): ?>
                    <li class="requirement-item">
                        <span><?php echo $requirement; ?></span>
                        <span class="requirement-status <?php echo $met ? 'status-passed' : 'status-failed'; ?>">
                            <?php echo $met ? 'Passed' : 'Failed'; ?>
                        </span>
                    </li>
                    <?php endforeach; ?>
                </ul>
                
                <?php if (!$requirementsMet): ?>
                <div class="alert alert-danger">
                    <strong>Warning:</strong> Your system does not meet all the requirements. Please fix the issues before continuing.
                </div>
                <?php endif; ?>
                
                <div class="actions">
                    <form method="post" action="?step=1">
                        <button type="submit" class="btn" <?php echo !$requirementsMet ? 'disabled' : ''; ?>>
                            Continue to Database Setup
                        </button>
                    </form>
                </div>
                
                <?php elseif ($currentStep == 2): ?>
                <!-- Step 2: Database Configuration -->
                <div class="step-title">Database Configuration</div>
                <div class="step-description">
                    Please enter your database connection details. If the database doesn't exist yet, 
                    the installation wizard will attempt to create it for you.
                </div>
                
                <form method="post" action="?step=2">
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="db_host">Database Host:</label>
                                <input type="text" id="db_host" name="db_host" value="localhost" required>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="db_name">Database Name:</label>
                                <input type="text" id="db_name" name="db_name" value="calendar" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="db_user">Database Username:</label>
                                <input type="text" id="db_user" name="db_user" required>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="db_pass">Database Password:</label>
                                <input type="password" id="db_pass" name="db_pass">
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <a href="<?php echo getStepUrl(1); ?>" class="btn btn-secondary">
                            <span>←</span> Back
                        </a>
                        <button type="submit" class="btn">
                            Test Connection & Continue <span>→</span>
                        </button>
                    </div>
                </form>
                
                <?php elseif ($currentStep == 3): ?>
                <!-- Step 3: Admin User Creation -->
                <div class="step-title">Create Admin User</div>
                <div class="step-description">
                    Please create an administrator account that you'll use to log in to the Calendar Application.
                    Make sure to use a strong password for security.
                </div>
                
                <form method="post" action="?step=3">
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="admin_name">Admin Name:</label>
                                <input type="text" id="admin_name" name="admin_name" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="admin_email">Admin Email:</label>
                                <input type="email" id="admin_email" name="admin_email" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="admin_password">Admin Password:</label>
                                <input type="password" id="admin_password" name="admin_password" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <a href="<?php echo getStepUrl(2); ?>" class="btn btn-secondary">
                            <span>←</span> Back
                        </a>
                        <button type="submit" class="btn">
                            Create Admin & Finalize <span>→</span>
                        </button>
                    </div>
                </form>
                
                <?php elseif ($currentStep == 4): ?>
                <!-- Step 4: Finalize Installation -->
                <div class="step-title">Installation Complete!</div>
                <div class="step-description">
                    Congratulations! The Calendar Application has been successfully installed. You can now 
                    log in with your admin credentials and start using the application.
                </div>
                
                <div class="alert alert-success">
                    <strong>Success!</strong> All installation steps have been completed successfully. Your calendar 
                    application is now ready to use.
                </div>
                
                <div class="actions">
                    <a href="index.html" class="btn btn-success">
                        Go to Application <span>→</span>
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px; margin-top: 20px;">
            <p>Calendar Application &copy; <?php echo date('Y'); ?></p>
        </div>
    </div>
    
    <script>
        // Add event listener to highlight form fields when focused
        // Add event listener to highlight form fields when focused
        document.addEventListener('DOMContentLoaded', function() {
                const formInputs = document.querySelectorAll('input');
                formInputs.forEach(input => {
                    input.addEventListener('focus', function() {
                        this.parentElement.classList.add('input-focused');
                    });
                    input.addEventListener('blur', function() {
                        this.parentElement.classList.remove('input-focused');
                    });
                });
                
                // Show loading indicator when submitting forms
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    form.addEventListener('submit', function() {
                        const submitButton = this.querySelector('button[type="submit"]');
                        if (submitButton) {
                            submitButton.innerHTML = 'Processing... <span class="spinner"></span>';
                            submitButton.disabled = true;
                        }
                    });
                });
                
                // Function to validate password strength on step 3
                if (document.getElementById('admin_password')) {
                    document.getElementById('admin_password').addEventListener('input', function() {
                        const password = this.value;
                        // Simple strength check (can be enhanced)
                        const isStrong = password.length >= 8;
                        
                        if (password.length > 0 && !isStrong) {
                            this.setCustomValidity('Password should be at least 8 characters long');
                        } else {
                            this.setCustomValidity('');
                        }
                    });
                }
            });
        </script>
    </body>
</html>