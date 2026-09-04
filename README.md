# DayGig

**DayGig** is an intelligent daily job aggregation and location-based discovery platform. It automatically extracts daily wage and short-term job postings from WhatsApp group messages using AI (LLMs), parses job requirements and geolocation data, and presents active job opportunities on an interactive map and web application.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Frameworks & Libraries Used](#frameworks--libraries-used)
  - [1. WhatsApp Bot (`whatsapp-bot`)](#1-whatsapp-bot-whatsapp-bot)
  - [2. Backend REST API (`daily-job-flask`)](#2-backend-rest-api-daily-job-flask)
  - [3. Frontend Web App (`daily-job-react`)](#3-frontend-web-app-daily-job-react)
  - [4. Database & External Services](#4-database--external-services)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [1. Database Setup (MongoDB)](#1-database-setup-mongodb)
  - [2. Backend Setup (`daily-job-flask`)](#2-backend-setup-daily-job-flask)
  - [3. Frontend Setup (`daily-job-react`)](#3-frontend-setup-daily-job-react)
  - [4. WhatsApp Bot Setup (`whatsapp-bot`)](#4-whatsapp-bot-setup-whatsapp-bot)
- [Environment Variables Reference](#environment-variables-reference)
- [API Reference](#api-reference)

---

## Overview

Connecting daily wage workers with short-term job opportunities often relies on informal messaging channels like WhatsApp groups. **DayGig** bridges this gap by:
1. Monitoring WhatsApp groups in real time.
2. Filtering and extracting structured job details (title, salary, date/time, requirements, location) via AI models.
3. Resolving geographical locations using Google Maps URL parsing or Google Geocoding API.
4. Storing clean, active listings in MongoDB.
5. Displaying job locations interactively on a map frontend for job seekers, alongside a portal for employers to post jobs manually.

---

## System Architecture

```text
               +-----------------------+
               |    WhatsApp Groups    |
               +-----------+-----------+
                           |
                           v
               +-----------------------+
               |     whatsapp-bot      |
               | (Baileys + Groq LLM)  |
               +-----------+-----------+
                           |
                           v
+------------------+  MongoDB  +--------------------+
|  daily-job-flask | <=======> |   MongoDB Database |
| (Flask REST API) |  Database +--------------------+
+--------+---------+
         ^
         |  REST API / JWT
         v
+------------------+
|  daily-job-react |
| (React 19 + Maps)|
+------------------+
```

---

## Key Features

- **Automated AI Scraper**: Uses WhatsApp Web sockets to listen for messages in groups, filtering potential jobs using keyword detection and Groq LLM parsing.
- **Location Resolution**: Parses shared Google Maps links (`maps.app.goo.gl`) or queries Google Geocoding API for named places to retrieve latitude and longitude coordinates.
- **Job Expiry Management**: Parses job expiration times and dates automatically.
- **Interactive Map Discovery**: Allows job seekers to view jobs pin-pointed on an interactive Leaflet map near their location.
- **User Authentication**: Secure JWT-based registration and login system for job posters.
- **Manual Job Posting**: Dedicated portal for registered users to create and manage job postings.

---

## Frameworks & Libraries Used

### 1. WhatsApp Bot ([`whatsapp-bot`](file:///c:/DayGig/DayGig-main/whatsapp-bot))
- **Environment**: Node.js (CommonJS)
- **Primary Libraries & Frameworks**:
  - [`@whiskeysockets/baileys`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Multi-device WhatsApp Web API library for listening to WhatsApp group messages.
  - [`openai`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Configured with Groq API endpoint (`https://api.groq.com/openai/v1`) for fast LLM extraction of job parameters.
  - [`mongoose`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Object Data Modeling (ODM) library for MongoDB integration.
  - [`axios`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Promise-based HTTP client for fetching Google Maps redirected URLs and Geocoding APIs.
  - [`qrcode-terminal`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Renders QR code in terminal for WhatsApp authentication.
  - [`dotenv`](file:///c:/DayGig/DayGig-main/whatsapp-bot/package.json): Environment variable loader.

### 2. Backend REST API ([`daily-job-flask`](file:///c:/DayGig/DayGig-main/daily-job-flask))
- **Environment**: Python 3.x
- **Primary Libraries & Frameworks**:
  - **[Flask](file:///c:/DayGig/DayGig-main/daily-job-flask/app.py)**: Lightweight Python web framework for REST API endpoints.
  - **[Flask-CORS](file:///c:/DayGig/DayGig-main/daily-job-flask/app.py)**: Handles Cross-Origin Resource Sharing for communication with the React frontend.
  - **[Flask-JWT-Extended](file:///c:/DayGig/DayGig-main/daily-job-flask/app.py)**: Manages JSON Web Token creation, decoding, and protection of routes.
  - **[PyMongo](file:///c:/DayGig/DayGig-main/daily-job-flask/db.py)**: Native Python driver for MongoDB interaction.
  - **[Bcrypt](file:///c:/DayGig/DayGig-main/daily-job-flask/routes/auth.py)**: Password hashing utility for user accounts.
  - **[python-dotenv](file:///c:/DayGig/DayGig-main/daily-job-flask/app.py)**: Manages secrets and environment configurations.

### 3. Frontend Web App ([`daily-job-react`](file:///c:/DayGig/DayGig-main/daily-job-react))
- **Environment**: Node.js & Vite
- **Primary Libraries & Frameworks**:
  - **[React 19](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)**: UI rendering framework.
  - **[Vite](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)**: Next-generation frontend build tool and development server.
  - **[React Router DOM v7](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)**: Client-side navigation and routing (`/`, `/login`, `/signup`, `/post-job`).
  - **[Leaflet](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)** & **[React-Leaflet](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)**: Interactive maps and map marker rendering.
  - **[Axios](file:///c:/DayGig/DayGig-main/daily-job-react/package.json)**: HTTP client for API communication with Flask backend.

### 4. Database & External Services
- **MongoDB**: Central database storing `jobs` and `users` collections.
- **Groq AI (OpenAI API Compatible)**: Fast inference LLM provider for extracting job information from unorganized text messages.
- **Google Maps Geocoding API**: Resolves location names into geographic coordinates (`lat`, `lng`).

---

## Prerequisites

Before getting started, make sure you have the following installed on your system:

- **Node.js**: `v18.x` or higher
- **Python**: `v3.8` or higher
- **MongoDB**: Local MongoDB instance or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.
- **Groq API Key**: Required for the WhatsApp bot's LLM feature.
- **Google Maps API Key** *(Optional)*: For geocoding named addresses.

---

## Installation & Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/vyshnavdas/DayGig.git
cd DayGig
```

### 1. Database Setup (MongoDB)
Ensure your MongoDB service is running locally or prepare your MongoDB Atlas connection URI string (e.g., `mongodb://localhost:27017` or `mongodb+srv://...`).

---

### 2. Backend Setup ([`daily-job-flask`](file:///c:/DayGig/DayGig-main/daily-job-flask))

1. Navigate to the Flask directory:
   ```bash
   cd daily-job-flask
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in `daily-job-flask/`:
   ```env
   MONGO_URI=mongodb://localhost:27017
   JWT_SECRET_KEY=your_jwt_secret_key_here
   ```

5. Run the Flask development server:
   ```bash
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`.*

---

### 3. Frontend Setup ([`daily-job-react`](file:///c:/DayGig/DayGig-main/daily-job-react))

1. Navigate to the React directory:
   ```bash
   cd ../daily-job-react
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file in `daily-job-react/` if custom backend URL is required:
   ```env
   VITE_API_URL=http://127.0.0.1:5000/api
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open on `http://localhost:5173` (or as displayed in your terminal).*

---

### 4. WhatsApp Bot Setup ([`whatsapp-bot`](file:///c:/DayGig/DayGig-main/whatsapp-bot))

1. Navigate to the WhatsApp bot directory:
   ```bash
   cd ../whatsapp-bot
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `whatsapp-bot/`:
   ```env
   MONGO_URI=mongodb://localhost:27017
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Start the WhatsApp bot:
   ```bash
   node index.js
   ```

5. **Authenticate**: A QR code will be displayed in the terminal. Scan it using WhatsApp on your primary phone (Settings > Linked Devices > Link a Device). Once connected, the bot will start monitoring group messages for job postings.

---

## Environment Variables Reference

### Backend ([`daily-job-flask/.env`](file:///c:/DayGig/DayGig-main/daily-job-flask))
| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB Connection String | `mongodb://localhost:27017` |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | `supersecretkey` |

### WhatsApp Bot ([`whatsapp-bot/.env`](file:///c:/DayGig/DayGig-main/whatsapp-bot))
| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB Connection String | `mongodb://localhost:27017` |
| `GROQ_API_KEY` | API Key for Groq LLM inference | `gsk_...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API Key | `AIzaSy...` |

### Frontend ([`daily-job-react/.env`](file:///c:/DayGig/DayGig-main/daily-job-react))
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL for Flask REST API | `http://127.0.0.1:5000/api` |

---

## API Reference

### Authentication Routes (`/api/auth`)
- `POST /api/auth/signup` - Register a new job poster account.
- `POST /api/auth/login` - Authenticate account and receive JWT access token.

### Job Routes (`/api/jobs`)
- `GET /api/jobs/` - Fetch all currently active daily job listings.
- `POST /api/jobs/post` - Manually post a job listing (Requires JWT Authorization header).

---

## License

This project is licensed under the ISC License.
