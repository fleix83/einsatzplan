<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Configuration Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .result { margin: 20px 0; padding: 15px; border-radius: 4px; }
        .success { background: #e8f5e8; color: #2e7d32; border: 1px solid #c8e6c9; }
        .error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .info { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
        .btn { background: #1760ff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0a4bd4; }
    </style>
</head>
<body>
    <h1>Email Configuration Test</h1>
    
    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_email'])) {
        require_once 'api/email_service.php';
        
        $testEmail = $_POST['email'] ?? 'einsatzplan@luminelli.ch';
        $testToken = generateResetToken();
        
        echo '<div class="info"><strong>Testing Email Configuration:</strong><br>';
        echo 'SMTP Host: luminelli.ch<br>';
        echo 'SMTP Port: 465<br>';
        echo 'From: einsatzplan@luminelli.ch<br>';
        echo 'Environment: ' . (isProductionEnvironment() ? 'Production' : 'Development') . '<br>';
        echo 'Base URL: ' . getBaseUrl() . '</div>';
        
        try {
            $result = sendPasswordResetEmail($testEmail, 'Test User', $testToken);
            
            if ($result) {
                echo '<div class="success">✅ Email sent successfully!</div>';
                
                if (!isProductionEnvironment()) {
                    $logFile = __DIR__ . '/logs/email_debug.log';
                    if (file_exists($logFile)) {
                        echo '<div class="info"><strong>Development Mode:</strong> Email logged to file instead of sending.<br>';
                        echo 'Check: ' . $logFile . '</div>';
                    }
                }
            } else {
                echo '<div class="error">❌ Failed to send email. Check error logs.</div>';
            }
        } catch (Exception $e) {
            echo '<div class="error">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
    }
    ?>
    
    <form method="POST">
        <h3>Test Email Sending</h3>
        <div>
            <label for="email">Test Email Address:</label><br>
            <input type="email" id="email" name="email" value="einsatzplan@luminelli.ch" style="width: 300px; padding: 8px;">
        </div>
        <br>
        <button type="submit" name="test_email" class="btn">Send Test Email</button>
    </form>
    
    <h3>Configuration Details</h3>
    <div class="info">
        <strong>Production Environment Detection:</strong><br>
        <?php
        require_once 'api/email_service.php';
        echo isProductionEnvironment() ? '✅ Production mode detected' : '⚠️ Development mode';
        ?>
        <br><br>
        
        <strong>Base URL:</strong><br>
        <?php echo getBaseUrl(); ?>
        <br><br>
        
        <strong>Email Configuration:</strong><br>
        <?php
        $emailConfig = require 'config/email_config.php';
        echo 'SMTP Host: ' . $emailConfig['smtp']['host'] . '<br>';
        echo 'SMTP Port: ' . $emailConfig['smtp']['port'] . '<br>';
        echo 'From Email: ' . $emailConfig['smtp']['from_email'] . '<br>';
        ?>
    </div>
</body>
</html>