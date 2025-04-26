<?php
// direct_connector.php
function getDirectDbConnection() {
    // Hardcoded credentials from your config
    $host = 'localhost';
    $user = 'test';
    $pass = 'test25';
    $dbname = 'test';
    $prefix = 'cal_';
    
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            throw new Exception('Failed to connect to database: ' . $e->getMessage());
        }
    }
    
    return $pdo;
}

function getDirectTableName($table) {
    return 'cal_' . $table; // Hardcoded prefix
}