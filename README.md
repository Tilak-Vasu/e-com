# E-Commerce Platform (Project Name)

This is a full-stack e-commerce application featuring a React frontend, a Django (ASGI) backend, real-time chat with WebSockets, and an AI-powered admin assistant.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Zustand
- **Backend:** Django 5, Django Channels, Daphne, PostgreSQL, Redis
- **CI/CD:** GitHub Actions for automated testing and deployment.

---

## Production Architecture

This project is designed for a scalable, self-hosted cloud environment.

- **Frontend:** Deployed as a static site on **Vercel**.
- **Backend:**
  - Application servers run the Django/Daphne application inside Docker containers.
  - **Nginx** is used as a reverse proxy on each application server.
- **Database & Cache:** A centralized, **Managed PostgreSQL** database and **Managed Redis** instance are used to ensure data consistency across all application servers.

---

## Local Development Setup

To run this project locally, you must have Docker and Docker Compose installed.

1.  **Clone the repository:**
    `git clone <your-repo-url>`
2.  **Setup Environment Files:** Create and fill in the `.env` files for both the `backend/` and `frontend/` directories using their respective `.env.example` templates.
3.  **Run the application:**
    `docker-compose up --build`
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:8000`

---

## Environment Variables

The application requires the following environment variables to be set on the production servers.

- `SECRET_KEY`: Your Django secret key.
- `DEBUG`: **Must be `False` in production.**
- `DATABASE_URL`: The **private** connection string for the managed PostgreSQL database.
- `REDIS_URL`: The **private** connection string for the managed Redis instance.
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`: Keys for third-party services.

---

## Deployment & Maintenance Procedures

### Provisioning a New Server

1.  Create a new cloud server instance (e.g., Ubuntu 22.04).
2.  Install Docker and Docker Compose.
3.  Install Nginx (`apt-get install nginx`).
4.  Copy the production Nginx configuration to `/etc/nginx/sites-available/e-com`.
5.  Enable the site: `ln -s /etc/nginx/sites-available/e-com /etc/nginx/sites-enabled/`.
6.  Clone the repository into the server's home directory.
7.  Create the `backend/.env` file and populate it with the production secrets.
8.  Pull the latest Docker image or build it on the server.
9.  Run the application using Docker Compose in detached mode: `docker-compose up -d`.

### Updating the Application (CI/CD)

The GitHub Actions workflow is configured to:
1.  Run all backend and frontend tests.
2.  On a successful push to `main`:
    - **Vercel Frontend:** Automatically deploy the latest frontend build.
    - **Self-Hosted Backend:** (This part requires a custom deployment script) The CI/CD pipeline should be configured to SSH into each production server, pull the latest code from the `main` branch, and restart the Docker containers (`docker-compose up -d --build`).

### Database Migrations

Migrations must be run **manually** during a deployment to avoid race conditions.

1.  SSH into **one** of the application servers.
2.  Navigate to the project directory.
3.  Run the migrate command inside the container:
    `docker-compose exec backend python manage.py migrate`

This ensures that the database schema is updated once per deployment.