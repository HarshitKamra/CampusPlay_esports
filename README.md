# 🎮 CampusPlay - College E-Sports Platform

CampusPlay is a comprehensive full-stack college gaming platform designed to connect students through competitive e-sports, live streaming, and community engagement. Built to foster a vibrant campus gaming ecosystem, the platform features real-time game statistics, tournament management, leaderboards, and integrated live streaming capabilities.

## ✨ Key Features

### 🏆 Tournaments & Competition
- **Tournament Management**: Create, manage, and participate in campus-wide gaming tournaments
- **Real-time Leaderboards**: Track player rankings and team standings across multiple games
- **Multi-Game Support**: Support for popular games including BGMI, Valorant, Clash Royale, and more
- **Campus-Specific Competitions**: Filter and participate in tournaments specific to your campus

### 📊 Player Statistics
- **Detailed Player Stats**: View comprehensive statistics for individual players
- **Game-Specific Analytics**: Track performance across different games
- **CSV Import**: Bulk upload player statistics via CSV files
- **Filtering & Search**: Filter stats by game, campus, and tier level

### 📺 Live Streaming
- **Embedded Live Streams**: Watch live campus matches directly on the platform
- **YouTube Integration**: Seamless integration with YouTube live streams
- **Live Indicators**: Real-time status updates for ongoing matches
- **Community Engagement**: Interactive viewing experience with live viewer counts

### 👥 Community Features
- **User Authentication**: Secure JWT-based authentication system
- **User Profiles**: Personalized profiles with gaming statistics
- **Campus Integration**: Connect with students from your campus
- **Social Feed**: Stay updated with latest tournaments and events

### 🛠️ Admin Dashboard
- **Tournament Creation**: Admin interface for creating and managing tournaments
- **Player Management**: Manage player registrations and statistics
- **CSV Upload**: Bulk import player data and statistics
- **Content Moderation**: Manage platform content and user activities

## 🚀 Tech Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with custom animations and responsive design
- **Vanilla JavaScript** - Client-side interactivity and API integration
- **Font Awesome** - Icon library for UI elements

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js v5** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT (JSON Web Tokens)** - Secure authentication
- **bcryptjs** - Password hashing
- **cookie-parser** - Cookie handling for sessions

### Development Tools
- **nodemon** - Auto-restart during development
- **morgan** - HTTP request logger
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
CampusPlay/
├── CampusPlay/
│   ├── client/                 # Frontend application
│   │   ├── css/               # Stylesheets
│   │   ├── js/                # JavaScript modules
│   │   │   ├── tournaments.js
│   │   │   ├── stats.js
│   │   │   ├── leaderboard.js
│   │   │   └── admin.js
│   │   ├── images/            # Image assets
│   │   ├── index.html         # Home page
│   │   ├── login.html         # Authentication page
│   │   ├── tournaments.html   # Tournament listing
│   │   ├── stats.html         # Player statistics
│   │   ├── leaderboard.html   # Rankings
│   │   └── admin.html         # Admin dashboard
│   │
│   └── server/                # Backend application
│       ├── controllers/       # Request handlers
│       ├── middleware/        # Custom middleware
│       ├── models/            # Database schemas
│       │   ├── user.js
│       │   ├── Tournament.js
│       │   └── PlayerStat.js
│       ├── routes/            # API endpoints
│       │   ├── auth.js
│       │   ├── tournaments.js
│       │   ├── stats.js
│       │   └── admin.js
│       ├── scripts/           # Utility scripts
│       ├── csv/               # CSV upload directory
│       ├── .env               # Environment variables
│       ├── package.json       # Dependencies
│       └── server.js          # Application entry point
│
├── .gitignore
├── README.md
└── requirements.txt
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/HarshitKamra/CampusPlay_esports.git
cd CampusPlay
```

### Step 2: Install Dependencies
Navigate to the server directory and install required packages:
```bash
cd CampusPlay/server
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the `CampusPlay/server` directory with the following variables:

```env
# Database Configuration
MONGO_URI=your_mongodb_connection_string
# or
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (use a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration (optional, for production)
ALLOWED_ORIGINS=http://localhost:3000
```

**Important**: Replace the placeholder values with your actual configuration:
- Get MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use local MongoDB
- Generate a strong JWT secret (e.g., using `openssl rand -base64 32`)

### Step 4: Start the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create new tournament (admin only)
- `GET /api/tournaments/:id` - Get tournament details

### Statistics
- `GET /api/stats` - Get player statistics
- `POST /api/stats/upload` - Upload stats via CSV (admin only)
- `GET /api/stats/filter` - Filter stats by game/campus

### Admin
- Admin actions are integrated into respective resource endpoints (e.g., creating tournaments, uploading stats).

## 🎮 Supported Games

- **BGMI** (Battlegrounds Mobile India)
- **Valorant**
- **Clash Royale**
- **And more...**

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- HTTP-only cookies for session management
- CORS protection
- Environment variable protection
- Request size limits (10MB)

## 🌐 Deployment

### Environment Variables for Production
Ensure the following are set in your production environment:
- `NODE_ENV=production`
- `MONGO_URI` or `MONGODB_URI`
- `JWT_SECRET`
- `ALLOWED_ORIGINS` (comma-separated list of allowed domains)

### Recommended Platforms
- **Vercel** - For full-stack deployment
- **Heroku** - For Node.js applications
- **Railway** - Modern deployment platform
- **DigitalOcean** - VPS hosting

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Harshit Kamra**
- GitHub: [@HarshitKamra](https://github.com/HarshitKamra)

## 🙏 Acknowledgments

- Font Awesome for icons
- Pexels for video assets
- MongoDB for database solutions
- Express.js community

## 📧 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the campus gaming community**
