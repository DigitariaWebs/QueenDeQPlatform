export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  isPremium?: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  message?: string;
  details?: any;
}

const API_BASE = import.meta.env.PROD
  ? 'https://queen-de-q-platform-backend.vercel.app/api/auth'
  : '/api/auth';

function saveSession(user: AuthUser, token: string) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  window.dispatchEvent(new Event('auth:changed'));
}

export function getCurrentUser(): AuthUser | null {
  try {
    const json = localStorage.getItem('auth_user');
    return json ? (JSON.parse(json) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  // Optional: call backend logout
  fetch(`${API_BASE}/logout`, { method: 'POST' }).catch(() => {});
  window.dispatchEvent(new Event('auth:changed'));
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let data: AuthResponse = { success: false, error: "Unknown error" };

    if (!res.ok) {
      const text = await res.text();
      console.error(
        "Registration failed with status:",
        res.status,
        "Response:",
        text
      );
      data = { success: false, error: `Server error: ${res.status}` };
      return data;
    }

    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      const text = await res.text();
      console.error("Raw response:", text);
      data = { success: false, error: "Invalid server response format" };
    }

    if (res.ok && data.user && data.token) {
      saveSession(data.user, data.token);
    }
    return data;
  } catch (networkError) {
    console.error("Network error during registration:", networkError);
    return {
      success: false,
      error: "Network error - please check your connection",
    };
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data: AuthResponse = { success: false, error: "Unknown error" };

    // Check if response is ok before trying to parse JSON
    if (!res.ok) {
      const text = await res.text();
      console.error("Login failed with status:", res.status, "Response:", text);
      data = { success: false, error: `Server error: ${res.status}` };
      return data;
    }

    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      const text = await res.text();
      console.error("Raw response:", text);
      data = { success: false, error: "Invalid server response format" };
    }

    if (res.ok && data.user && data.token) {
      saveSession(data.user, data.token);
    }
    return data;
  } catch (networkError) {
    console.error("Network error during login:", networkError);
    return {
      success: false,
      error: "Network error - please check your connection",
    };
  }
}


