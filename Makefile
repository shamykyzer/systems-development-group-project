# Docker Compose file
COMPOSE := docker compose -p pinkcafe -f docker/docker-compose.yml

.PHONY: dev prod build down

# Run backend + frontend (dev)
dev:
	$(COMPOSE) --profile dev up --build

# Run combined app (prod)
prod:
	$(COMPOSE) --profile prod up --build

# Build only
build:
	$(COMPOSE) --profile prod build

# Stop containers
down:
	$(COMPOSE) down --remove-orphans
