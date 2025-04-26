import axios from "axios";

const axiosBean = axios.create({
  // baseURL: "https://fba1-58-49-211-176.ngrok-free.app",
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
    // Add any response interceptors here
    return response.data;
  },
  (error) => {
    // Handle response error
    return Promise.reject(error);
  }
);

export default axiosBean;
