import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
});

// ✅ Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const registerUser = (data) => api.post("/register", data);
const loginUser = (data) => api.post("/login", data);
const sendSecurityCode = (data) => api.post("/send-code", data);
const verifySecurityCode = (data) => api.post("/verify-code", data);
const resetPassword = (data) => api.post("/reset-password", data);
const verifyUser = () => api.get("/verify-user");
const logoutUser = () => api.post("/logout");

const AuthServices = {
  registerUser,
  loginUser,
  sendSecurityCode,
  verifySecurityCode,
  resetPassword,
  verifyUser,
  logoutUser
};

export default AuthServices;
