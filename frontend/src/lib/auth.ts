import axios from "axios";
import api from "./axios";

let refreshPromise: Promise<void> | null = null;

/**
 * Calls /auth/refresh, sharing one in-flight request between concurrent
 * callers so a burst of 401s triggers a single refresh.
 */
export async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** The session can't be recovered: clear cookies and send the user to login. */
export function handleAuthFailure() {
  axios.post("/api/auth/logout", {}, { withCredentials: true }).catch(() => {});
  window.location.href = "/connexion";
}
