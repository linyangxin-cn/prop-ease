// Configuration for v1.2 environment (new deployment)
module.exports = {
  // Environment variables
  REACT_APP_API_URL: "https://api-v1-2.propease.eu/api/v1",
  
  // Domain configurations
  API_DOMAIN: "api-v1-2.propease.eu",
  APP_DOMAIN: "app-v1-2.propease.eu",
  
  // Azure Storage configuration
  STORAGE_ACCOUNT: "webappstoragev1dot2",
  
  // Build-time replacements for hardcoded URLs
  URL_REPLACEMENTS: {
    "https://api.propease.eu/api/v1": "https://api-v1-2.propease.eu/api/v1",
    "https://api.propease.eu": "https://api-v1-2.propease.eu",
    "api.propease.eu": "api-v1-2.propease.eu",
    "app.propease.eu": "app-v1-2.propease.eu"
  },
  
  // Environment name for identification
  ENVIRONMENT_NAME: "v1-2"
};
