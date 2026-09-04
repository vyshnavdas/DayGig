# DayGig Backend API (Flask)

The `daily-job-flask` service is the central RESTful API for the DayGig platform. Built using Python and Flask, it handles user authentication, JWT access token management, and job management against a MongoDB database.

---

## Table of Contents

- [Overview](#overview)
- [Frameworks & Libraries Used](#frameworks--libraries-used)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)

---

## Overview

The Flask service serves requests from the React frontend application. It manages:
- User signup and login with secure password hashing (`bcrypt`).
- JSON Web Token (JWT) issuing and token verification (`flask-jwt-extended`).
- Storing and retrieving active daily job listings in MongoDB.

---

## Frameworks & Libraries Used

- **Flask**: Python micro web framework for handling HTTP routes and requests.
- **Flask-CORS**: Enables Cross-Origin Resource Sharing for browser clients.
- **Flask-JWT-Extended**: Provides JWT management for route authorization.
- **PyMongo**: Official Python driver for MongoDB database operations.
- **Bcrypt**: Hashing algorithm for secure user password storage.
- **python-dotenv**: Loads configuration variables from `.env` files.

---

## Project Structure

```text
daily-job-flask/
├── app.py           # Application entrypoint & Flask blueprint configuration
├── db.py            # MongoDB connection configuration
├── requirements.txt # Python package dependencies list
├── routes/
│   ├── auth.py      # Authentication routes (/api/auth/signup, /api/auth/login)
│   └── jobs.py      # Job routes (/api/jobs/, /api/jobs/post)
├── .env.sample      # Environment variables template
```

---

## Installation & Setup

1. **Navigate to directory**:
   ```bash
   cd daily-job-flask
   ```

2. **Create and activate virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file based on `.env.sample`:
   ```env
   MONGO_URI=mongodb://localhost:27017
   JWT_SECRET_KEY=your_secret_key_here
   ```

5. **Run the server**:
   ```bash
   python app.py
   ```
   The backend server will start at `http://127.0.0.1:5000`.

---

## Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `MONGO_URI` | Connection URI for MongoDB instance | `mongodb://localhost:27017` |
| `JWT_SECRET_KEY` | Secret string for signing JWT tokens | `your_secret_key_here` |

---

## API Endpoints

### Authentication Blueprint (`/api/auth`)

#### `POST /api/auth/signup`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account created"
  }
  ```

#### `POST /api/auth/login`
Authenticates a user and returns a JWT access token valid for 7 days.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "token": "<jwt_access_token>"
  }
  ```

---

### Jobs Blueprint (`/api/jobs`)

#### `GET /api/jobs/`
Retrieves all currently active jobs from MongoDB.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 1,
    "jobs": [
      {
        "message_id": "...",
        "title": "Construction Worker",
        "salary": "1000",
        "salary_type": "daily",
        "location_text": "Kochi",
        "coordinates": { "lat": 9.9312, "lng": 76.2673 },
        "status": "active"
      }
    ]
  }
  ```

#### `POST /api/jobs/post`
Creates a manual job entry. Requires a valid JWT bearer token in the `Authorization` header (`Bearer <token>`).
- **Request Body**:
  ```json
  {
    "title": "Delivery Helper",
    "salary": "800",
    "location_text": "Kaloor, Ernakulam",
    "coordinates": { "lat": 9.998, "lng": 76.292 }
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Job posted"
  }
  ```
