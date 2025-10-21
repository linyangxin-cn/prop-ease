import axios from "axios";
import { message } from "antd";

// Request deduplication map to prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>();

const axiosBean = axios.create({
  // Use the environment-specific API URL
  baseURL: process.env.REACT_APP_API_URL || "https://api.propease.eu/api/v1",
  withCredentials: true, // Add this to ensure cookies are sent with cross-origin requests
  timeout: 30000, // 30 second default timeout - upload endpoints will override this
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

    let errorMessage = "The network is congested, please try again later!";

    if (error.response) {
      console.error("Error details:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // More specific error messages based on status code
      if (error.response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response.status === 403) {
        errorMessage = "Access denied. You don't have permission to perform this action.";
      } else if (error.response.status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (error.response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
    } else if (error.request) {
      // Network error (including CORS)
      console.error("Network error - no response received:", error.request);
      errorMessage = "Network error. Please check your connection and try again.";
    } else {
      // Something else happened
      console.error("Request setup error:", error.message);
      errorMessage = "Request failed. Please try again.";
    }

    message.error(errorMessage);
    return Promise.reject(error);
  }
);

export default axiosBean;
