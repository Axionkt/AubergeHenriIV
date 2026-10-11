import axios from "axios";
import api from "./axios";

let refreshPromise: Promise<void> | null = null;

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

export function handleAuthFailure() {
  axios.post("/api/auth/logout", {}, { withCredentials: true }).catch(() => {});
  window.location.href = "/connexion";
}
