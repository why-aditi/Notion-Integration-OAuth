import axios from "axios";

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Notion API methods
export const notionApi = {
  // Get OAuth URL
  getAuthUrl: (userId, frontendUrl) =>
    api.get("/auth/url", { params: { userId, frontendUrl } }),

  // Get user's Notion connections
  getConnections: (userId) =>
    api.get("/connections", { params: { userId } }),

  // Delete a Notion connection
  deleteConnection: (userId, connectionId) =>
    api.delete(`/connections/${connectionId}`, {
      params: { userId },
    }),

  // Exchange authorization code for tokens
  exchangeCode: (code, state) =>
    api.get("/callback", { params: { code, state } }),
};

export default api;
