# Pink Cafe - Docker Setup

## Prerequisites
- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/shamykyzer/systems-development-group-project.git
   cd systems-development-group-project
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

   Or run in detached mode (background):
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

4. **Test login**
   - Email: `admin@pinkcafe.com`
   - Password: `admin123`

## Docker Commands

### Start services
```bash
docker-compose up
```

### Stop services
```bash
docker-compose down
```

### Rebuild containers (after code changes)
```bash
docker-compose up --build
```

### View logs
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop and remove all containers, volumes
```bash
docker-compose down -v
```

## Project Structure
```
systems-development-group-project/
├── docker-compose.yml          # Orchestrates all services
├── Dockerfile.backend          # Flask backend container
├── pinkcafe/
│   ├── Dockerfile.frontend    # React frontend container
│   ├── backend/
│   │   ├── app.py            # Flask API
│   │   ├── requirements.txt   # Python dependencies
│   │   └── CSV_Files/        # Sales data
│   └── src/                  # React source code
```

## Services

### Backend (Flask)
- **Port:** 5000
- **Database:** SQLite (persisted in Docker volume)
- **API Endpoints:**
  - `POST /api/login` - User login
  - `POST /api/register` - User registration
  - `GET /api/sales` - Get sales data
  - `GET /api/sales/summary` - Sales statistics

### Frontend (React)
- **Port:** 3000
- **Features:**
  - Login/Registration UI
  - Sales dashboard
  - Business promo panel

## Troubleshooting

### Port already in use
If ports 3000 or 5000 are already in use, stop the existing services:
```bash
# Stop React dev server
Ctrl+C in the terminal running npm start

# Stop Flask server
Ctrl+C in the terminal running python app.py
```

### Rebuild after changing dependencies
```bash
docker-compose down
docker-compose up --build
```

### Access container shell
```bash
# Backend
docker exec -it pinkcafe-backend /bin/bash

# Frontend
docker exec -it pinkcafe-frontend /bin/sh
```

### Reset database
```bash
docker-compose down -v
docker-compose up
```

## Development

The containers are configured with volume mounts, so code changes will reflect immediately:
- React hot-reload is enabled
- Flask debug mode is enabled

No need to rebuild containers for code changes!
