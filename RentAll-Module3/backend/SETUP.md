# RentAll Module 3 - Database Setup Guide

## Quick Start Options

### Option 1: Use MongoDB Atlas (Recommended for testing)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Add to `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rentall
   USE_LOCAL_DB=false
   ```

### Option 2: Install MongoDB Locally
1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start MongoDB service
3. Add to `.env` file:
   ```
   LOCAL_MONGODB_URI=mongodb://localhost:27017/rentall
   USE_LOCAL_DB=true
   ```

### Option 3: Use Docker (Quickest setup)
1. Install Docker Desktop
2. Run this command:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
3. Add to `.env` file:
   ```
   LOCAL_MONGODB_URI=mongodb://localhost:27017/rentall
   USE_LOCAL_DB=true
   ```

### Option 4: Simplified Server (No MongoDB needed for testing)
If you just want to test the API endpoints without MongoDB, you can modify the server to use mock data.

## Current Issue
The MongoDB Memory Server (in-memory option) is having compatibility issues on Windows. It's recommended to use one of the first three options above.

## To Fix Your Current Setup:

1. **Choose one of the options above** and set up MongoDB
2. **Update your `.env` file** with the appropriate configuration
3. **Restart the server**:
   ```bash
   npm run dev
   ```

## Testing Without Database
If you want to test the API endpoints structure without database connectivity:

1. The server will start but API calls will fail with database errors
2. You can still test that endpoints exist and return proper error responses
3. Open `test-dashboard.html` in your browser to see the endpoint structure

## Verification
Once MongoDB is running, you should see:
```
MongoDB connected successfully!
RentAll backend running on port 5000
```

Then you can test the full functionality using the test dashboard.