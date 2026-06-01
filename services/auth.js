const { buildSupabaseHeaders, buildSupabaseUrl } = require("./supabase-config");

const authRequest = async (path, body) => {
  const response = await fetch(buildSupabaseUrl(path), {
    method: "POST",
    headers: buildSupabaseHeaders(null),
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.msg || payload?.error_description || payload?.error || "Supabase auth request failed";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const signUpWithPassword = async (email, password, metadata = {}) =>
  authRequest("/auth/v1/signup", {
    email,
    password,
    data: metadata,
  });

const signInWithPassword = async (email, password) =>
  authRequest("/auth/v1/token?grant_type=password", {
    email,
    password,
  });

const refreshSession = async (refreshToken) =>
  authRequest("/auth/v1/token?grant_type=refresh_token", {
    refresh_token: refreshToken,
  });

const signOut = async (accessToken) => {
  const response = await fetch(buildSupabaseUrl("/auth/v1/logout"), {
    method: "POST",
    headers: buildSupabaseHeaders(accessToken),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.message || payload?.error_description || payload?.error || "Failed to sign out";
    throw new Error(message);
  }

  return true;
};

const getUser = async (accessToken) => {
  const response = await fetch(buildSupabaseUrl("/auth/v1/user"), {
    method: "GET",
    headers: buildSupabaseHeaders(accessToken),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error_description || payload?.error || "Failed to load user";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

module.exports = {
  signUpWithPassword,
  signInWithPassword,
  refreshSession,
  signOut,
  getUser,
};
