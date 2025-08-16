# Multi-Tenancy FastAPI Application

A mission-critical multi-tenancy application built with FastAPI, PostgreSQL, and Redis, featuring comprehensive SSO support and enterprise-grade security.

## Features

- **Multi-Tenancy**: Support for both individual users and organizations
- **Authentication**: Email/password and Google OAuth SSO
- **Authorization**: Role-based access control (RBAC) with fine-grained permissions
- **Security**: JWT tokens, password hashing, rate limiting, audit logging
- **Performance**: Optimized database schema with indexing and partitioning
- **Observability**: Structured logging, health checks, metrics
- **Scalability**: Designed to handle millions of users

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multitenancy-app
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   make up
   ```

4. **Initialize database**
   ```bash
   make init-db
   ```

5. **Access the application**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Architecture

### Database Schema
- **Users**: Partitioned by creation date for performance
- **Organizations**: Multi-tenant isolation
- **Roles & Permissions**: Flexible RBAC system
- **OAuth Providers**: Extensible SSO configuration
- **Activity Logs**: Comprehensive audit trail

### API Structure
```
app/
├── api/v1/endpoints/    # API endpoints
├── core/               # Core configuration and utilities
├── models/             # SQLAlchemy models
├── schemas/            # Pydantic schemas
├── services/           # Business logic
├── middleware/         # Custom middleware
└── utils/              # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `GET /api/v1/auth/google` - Get Google OAuth URL
- `POST /api/v1/auth/google/callback` - Handle Google OAuth callback

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/` - List users (with permissions)

### Organizations
- `POST /api/v1/organizations/` - Create organization
- `GET /api/v1/organizations/my` - Get user's organizations

### Health
- `GET /api/v1/health/` - Health check with database test
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Development

### Running Tests
```bash
make test
```

### Code Formatting
```bash
make format
make lint
```

### Database Migrations
```bash
# Create new migration
make migration name="add_new_table"

# Run migrations
make migrate
```

### Monitoring Logs
```bash
make logs
```

## Configuration

Key environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT signing key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt
- **Rate Limiting**: Configurable request rate limits
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **CORS Protection**: Configurable cross-origin policies
- **Input Validation**: Pydantic schema validation
- **Audit Logging**: Comprehensive activity tracking

## Performance Optimizations

- **Database Indexing**: Comprehensive index strategy
- **Connection Pooling**: Optimized database connections
- **Redis Caching**: Session and data caching
- **Table Partitioning**: Automatic data partitioning
- **Async Operations**: Non-blocking I/O operations

## Production Deployment

1. **Update Environment Variables**
   - Set production database credentials
   - Configure OAuth providers
   - Set secure secret keys

2. **Database Setup**
   - Run migrations: `make migrate`
   - Set up monitoring and backups

3. **Security Hardening**
   - Enable HTTPS
   - Configure firewall rules
   - Set up monitoring and alerting

4. **Scaling**
   - Use load balancers
   - Set up read replicas
   - Configure horizontal scaling

## License

This project is licensed under the MIT License.