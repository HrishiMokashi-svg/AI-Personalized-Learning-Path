// Backend URL - change if your backend runs elsewhere
const API_URL = "http://127.0.0.1:8001";

function getToken() { return localStorage.getItem("learnai_token"); }
function saveSession(data) {
  localStorage.setItem("learnai_token", data.token);
  localStorage.setItem("learnai_user", JSON.stringify(data.user));
}
function logout() {
  localStorage.removeItem("learnai_token");
  localStorage.removeItem("learnai_user");
  location.href = "index.html";
}

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const t = getToken();
  if (t) headers["Authorization"] = "Bearer " + t;
  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
  } catch (e) {
    throw new Error("Cannot reach the backend at " + API_URL + ". Is it running (start.bat)?");
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
