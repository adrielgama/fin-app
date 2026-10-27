export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
export const MOCK_SESSION_VALUE = "mock-session";

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
}

export const MOCK_USER: SessionUser = {
  uid: "mock-user",
  email: "demo@fin-app.dev",
  name: "Usuário Demo",
  photoURL: null,
};
