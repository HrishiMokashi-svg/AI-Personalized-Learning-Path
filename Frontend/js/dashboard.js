if (!getToken()) location.href = "index.html";

const view = document.getElementById("view");
const titles = {
  home: "Dashboard",
  profile: "Student Profile",
  skills: "Student Skill Form",
  recommendations: "Recommendations",
  path: "My AI Learning Path",
  courses: "Courses",
  videos: "Video Lectures",
  quiz: "Quiz",
  performance: "Performance",
  progress: "Progress",
  tutor: "AI Tutor (RAG)",
  settings: "Settings"
};

let charts = [];

function getStoredUser() {
  try {
    const raw = localStorage.getItem("learnai_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          id: parsed.id || 0,
          name: parsed.name || "Learner",
          email: parsed.email || "",
          profile: parsed.profile || {},
          joined: parsed.joined || new Date().toISOString()
        };
      }
    }
  } catch (e) {}
  return { id: 0, name: "Learner", email: "", profile: {}, joined: new Date().toISOString() };
}

let ME = getStoredUser();

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const loading = () => (view.innerHTML = '<div class="card"><span class="spinner"></span>Loading...</div>');
const showErr = (e, page = "home") => {
  view.innerHTML = `
    <div class="card" style="border-left:4px solid var(--red)">
      <h3 style="color:var(--red)">Connection Issue</h3>
      <p style="margin:8px 0;line-height:1.5">${esc(e.message || "Unable to reach the backend service.")}</p>
      <div class="row" style="margin-top:14px">
        <button class="btn sm" onclick="go('${page}')">Retry</button>
        <button class="btn sec sm" onclick="go('settings')">Configure Backend URL</button>
      </div>
    </div>`;
};

function flash(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

function destroyCharts() {
  charts.forEach(c => {
    try { c.destroy(); } catch (err) {}
  });
  charts = [];
}

const SETTINGS_PREFIX = "learnai_settings_";
const defaultSettings = {
  photo: "",
  studentId: "",
  notifications: { courses: true, quizzes: true, progress: true, recommendations: true },
  weeklyGoals: 5,
  studyHours: 1,
  targetDate: ""
};

function readSettings() {
  const userId = (ME && ME.id) ? ME.id : 0;
  const profileHours = (ME && ME.profile && ME.profile.hours_per_week) ? ME.profile.hours_per_week : defaultSettings.weeklyGoals;
  const saved = localStorage.getItem(SETTINGS_PREFIX + userId);
  if (!saved) {
    return {
      ...defaultSettings,
      weeklyGoals: profileHours,
      notifications: { ...defaultSettings.notifications }
    };
  }
  try {
    const parsed = JSON.parse(saved);
    return {
      ...defaultSettings,
      ...parsed,
      weeklyGoals: profileHours,
      notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) }
    };
  } catch (e) {
    return { ...defaultSettings, weeklyGoals: profileHours };
  }
}

function saveSettings(settings) {
  const userId = (ME && ME.id) ? ME.id : 0;
  localStorage.setItem(SETTINGS_PREFIX + userId, JSON.stringify(settings));
}

function settingField(label, id, value, type = "text", attrs = "") {
  return `<div class="setting-field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${attrs}></div>`;
}

function settingToggle(label, id, checked) {
  return `<label class="settings-toggle" for="${id}"><span>${label}</span><input id="${id}" type="checkbox" ${checked ? "checked" : ""}><span class="toggle-control" aria-hidden="true"></span></label>`;
}

function syllabusMarkup(course) {
  const syllabus = course.syllabus || [];
  if (!syllabus.length) return "";
  return `<details class="course-syllabus"><summary>View syllabus <span>${syllabus.length} modules</span></summary>
    <ol>${syllabus.map(module => `<li><strong>${esc(module.title)}</strong>
      <ul>${(module.topics || []).map(topic => `<li>${esc(topic)}</li>`).join("")}</ul></li>`).join("")}</ol>
  </details>`;
}

document.getElementById("nav").onclick = e => {
  const b = e.target.closest("button");
  if (b && b.dataset.page) go(b.dataset.page);
};

