# GitHub CRM

A comprehensive CRM system for managing GitHub public repositories.

## Quick Start with Docker

Start the entire application stack:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Services

- PostgreSQL Database: `localhost:5432`
- MongoDB (Analytics): `localhost:27017`
- Redis (Queue): `localhost:6379`

## Development

For detailed development setup, configuration, and API documentation:

- **Backend**: See [backend/README.md](./backend/README.md)
- **Frontend**: See [frontend/README.md](./frontend/README.md)

## Environment

Default credentials and settings are configured for development. Update `docker-compose.yml` environment variables for production deployment.
