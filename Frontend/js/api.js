const LOCAL_API_URL = "http://127.0.0.1:8000";
const isLocalFrontend = ["localhost", "127.0.0.1"].includes(location.hostname);
const configuredApiUrl = typeof window.LEARNAI_API_URL === "string"
  ? window.LEARNAI_API_URL.trim().replace(/\/+$/, "")
  : "";
const API_URL = configuredApiUrl || (isLocalFrontend ? LOCAL_API_URL : "");
window.API_URL = API_URL;

const THEME_STORAGE_KEY = "learnai_theme";
const LANGUAGE_STORAGE_KEY = "learnai_language";

function applyTheme(theme = localStorage.getItem(THEME_STORAGE_KEY)) {
  const selectedTheme = ["light", "dark", "system"].includes(theme) ? theme : "system";
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = selectedTheme === "system" ? (prefersDark ? "dark" : "light") : selectedTheme;
  return selectedTheme;
}

function setTheme(theme) {
  if (!["light", "dark", "system"].includes(theme)) throw new Error("Choose a valid theme.");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

function getLanguage() {
  const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return ["en", "mr", "hi"].includes(language) ? language : "en";
}

function setLanguage(language) {
  if (!["en", "mr", "hi"].includes(language)) throw new Error("Choose a valid language.");
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  if (typeof applyTranslations === "function") applyTranslations();
}

applyTheme();
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (localStorage.getItem(THEME_STORAGE_KEY) === "system" || !localStorage.getItem(THEME_STORAGE_KEY)) applyTheme();
  });
}

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("learnai_token");
}

function saveSession(data) {
  const token = data.token || data.access_token;
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("learnai_token", token);
  }
  if (data.user) {
    localStorage.setItem("learnai_user", JSON.stringify(data.user));
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("learnai_token");
  localStorage.removeItem("learnai_user");
  location.href = "index.html";
}

async function api(path, method = "GET", body = null) {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured. Set LEARNAI_API_URL in js/config.js to your deployed backend URL.");
  }
  const headers = { "Content-Type": "application/json" };
  const t = getToken();
  if (t) headers["Authorization"] = "Bearer " + t;
  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
  } catch (e) {
    const localHint = isLocalFrontend ? " Is the backend running (start.bat)?" : "";
    throw new Error("Cannot reach the backend at " + API_URL + "." + localHint);
  }
  if (res.status === 401 && path.indexOf("/auth/") !== 0) { logout(); throw new Error("Session expired"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.detail || "Request failed";
    if (Array.isArray(msg)) msg = msg.map(m => m.msg).join(", ");
    throw new Error(msg);
  }
  return data;
}
