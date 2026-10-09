# LearnAI - AI Personalized Learning Path 🚀

An intelligent, full-stack learning platform that creates personalized roadmaps, tests user knowledge with interactive quizzes, and answers student questions using an AI Tutor powered by RAG (Retrieval-Augmented Generation) and Google Gemini.

---

## 🌟 Key Features

- **Personalized AI Learning Paths**: Generates tailored 6-week roadmaps grounded in your skills, goals, strengths, and weaknesses.
- **RAG-Powered AI Tutor**: Intelligent question answering referencing an curated knowledge base of roadmaps and career guidance.
- **Interactive Quizzes & Performance Tracking**: Topic-specific quizzes with instant scoring, progress charts, and weak-area identification.
- **Course Catalog & Progress**: Enroll in courses, inspect syllabi, update completion status, and find relevant video lectures.
- **Flexible Database**: Runs seamlessly with **MySQL** or zero-config **SQLite** fallback.
- **Ready for Deployment**: Optimized for full-stack deployment on **Vercel**, Render, or Railway.

---

## 🏗️ Architecture

```
AI-Personalized-Learning-Path/
├── api/
│   └── index.py            # Vercel serverless function entrypoint
├── Backend/
│   ├── main.py             # FastAPI REST API (dual-routed: / and /api)
│   ├── database.py         # SQLAlchemy engine with MySQL & SQLite fallback
│   ├── models.py           # Database models (User, Course, Quiz, RAG)
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── auth.py             # JWT authentication & PBKDF2 password hashing
│   ├── api_calling.py      # Google Gemini API integration
│   ├── rag.py              # Vector embeddings & cosine similarity retrieval
│   ├── seed.py             # Initial courses & quiz questions data
│   ├── kb/                 # Markdown knowledge base files
│   └── start.bat           # Dedicated backend launcher
├── Frontend/
│   ├── index.html          # Authentication (Login / Register)
│   ├── dashboard.html      # Main dashboard with SPA navigation
│   ├── css/                # Custom responsive design system
│   ├── js/
│   │   ├── api.js          # API client with auto-origin detection
│   │   ├── dashboard.js    # Interactive views & Chart.js visualizations
│   │   ├── i18n.js         # Multilingual translations (English, Hindi, Marathi)
│   │   └── config.js       # Optional remote backend URL configuration
├── requirements.txt        # Root Python dependencies for cloud deployment
├── vercel.json             # Vercel routing rules & rewrites
└── start.bat               # One-click launcher for frontend + backend
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
- Python 3.10+
- (Optional) MySQL Server (if not installed, the app automatically uses local SQLite `learnai.db`)

### 2. Configure Environment Variables
Copy `Backend/.env.example` to `Backend/.env`:
```bash
# In Backend/.env:
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_random_secret_key
```

### 3. One-Click Launch (Windows)
Double-click `start.bat` in the root folder, or run:
```bat
start.bat
```
This automatically:
- Detects the Python virtual environment
- Resolves port conflicts
- Starts the FastAPI backend on `http://127.0.0.1:8000`
- Starts the frontend web server on `http://127.0.0.1:5500`
- Opens your default web browser

---

## ☁️ Deploying to Vercel

### Step 1: Push Code to GitHub
Ensure all latest code is committed and pushed to your GitHub repository.

### Step 2: Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository: `AI-Personalized-Learning-Path`.
4. Leave Framework Preset as **Other**.
5. Set Root Directory to `./` (default).

### Step 3: Add Environment Variables in Vercel
In the Vercel project configuration, add:
- `GOOGLE_API_KEY`: Your Google AI Studio API key
- `JWT_SECRET`: A long random secret string (e.g. `learnai-secure-jwt-key-2026`)
- `USE_SQLITE`: `true` (uses `/tmp/learnai.db` in serverless environment)
- *(Optional)* `DATABASE_URL`: If you have an external cloud database (e.g., Supabase, Neon, Railway, or PlanetScale)

### Step 4: Deploy!
Click **Deploy**. Vercel will:
- Build static frontend files
- Package `api/index.py` with FastAPI serverless handlers
- Serve both frontend and backend seamlessly from your `.vercel.app` domain!

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` or `/api/health` | Service health check |
| `POST` | `/auth/register` | Register student account |
| `POST` | `/auth/login` | Login and receive JWT token |
| `GET` | `/me` | Get current student info & profile |
| `PUT` | `/profile` | Update student skills & preferences |
| `GET` | `/courses` | List all catalog courses & enrollment |
| `POST` | `/courses/{id}/enroll` | Enroll in course |
| `GET` | `/recommendations` | Get personalized course recommendations |
| `POST` | `/learning-path/generate` | Generate 6-week AI learning plan |
| `GET` | `/quiz/topics` | Get available quiz categories |
| `POST` | `/quiz/submit` | Submit answers and receive score |
| `POST` | `/chat` | Ask RAG-augmented AI Tutor |
