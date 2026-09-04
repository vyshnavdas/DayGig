# DayGig WhatsApp Bot

The `whatsapp-bot` service is an automated job extraction engine for the DayGig platform. It monitors WhatsApp groups in real time using socket connections, filters messages for job postings, uses AI (LLMs) to structure job data, resolves location coordinates, and saves active job listings directly to MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Frameworks & Libraries Used](#frameworks--libraries-used)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)

---

## Overview

In many regions, short-term and daily wage job opportunities are shared through local WhatsApp groups. The `whatsapp-bot` automates the extraction process by:
1. Connecting to WhatsApp via Web Sockets using `@whiskeysockets/baileys`.
2. Filtering incoming group messages for job-related keywords.
3. Extracting location coordinates from shared Google Maps URLs or geocoding place names via Google Maps API.
4. Sending unorganized message text to Groq LLM (OpenAI-compatible client) to extract structured fields (job title, salary, date, time, requirements, expiration time).
5. Saving structured job documents into the central MongoDB database.

---

## Frameworks & Libraries Used

- **`@whiskeysockets/baileys`**: Open-source WhatsApp Web API library for Node.js using multi-file auth state and web sockets.
- **`openai`**: Configured to connect to the Groq API endpoint (`https://api.groq.com/openai/v1`) for fast LLM inference.
- **`mongoose`**: MongoDB ODM for managing database connections and job document storage.
- **`axios`**: Promise-based HTTP client used to follow redirect chains for Google Maps short URLs (`maps.app.goo.gl`) and perform geocoding HTTP requests.
- **`qrcode-terminal`**: Displays authentication QR code directly in the terminal interface.
- **`@hapi/boom`**: HTTP error handling utility for managing connection disconnect reasons.
- **`dotenv`**: Configuration management for environment variables.

---

## How It Works

```text
Incoming Group Message 
       │
       ▼
Keyword Check (Job terms, language detection)
       │
       ▼
Location Extraction:
 ├─ Parse Google Maps URL (@lat,lng or ?q=lat,lng)
 └─ OR LLM location text extraction + Google Geocoding API
       │
       ▼
Groq LLM Structured Job Parsing (Title, Salary, Date, Requirements, Expiration)
       │
       ▼
Validation (is_job == true)
       │
       ▼
Insert into MongoDB ('jobs' collection)
```

---

## Project Structure

```text
whatsapp-bot/
├── index.js                     # Main bot connection setup & event listener
├── helpers/
│   ├── extractAndResolveLocation.js  # Google Maps URL parsing & Geocoding API with caching
│   └── insertJob.js             # Mongoose helper function to save job documents
├── llm/
│   ├── client.js                # OpenAI client configuration targeting Groq API
│   ├── extractJob.js            # LLM prompt pipeline for main job fields extraction
│   ├── extractJobTime.js        # LLM prompt pipeline for work date & expiration time
│   └── extractLocationText.js   # LLM prompt for location text extraction
├── package.json                 # Node project dependencies
```

---

## Installation & Setup

1. **Navigate to directory**:
   ```bash
   cd whatsapp-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `whatsapp-bot/`:
   ```env
   MONGO_URI=mongodb://localhost:27017
   GROQ_API_KEY=your_groq_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start the bot**:
   ```bash
   node index.js
   ```

5. **Authenticate with WhatsApp**:
   - A QR code will print in the console terminal.
   - Open WhatsApp on your mobile phone.
   - Go to **Settings** > **Linked Devices** > **Link a Device**.
   - Scan the terminal QR code.
   - The bot will output `Bot connected` upon successful authentication and store credentials in `./auth_info`.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | Connection URI for MongoDB database | `mongodb://localhost:27017` |
| `GROQ_API_KEY` | API Key for Groq LLM inference service | `gsk_...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API Key | `AIzaSy...` |
