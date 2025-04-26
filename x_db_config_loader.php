<?php
// db_config_loader.php
define('APP_ROOT', '/Applications/XAMPP/xamppfiles/htdocs/einsatzplan');
define('CONFIG_PATH', APP_ROOT . '/api/config.php');

function loadDbConfig() {
    if (!file_exists(CONFIG_PATH)) {
        throw new Exception('Database configuration file not found at: ' . CONFIG_PATH);
    }
    return require CONFIG_PATH;
}