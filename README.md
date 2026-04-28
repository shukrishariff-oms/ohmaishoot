# OhMaiShoot Local Landing Page System

A sleek, premium black & white landing page system for OhMaiShoot Marathon Photography. Built with React (Vite + Tailwind CSS 4) on the frontend and FastAPI (SQLite) on the backend. Designed strictly for local laptop use.

## Prerequisites
- Node.js (v18+ recommended)
- Python (3.9+ recommended)

## Quick Start (Windows)
If you are on Windows, you can simply run the provided batch script to start both the Python backend and React frontend simultaneously:

1. Double-click on `start.bat` in the root folder.
2. The browser should automatically open `http://localhost:5173`.

> **Note**: The first time you run `start.bat`, it will attempt to install the required Python packages globally/via pip, and the npm packages. You might prefer to do it manually once using the manual steps below.

## Manual Setup & Run

### 1. Backend (FastAPI)
The backend uses SQLite to store data and serves the API on port `8000`.

1. Open your terminal and navigate to the `backend` directory:
   ```cmd
   cd backend
   ```
2. (Optional but Recommended) Create a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install the dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```cmd
   uvicorn main:app --reload
   ```
   *The backend is now running at `http://localhost:8000`. It will automatically create `storage/covers` and `data/ohmaishoot.db` on launch.*

### 2. Frontend (React + Vite)
The frontend serves the user interface on port `5173`.

1. Open a **new** terminal window and navigate to the `frontend` directory:
   ```cmd
   cd frontend
   ```
2. Install the node modules:
   ```cmd
   npm install
   ```
3. Start the Vite development server:
   ```cmd
   npm run dev
   ```
   *The frontend is now running at `http://localhost:5173`.*

## Admin Access
- To manage albums, navigate to the admin page: **`http://localhost:5173/admin`**
- **Username:** `admin`
- **Password:** `admin123`

From the Admin Dashboard, you can add new events, upload cover images, set the external PhotoHawk URL, and toggle the publish status to make them visible on the Home Page.

## Project Structure
- `backend/data/`: Where the `ohmaishoot.db` SQLite database is saved.
- `backend/storage/covers/`: Uploaded cover images are saved here and served statically.
- `frontend/src/pages/`: Contains `Home.jsx` (Landing Page) and `Admin.jsx` (Dashboard).

## Deploying to Coolify (Docker Compose)

This project is fully dockerized and ready to be deployed on Coolify using the `docker-compose.yml` file.

1. Create a new Application in Coolify and connect this GitHub repository.
2. Select **Docker Compose** as the Build Pack.
3. In the Configuration tab, set the following Environment Variables:
   - `VITE_API_URL`: The public URL of the backend (e.g., `https://api.ohmaishoot.com`). *You may need to deploy once to get the URL, then set this and deploy again.*
   - `CORS_ORIGINS`: The public URL of the frontend (e.g., `https://ohmaishoot.com`).
   - `ADMIN_USERNAME`: Your custom admin username.
   - `ADMIN_PASSWORD`: Your custom admin password.
4. Coolify will automatically read the `docker-compose.yml`, build the `backend` and `frontend` images, and mount the persistent volumes (`ohmaishoot-db` and `ohmaishoot-covers`) so you don't lose data on redeploys.
5. In Coolify's server/network settings, configure your domains to route traffic:
   - Map `https://ohmaishoot.com` to the `frontend` service port 80.
   - Map `https://api.ohmaishoot.com` to the `backend` service port 8000.
