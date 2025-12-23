# CampusPlay - College Gaming Platform

A comprehensive gaming platform for college students to compete in tournaments, track stats, and climb leaderboards.

## Features

- 🎮 **Tournament Management** - Create and manage gaming tournaments
- 📊 **Player Statistics** - Upload and track player performance via CSV
- 🏆 **Leaderboards** - Dynamic leaderboards with composite scoring
- 💳 **Payment Integration** - Razorpay integration for tournament entry fees
- 👥 **User Management** - Admin dashboard for managing users and tournaments
- 🔐 **Authentication** - Secure JWT-based authentication system

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Payment**: Razorpay
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Razorpay account (for payment features)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CampusPlay.git
   cd CampusPlay
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   
   # Razorpay (Optional - for payment features)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:5000` in your browser

## Project Structure

```
CampusPlay/
├── client/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── images/         # Image assets
│   └── *.html          # HTML pages
├── server/             # Backend files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   └── server.js       # Entry point
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create tournament (Admin only)
- `POST /api/tournaments/:id/join` - Join tournament
- `PATCH /api/tournaments/:id/status` - Update tournament status (Admin)

### Stats
- `GET /api/stats` - Get player statistics
- `POST /api/stats/upload` - Upload CSV stats (Admin)
- `DELETE /api/stats/:id` - Delete stat entry (Admin)

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/status/:tournamentId` - Get payment status

## Admin Features

- Create tournaments with entry fees
- Manage tournament registrations
- Upload and manage player statistics
- View tournament participants
- Create admin accounts

## Payment Setup

See [PAYMENT_SETUP.md](./PAYMENT_SETUP.md) for detailed Razorpay integration instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on GitHub.

## Author

Developed for college gaming communities.
