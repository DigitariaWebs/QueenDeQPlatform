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

const API_BASE = '/api/auth';

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

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  let data: AuthResponse = { success: false, error: 'Unknown error' };
  try { data = await res.json(); } catch { data = { success: false, error: 'Invalid server response' }; }
  if (res.ok && data.user && data.token) {
    saveSession(data.user, data.token);
  }
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let data: AuthResponse = { success: false, error: 'Unknown error' };
  try { data = await res.json(); } catch { data = { success: false, error: 'Invalid server response' }; }
  if (res.ok && data.user && data.token) {
    saveSession(data.user, data.token);
  }
  return data;
}

// Google One Tap / button: pass the credential (ID token) to backend
export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  let data: AuthResponse = { success: false, error: 'Unknown error' };
  try { data = await res.json(); } catch { data = { success: false, error: 'Invalid server response' }; }
  if (res.ok && data.user && data.token) {
    saveSession(data.user, data.token);
  }
  return data;
}


