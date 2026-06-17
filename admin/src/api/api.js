import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Unga backend URL
});

// Request Interceptor: Yella request-kum token-ai add pannum
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;