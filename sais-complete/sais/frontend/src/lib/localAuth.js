/**
 * src/lib/localAuth.js
 * ─────────────────────
 * LocalStorage-based auth system for development.
 * Stores users and sessions entirely in localStorage.
 * Pre-seeds a dummy user on first load.
 */

const USERS_KEY = "sais_users";
const TOKEN_KEY = "sais_token";
const USER_KEY = "sais_user";

// ── Helpers ─────────────────────────────────────────────
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateToken() {
  return (
    "sais_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

// ── Seed dummy user on first load ───────────────────────
function ensureDummyUser() {
  const users = getUsers();
  if (users.length === 0) {
    users.push({
      id: 1,
      email: "demo@sais.edu",
      username: "demo",
      full_name: "Demo Student",
      password: "password123",
      created_at: new Date().toISOString(),
    });
    saveUsers(users);
  }
}

// Run seed immediately
ensureDummyUser();

// ── Public API (mirrors backend contract) ───────────────
export const localAuth = {
  /**
   * Register a new user.
   */
  register({ email, username, full_name, password }) {
    const users = getUsers();

    if (users.find((u) => u.email === email)) {
      throw {
        response: { status: 400, data: { detail: "Email already registered" } },
      };
    }
    if (users.find((u) => u.username === username)) {
      throw {
        response: { status: 400, data: { detail: "Username already taken" } },
      };
    }

    const newUser = {
      id: users.length + 1,
      email,
      username,
      full_name: full_name || username,
      password,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...safe } = newUser;
    return { data: safe };
  },

  /**
   * Login with email + password. Returns an access token.
   */
  login({ email, password }) {
    const users = getUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      throw {
        response: {
          status: 401,
          data: { detail: "Invalid email or password" },
        },
      };
    }

    const token = generateToken();
    localStorage.setItem(TOKEN_KEY, token);

    // Store the active user id with the token
    localStorage.setItem(
      "sais_session",
      JSON.stringify({ token, userId: user.id }),
    );

    const { password: _, ...safe } = user;
    return { data: { access_token: token, user: safe } };
  },

  /**
   * Get current authenticated user.
   */
  me() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw {
        response: { status: 401, data: { detail: "Not authenticated" } },
      };
    }

    let session;
    try {
      session = JSON.parse(localStorage.getItem("sais_session"));
    } catch {
      throw { response: { status: 401, data: { detail: "Invalid session" } } };
    }

    if (!session || session.token !== token) {
      throw { response: { status: 401, data: { detail: "Invalid session" } } };
    }

    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);

    if (!user) {
      throw { response: { status: 401, data: { detail: "User not found" } } };
    }

    const { password: _, ...safe } = user;
    return { data: safe };
  },

  /**
   * Logout: clear token and session data.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("sais_session");
  },
};
