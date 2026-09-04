# DayGig Frontend Web Application (React + Vite)

The `daily-job-react` application provides a modern web interface for job seekers and job posters on the DayGig platform. Built with React 19, Vite, and Leaflet, it renders an interactive map displaying local daily job postings alongside job details, user authentication forms, and job posting tools.

---

## Table of Contents

- [Overview](#overview)
- [Frameworks & Libraries Used](#frameworks--libraries-used)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Application Pages & Components](#application-pages--components)

---

## Overview

The React web application allows users to:
- Browse daily job openings pinned on an interactive map view centered on their location.
- View job descriptions, compensation, requirements, and contact details.
- Register for an account and log in via JWT authentication.
- Create manual job listings through a dedicated post job form.

---

## Frameworks & Libraries Used

- **React 19**: Modern UI library for building component-based web interfaces.
- **Vite**: Ultra-fast build tool and local development server.
- **React Router DOM (v7)**: Client-side routing for multi-page application navigation.
- **Leaflet & React-Leaflet**: Interactive map component for placing and rendering job markers.
- **Axios**: HTTP client for communicating with the Flask REST API backend.
- **ESLint**: Code linting and quality enforcement.

---

## Project Structure

```text
daily-job-react/
├── public/                # Static assets (favicons, icons)
├── src/
│   ├── assets/            # UI graphics and logos
│   ├── components/
│   │   ├── AddJobButton.jsx  # Floating action button to post job
│   │   ├── DayGigLogo.jsx    # Application logo component
│   │   ├── JobList.jsx       # Side drawer job listing view
│   │   ├── MapView.jsx       # Leaflet interactive map rendering component
│   │   └── ProfileMenu.jsx   # User profile navigation and logout menu
│   ├── context/
│   │   └── AuthContext.jsx   # React Context state management for JWT auth
│   ├── pages/
│   │   ├── LoginPage.jsx     # User login screen
│   │   ├── SignupPage.jsx    # User registration screen
│   │   └── PostJobPage.jsx   # Form screen for posting new jobs
│   ├── App.jsx            # Main app shell & router configuration
│   ├── main.jsx           # React DOM application entrypoint
│   └── index.css          # Global styling rules
├── package.json           # Node project configuration and scripts
└── vite.config.js         # Vite bundler configuration
```

---

## Installation & Setup

1. **Navigate to directory**:
   ```bash
   cd daily-job-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables (Optional)**:
   Create a `.env` file in `daily-job-react/` if custom API URL is needed:
   ```env
   VITE_API_URL=http://127.0.0.1:5000/api
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Environment Variables

| Variable | Description | Default Value |
|---|---|---|
| `VITE_API_URL` | Base URL for Flask REST API | `http://127.0.0.1:5000/api` |

---

## Application Pages & Components

- **Map Discovery View (`/`)**: Main screen displaying an interactive map powered by Leaflet, displaying nearby job markers and job cards.
- **Login (`/login`)**: Account sign-in page accepting user credentials to retrieve and store JWT tokens.
- **Signup (`/signup`)**: Registration page for new job posters.
- **Post Job (`/post-job`)**: Form page enabling authenticated users to submit new job listings with title, salary, location, and requirements.
