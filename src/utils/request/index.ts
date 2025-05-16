import axios from "axios";
import { message } from "antd";

const axiosBean = axios.create({
  // Always use the absolute URL for API calls
  baseURL: "https://api.propease.eu/api/v1",
  withCredentials: true, // Add this to ensure cookies are sent with cross-origin requests
});

axiosBean.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // Handle request error
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

axiosBean.interceptors.response.use(
  (response) => {
    const { data, message: msg, code } = response.data;

    if (code !== 0) {
      console.error("API error:", { code, message: msg });
      message.error(msg);
      if (code === 1002) {
        // 1001: token expired, redirect to login page
        // Use origin to ensure we don't append to /index.html
        window.location.href = window.location.origin + "/login";
      }
      return Promise.reject(new Error(msg || "Error"));
    }
    return data;
  },
  (error) => {
    // Handle response error
    console.error("Response error:", error);
    if (error.response) {
      console.error("Error details:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    message.error("The network is congested, please try again later!");
    return Promise.reject(error);
  }
);

export default axiosBean;
