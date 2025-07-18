<?php
// Email service for password reset functionality
// Prevent any output that could corrupt JSON responses
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

// Load email configuration
$emailConfig = require_once '../config/email_config.php';

// PHPMailer configuration
// For production, install PHPMailer via composer: composer require phpmailer/phpmailer
// For this example, we'll use a simple email function that can be easily adapted

/**
 * Send password reset email
 * 
 * @param string $email The recipient's email address
 * @param string $name The recipient's name
 * @param string $resetToken The password reset token
 * @return bool True if email was sent successfully, false otherwise
 */
function sendPasswordResetEmail($email, $name, $resetToken) {
    // Create reset URL
    $resetUrl = getBaseUrl() . '/reset-password-form.html?token=' . urlencode($resetToken);
    
    // Email subject
    $subject = 'Passwort zurücksetzen - Einsatzplan';
    
    // Email content
    $message = getPasswordResetEmailTemplate($name, $resetUrl);
    
    global $emailConfig;
    
    // Email headers
    $fromEmail = $emailConfig['smtp']['from_email'] ?? 'einsatzplan@luminelli.ch';
    $headers = [
        'From: ' . $fromEmail,
        'Reply-To: ' . $fromEmail,
        'Content-Type: text/html; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // For production, use PHPMailer with SMTP
    if (isProductionEnvironment()) {
        return sendEmailWithPHPMailer($email, $subject, $message);
    } else {
        // For development, log email instead of sending
        logEmailForDevelopment($email, $subject, $message);
        return true; // Return true for development testing
    }
}

/**
 * Get the base URL for the application
 */
function getBaseUrl() {
    global $emailConfig;
    
    // Use production URL if configured and in production environment
    if (isProductionEnvironment() && isset($emailConfig['production_url'])) {
        return $emailConfig['production_url'];
    }
    
    // Fallback to auto-detection for development
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $path = dirname($_SERVER['REQUEST_URI']);
    
    return $protocol . '://' . $host . $path;
}

/**
 * Check if we're in production environment
 */
function isProductionEnvironment() {
    // Check multiple indicators for production environment
    return (
        (isset($_SERVER['APP_ENV']) && $_SERVER['APP_ENV'] === 'production') ||
        (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'luminelli.ch') !== false) ||
        (isset($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], 'luminelli.ch') !== false)
    );
}

/**
 * Generate password reset email template
 */
function getPasswordResetEmailTemplate($name, $resetUrl) {
    return '
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #1760ff;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
            }
            .button {
                display: inline-block;
                background-color: #1760ff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-weight: bold;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #0a4bd4;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 14px;
                color: #666;
            }
            .security-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Einsatzplan</h1>
            <p>Passwort zurücksetzen</p>
        </div>
        
        <div class="content">
            <h2>Hallo ' . htmlspecialchars($name) . ',</h2>
            
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für den Einsatzplan gestellt.</p>
            
            <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
            
            <div style="text-align: center;">
                <a href="' . htmlspecialchars($resetUrl) . '" class="button">Passwort zurücksetzen</a>
            </div>
            
            <p>Alternativ können Sie den folgenden Link in Ihren Browser kopieren:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
                ' . htmlspecialchars($resetUrl) . '
            </p>
            
            <div class="security-notice">
                <strong>Sicherheitshinweis:</strong>
                <ul>
                    <li>Dieser Link ist nur 30 Minuten gültig</li>
                    <li>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail</li>
                    <li>Teilen Sie diesen Link nicht mit anderen</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
                <p>Bei Fragen wenden Sie sich an Ihren Administrator.</p>
            </div>
        </div>
    </body>
    </html>';
}

/**
 * Send email using PHPMailer (for production)
 * This function should be implemented when PHPMailer is available
 */
