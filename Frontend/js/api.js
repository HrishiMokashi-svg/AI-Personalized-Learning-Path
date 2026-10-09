function isLocalHost(host = location.hostname) {
  return (
    ["localhost", "127.0.0.1", "[::1]", "::1", ""].includes(host) ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.") ||
    host.endsWith(".local")
  );
}

// Check for optional ?api_url= parameter in URL for seamless linking
try {
  const urlParams = new URLSearchParams(window.location.search);
  const paramApiUrl = urlParams.get("api_url");
  if (paramApiUrl && paramApiUrl.trim()) {
    localStorage.setItem("learnai_api_url", paramApiUrl.trim().replace(/\/+$/, ""));
  }
} catch (e) {}

function getApiUrl() {
  // 1. window.LEARNAI_API_URL set in js/config.js
  const configUrl = typeof window.LEARNAI_API_URL === "string" ? window.LEARNAI_API_URL.trim().replace(/\/+$/, "") : "";
  if (configUrl) return configUrl;

  // 2. Saved URL from Settings in localStorage
  const savedUrl = (localStorage.getItem("learnai_api_url") || "").trim().replace(/\/+$/, "");
  if (savedUrl) return savedUrl;

  // 3. Localhost development fallback
  if (isLocalHost()) {
    const host = location.hostname || "127.0.0.1";
    return `http://${host}:8000`;
  }

  // 4. In production without explicit config, fallback to current origin for full-stack deployment
  if (typeof location !== "undefined" && location.origin && location.origin.startsWith("http")) {
    return location.origin;
  }

  return "";
}

function setApiUrl(url) {
  const cleaned = (url || "").trim().replace(/\/+$/, "");
  if (cleaned) {
    localStorage.setItem("learnai_api_url", cleaned);
  } else {
    localStorage.removeItem("learnai_api_url");
  }
  window.API_URL = getApiUrl();
  return window.API_URL;
}

window.getApiUrl = getApiUrl;
window.setApiUrl = setApiUrl;
window.API_URL = getApiUrl();

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

function logout(isExpired = false) {
  localStorage.removeItem("token");
  localStorage.removeItem("learnai_token");
  localStorage.removeItem("learnai_user");
  location.href = isExpired ? "index.html?expired=1" : "index.html";
}

async function api(path, method = "GET", body = null) {
  const base = getApiUrl();
  if (!base) {
    throw new Error("Backend API URL is not configured. Please enter your deployed backend URL in Settings or in js/config.js.");
  }
  const headers = { "Content-Type": "application/json" };
  const t = getToken();
  if (t) headers["Authorization"] = "Bearer " + t;

  // Route through /api prefix on same-origin cloud deployments to avoid collisions with HTML routes
  let url = base + path;
  if (typeof location !== "undefined" && base === location.origin && !path.startsWith("/api")) {
    url = base + "/api" + path;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
  } catch (e) {
    const isLocal = isLocalHost();
    const hint = isLocal
      ? " Please verify the backend is running (start.bat on port 8000)."
      : " Please verify your backend service is running and CORS is enabled.";
    throw new Error(`Unable to connect to backend at ${base}.${hint}`);
  }

  if (res.status === 401 && path.indexOf("/auth/") !== 0) {
    logout(true);
    throw new Error("Your session has expired. Please log in again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.detail || data.message || "Request failed";
    if (Array.isArray(msg)) msg = msg.map(m => m.msg || JSON.stringify(m)).join(", ");
    throw new Error(msg);
  }
  return data;
}