function getRoutePage() {
  const hash = (location.hash || "").replace(/^#\/?/, "").toLowerCase();
  if (hash && pages[hash]) return hash;
  return "home";
}

window.addEventListener("hashchange", () => {
  const target = getRoutePage();
  go(target, false);
});

async function go(page, updateHash = true) {
  const renderPage = pages[page];
  if (typeof renderPage !== "function") {
    page = "home";
  }
  if (updateHash && location.hash !== "#" + page) {
    if (history.pushState) {
      history.pushState(null, "", "#" + page);
    } else {
      location.hash = "#" + page;
    }
  }
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = titles[page] || "Dashboard";
  destroyCharts();
  loading();
  try {
    await pages[page]();
  } catch (e) {
    showErr(e, page);
  }
}

const pages = {
  async home() {
    const [d, me] = await Promise.all([api("/dashboard"), api("/me")]);
    ME = me;
    if (!ME.profile) ME.profile = {};
    localStorage.setItem("learnai_user", JSON.stringify(ME));
    const empty = !(me.profile.interests || me.profile.goal);
    view.innerHTML = `
      ${empty ? `<div class="card" style="margin-bottom:16px;border-left:4px solid var(--amber)"><b>Get started:</b> fill the <a href="#skills" onclick="go('skills');return false">Skill Form</a> so AI can build your learning path.</div>` : ""}
      <div class="grid g4">
        <div class="card stat"><div class="num">${d.enrolled}</div><div class="lbl">Courses enrolled</div></div>
        <div class="card stat"><div class="num">${d.overall_progress}%</div><div class="lbl">Overall progress</div></div>
        <div class="card stat"><div class="num">${d.quizzes}</div><div class="lbl">Quizzes taken</div></div>
        <div class="card stat"><div class="num">${d.avg_score}%</div><div class="lbl">Average quiz score</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <h3>Your learning path</h3>
          <p class="muted">${d.has_path ? "Your AI learning path is ready." : "No path yet. Generate one from your skill form."}</p>
          <br><button class="btn" onclick="go('path')">Open Learning Path</button>
        </div>
        <div class="card">
          <h3>Test yourself</h3>
          <p class="muted">Take a quick quiz to find your weak areas.</p>
          <br><button class="btn sec" onclick="go('quiz')">Start Quiz</button>
        </div>
      </div>`;
  },

  async recommendations() {
    const recs = await api("/recommendations");
    view.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <h3>AI-Powered Course Recommendations</h3>
        <p class="muted">Courses tailored to your interests, weaknesses, hobbies, and learning goals.</p>
      </div>
      ${recs.length ? `
      <div class="grid g3">${recs.map(c => `
        <div class="card">
          <div class="row space"><h3>${esc(c.title)}</h3></div>
          <span class="tag lvl">${esc(c.level)}</span><span class="tag">${esc(c.category)}</span><span class="tag">${c.duration_hours}h</span>
          ${c.score ? `<span class="tag" style="background:#dcfce7;color:#166534">★ Score: ${c.score}</span>` : ""}
          <p class="muted" style="margin:10px 0">${esc(c.description)}</p>
          ${c.reason ? `<div style="margin:8px 0;font-size:.85rem;color:var(--primary);background:#eef2ff;padding:6px 10px;border-radius:6px">💡 <b>Why:</b> ${esc(c.reason)}</div>` : ""}
          ${syllabusMarkup(c)}
          ${c.enrolled ? `<div class="bar"><div style="width:${c.progress}%"></div></div><span class="muted">${c.progress}% complete</span>`
            : `<button class="btn sm" onclick="enroll(${c.id}, 'recommendations')">Enroll</button>`}
        </div>`).join("")}
      </div>` : `<div class="card"><p class="muted">No course recommendations found yet. Fill out your <a href="#skills" onclick="go('skills');return false">Skill Form</a> to generate recommendations.</p></div>`}`;
  },

  async settings() {
    const settings = readSettings();
    const theme = applyTheme();
    const currentApiUrl = getApiUrl();
    view.innerHTML = `
      <div class="settings-page">
        <section class="card settings-card">
          <div class="settings-heading"><span>🔌</span><div><h2>Backend Connection</h2><p class="muted">Configure your FastAPI backend API URL for local and production use.</p></div></div>
          <div class="settings-fields">
            ${settingField("Backend API URL", "backendApiUrl", currentApiUrl, "url", 'placeholder="http://127.0.0.1:8000 or https://your-backend.onrender.com"')}
          </div>
          <div class="row settings-actions" style="margin-top:14px">
            <button class="btn" id="saveApiUrl">Save Backend URL</button>
            <button class="btn sec" id="testApiUrl">Test Connection</button>
            <span id="apiStatus" class="settings-status" role="status"></span>
          </div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>👤</span><div><h2>Account</h2><p class="muted">Edit your account details and student ID.</p></div></div>
          <div class="settings-account">
            <div class="settings-photo">
              <strong>Profile Photo</strong>
              <img id="settingsPhoto" class="${settings.photo ? "" : "hidden"}" src="${esc(settings.photo)}" alt="Profile photo">
              <span id="photoPlaceholder" class="${settings.photo ? "hidden" : ""}">${esc(((ME && ME.name) || "?").slice(0, 1).toUpperCase())}</span>
              <label class="btn sec sm" for="photoInput">Edit photo</label><input class="hidden" id="photoInput" type="file" accept="image/*">
            </div>
            <div class="settings-fields">
              ${settingField("Name", "accountName", (ME && ME.name) || "")}
              ${settingField("Email", "accountEmail", (ME && ME.email) || "", "email")}
              ${settingField("Student ID", "studentId", settings.studentId)}
            </div>
          </div>
          <div class="row settings-actions"><button class="btn" id="saveAccount">Save Account</button><span id="accountStatus" class="settings-status" role="status"></span></div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>🔔</span><div><h2>Notifications</h2><p class="muted">Choose which reminders you prefer.</p></div></div>
          <div class="settings-options">
            ${settingToggle("Course reminders", "notifyCourses", settings.notifications.courses)}
            ${settingToggle("Quiz reminders", "notifyQuizzes", settings.notifications.quizzes)}
            ${settingToggle("Progress updates", "notifyProgress", settings.notifications.progress)}
            ${settingToggle("AI recommendations", "notifyRecommendations", settings.notifications.recommendations)}
          </div>
          <p class="muted settings-note">Reminder options are saved as preferences. This app does not send notifications yet.</p>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>🌐</span><div><h2>Language</h2><p class="muted">The dashboard interface updates when you change this setting.</p></div></div>
          <div class="settings-row"><label for="languageSelect">Language</label><select id="languageSelect">
            <option value="en" ${getLanguage() === "en" ? "selected" : ""}>English</option>
            <option value="mr" ${getLanguage() === "mr" ? "selected" : ""}>Marathi</option>
            <option value="hi" ${getLanguage() === "hi" ? "selected" : ""}>Hindi</option>
          </select></div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>🎨</span><div><h2>Appearance</h2><p class="muted">Choose light, dark, or system appearance.</p></div></div>
          <div class="settings-row"><label for="themeSelect">Theme</label><select id="themeSelect">
            <option value="light" ${theme === "light" ? "selected" : ""}>Light Mode</option>
            <option value="dark" ${theme === "dark" ? "selected" : ""}>Dark Mode</option>
            <option value="system" ${theme === "system" ? "selected" : ""}>System Default</option>
          </select></div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>🔐</span><div><h2>Privacy &amp; Security</h2><p class="muted">Manage your password and current login.</p></div></div>
          <form id="passwordForm" class="settings-fields">
            ${settingField("Current password", "currentPassword", "", "password", 'required autocomplete="current-password"')}
            ${settingField("New password", "newPassword", "", "password", 'required minlength="6" autocomplete="new-password"')}
            <div class="setting-field settings-field-action"><label>&nbsp;</label><button class="btn" type="submit">Change Password</button></div>
          </form>
          <p id="passwordStatus" class="settings-status" role="status"></p>
          <div class="settings-row"><div><strong>Login Sessions</strong><p class="muted">Only the current browser session can be signed out here.</p></div><button class="btn sec" id="logoutDevice">Sign out this device</button></div>
          <div class="settings-row privacy-copy"><div><strong>Data Privacy</strong><p class="muted">Your learning data is stored by LearnAI to provide courses, progress tracking, quizzes, and personalized recommendations.</p></div></div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>📊</span><div><h2>Progress Settings</h2><p class="muted">Set your study targets.</p></div></div>
          <div class="settings-fields settings-fields-three">
            ${settingField("Weekly goals (hours)", "weeklyGoals", settings.weeklyGoals, "number", 'min="1" max="168" required')}
            ${settingField("Study hours/day", "studyHours", settings.studyHours, "number", 'min="1" max="24" required')}
            ${settingField("Target completion date", "targetDate", settings.targetDate, "date")}
          </div>
        </section>

        <section class="card settings-card">
          <div class="settings-heading"><span>🔄</span><div><h2>Reset</h2><p class="muted">Reset saved recommendations or learning preferences.</p></div></div>
          <div class="row"><button class="btn sec" id="resetRecommendations">Reset recommendations</button><button class="btn sec" id="resetPreferences">Reset learning preferences</button></div>
          <p id="resetStatus" class="settings-status" role="status"></p>
        </section>

        <section class="card settings-card settings-danger">
          <div class="settings-heading"><span>🚪</span><div><h2>Account Actions</h2><p class="muted">Sign out or permanently delete your account and learning records.</p></div></div>
          <div class="row"><button class="btn sec" id="logoutAccount">Logout</button>
            <input id="deletePassword" type="password" placeholder="Password to confirm deletion" autocomplete="current-password">
            <button class="btn danger-btn" id="deleteAccount">Delete Account</button></div>
          <p id="deleteStatus" class="settings-status" role="status"></p>
        </section>
        <div class="settings-footer"><p class="muted">Preferences saved in this browser. Weekly hours update your learning profile.</p><button class="btn" id="saveSettings">Save Settings</button></div>
        <p id="settingsStatus" class="settings-status" role="status" aria-live="polite"></p>
      </div>`;

    const formValue = id => document.getElementById(id).value.trim();
    const accountStatus = document.getElementById("accountStatus");
    const settingsStatus = document.getElementById("settingsStatus");
    const apiStatus = document.getElementById("apiStatus");

    document.getElementById("saveApiUrl").onclick = () => {
      const url = formValue("backendApiUrl");
      setApiUrl(url);
      flash(apiStatus, `Backend URL set to: ${getApiUrl() || "(default local)"}`);
      const notice = document.getElementById("apiNotice");
      if (notice) notice.style.display = getApiUrl() ? "none" : "block";
    };

    document.getElementById("testApiUrl").onclick = async () => {
      const btn = document.getElementById("testApiUrl");
      btn.disabled = true;
      flash(apiStatus, "Testing connection...");
      try {
        const testUrl = (formValue("backendApiUrl") || getApiUrl()).replace(/\/+$/, "");
        const res = await fetch(`${testUrl}/health`, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.status === "ok") {
          flash(apiStatus, "Connection successful! Backend is online.");
        } else {
          flash(apiStatus, `Backend returned HTTP ${res.status}`, false);
        }
      } catch (err) {
        flash(apiStatus, `Connection failed: ${err.message}`, false);
      } finally {
        btn.disabled = false;
      }
    };

    document.getElementById("saveAccount").onclick = async () => {
      const button = document.getElementById("saveAccount");
      button.disabled = true;
      try {
        const updated = await api("/account", "PUT", { name: formValue("accountName"), email: formValue("accountEmail") });
        ME = { ...ME, ...updated };
        const session = JSON.parse(localStorage.getItem("learnai_user") || "{}");
        localStorage.setItem("learnai_user", JSON.stringify({ ...session, ...updated }));
        document.getElementById("hello").textContent = "Hi, " + ME.name + " 👋";
        flash(accountStatus, "Account details updated.");
      } catch (error) {
        flash(accountStatus, error.message, false);
      } finally {
        button.disabled = false;
      }
    };

    document.getElementById("photoInput").onchange = event => {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        event.target.value = "";
        flash(settingsStatus, "Photo must be an image smaller than 2 MB.", false);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        settings.photo = reader.result;
        document.getElementById("settingsPhoto").src = settings.photo;
        document.getElementById("settingsPhoto").classList.remove("hidden");
        document.getElementById("photoPlaceholder").classList.add("hidden");
      };
      reader.onerror = () => flash(settingsStatus, "Could not read the selected photo.", false);
      reader.readAsDataURL(file);
    };

    document.getElementById("languageSelect").onchange = event => {
      try {
        settings.language = event.target.value;
        saveSettings(settings);
        setLanguage(event.target.value);
        go("settings");
      } catch (error) {
        flash(settingsStatus, error.message, false);
      }
    };

    document.getElementById("themeSelect").onchange = event => {
      try {
        setTheme(event.target.value);
        flash(settingsStatus, `${event.target.value === "system" ? "System" : event.target.value === "dark" ? "Dark" : "Light"} theme applied.`);
      } catch (error) {
        flash(settingsStatus, error.message, false);
      }
    };

    document.getElementById("passwordForm").onsubmit = async event => {
      event.preventDefault();
      const status = document.getElementById("passwordStatus");
      try {
        await api("/account/password", "PUT", {
          current_password: document.getElementById("currentPassword").value,
          new_password: document.getElementById("newPassword").value
        });
        event.target.reset();
        flash(status, "Password updated.");
      } catch (error) {
        flash(status, error.message, false);
      }
    };

    document.getElementById("logoutDevice").onclick = () => logout();
    document.getElementById("logoutAccount").onclick = () => logout();

    document.getElementById("resetRecommendations").onclick = async () => {
      const status = document.getElementById("resetStatus");
      if (!confirm("Reset your generated learning recommendations?")) return;
      try {
        await api("/learning-path", "DELETE");
        flash(status, "Recommendations reset.");
      } catch (error) {
        flash(status, error.message, false);
      }
    };

    document.getElementById("resetPreferences").onclick = async () => {
      const status = document.getElementById("resetStatus");
      if (!confirm("Reset your learning style and study preferences?")) return;
      try {
        const curProfile = (ME && ME.profile) ? ME.profile : {};
        await api("/profile", "PUT", { ...curProfile, learning_style: "", hours_per_week: 5 });
        ME.profile = { ...curProfile, learning_style: "", hours_per_week: 5 };
        settings.weeklyGoals = defaultSettings.weeklyGoals;
        settings.studyHours = defaultSettings.studyHours;
        settings.targetDate = defaultSettings.targetDate;
        saveSettings(settings);
        go("settings");
      } catch (error) {
        flash(status, error.message, false);
      }
    };

    document.getElementById("deleteAccount").onclick = async () => {
      const status = document.getElementById("deleteStatus");
      const password = document.getElementById("deletePassword").value;
      if (!password) {
        flash(status, "Enter your password to delete the account.", false);
        return;
      }
      if (!confirm("This permanently deletes your account, learning history, quiz results, and learning paths. Continue?")) return;
      try {
        await api("/account", "DELETE", { password });
        localStorage.removeItem(SETTINGS_PREFIX + (ME ? ME.id : 0));
        logout();
      } catch (error) {
        flash(status, error.message, false);
      }
    };

    document.getElementById("saveSettings").onclick = async () => {
      const button = document.getElementById("saveSettings");
      button.disabled = true;
      try {
        settings.studentId = formValue("studentId");
        settings.weeklyGoals = Number(formValue("weeklyGoals"));
        settings.studyHours = Number(formValue("studyHours"));
        settings.targetDate = formValue("targetDate");
        if (!Number.isInteger(settings.weeklyGoals) || settings.weeklyGoals < 1 || settings.weeklyGoals > 168) {
          throw new Error("Weekly goals must be between 1 and 168 hours.");
        }
        if (!Number.isInteger(settings.studyHours) || settings.studyHours < 1 || settings.studyHours > 24) {
          throw new Error("Study hours per day must be between 1 and 24.");
        }
        settings.notifications = {
          courses: document.getElementById("notifyCourses").checked,
          quizzes: document.getElementById("notifyQuizzes").checked,
          progress: document.getElementById("notifyProgress").checked,
          recommendations: document.getElementById("notifyRecommendations").checked
        };
        const curProfile = (ME && ME.profile) ? ME.profile : {};
        ME.profile = await api("/profile", "PUT", { ...curProfile, hours_per_week: settings.weeklyGoals });
        saveSettings(settings);
        flash(settingsStatus, "Changes saved.");
      } catch (error) {
        flash(settingsStatus, error.message, false);
      } finally {
        button.disabled = false;
      }
    };
  },

  async profile() {
    const me = await api("/me");
    ME = me;
    if (!ME.profile) ME.profile = {};
    const p = me.profile;
    const row = (k, v) => `<tr><th style="width:180px">${k}</th><td>${esc(v) || '<span class="muted">Not filled</span>'}</td></tr>`;
    const initial = esc(((me.name && me.name[0]) || "U").toUpperCase());
    const joinedDate = esc((me.joined || "").slice(0, 10));
    view.innerHTML = `
      <div class="card"><div class="row" style="gap:18px;margin-bottom:14px">
        <div class="avatar">${initial}</div>
        <div><h2>${esc(me.name)}</h2><div class="muted">${esc(me.email)}</div><div class="muted">Joined ${joinedDate}</div></div></div>
        <table>${row("Education", p.education_level)}${row("Goal", p.goal)}${row("Interests", p.interests)}${row("Strengths", p.strengths)}
        ${row("Weaknesses", p.weaknesses)}${row("Hobbies", p.hobbies)}${row("Learning style", p.learning_style)}${row("Hours / week", p.hours_per_week)}</table>
        <br><button class="btn" onclick="go('skills')">Edit in Skill Form</button></div>`;
  },

  async skills() {
    const me = await api("/me");
    ME = me;
    if (!ME.profile) ME.profile = {};
    const p = me.profile;
    view.innerHTML = `
      <div class="card"><p class="muted">Tell us about yourself. Separate multiple items with commas.</p>
      <div class="grid g2">
        <div><label>Education level</label><select id="f_edu">${["", "High school", "Diploma", "Undergraduate", "Postgraduate", "Working professional"].map(o => `<option ${o === p.education_level ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        <div><label>Learning style</label><select id="f_style">${["", "Visual", "Auditory", "Reading/Writing", "Hands-on (Kinesthetic)"].map(o => `<option ${o === p.learning_style ? "selected" : ""}>${o}</option>`).join("")}</select></div>
      </div>
      <label>Career / learning goal</label><input id="f_goal" value="${esc(p.goal)}" placeholder="e.g. Become a full-stack developer">
      <label>Interests</label><textarea id="f_int" rows="2" placeholder="e.g. AI, web development, data science">${esc(p.interests)}</textarea>
      <label>Strengths</label><textarea id="f_str" rows="2" placeholder="e.g. logical thinking, python, teamwork">${esc(p.strengths)}</textarea>
      <label>Weaknesses</label><textarea id="f_weak" rows="2" placeholder="e.g. mathematics, sql, time management">${esc(p.weaknesses)}</textarea>
      <label>Hobbies</label><textarea id="f_hob" rows="2" placeholder="e.g. gaming, drawing, cricket">${esc(p.hobbies)}</textarea>
      <label>Study hours per week</label><input id="f_hours" type="number" min="1" max="80" value="${p.hours_per_week || 5}">
      <div class="row" style="margin-top:18px"><button class="btn" id="saveBtn">Save</button><button class="btn sec" id="genBtn">Save &amp; Generate AI Learning Path</button></div>
      <div id="fmsg" class="msg"></div></div>`;

    const save = async () => {
      const g = id => document.getElementById(id).value;
      const updatedProfile = await api("/profile", "PUT", {
        education_level: g("f_edu"),
        goal: g("f_goal"),
        interests: g("f_int"),
        strengths: g("f_str"),
        weaknesses: g("f_weak"),
        hobbies: g("f_hob"),
        learning_style: g("f_style"),
        hours_per_week: parseInt(g("f_hours")) || 5
      });
      ME.profile = updatedProfile;
      localStorage.setItem("learnai_user", JSON.stringify(ME));
    };

    const msg = document.getElementById("fmsg");
    document.getElementById("saveBtn").onclick = async () => {
      try { await save(); flash(msg, "Saved successfully!"); }
      catch (e) { flash(msg, e.message, false); }
    };
    document.getElementById("genBtn").onclick = async () => {
      try {
        await save();
        go("path");
        setTimeout(() => {
          const r = document.getElementById("regen");
          if (r) r.click();
        }, 300);
      } catch (e) { flash(msg, e.message, false); }
    };
  },

  async path() {
    const path = await api("/learning-path");
    renderPath(path);
  },

  async courses() {
    const list = await api("/courses");
    view.innerHTML = `<div class="card" style="margin-bottom:16px"><h3>What are courses for?</h3>
      <p class="muted">Courses organize learning into topics, levels and estimated study time. Enroll to keep track of your learning progress.</p></div>
      <div class="grid g3">${list.map(c => `
      <div class="card"><div class="row space"><h3>${esc(c.title)}</h3></div>
      <span class="tag lvl">${esc(c.level)}</span><span class="tag">${esc(c.category)}</span><span class="tag">${c.duration_hours}h</span>
      <p class="muted" style="margin:10px 0">${esc(c.description)}</p>
      ${syllabusMarkup(c)}
      ${c.enrolled ? `<div class="bar"><div style="width:${c.progress}%"></div></div><span class="muted">${c.progress}% complete</span>`
        : `<button class="btn sm" onclick="enroll(${c.id}, 'courses')">Enroll</button>`}</div>`).join("")}</div>`;
  },

  async videos() {
    const list = await api("/courses");
    view.innerHTML = `<div class="card" style="margin-bottom:16px"><h3>Learn with video lectures</h3>
      <p class="muted">Choose a course to find video lectures on YouTube. Add your interests and learning goals in the Skill Form to personalize your learning path.</p></div>
      ${list.length ? `<div class="grid g3">${list.map(c => {
        const query = encodeURIComponent(`${c.title} ${c.category} course lecture`);
        return `<div class="card"><h3>${esc(c.title)}</h3><span class="tag lvl">${esc(c.level)}</span><span class="tag">${esc(c.category)}</span>
          <p class="muted" style="margin:10px 0">${esc(c.description)}</p>
          ${syllabusMarkup(c)}
          <a class="btn sm" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">Find video lectures</a></div>`;
      }).join("")}</div>` : `<div class="card">No courses are available yet.</div>`}`;
  },

  async quiz() {
    const topics = await api("/quiz/topics");
    view.innerHTML = `<div class="card"><h3>Choose a topic</h3><div class="row" style="margin-top:10px">
      ${topics.map(t => `<button class="btn sec" onclick="startQuiz('${esc(t)}')">${esc(t)}</button>`).join("")}</div></div><div id="quizArea" style="margin-top:16px"></div>`;
  },

  async performance() {
    const d = await api("/performance");
    if (!d.attempts) {
      view.innerHTML = `<div class="card">No quizzes taken yet. Take a quiz to see your performance.</div>`;
      return;
    }
    view.innerHTML = `
      <div class="grid g4"><div class="card stat"><div class="num">${d.average}%</div><div class="lbl">Average score</div></div>
      <div class="card stat"><div class="num">${d.attempts}</div><div class="lbl">Attempts</div></div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Score by topic</h3><canvas id="c1"></canvas></div>
        <div class="card"><h3>Score trend</h3><canvas id="c2"></canvas></div></div>
      <div class="card" style="margin-top:16px"><h3>History</h3><table><tr><th>Date</th><th>Topic</th><th>Score</th></tr>
      ${d.history.slice().reverse().map(h => `<tr><td>${esc(h.date)}</td><td>${esc(h.topic)}</td><td>${h.score}/${h.total} (${h.percent}%)</td></tr>`).join("")}</table></div>`;

    if (typeof Chart !== "undefined") {
      const c1El = document.getElementById("c1");
      const c2El = document.getElementById("c2");
      if (c1El) {
        charts.push(new Chart(c1El, {
          type: "bar",
          data: {
            labels: d.topics.map(t => t.topic),
            datasets: [{ label: "Average %", data: d.topics.map(t => t.average), backgroundColor: "#6366f1" }]
          },
          options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }
        }));
      }
      if (c2El) {
        charts.push(new Chart(c2El, {
          type: "line",
          data: {
            labels: d.history.map((h, i) => "#" + (i + 1)),
            datasets: [{ label: "Score %", data: d.history.map(h => h.percent), borderColor: "#10b981", tension: 0.3 }]
          },
          options: { scales: { y: { min: 0, max: 100 } } }
        }));
      }
    }
  },

  async progress() {
    const [d, dashboard] = await Promise.all([api("/progress"), api("/dashboard")]);
    if (!d.items.length) {
      view.innerHTML = `<div class="progress-empty">
        <div class="progress-empty-icon">✦</div><h2>Your learning journey starts here</h2>
        <p>Enroll in a course to see your progress, celebrate completions, and keep your learning on track.</p>
        <button class="btn" onclick="go('courses')">Explore courses</button>
      </div>`;
      return;
    }
    view.innerHTML = `
      <section class="progress-page-heading">
        <div><span class="progress-kicker">YOUR LEARNING OVERVIEW</span><h2>Student Progress</h2>
          <p>Track your learning journey and see how you are improving.</p></div>
        <button class="progress-add-course" onclick="go('courses')"><span aria-hidden="true">＋</span> Explore courses</button>
      </section>
      <section class="progress-summary" aria-label="Course summary">
        <div class="progress-summary-card enrolled-tile"><span class="summary-icon" aria-hidden="true">▤</span><div><span>Total Courses</span><strong>${d.items.length}</strong><small>Enrolled courses</small></div></div>
        <div class="progress-summary-card complete-tile"><span class="summary-icon" aria-hidden="true">✓</span><div><span>Completed</span><strong>${d.completed}</strong><small>Courses completed</small></div></div>
        <div class="progress-summary-card average-tile"><span class="summary-icon" aria-hidden="true">↗</span><div><span>Average Progress</span><strong>${d.overall}%</strong><small>Overall progress</small></div></div>
        <div class="progress-summary-card quiz-tile"><span class="summary-icon" aria-hidden="true">★</span><div><span>Total Quizzes</span><strong>${dashboard.quizzes}</strong><small>Quizzes attempted</small></div></div>
      </section>
      <section class="progress-table-card">
        <div class="progress-table-heading"><div><h3>Course progress</h3><p>Keep your momentum going—one lesson at a time.</p></div>
          <span class="progress-table-count">Showing <b>${d.items.length}</b> course${d.items.length === 1 ? "" : "s"}</span></div>
        <div class="progress-table-wrap"><table class="progress-table">
          <thead><tr><th>#</th><th>COURSE NAME</th><th>CATEGORY</th><th>PROGRESS</th><th>STATUS</th><th>EST. TIME</th><th>ACTIONS</th></tr></thead>
          <tbody>${d.items.map((i, index) => {
            const status = i.progress >= 100 ? "Completed" : i.progress > 0 ? "In progress" : "Not started";
            const statusClass = i.progress >= 100 ? "complete" : i.progress > 0 ? "active" : "waiting";
            const categoryClass = `category-${index % 6}`;
            return `<tr>
              <td class="progress-index" data-label="#">${index + 1}</td>
              <td data-label="COURSE NAME"><div class="progress-course"><span class="course-mark mark-${index % 5}">${esc((i.category || i.title).slice(0, 1).toUpperCase())}</span>
                <strong>${esc(i.title)}</strong></div></td>
              <td data-label="CATEGORY"><span class="progress-category ${categoryClass}">${esc(i.category || "Course")}</span></td>
              <td data-label="PROGRESS"><div class="progress-cell"><div class="progress-track"><span class="progress-fill ${statusClass}" style="width:${i.progress}%"></span></div><strong>${i.progress}%</strong></div></td>
              <td data-label="STATUS"><span class="progress-status ${statusClass}"><i></i>${status}</span></td>
              <td data-label="EST. TIME"><span class="progress-duration">${i.duration_hours} hrs</span></td>
              <td data-label="ACTIONS"><button class="progress-action" onclick="editProgress(${i.course_id}, ${i.progress})"><span aria-hidden="true">✎</span> Update</button></td>
            </tr>`;
          }).join("")}</tbody>
        </table></div>
        <div class="progress-table-footer"><span>Progress updates are saved to your learning record.</span><button onclick="go('performance')">View quiz performance <span aria-hidden="true">→</span></button></div>
      </section>`;
  },

  async tutor() {
    const userName = (ME && ME.name) ? ME.name : "Learner";
    view.innerHTML = `<div class="card"><p class="muted">Ask anything about learning, roadmaps, study tips. Answers use the knowledge base (RAG) plus AI.</p><br>
      <div class="chat-box" id="chat"><div class="bubble ai">Hi ${esc(userName)}! What would you like to learn today?</div></div>
      <div class="row"><input id="chatIn" placeholder="e.g. How do I start learning machine learning?" style="flex:1"><button class="btn" id="chatBtn">Send</button></div></div>`;
    const send = async () => {
      const inp = document.getElementById("chatIn"), box = document.getElementById("chat"), text = inp.value.trim();
      if (!text) return;
      box.innerHTML += `<div class="bubble me">${esc(text)}</div>`; inp.value = "";
      const wait = document.createElement("div"); wait.className = "bubble ai"; wait.innerHTML = '<span class="spinner"></span>Thinking...';
      box.appendChild(wait); box.scrollTop = box.scrollHeight;
      try {
        const r = await api("/chat", "POST", { message: text });
        const sourcesText = (r.sources && r.sources.length) ? "\n\n📎 Sources: " + r.sources.join(", ") : "";
        wait.textContent = r.answer + sourcesText;
      } catch (e) {
        wait.textContent = "⚠ " + e.message;
      }
      box.scrollTop = box.scrollHeight;
    };
    document.getElementById("chatBtn").onclick = send;
    document.getElementById("chatIn").onkeydown = e => { if (e.key === "Enter") send(); };
  }
};

function renderPath(path) {
  const weeks = path && path.weeks ? path.weeks : [];
  view.innerHTML = `
    <div class="card"><div class="row space"><div><h3>Personalized learning path</h3><p class="muted">Built by AI from your skill form, quiz results and the RAG knowledge base.</p></div>
    <button class="btn" id="regen">${path ? "Regenerate" : "Generate with AI"}</button></div><div id="pmsg" class="msg"></div></div>
    ${path ? `<div class="card" style="margin-top:16px">
      ${path.ai === false ? `<div class="msg err" style="display:block;margin-bottom:12px">AI unavailable (${esc(path.error || "")}). Showing a rule-based path. Check GOOGLE_API_KEY in backend/.env.</div>` : ""}
      <p style="margin-bottom:18px">${esc(path.summary)}</p>
      ${weeks.map(w => `<div class="week"><h4>Week ${esc(w.week)}: ${esc(w.title)}</h4>
        ${w.hours ? `<span class="tag">${esc(w.hours)} hrs</span>` : ""}
        <ul>${(w.goals || []).map(g => `<li>${esc(g)}</li>`).join("")}</ul>
        ${(w.resources || []).length ? `<div class="muted"><b>Resources:</b> ${(w.resources || []).map(esc).join(" • ")}</div>` : ""}
        ${w.practice ? `<div class="muted"><b>Practice:</b> ${esc(w.practice)}</div>` : ""}</div>`).join("")}
      ${(path.tips || []).length ? `<h4>Tips</h4><ul style="margin-left:18px">${path.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${(path.sources || []).length ? `<p class="muted" style="margin-top:12px">📎 Knowledge sources: ${path.sources.map(esc).join(", ")}</p>` : ""}
    </div>` : ""}`;

  document.getElementById("regen").onclick = async function () {
    this.disabled = true; this.innerHTML = '<span class="spinner"></span>AI is thinking...';
    try {
      renderPath(await api("/learning-path/generate", "POST"));
    } catch (e) {
      this.disabled = false;
      this.textContent = "Generate with AI";
      flash(document.getElementById("pmsg"), e.message, false);
    }
  };
}

async function enroll(id, page) {
  try {
    await api(`/courses/${id}/enroll`, "POST");
    go(page);
  } catch (e) {
    alert(e.message);
  }
}

async function setProgress(id, v) {
  try {
    await api(`/progress/${id}`, "PUT", { progress: parseInt(v) });
    go("progress");
  } catch (e) {
    alert(e.message);
  }
}

async function editProgress(id, current) {
  const value = prompt("Update course completion (0–100):", current);
  if (value === null) return;
  const progress = Number(value);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    alert("Enter a whole number from 0 to 100.");
    return;
  }
  await setProgress(id, progress);
}

async function startQuiz(topic) {
  const area = document.getElementById("quizArea");
  area.innerHTML = '<div class="card"><span class="spinner"></span>Loading...</div>';
  const qs = await api("/quiz/questions?topic=" + encodeURIComponent(topic));
  area.innerHTML = `<div class="card"><h3>${esc(topic)} Quiz</h3><br>${qs.map((q, i) => `
    <div class="quiz-q"><b>${i + 1}. ${esc(q.question)}</b>
    ${q.options.map((o, j) => `<label class="opt"><input type="radio" name="q${q.id}" value="${j}">${esc(o)}</label>`).join("")}</div>`).join("")}
    <button class="btn" id="qsub">Submit</button><div id="qres"></div></div>`;

  document.getElementById("qsub").onclick = async () => {
    const answers = qs.map(q => {
      const c = document.querySelector(`input[name="q${q.id}"]:checked`);
      return { question_id: q.id, selected: c ? parseInt(c.value) : -1 };
    });
    if (answers.some(a => a.selected < 0) && !confirm("Some questions are unanswered. Submit anyway?")) return;
    const r = await api("/quiz/submit", "POST", { topic, answers });
    document.getElementById("qsub").classList.add("hidden");
    const pct = r.total ? Math.round(100 * r.score / r.total) : 0;
    document.getElementById("qres").innerHTML = `<h3 style="margin:16px 0">Score: ${r.score}/${r.total} (${pct}%)</h3>` +
      r.details.map(d => `<div class="${d.correct ? "res-ok" : "res-bad"}"><b>${esc(d.question)}</b><br>
        ${d.correct ? "✔ Correct" : `✘ Your answer: ${esc(d.your_answer || "none")} — Correct: ${esc(d.right_answer)}`}<br><span class="muted">${esc(d.explanation)}</span></div>`).join("");
  };
}

(async () => {
  // Check backend configuration
  if (!getApiUrl() && !isLocalHost()) {
    const notice = document.getElementById("apiNotice");
    if (notice) notice.style.display = "block";
  }

  try {
    ME = await api("/me");
    if (!ME.profile) ME.profile = {};
    localStorage.setItem("learnai_user", JSON.stringify(ME));
    const hello = document.getElementById("hello");
    if (hello) hello.textContent = "Hi, " + ME.name + " 👋";
  } catch (e) {
    // If backend is not reached, use cached user profile
    ME = getStoredUser();
    const hello = document.getElementById("hello");
    if (hello && ME.name) hello.textContent = "Hi, " + ME.name + " 👋";
  }

  const initial = getRoutePage();
  go(initial, false);
})();