function sendEmailWithPHPMailer($email, $subject, $message) {
    global $emailConfig;
    
    // Check if PHPMailer is available
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        // Try to include PHPMailer if it exists
        $phpmailerPath = __DIR__ . '/../vendor/autoload.php';
        if (file_exists($phpmailerPath)) {
            require_once $phpmailerPath;
        } else {
            // Fall back to basic mail with SMTP simulation
            return sendEmailWithBasicSMTP($email, $subject, $message);
        }
    }
    
    // If PHPMailer is still not available, use basic SMTP
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return sendEmailWithBasicSMTP($email, $subject, $message);
    }
    
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;
    
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $emailConfig['smtp']['host'];
        $mail->SMTPAuth   = $emailConfig['smtp']['auth'];
        $mail->Username   = $emailConfig['smtp']['username'];
        $mail->Password   = $emailConfig['smtp']['password'];
        $mail->SMTPSecure = $emailConfig['smtp']['encryption'];
        $mail->Port       = $emailConfig['smtp']['port'];
        
        // Recipients
        $mail->setFrom($emailConfig['smtp']['from_email'], $emailConfig['smtp']['from_name']);
        $mail->addAddress($email);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        $mail->CharSet = 'UTF-8';
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('PHPMailer Error: ' . $mail->ErrorInfo);
        // Try fallback method
        return sendEmailWithBasicSMTP($email, $subject, $message);
    }
}

/**
 * Send email using basic SMTP configuration
 * Fallback when PHPMailer is not available
 */
function sendEmailWithBasicSMTP($email, $subject, $message) {
    global $emailConfig;
    
    // Configure PHP mail settings temporarily
    $originalSendmailFrom = ini_get('sendmail_from');
    $originalSMTPHost = ini_get('SMTP');
    $originalSMTPPort = ini_get('smtp_port');
    
    // Set SMTP configuration
    ini_set('sendmail_from', $emailConfig['smtp']['from_email']);
    ini_set('SMTP', $emailConfig['smtp']['host']);
    ini_set('smtp_port', $emailConfig['smtp']['port']);
    
    $headers = [
        'From: ' . $emailConfig['smtp']['from_email'],
        'Reply-To: ' . $emailConfig['smtp']['from_email'],
        'Content-Type: text/html; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    $result = mail($email, $subject, $message, implode("\r\n", $headers));
    
    // Restore original settings
    ini_set('sendmail_from', $originalSendmailFrom);
    ini_set('SMTP', $originalSMTPHost);
    ini_set('smtp_port', $originalSMTPPort);
    
    return $result;
}

/**
 * Rate limiting for password reset requests
 * 
 * @param string $email The email address
 * @return bool True if request is allowed, false if rate limited
 */
function checkResetRateLimit($email) {
    $conn = getDbConnection();
    
    // Check how many reset requests were made in the last hour
    $stmt = $conn->prepare("
        SELECT COUNT(*) as request_count
        FROM users 
        WHERE email = ? 
        AND reset_token_expires > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $conn->close();
    
    // Allow maximum 3 requests per hour
    return $result['request_count'] < 3;
}

/**
 * Generate a secure random token
 */
function generateResetToken() {
    return bin2hex(random_bytes(32)); // 64 character token
}

/**
 * Log email for development (instead of sending)
 */
function logEmailForDevelopment($email, $subject, $message) {
    $logFile = __DIR__ . '/../logs/email_debug.log';
    $logDir = dirname($logFile);
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "\n" . str_repeat('=', 80) . "\n";
    $logEntry .= "EMAIL LOG - {$timestamp}\n";
    $logEntry .= str_repeat('=', 80) . "\n";
    $logEntry .= "To: {$email}\n";
    $logEntry .= "Subject: {$subject}\n";
    $logEntry .= "Message:\n{$message}\n";
    $logEntry .= str_repeat('=', 80) . "\n\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Log password reset activities
 */
function logPasswordResetActivity($email, $activity, $details = '') {
    $conn = getDbConnection();
    
    $stmt = $conn->prepare("
        INSERT INTO password_reset_logs (email, activity, details, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $stmt->bind_param('sssss', $email, $activity, $details, $ipAddress, $userAgent);
    $stmt->execute();
    
    $conn->close();
}