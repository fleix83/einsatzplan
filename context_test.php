<?php
// context_test.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include the file how your application would include it
include_once 'db.php';  // or require_once, or whatever your application uses

// Try to use the functions
try {
    $connection = getDbConnection();
    echo "Connection successful in application context!";
} catch (Exception $e) {
    echo "Connection failed in application context: " . $e->getMessage();
}