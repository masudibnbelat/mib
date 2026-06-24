const TOKEN_KEY = "auth_token";

export interface TokenPayload {
  username: string;
  role: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

export function generateToken(username: string, role: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    username,
    role,
    iat: now,
    exp: now + 86400, // 24 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode("client_signed");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ✅ Event dispatcher for same-tab changes
function notifyTokenChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event("auth-token-change"));
  }
}

export function setToken(token: string): void {
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEY, token);
    notifyTokenChange(); // ✅ Notify AuthGuard
  }
}

export function getToken(): string | null {
  if (isBrowser()) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_KEY);
    notifyTokenChange(); // ✅ Notify AuthGuard
  }
}

export function decodeToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1])) as TokenPayload;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      removeToken(); // ✅ This will trigger notifyTokenChange
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return decodeToken() !== null;
}
