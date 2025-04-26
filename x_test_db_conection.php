<?php
// test_db_connection.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// First, see if we can include db.php
echo "Loading db.php...<br>";
require_once 'db.php';

// Try to get the DB config
echo "Getting DB config...<br>";
try {
    $config = getDbConfig();
    echo "Successfully got DB config:<br>";
    echo "Host: " . $config['host'] . "<br>";
    echo "User: " . $config['user'] . "<br>";
    echo "DB: " . $config['name'] . "<br>";
    echo "Prefix: " . $config['prefix'] . "<br>";
} catch (Exception $e) {
    echo "Failed to get DB config: " . $e->getMessage() . "<br>";
}

// Try to get a DB connection
echo "<br>Trying to connect to database...<br>";
try {
    $pdo = getDbConnection();
    echo "Successfully connected to database!<br>";
    
    // Test a simple query
    $stmt = $pdo->query('SELECT 1 as test');
    $result = $stmt->fetch();
    echo "Test query result: " . $result['test'] . "<br>";
} catch (Exception $e) {
    echo "Failed to connect to database: " . $e->getMessage() . "<br>";
}