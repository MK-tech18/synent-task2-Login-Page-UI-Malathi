/* Demo-only authentication (front-end).
   For real projects, use a backend (PHP/.NET) + database + proper password hashing. */

const Auth = (() => {
  const USERS_KEY = "demo_users_v1";
  const SESSION_KEY = "demo_session_v1";

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function setMsg(el, text, type) {
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("ok", "err");
    if (type) el.classList.add(type);
  }

  function setSession(email) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, at: Date.now() }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function register(email, password, confirm) {
    const e = normalizeEmail(email);
    if (!e) return { ok: false, message: "Please enter a valid email." };
    if (!password || password.length < 6) return { ok: false, message: "Password must be at least 6 characters." };
    if (password !== confirm) return { ok: false, message: "Passwords do not match." };

    const users = loadUsers();
    if (users.some(u => u.email === e)) return { ok: false, message: "This email is already registered. Please login." };

    const passwordHash = await sha256(password);
    users.push({ email: e, passwordHash, createdAt: Date.now() });
    saveUsers(users);
    return { ok: true, message: "Registered successfully! Redirecting to login..." };
  }

  async function login(email, password) {
    const e = normalizeEmail(email);
    if (!e || !password) return { ok: false, message: "Please enter email and password." };

    const users = loadUsers();
    const user = users.find(u => u.email === e);
    if (!user) return { ok: false, message: "User not found. Please register first." };

    const passwordHash = await sha256(password);
    if (passwordHash !== user.passwordHash) return { ok: false, message: "Incorrect password." };

    setSession(e);
    return { ok: true, message: "Login successful! Redirecting..." };
  }

  function forgotPasswordAlert() {
    alert("Demo only: password reset needs backend/email service.\nFor now, please register again with a new email or clear browser storage.");
  }

  function guard() {
    const s = getSession();
    if (!s?.email) window.location.href = "index.html";
  }

  function currentUserEmail() {
    return getSession()?.email || "";
  }

  function logout() {
    clearSession();
    window.location.href = "index.html";
  }

  function registerPage() {
    const form = document.getElementById("registerForm");
    const msg = document.getElementById("regMsg");
    form?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      setMsg(msg, "", null);

      const email = document.getElementById("regEmail")?.value;
      const pass = document.getElementById("regPassword")?.value;
      const conf = document.getElementById("regConfirm")?.value;

      const res = await register(email, pass, conf);
      setMsg(msg, res.message, res.ok ? "ok" : "err");
      if (res.ok) setTimeout(() => (window.location.href = "index.html"), 900);
    });
  }

  function loginPage() {
    const form = document.getElementById("loginForm");
    const msg = document.getElementById("loginMsg");
    form?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      setMsg(msg, "", null);

      const email = document.getElementById("loginEmail")?.value;
      const pass = document.getElementById("loginPassword")?.value;

      const res = await login(email, pass);
      setMsg(msg, res.message, res.ok ? "ok" : "err");
      if (res.ok) setTimeout(() => (window.location.href = "dashboard.html"), 700);
    });
  }

  return {
    registerPage,
    loginPage,
    forgotPasswordAlert,
    guard,
    currentUserEmail,
    logout,
  };
})();

