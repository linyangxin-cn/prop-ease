import axios from "axios";
import { message } from "antd";

const axiosBean = axios.create({
  // baseURL: "https://fba1-58-49-211-176.ngrok-free.app",
  baseURL: "/api/v1",
  withCredentials: true, // Add this to ensure cookies are sent with cross-origin requests
});

axiosBean.interceptors.request.use(
  (config) => {
    // Add any request interceptors here
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      withCredentials: config.withCredentials,
      headers: config.headers,
      cookies: document.cookie
    });
    return config;
  },
  (error) => {
    // Handle request error
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosBean.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    const { data, message: msg, code } = response.data;

    if (code !== 0) {
      console.error('API error:', { code, message: msg });
      message.error(msg);
      if (code === 1002) {
        // 1001: token expired, redirect to login page
        window.location.href = "/login";
      }
      return Promise.reject(new Error(msg || "Error"));
    }
    return data;
  },
  (error) => {
    // Handle response error
    console.error('Response error:', error);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    message.error("The network is congested, please try again later!");
    return Promise.reject(error);
  }
);

export default axiosBean;
