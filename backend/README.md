# NestJS Clean Architecture API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

A comprehensive NestJS template implementing **Clean Architecture**, **Domain-Driven Design (DDD)**, **CQRS**, and advanced authentication with automatic token refresh capabilities.

## 🚀 Features

### Architecture & Design Patterns
- **Clean Architecture** with clear separation of concerns
- **Domain-Driven Design (DDD)** with entities, value objects, and domain events
- **CQRS (Command Query Responsibility Segregation)** pattern
- **Repository Pattern** with dependency injection
- **Specification Pattern** for business rules validation

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Automatic token refresh** with configurable thresholds
- **Role-based access control (RBAC)** with granular permissions
- **Email verification** system
- **Password reset** functionality
- **Two-Factor Authentication (2FA)** support

### Security
- **Helmet** for security headers
- **Rate limiting** with Redis
- **Input validation** with class-validator
- **Password hashing** with bcrypt
- **Secure cookie handling**
- **CORS configuration**

### Infrastructure
- **PostgreSQL** with Prisma ORM for main data storage
- **MongoDB** for domain events logging and audit trail
- **Redis** for caching and sessions
- **BullMQ** for background job processing
- **Winston** for structured logging
- **Docker** containerization

### Additional Features
- **GitHub Repository Management**
- **Domain Events Logging** with MongoDB for complete audit trails
- **Email notifications** with templates
- **Internationalization (i18n)**
- **API documentation** with Swagger
- **Comprehensive testing** setup
- **Database migrations** and seeding

## 🏗️ Clean Architecture

This project follows the Clean Architecture principles with the following layer structure:

```
src/
├── core/                           # Domain Layer (Business Logic)
│   ├── entities/                   # Domain entities
│   ├── value-objects/              # Value objects
│   ├── events/                     # Domain events
│   ├── exceptions/                 # Domain exceptions
│   ├── repositories/               # Repository interfaces
│   ├── services/                   # Domain services
│   └── specifications/             # Business rule specifications
│
├── application/                    # Application Layer (Use Cases)
│   ├── commands/                   # Command handlers (CQRS)
│   ├── queries/                    # Query handlers (CQRS)
│   ├── dtos/                       # Data Transfer Objects
│   └── services/                   # Application services
│
├── infrastructure/                 # Infrastructure Layer
│   ├── database/                   # Database implementations
│   ├── repositories/               # Repository implementations
│   ├── services/                   # External service integrations
│   ├── logger/                     # Logging implementation
│   └── queue/                      # Job queue implementation
│
├── presentation/                   # Presentation Layer
│   ├── controllers/                # REST API controllers
│   ├── guards/                     # Authentication/Authorization guards
│   ├── middleware/                 # Custom middleware
│   └── modules/                    # NestJS modules
│
└── shared/                        # Shared utilities
    ├── constants/                  # Application constants
    ├── decorators/                 # Custom decorators
    └── utils/                      # Utility functions
```

### Layer Dependencies

- **Core Layer**: No dependencies on other layers (pure business logic)
- **Application Layer**: Depends only on Core layer
- **Infrastructure Layer**: Implements Core interfaces, can depend on external libraries
- **Presentation Layer**: Depends on Application and Core layers

## 🔐 Auto Token Refresh System

The application implements a sophisticated automatic token refresh mechanism that works seamlessly with frontend applications:

### How It Works

1. **Cookie-Based Detection**: The `TokenRefreshGuard` checks for refresh tokens in HTTP cookies on every request
2. **Automatic Expiry Check**: When an access token is about to expire (within configurable threshold), the guard automatically triggers a refresh
3. **Header Response**: New access tokens are sent back to the frontend in response headers
4. **Frontend Integration**: The frontend should read the new token from headers and update its stored token
5. **Seamless Experience**: Users never experience authentication interruptions

### Key Components

#### TokenRefreshGuard
```typescript
// Automatically intercepts requests and refreshes tokens when needed
@Injectable()
export class TokenRefreshGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for refresh token in cookies
    const refreshTokenCookie = request.cookies?.[this.configService.get('REFRESH_COOKIE_NAME')];
    
    // Check token expiry and refresh if needed
    const timeUntilExpiry = tokenExpiry - currentTime;
    if (timeUntilExpiry <= thresholdInSeconds) {
      // Trigger automatic token refresh
      const newTokens = await this.commandBus.execute(new RefreshTokenCommand(refreshTokenCookie));
      // Set new token in response headers for frontend to read
      response.setHeader('X-New-Access-Token', newTokens.accessToken);
    }
    return true;
  }
}
```

#### RefreshTokenCommand
```typescript
// Handles the token refresh logic using CQRS pattern
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler {
  async execute(command: RefreshTokenCommand): Promise<IAuthRefreshTokenResponse> {
    // Validate refresh token from cookie
    const token = await this.authService.validateRefreshToken(refreshToken);
    
    // Generate new tokens
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = uuidv4();
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
```

### Frontend Integration

```typescript
// Frontend should check for new tokens in response headers
axios.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      // Update stored access token
      localStorage.setItem('accessToken', newToken);
      // Update Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    return response;
  }
);
```

### Configuration

```typescript
// Environment variables for token configuration
JWT_ACCESS_EXPIRATION=15m          // Access token expiration
JWT_REFRESH_EXPIRATION=7d          // Refresh token expiration
TOKEN_REFRESH_THRESHOLD=300        // Refresh threshold in seconds (5 minutes)
REFRESH_COOKIE_NAME=refreshToken   // Cookie name for refresh token
```

