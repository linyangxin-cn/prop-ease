#!/bin/bash

# Configuration
STORAGE_ACCOUNT_NAME="webappstorage20250511"
STORAGE_CONTAINER_NAME="$web"  # This is the default container for static websites
BUILD_FOLDER="./build"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
echo "Checking Azure login status..."
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Build the React app
echo "Building the React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

# Enable static website hosting
echo "Enabling static website hosting..."
az storage blob service-properties update --account-name $STORAGE_ACCOUNT_NAME --static-website --index-document index.html --404-document index.html

# az storage blob service-properties update --account-name webappstorage20250511 --static-website --index-document index.html --404-document index.html

# Create route-specific index.html files for client-side routing
echo "Creating route-specific index.html files for client-side routing..."
# List of routes that need direct access
ROUTES=("login" "sign-up" "property-detail")

for ROUTE in "${ROUTES[@]}"; do
    echo "Creating $ROUTE route..."
    mkdir -p $BUILD_FOLDER/$ROUTE
    cp $BUILD_FOLDER/index.html $BUILD_FOLDER/$ROUTE/index.html
done

# Upload files to Azure Storage
echo "Uploading files to Azure Storage..."
az storage blob upload-batch --account-name $STORAGE_ACCOUNT_NAME --source $BUILD_FOLDER --destination $STORAGE_CONTAINER_NAME --overwrite

# az storage blob upload-batch --account-name webappstorage20250511 --source ./build --destination \$web --overwrite

# Get the website URL
echo "Deployment completed successfully!"
WEBSITE_URL=$(az storage account show --name $STORAGE_ACCOUNT_NAME --query "primaryEndpoints.web" --output tsv)
echo "Your website is available at: $WEBSITE_URL"
