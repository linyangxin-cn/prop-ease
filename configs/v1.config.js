// Configuration for v1 environment (current production)
module.exports = {
  // Environment variables
  REACT_APP_API_URL: "https://api.propease.eu/api/v1",
  
  // Domain configurations
  API_DOMAIN: "api.propease.eu",
  APP_DOMAIN: "app.propease.eu",
  
  // Azure Storage configuration
  STORAGE_ACCOUNT: "webappstorage20250511",
  
  // Build-time replacements for hardcoded URLs
  URL_REPLACEMENTS: {
    "https://api.propease.eu/api/v1": "https://api.propease.eu/api/v1",
    "https://api.propease.eu": "https://api.propease.eu",
    "api.propease.eu": "api.propease.eu",
    "app.propease.eu": "app.propease.eu"
  },
  
  // Environment name for identification
  ENVIRONMENT_NAME: "v1"
};
