<?php
// Email configuration for production
// This file should be excluded from version control for security

return [
    'smtp' => [
        // Must be a *.metanet.ch hostname: since June 2026 the Metanet mail
        // server presents a *.metanet.ch certificate that does not cover
        // luminelli.ch, so TLS verification fails with the domain hostname.
        'host' => 'hira2.metanet.ch',
        'port' => 465,
        'encryption' => 'ssl', // SSL/TLS for port 465
        'auth' => true,
        'username' => 'einsatzplan@luminelli.ch',
        'password' => 'Basel2025!!!', // In production, consider using environment variables
        'from_email' => 'einsatzplan@luminelli.ch',
        'from_name' => 'Einsatzplan'
    ],
    'production_url' => 'https://www.luminelli.ch/einsatzplan'
];