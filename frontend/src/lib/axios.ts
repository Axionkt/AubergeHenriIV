import axios from "axios";
import { refreshAccessToken, handleAuthFailure } from "./auth";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends both access and refresh token cookies
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const isAuthRoute = err.config?.url?.includes("/auth/");
    const is401 = err.response?.status === 401;
    if (!is401 || isAuthRoute || err.config?._retry) {
      return Promise.reject(err);
    }
    err.config._retry = true;

    try {
      await refreshAccessToken();
      return api.request(err.config);
    } catch {
      handleAuthFailure();
      return Promise.reject(err);
    }
  },
);

export default api;
