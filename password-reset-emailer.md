# Password Reset Email Configuration Setup

This document provides instructions for system administrators on how to configure the email functionality for password reset in the German calendar application.

## Overview

The password reset feature uses SMTP to send email notifications when users request password resets. The system supports both production SMTP configurations and development testing modes.

## Files Involved

- `config/email_config.php` - Email configuration settings
- `api/email_service.php` - Email service functions
- `test_email_config.php` - Email configuration testing tool
- `create_reset_logs_table.sql` - Optional logging table creation

## Configuration Steps

### 1. Email Configuration Setup

Create or modify `config/email_config.php` with your SMTP settings:

```php
<?php
return [
    'smtp' => [
        'host' => 'your-smtp-server.com',        // SMTP server hostname
        'port' => 465,                           // SMTP port (465 for SSL, 587 for TLS)
        'encryption' => 'ssl',                   // 'ssl' or 'tls'
        'auth' => true,                          // Enable SMTP authentication
        'username' => 'your-email@domain.com',   // SMTP username
        'password' => 'your-password',           // SMTP password
        'from_email' => 'your-email@domain.com', // From email address
        'from_name' => 'Your App Name'           // From name
    ],
    'production_url' => 'https://your-domain.com/path' // Base URL for reset links
];
```

### 2. SMTP Configuration Options

#### Common SMTP Providers

**Gmail/Google Workspace:**
```php
'host' => 'smtp.gmail.com',
'port' => 587,
'encryption' => 'tls',
```

**Office 365/Outlook:**
```php
'host' => 'smtp.office365.com',
'port' => 587,
'encryption' => 'tls',
```

**Custom SMTP Server:**
```php
'host' => 'mail.yourdomain.com',
'port' => 465,
'encryption' => 'ssl',
```

### 3. PHPMailer Installation (Recommended)

For production environments, install PHPMailer via Composer:

```bash
composer require phpmailer/phpmailer
```

The system will automatically detect and use PHPMailer if available. If not available, it falls back to PHP's built-in `mail()` function.

### 4. Database Setup

Create the optional password reset logging table by running:

```sql
-- Execute create_reset_logs_table.sql
mysql -u username -p database_name < create_reset_logs_table.sql
```

This table tracks password reset activities for security monitoring.

### 5. Environment Detection

The system automatically detects production vs development environments:

**Production Detection:**
- `APP_ENV=production` environment variable
- Domain contains 'luminelli.ch'
- Server name contains 'luminelli.ch'

**Development Mode:**
- Emails are logged to `logs/email_debug.log` instead of being sent
- Useful for testing without sending actual emails

### 6. Testing Configuration

Use the built-in test tool at `test_email_config.php`:

1. Navigate to `http://your-domain/test_email_config.php`
2. Enter a test email address
3. Click "Send Test Email"
4. Check the results and logs

## Security Considerations

### 1. Email Configuration Security

- **Never commit `config/email_config.php` to version control**
- Use environment variables for sensitive credentials:
  ```php
  'password' => $_ENV['SMTP_PASSWORD'] ?? 'fallback-password',
  ```
- Restrict file permissions: `chmod 600 config/email_config.php`

### 2. Rate Limiting

The system includes built-in rate limiting:
- Maximum 3 reset requests per hour per email address
- Implemented in `checkResetRateLimit()` function

### 3. Token Security

- Reset tokens are 64-character cryptographically secure random strings
- Tokens expire after 30 minutes
- Tokens are invalidated after use

### 4. Logging

Password reset activities are logged with:
- Email address
- Activity type (request, success, failure)
- IP address and user agent
- Timestamp

## Troubleshooting

### Common Issues

**1. SMTP Authentication Failed**
- Verify username/password credentials
- Check if two-factor authentication requires app passwords
- Ensure SMTP is enabled on the email provider

**2. Connection Timeout**
- Verify SMTP host and port
- Check firewall settings
- Try alternative ports (587 vs 465)

**3. SSL/TLS Errors**
- Verify encryption setting matches port
- Check SSL certificate validity
- Try different encryption methods

**4. Emails Not Sending**
- Check PHP error logs
- Verify `mail()` function is enabled
- Test with `test_email_config.php`

### Debug Mode

In development, emails are logged instead of sent. Check:
- `logs/email_debug.log` for email content
- PHP error logs for technical issues
- Database logs for reset token generation

### Production Checklist

Before deploying to production:

- [ ] Email configuration file created and secured
- [ ] SMTP credentials tested
- [ ] PHPMailer installed (recommended)
- [ ] Password reset logs table created
- [ ] Email configuration tested with `test_email_config.php`
- [ ] Production URL configured correctly
- [ ] File permissions set appropriately
- [ ] Error logging enabled

## Email Template Customization

The email template can be customized in `api/email_service.php` in the `getPasswordResetEmailTemplate()` function. The template includes:

- Responsive HTML design
- German language content
- Security warnings
- Clear call-to-action button
- Alternative plain text link

## Monitoring

Monitor password reset usage through:
- `password_reset_logs` table for activity tracking
- Server error logs for technical issues
- Email delivery reports from SMTP provider

## Support

For technical issues:
1. Check `test_email_config.php` output
2. Review PHP error logs
3. Verify database connectivity
4. Test SMTP settings manually