### Security Features

- **Token Rotation**: New refresh tokens are generated on each refresh
- **Revocation**: Old refresh tokens are immediately revoked
- **Secure Cookies**: Refresh tokens stored as HttpOnly cookies
- **Header Response**: New access tokens sent via response headers to frontend
- **Expiry Validation**: Both access and refresh token expiry is validated
- **User Session Management**: Tokens are tied to specific user sessions

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- MongoDB 6+ (for domain events storage)
- Redis 6+
- Docker (optional)

### Environment Configuration

Create a `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nestjs_clean_arch"
MONGO_CONNECTION_STRING="mongodb://localhost:27017/domain_events"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
TOKEN_REFRESH_THRESHOLD=300

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-password"

# Application
PORT=3000
NODE_ENV="development"
API_PREFIX="api/v1"

# Swagger Documentation
SWAGGER_USER="admin"
SWAGGER_PASSWORD="admin123"
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd github-crm
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Generate Prisma Client**
```bash
pnpm run db:generate
```

4. **Run database migrations**
```bash
pnpm run db:migrate
```

5. **Seed the database**
```bash
pnpm run db:seed
```

6. **Start the application**
```bash
# Development mode
pnpm start dev

# Production mode
pnpm start prod
```

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Start all services (PostgreSQL, Redis, App)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Docker Configuration

The application includes:
- Multi-stage Dockerfile for optimized production builds
- Docker Compose configuration with PostgreSQL and Redis
- Health checks for all services
- Volume mounting for persistent data

## 📚 API Documentation

Once the application is running, visit:

- **Swagger UI**: `http://localhost:3000/docs`
- **API Base URL**: `http://localhost:3000/api`

### Authentication Endpoints

```bash
POST /api/auth/register          # User registration
POST /api/auth/login             # User login
POST /api/auth/logout            # User logout
```

### Example: Automatic Token Refresh

```typescript
// The client doesn't need to handle token refresh manually
// The TokenRefreshGuard automatically handles it via cookies

// Client makes a request with an expiring token
// Refresh token is automatically sent via HTTP cookies
fetch('/api/repositories', {
  headers: {
    'Authorization': 'Bearer <expiring-access-token>'
  },
  credentials: 'include' // Include cookies
});

// The guard detects the expiring token and automatically refreshes it
// The response includes the new access token in headers
// Response headers: { 'X-New-Access-Token': '<new-token>' }

// Frontend should intercept the response and update the stored token
```

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# Integration tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```

### Testing Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows
- **Repository Tests**: Test database interactions
- **Service Tests**: Test business logic
- **Controller Tests**: Test API endpoints

## 📈 Performance & Monitoring

### Logging

The application uses structured logging with Winston and MongoDB for domain events:

```typescript
// Automatic request logging
this.logger.log({
  message: 'Token refresh successful',
  userId: user.id,
  requestId: request.id,
  timestamp: new Date().toISOString()
});

// Domain events are automatically stored in MongoDB
// This provides a complete audit trail of all business operations
```

### Caching

Redis is used for:
- Session storage
- Rate limiting counters
- Temporary data caching
- Job queue management

### Database Optimization

- Connection pooling with Prisma
- Database indexing on frequently queried fields
- Optimized queries with select statements
- Database migrations for schema changes

## 🔧 Available Scripts

```bash
npm run build           # Build the application
npm run start          # Start production server
npm run start:dev      # Start development server
npm run start:debug    # Start with debugging
npm run lint           # Lint TypeScript files
npm run format         # Format code with Prettier
npm run test           # Run unit tests
npm run test:e2e       # Run integration tests
npm run test:cov       # Generate test coverage
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:push        # Push schema changes
npm run db:seed        # Seed database with initial data
```

## 📋 Project Structure Deep Dive

### Domain Layer (`src/core/`)

**Entities**: Core business objects with identity
- `User` - User aggregate root
- `Role` - Role entity with permissions
- `GitHubRepository` - Repository management entity
- `RefreshToken` - Token management entity

**Value Objects**: Immutable objects representing descriptive aspects
- `Email` - Email validation and formatting
- `UserId` - Strongly typed user identifiers
- `Token` - JWT token wrapper
- `RepositoryStats` - Repository statistics

**Domain Events**: Events that represent business occurrences (stored in MongoDB)
- `UserCreatedEvent`
- `RepositorySyncCompletedEvent`
- `TokenRefreshedEvent`

### Application Layer (`src/application/`)

**Commands**: Operations that change system state
- `CreateUserCommand`
- `RefreshTokenCommand`
- `SyncRepositoryCommand`

**Queries**: Operations that retrieve data
- `GetUserProfileQuery`
- `GetRepositoriesQuery`

**DTOs**: Data transfer objects for API communication

### Infrastructure Layer (`src/infrastructure/`)

**Repository Implementations**: Concrete implementations of domain repositories using Prisma

**External Services**: Integrations with external systems
- SMTP for email delivery
- GitHub API for repository data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Document public APIs with JSDoc

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Oleksandr Molochko**
- GitHub: [CROSP](https://github.com/CROSP)

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the Swagger API documentation

---

**Built with ❤️ using Clean Architecture principles and modern TypeScript practices.**