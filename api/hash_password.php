<?php
// hash_password.php - Run this script to generate a hashed password
// Usage: php hash_password.php

if (php_sapi_name() !== 'cli') {
    echo "This script should be run from the command line.";
    exit;
}

// Get input from command line
echo "Enter email: ";
$email = trim(fgets(STDIN));

echo "Enter password: ";
$password = trim(fgets(STDIN));

echo "Enter name: ";
$name = trim(fgets(STDIN));

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Generate SQL
$sql = "INSERT INTO users (name, email, password, role, is_starter, is_schreibdienst, active) 
        VALUES ('$name', '$email', '$hashedPassword', 'Backoffice', 0, 0, 1);";

echo "\nUse this SQL to create the user:\n\n";
echo $sql;
echo "\n\n";

?>