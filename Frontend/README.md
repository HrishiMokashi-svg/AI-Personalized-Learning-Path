# LearnAI - Frontend
Plain HTML/CSS/JS (no build step). Pages: index.html (login/register), dashboard.html (dashboard, profile, skill form, learning path, courses, video lectures, quiz, performance, progress, AI tutor, settings). The Video Lectures page links each course to matching YouTube lecture search results.
Use Settings in the dashboard sidebar to edit account details, notification preferences, language, appearance, privacy/security, study goals, and account actions. Marathi and Hindi UI translations are included. Notification preferences, daily study hours, target date, and profile photos are saved in this browser; weekly study hours update the learning profile. Account name, email, and password changes are saved by the backend. Notification switches store preferences only; the application does not currently deliver reminders.
## Local development
Run `start.bat` (serves the frontend on http://127.0.0.1:5500). The local API defaults to http://127.0.0.1:8000; the local backend must be running separately.

## Deploying the frontend to Vercel
Create a Vercel project from this repository with **Root Directory** set to `Frontend`, **Framework Preset** set to `Other`, **Build Command** unset/disabled, and **Output Directory** set to `.`. `vercel.json` sets the no-build static output as well.

The FastAPI backend is not part of this static deployment. Deploy it as a separate service, then set `window.LEARNAI_API_URL` in `js/config.js` to that service's public base URL (including `https://`, without a trailing slash), and redeploy the frontend. Do not use a localhost address there.

Because this is plain static HTML/JavaScript with no build step, browser JavaScript cannot read Vercel server environment variables directly. `js/config.js` is the single public runtime configuration point for the backend URL; Vercel environment variables do not automatically replace it. This URL is public configuration, not a secret. Keep API keys and `.env` values on the backend.
