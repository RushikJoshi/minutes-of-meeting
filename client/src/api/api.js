import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const { hostname } = window.location;
  // If we are on an IP address (like 10.125.183.132), use that IP for the backend too
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:5000`;
  }
  return "http://localhost:5000";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

const WS_KEY = "mom.workspaceId";

export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
}

export function setWorkspaceId(workspaceId) {
  if (workspaceId) {
    localStorage.setItem(WS_KEY, String(workspaceId));
  } else {
    localStorage.removeItem(WS_KEY);
  }
}

API.interceptors.request.use((config) => {
  const wsId = localStorage.getItem(WS_KEY);
  if (wsId) {
    // eslint-disable-next-line no-param-reassign
    config.headers["x-workspace-id"] = wsId;
  }
  return config;
});

// If the stored workspace id is stale (user has no access), clear it so the
// backend can fall back to the user's first membership on subsequent requests.
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || "");
    if (status === 403 && message.toLowerCase().includes("workspace")) {
      localStorage.removeItem(WS_KEY);
    }
    return Promise.reject(error);
  }
);

export default API;
