#!/bin/sh
# =============================================================================
# DOCKER ENTRYPOINT SCRIPT FOR FRONTEND
# =============================================================================
# This script handles runtime environment variable injection for the React app

set -e

# Function to replace environment variables in built files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Find all JS files in the build directory
    find /usr/share/nginx/html/static/js -name "*.js" -type f | while read -r file; do
        echo "Processing file: $file"
        
        # Replace environment variable placeholders with actual values
        if [ -n "$REACT_APP_API_URL" ]; then
            sed -i "s|REACT_APP_API_URL_PLACEHOLDER|$REACT_APP_API_URL|g" "$file"
        fi
        
        if [ -n "$REACT_APP_ENVIRONMENT" ]; then
            sed -i "s|REACT_APP_ENVIRONMENT_PLACEHOLDER|$REACT_APP_ENVIRONMENT|g" "$file"
        fi
        
        if [ -n "$REACT_APP_VERSION" ]; then
            sed -i "s|REACT_APP_VERSION_PLACEHOLDER|$REACT_APP_VERSION|g" "$file"
        fi
    done
    
    echo "Environment variable replacement completed."
}

# Function to create runtime configuration
create_runtime_config() {
    echo "Creating runtime configuration..."
    
    cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
    REACT_APP_API_URL: '${REACT_APP_API_URL:-}',
    REACT_APP_ENVIRONMENT: '${REACT_APP_ENVIRONMENT:-development}',
    REACT_APP_VERSION: '${REACT_APP_VERSION:-unknown}'
};
EOF
    
    echo "Runtime configuration created."
}

# Main execution
main() {
    echo "Starting frontend container initialization..."
    
    # Log environment variables (excluding sensitive ones)
    echo "Environment: ${REACT_APP_ENVIRONMENT:-development}"
    echo "API URL: ${REACT_APP_API_URL:-not set}"
    echo "Version: ${REACT_APP_VERSION:-unknown}"
    
    # Create runtime configuration
    create_runtime_config
    
    # Replace environment variables in built files (if needed)
    # replace_env_vars
    
    echo "Frontend container initialization completed."
    
    # Execute the main command
    exec "$@"
}

# Run main function
main "$@"
