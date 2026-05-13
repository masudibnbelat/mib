import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

const axiosPublic = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

axiosPublic.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      console.error("Server error:", error.response?.data?.message);
    }
    return Promise.reject(error);
  },
);

export default axiosPublic;
