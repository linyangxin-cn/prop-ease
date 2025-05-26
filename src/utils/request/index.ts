import axios from "axios";
import { message } from "antd";

// Request deduplication map to prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>();

const axiosBean = axios.create({
  // Use the environment-specific API URL
  baseURL: process.env.REACT_APP_API_URL || "https://api.propease.eu/api/v1",
  withCredentials: true, // Add this to ensure cookies are sent with cross-origin requests
});

// Function to generate a unique key for each request
const generateRequestKey = (config: any): string => {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.data || {})}_${JSON.stringify(config.params || {})}`;
};

// Override the request method to implement deduplication
const originalRequest = axiosBean.request;
axiosBean.request = function(config) {
  const requestKey = generateRequestKey(config);

  // Check if there's already a pending request with the same key
  if (pendingRequests.has(requestKey)) {
    console.log(`Deduplicating request: ${requestKey}`);
    return pendingRequests.get(requestKey)!;
  }

  // Create the request promise and store it
  const requestPromise = originalRequest.call(this, config)
    .finally(() => {
      // Clean up the pending request when it completes
      pendingRequests.delete(requestKey);
    });

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};

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
        setTimeout(() => {
          window.location.href = window.location.origin + "/login";
        }, 3000);
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
