import axios from "axios";
import { message } from "antd";

const axiosBean = axios.create({
  // baseURL: "https://fba1-58-49-211-176.ngrok-free.app",
  baseURL: "/api/v1",
});

axiosBean.interceptors.request.use(
  (config) => {
    // Add any request interceptors here
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

axiosBean.interceptors.response.use(
  (response) => {
    const { data, message: msg, code } = response.data;

    if (code !== 0) {
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
    message.error("The network is congested, please try again later!");
    return Promise.reject(error);
  }
);

export default axiosBean;
