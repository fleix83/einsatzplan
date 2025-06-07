# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a German calendar application for scheduling volunteer workers ("benevol workers"). The application manages shift scheduling with two shift types (E1 and E2) for volunteers at an organization. It features user management, holiday tracking, color customization, and administrative controls.

## Architecture

### Backend (PHP + MySQL)
- **Bootstrap**: `bootstrap.php` - Application initialization and autoloading
- **Configuration**: `config/db.php` and `api/config.php` - Database configuration and helper functions
- **API Endpoints**: All located in `/api/` directory
  - `shifts.php` - Shift management with frozen month checks
  - `users.php` - User and volunteer management
  - `auth.php` - Authentication with session-based tokens
  - `calendar.php` - Calendar data and operations
  - `holidays.php` - Holiday/vacation management
  - `colors.php` - Color theme customization
  - `custom_events.php` - Custom event management
  - `announcement.php` - Announcement text management
  - `schreibdienst.php` - Special duty events
  - `calendar_state.php` - Month freeze/unfreeze functionality

### Frontend (Vanilla JavaScript)
- **Main**: `index.html` - Single page application
- **Scripts**: All located in `/js/` directory
  - `script.js` - Main calendar logic and UI interactions
  - `auth.js` - Authentication handling
  - `holiday.js` - Holiday management UI
  - `colorCustomization.js` - Color theme controls
  - `announcement.js` - Announcement editing
  - `customEvents.js` - Custom event management
  - `schreibdienst.js` - Special duty management

### Database Schema
Key tables (see `calendar.sql`):
- `users` - Volunteers and backoffice staff with roles
- `shifts` - Shift assignments (E1/E2) with two positions each
- `holidays` - Vacation/holiday periods for users
- `calendar_states` - Month freeze status for administrative control
- `custom_events` - Custom events with time and details
- `color_settings` - Customizable color themes
- `sessions` - Authentication tokens

## Development Commands

### Local Development
- **Web Server**: Use XAMPP or similar (Apache + MySQL + PHP)
- **Database**: MySQL/MariaDB required
- **PHP Version**: >= 7.4 required

### Installation
- Run `install.php` for guided setup wizard
- Creates database structure from `calendar.sql`
- Sets up admin user and configuration files

### Configuration
- Database config in `config/config.php` (created by installer)
- Timezone set to `Europe/Zurich`
- Uses UTF-8 character encoding

## Key Features

### User Roles
- **Freiwillige** (Volunteers): Can be assigned to shifts
- **Backoffice**: Administrative access with authentication
- Special flags: `is_starter`, `is_schreibdienst` for different shift types

### Shift System
- Two shift types: E1 and E2
- Each shift can have up to 2 volunteers
- Month-level freeze functionality prevents editing past periods
- Notes can be added for each shift position

### Month Freezing
Administrative feature that prevents modification of completed months through `calendar_states` table.

### Authentication
- Session-based authentication for backoffice users
- Token validation via `sessions` table
- Public read access for volunteer information

### Color Customization
Administrators can customize calendar colors including shift backgrounds, hover states, and special indicators.

## Important Patterns

### API Response Format
All API endpoints return JSON with consistent error handling via `sendJsonResponse()` and `handleError()` functions.

### Database Connections
Use `getDbConnection()` helper function from config files. Always includes proper UTF-8 charset and error handling.

### Permission Checks
Check month freeze status before allowing modifications using `canEditMonth()` function in relevant APIs.

### Frontend Data Loading
Calendar data is loaded via AJAX calls to API endpoints, with real-time updates and user notifications.