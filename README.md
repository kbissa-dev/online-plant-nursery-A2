# Online Plant Nursery System

A full-stack MERN web application for an online plant nursery store.
It is built as a part of IFN636 Software Lifecycle Management coursework.


## Live Application

**Public URL**: [http://ec2-15-134-76-47.ap-southeast-2.compute.amazonaws.com/]

## Local URLs

**Frontend**: [http://localhost:3000]

**Backend**: [http://localhost:5001] for API testing

## Demo Credentials

New credentials for customers can be created by using "Register" button on the top right corner of the webpage or existing credentials* are as follow:

**Admin (Green Plant Nursery Admin)**:
  - Email: `admin@green.com`
  - Password: `admin123`

**Staff (Green Plant Nursery Staff)**:
  - Email: `staff@email.com`
  - Password: `StaffPass123`

**Customers (Registered Users)**:
  - Email: `customer@email.com`
  - Password: `CustomerPass123`

*If setting up for the first time, refer to Database Setup and Seeding to create Admin credentials.

## System Overview

This web application provides role based functionality for an online plant nursery with JWT-based authentication and session management.

### User Roles and Permissions:

- **Staff (Green Plant Nursery Staff)**:
  - Create new plant products
  - View all plant inventory
  - Update plant details and stock levels
  - Delete plant products

- **Customers (Registered Users)**:
  - Browse plant catalog (registration required)
  - Add plants to shopping cart
  - View and modify cart contents
  - Update item quantities in cart
  - Remove items from cart
  - Create orders from cart contents
  - Cancel pending orders
  - Persistent cart across sessions

- **Authentication System**:
  - User registration and account creation
  - Login with JWT token issued upon successful authentication
  - Logout functionality with token management
  - Profile update capabilities for authenticated users
  - Role based access control (staff vs customer permissions)

## Tech Stack

- **Frontend**: React.js (Create React App)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Testing**: Mocha, Chai, Sinon
- **Deployment (CI/CD)**: AWS EC2 with GitHub Actions

## Prerequisites

Before running this project locally, ensure you have:
- Node.js (v22 or higher)
- npm or yarn
- MongoDB Atlas account and cluster
- Git

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kbissa-dev/online-plant-nursery-A2.git
cd online-plant-nursery-A2
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables in .env:

# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/online-plant-nursery-A2
# JWT_SECRET=your_jwt_secret_here
# PORT=5001
npm run dev
```

The backend server will run on `http://localhost:5001`

### 3. Database Setup and Seeding

Update your `.env` file with your MongoDB Atlas connection string and then run the setup scripts:

```bash
# Create admin account (run this first)
npm run create:admin

# Seed the database with initial plant data
node seed/seedPlants.js
```

#### Important Notes:

- `createAdmin.js` creates the admin account with email: `admin@green.com` and password: `admin123`
- `seedPlants.js` populates the database with 12 initial plants from `auPlants.json`
- Only run these scripts during initial setup or when you want to reset your database.
- **Warning**: `seedPlants.js` will delete all existing plants before inserting seed data.

### 4. Start Backend Server

```bash
npm run dev
```

The backend server will run on `http://localhost:5001`

### 5. Frontend Setup

```bash
# Navigate to frontend directory (open new terminal)
cd frontend
# Install dependencies
npm install
# Start the React development server
npm start
```

The frontend will run on `http://localhost:3000`

## Available Scripts

### Frontend Scripts

In the `frontend` directory:

#### `npm start`

Runs the React app in development mode on [http://localhost:3000](http://localhost:3000).

### Backend Scripts

In the `backend` directory:

#### `npm run dev`

Starts the backend server with nodemon for development.

#### `npm test`

Runs backend tests.

`npm run create:admin`

Creates the admin user account.

## CI/CD Pipeline

### Deployment Workflow: `.github/workflows/backend-ci.yml`

#### Process
1. Install dependencies and run tests
2. Build frontend for production
3. Deploy to AWS EC2 instance
4. Restart services using PM2 process manager

#### Infrastructure
- **Process Manager**: PM2 - manages backend process and serves built frontend
- **Reverse Proxy**: Nginx - routes port 80 to build React static files and API requests to backend (port 5001)
- **Deployment Trigger**: Push to main branch

**Deployment Status**: Check GitHub Actions for build success, verify with `pm2 status` on server.

## Known Limitations

- **Single Point of Failure**: Application runs on single EC2 instance with no redundancy
- **Deployment Strategy**: Uses PM2 restart without zero downtime deployment
- **Security**: HTTP only configuration suitable for development or demo purposes only
- **Database**: No backup or disaster recovery implementation