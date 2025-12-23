# How to Run and Test Your CampusPlay Website

## Prerequisites

Before running the website, make sure you have:
1. **Node.js** installed (v14 or higher recommended)
   - Check by running: `node --version`
   - Download from: https://nodejs.org/
2. **MongoDB** database running
   - Local MongoDB installation, OR
   - MongoDB Atlas cloud database (free tier available)
3. **npm** (comes with Node.js)
   - Check by running: `npm --version`

## Step-by-Step Instructions

### 1. Navigate to Server Directory
```bash
cd CampusPlay/server
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```
This will install all required packages (Express, Mongoose, JWT, etc.)

### 3. Configure Environment Variables
Make sure your `.env` file in the `server` directory contains:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
```

**Example for local MongoDB:**
```env
MONGO_URI=mongodb://localhost:27017/campusplay
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
```

**Example for MongoDB Atlas:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campusplay
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
```

### 4. Start the Server

**Option A: Development Mode (with auto-restart)**
```bash
npm run dev
```

**Option B: Production Mode**
```bash
npm start
```

You should see:
```
MongoDB Connected
Server running on port 5000
```

### 5. Access Your Website

Open your web browser and navigate to:
```
http://localhost:5000
```

## Testing Different Pages

Once the server is running, you can test these pages:

1. **Home Page**: `http://localhost:5000/`
2. **Login Page**: `http://localhost:5000/login`
3. **Tournaments**: `http://localhost:5000/tournaments`
4. **Stats**: `http://localhost:5000/stats`
5. **Leaderboard**: `http://localhost:5000/leaderboard`
6. **Admin Dashboard**: `http://localhost:5000/admin` (requires admin account)

## Testing Features

### 1. User Registration & Login
- Go to `/login` page
- Register a new account
- Login with your credentials

### 2. Create Admin Account (Optional)
You can manually set a user as admin in MongoDB or use the import script if available.

### 3. Test Tournaments
- Navigate to `/tournaments`
- If logged in as admin, you can create tournaments
- Regular users can join tournaments

### 4. Test Stats Upload
- Login as admin
- Go to `/stats` page
- Upload a CSV file with player statistics
- View the stats table

### 5. Test Leaderboard
- Go to `/leaderboard` page
- Select filters (Game: BGMI, Campus: Patiala)
- View top 3 players and full rankings

## Troubleshooting

### Server won't start
- **Error: "MONGO_URI is not defined"**
  - Check that your `.env` file exists in the `server` directory
  - Verify the `MONGO_URI` variable is set correctly

- **Error: "JWT_SECRET is not defined"**
  - Add `JWT_SECRET=your_secret_key` to your `.env` file

- **Error: "Cannot connect to MongoDB"**
  - Make sure MongoDB is running (if local)
  - Check your MongoDB connection string
  - Verify network connection (if using Atlas)

### Port already in use
- Change the `PORT` in your `.env` file to a different number (e.g., 5001, 3000)
- Or stop the process using port 5000

### Dependencies not installed
- Run `npm install` again in the `server` directory
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

## Quick Start Commands Summary

```bash
# 1. Navigate to server directory
cd CampusPlay/server

# 2. Install dependencies (first time only)
npm install

# 3. Start the server
npm run dev

# 4. Open browser
# Visit: http://localhost:5000
```

## Development Tips

- Use `npm run dev` for development (auto-restarts on file changes)
- Check the terminal for error messages
- Use browser developer tools (F12) to debug frontend issues
- Check MongoDB connection in the terminal output

## Next Steps

After the server is running:
1. Register a user account
2. Test creating tournaments (if admin)
3. Upload CSV stats files
4. View leaderboards
5. Explore all features!

