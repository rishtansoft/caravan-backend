# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Caravan Backend is a Node.js REST API for a cargo/load delivery tracking platform (logistics/ride-sharing system). It connects cargo owners who need to ship goods with drivers who transport them.

## Commands

```bash
# Development server with hot reload
npm run dev

# Production server
npm start
```

No test or lint commands are configured.

## Architecture

### Technology Stack
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Real-time:** Socket.io for location updates and notifications
- **Auth:** JWT tokens + bcrypt password hashing
- **File Storage:** S3-compatible storage (twcstorage.ru)
- **Validation:** Joi + express-validator

### Application Flow
```
index.js → db.js (Sequelize sync) → http.js (Express + Socket.io) → router/index.js → controllers
```

Server runs on port 6000 by default.

### Directory Structure
- `controllers/` - Business logic organized by domain (admin/, driver/, load/, user/, assignments/)
- `router/` - API route definitions matching controller structure
- `models/models.js` - All Sequelize model definitions in single file
- `middleware/` - Auth middleware (JWT validation), admin role check, error handling
- `utils/` - S3 upload/delete, validation helpers, distance calculation (Haversine)
- `config/` - S3 configuration
- `error/ApiError.js` - Custom error class with status codes

### Key Models & Relationships
- **Users** - Base user (roles: driver, cargo_owner, admin)
- **Driver** - 1-to-1 with Users, contains vehicle/document info
- **Load** - Posted by cargo owners, has LoadDetails for specifications
- **Assignment** - Links Driver to Load with status tracking
- **Location** - GPS points for tracking loads in transit
- **CarType** - Vehicle type catalog with dimensions/weight limits

### API Structure
Base: `/api`
- `/auth` - Registration (3-step with phone verification), login, password reset
- `/users` - Profile management, avatar upload
- `/driver` - Driver profile, document uploads, trip status updates
- `/loads` - Create/manage loads, assign to drivers, status tracking
- `/admin` - Driver management, car type CRUD
- `/assignments` - Load-driver assignment operations

### Socket.io Events
- `locationUpdate` - Driver sends GPS coordinates
- Load creation broadcasts to available drivers
- Driver location shared with cargo owner tracking their shipment

### User Roles
- `cargo_owner` - Posts loads, tracks shipments
- `driver` - Accepts loads, provides location updates
- `admin` - System management

### Load Status Flow
`posted` → `assigned` → `in_transit_get_load` → `arrived_picked_up` → `picked_up` → `in_transit` → `delivered`

### Environment Variables
Key variables in `.env`: PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, S3_* credentials, TELEGRAM_BOT_TOKEN

### Response Format
```javascript
// Success
{ status: 200, data: { ... } }

// Error
{ status: 400|403|404|500, message: "..." }
```

### Validation Patterns
- Phone: Uzbek format (+998...)
- Passwords hashed with bcrypt (10 rounds)
- Joi schemas for request validation
- Timezone: +05:00 (Uzbekistan)
