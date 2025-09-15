# TripSync - Group Travel Collaboration App

A mobile-first trip management app built with MERN stack and React Native (Expo) for group travel collaboration, expense tracking, media sharing, and real-time chat.

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Mobile**: React Native (Expo)
- **Authentication**: JWT + bcrypt
- **File Uploads**: Cloudinary
- **Real-time**: Socket.IO
- **State Management**: React Context API
- **Navigation**: React Navigation

## 📂 Project Structure

```
tripsync/
├── backend/                    # Express.js API server
│   ├── config/                # Database configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── utils/                # Utility functions
│   ├── server.js             # Main server file
│   ├── seed.js               # Database seeding script
│   ├── package.json          # Backend dependencies
│   └── env.example           # Environment variables template
├── mobile/                    # React Native Expo app
│   ├── api/                  # API service layer
│   ├── components/           # Reusable components
│   ├── context/              # React Context providers
│   ├── navigation/           # Navigation configuration
│   ├── screens/              # App screens
│   │   ├── Auth/            # Authentication screens
│   │   ├── Trips/           # Trip management screens
│   │   ├── Expenses/        # Expense tracking screens
│   │   ├── Media/           # Media gallery screens
│   │   ├── Chat/            # Chat screens
│   │   └── Profile/         # Profile and settings screens
│   ├── App.js               # Main app component
│   ├── package.json         # Mobile dependencies
│   └── app.json             # Expo configuration
└── README.md                 # This file
```

## 🛠 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```

4. **Edit `.env` file with your configuration:**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tripsync
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NODE_ENV=development
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The backend will be running on `http://localhost:5000`

### Mobile Setup

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   expo start
   ```

4. **Run on device/simulator:**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

### Database Setup

1. **Make sure MongoDB is running:**
   ```bash
   # For local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGO_URI in .env file
   ```

2. **Seed the database with dummy data:**
   ```bash
   cd backend
   npm run seed
   ```

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/tripsync` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_super_secret_jwt_key_here` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `NODE_ENV` | Environment mode | `development` |

### Mobile (app.json)

The mobile app automatically detects the environment and uses:
- Development: `http://localhost:5000` (backend)
- Production: Update `API_BASE_URL` in `mobile/api/config.js`

## 📱 Features

### ✅ Implemented Features

- **Authentication**
  - User registration and login
  - JWT token management
  - Secure token storage with Expo SecureStore
  - Auto-login functionality

- **Trip Management**
  - Create and manage trips
  - Invite members via email
  - Trip details with dates, destination, budget
  - Member management

- **Expense Tracking**
  - Add expenses to trips
  - Split expenses among participants
  - Multiple split types (equal, custom, paid by one)
  - Expense categories and receipts
  - Expense summary and balances

- **Media Sharing**
  - Upload images and videos
  - Cloudinary integration
  - Media gallery with grid view
  - Caption and tagging support

- **Real-time Chat**
  - Socket.IO integration
  - Group chat for each trip
  - Message types (text, image, video, file)
  - Typing indicators
  - Message reactions

- **Profile Management**
  - User profile editing
  - Avatar support
  - Settings and preferences

### 🚧 Future Features (Placeholders Implemented)

- 📍 Location tracking with React Native Maps
- ☁️ Google Drive integration for media
- 🔔 Push notifications (Expo/Firebase)
- 📊 Export expenses as PDF/CSV
- 🗺️ Trip itinerary planning
- 💳 Payment integration
- 🌐 Multi-language support

## 🧪 Testing

### Test Data

The seed script creates:
- 5 test users with credentials
- 3 sample trips with different scenarios
- Sample expenses with various split types
- Media items with captions and tags
- Chat messages for testing real-time features

### Test Login Credentials

```
Email: john@example.com | Password: password123
Email: jane@example.com | Password: password123
Email: mike@example.com | Password: password123
Email: sarah@example.com | Password: password123
Email: david@example.com | Password: password123
```

### API Testing

Test the backend API endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/change-password` | Change password |

### Trip Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | Get user's trips |
| POST | `/api/trips` | Create new trip |
| GET | `/api/trips/:id` | Get trip details |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| POST | `/api/trips/:id/invite` | Invite member |
| DELETE | `/api/trips/:id/members/:memberId` | Remove member |

### Expense Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/trip/:tripId` | Get trip expenses |
| POST | `/api/expenses` | Add expense |
| GET | `/api/expenses/:id` | Get expense details |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/trip/:tripId/summary` | Get expense summary |

### Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media/trip/:tripId` | Get trip media |
| POST | `/api/media/upload` | Upload media |
| GET | `/api/media/:id` | Get media details |
| PUT | `/api/media/:id` | Update media |
| DELETE | `/api/media/:id` | Delete media |
| GET | `/api/media/trip/:tripId/stats` | Get media statistics |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/trip/:tripId` | Get chat messages |
| POST | `/api/chat/send` | Send message |
| PUT | `/api/chat/:messageId` | Edit message |
| DELETE | `/api/chat/:messageId` | Delete message |
| POST | `/api/chat/:messageId/reaction` | Add reaction |
| DELETE | `/api/chat/:messageId/reaction` | Remove reaction |

## 🚀 Deployment

### Backend Deployment

1. **Prepare for production:**
   ```bash
   cd backend
   npm install --production
   ```

2. **Set production environment variables:**
   ```env
   NODE_ENV=production
   MONGO_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   # ... other production configs
   ```

3. **Deploy to your preferred platform:**
   - Heroku
   - AWS
   - DigitalOcean
   - Railway
   - Vercel

### Mobile Deployment

1. **Build for production:**
   ```bash
   cd mobile
   expo build:android  # For Android
   expo build:ios      # For iOS
   ```

2. **Update API URLs:**
   - Update `API_BASE_URL` in `mobile/api/config.js`
   - Update `SOCKET_URL` for production backend

3. **Publish to app stores:**
   - Google Play Store (Android)
   - Apple App Store (iOS)

## 🛠 Development

### Adding New Features

1. **Backend:**
   - Create model in `backend/models/`
   - Add controller in `backend/controllers/`
   - Define routes in `backend/routes/`
   - Update server.js if needed

2. **Mobile:**
   - Create API service in `mobile/api/`
   - Add screens in `mobile/screens/`
   - Update navigation in `mobile/navigation/`
   - Add context if needed in `mobile/context/`

### Code Style

- Use ESLint and Prettier for consistent formatting
- Follow React Native and Node.js best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Write descriptive commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console logs for errors
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check network connectivity
5. Review the API documentation

For additional help, please open an issue on GitHub.

---

**Happy Traveling! ✈️**
