# Nexspire Solutions Backend - Setup Guide

## Prerequisites

1. **Node.js** (v16+) - Already installed
2. **MySQL** (v8+) - Required for database

## Quick Start

### 1. Install MySQL (if not installed)

Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

### 2. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE nexspire_solutions;

# Exit MySQL
exit
```

### 3. Import Database Schema

```bash
cd "e:\Smart Code\Freelance Project\Nexs\nexs-backend"
mysql -u root -p nexspire_solutions < database/schema.sql
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update:
```
DB_PASSWORD=your_mysql_password
```

### 5. Start Server

```bash
# Make sure you're in nexs-backend folder
cd "e:\Smart Code\Freelance Project\Nexs\nexs-backend"

# Start development server
npm run dev
```

Server will run on: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user (protected)

### Clients (protected)
- `GET /api/clients` - List all clients
- `GET /api/clients/stats` - Client statistics
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects (protected)
- `GET /api/projects` - List all projects
- `GET /api/projects/stats` - Project statistics
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Leads (protected)
- `GET /api/leads` - List all leads
- `GET /api/leads/stats` - Lead statistics
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

## Testing with Thunder Client / Postman

1. **Sign up a new user:**
   ```
   POST http://localhost:5000/api/auth/signup
   Body (JSON):
   {
     "email": "test@example.com",
     "password": "password123",
     "firstName": "Test",
     "lastName": "User"
   }
   ```

2. **Sign in:**
   ```
   POST http://localhost:5000/api/auth/signin
   Body (JSON):
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   
   Save the `token` from the response!

3. **Use protected endpoints:**
   Add Authorization header to all protected requests:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## Default Admin Account

After running the schema.sql:
- Email: admin@nexspiresolutions.co.in
- Password: admin123

**⚠️ Change this password immediately in production!**

## Production Deployment

See `DEPLOYMENT.md` for production deployment guide.

## Troubleshooting

**Error: "MySQL Database connection failed"**
- Check if MySQL is running
- Verify database credentials in `.env`
- Ensure `nexspire_solutions` database exists

**Error: "Table doesn't exist"**
- Run the schema.sql file to create tables
- Check database name in `.env`

## Features Implemented

✅ Authentication (JWT)
✅ Client Management (CRM)
✅ Project Management  
✅ Lead Management
⏳ Team Management (coming soon)
⏳ Document Management (coming soon)
⏳ Messaging System (coming soon)

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-restart)
npm run dev

# Run in production mode
npm start
```
