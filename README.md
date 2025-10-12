# FaithBliss Backend API 🚀

A comprehensive NestJS backend for the FaithBliss Christian Dating Platform.

## 📋 Features

- ✅ **Authentication & Authorization** (JWT with refresh tokens)
- ✅ **User Management** (Registration, profile updates, preferences)
- ✅ **Matching System** (Like/match users based on preferences)
- ✅ **Messaging** (Real-time messaging between matched users)
- ✅ **Database Integration** (PostgreSQL with Prisma ORM)
- ✅ **API Documentation** (Swagger/OpenAPI)
- ✅ **Data Validation** (Class-validator)
- ✅ **Testing Setup** (Jest unit and e2e tests)
- ✅ **CORS & Security** (Configured for production)

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access & Refresh tokens)
- **Validation**: Class-validator
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd faithbliss-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual database credentials and JWT secrets.

## 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from [postgresql.org](https://postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`

2. **Create database**
   ```bash
   createdb faithbliss_db
   ```

3. **Update .env file** with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/faithbliss_db"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

6. **Seed the database** (optional, for test data)
   ```bash
   npm run prisma:seed
   ```

## 🚀 Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

The API will be available at:
- **Main API**: `http://localhost:3001`
- **API Documentation**: `http://localhost:3001/api/docs`

## 🧪 Testing

### Unit tests
```bash
npm test
```

### Watch mode
```bash
npm run test:watch
```

### Test coverage
```bash
npm run test:cov
```

### E2E tests
```bash
npm run test:e2e
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/logout-all` - Logout from all devices

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/preferences` - Update user preferences
- `GET /users/potential-matches` - Get potential matches

### Matches
- `GET /matches` - Get user matches
- `POST /matches/like/:userId` - Like a user

### Messages
- `POST /messages` - Send a message
- `GET /messages/match/:matchId` - Get match messages

## 🔧 Database Schema

The application uses the following main models:

- **User**: Core user information and preferences
- **UserPreferences**: Matching preferences (age, gender, denomination, distance)
- **UserLike**: Track user likes for matching
- **Match**: Successful matches between users
- **Message**: Messages between matched users
- **RefreshToken**: JWT refresh tokens for security

## 🚚 Deployment

### Environment Variables for Production
```bash
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
NODE_ENV="production"
PORT="3001"
FRONTEND_URL="your-frontend-domain"
```

### Build for production
```bash
npm run build
```

## 🛡️ Security Features

- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- HTTP-only cookies for refresh tokens
- CORS configuration
- Input validation and sanitization
- Rate limiting ready

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@faithbliss.com or create an issue on GitHub.