#!/bin/bash

# =============================================================================
# DEPLOY TO V1 ENVIRONMENT (Current Production)
# =============================================================================
# This script deploys the frontend to the current v1 production environment
# Storage Account: webappstorage20250511
# Backend: api.propease.eu
# Frontend: app.propease.eu

set -e  # Exit on any error

echo "🚀 Starting deployment to V1 environment..."
echo "📦 Storage Account: webappstorage20250511"
echo "🌐 Backend: api.propease.eu"
echo "🌐 Frontend: app.propease.eu"
echo ""

# Configuration
STORAGE_ACCOUNT_NAME="webappstorage20250511"
STORAGE_CONTAINER_NAME="\$web"  # This is the default container for static websites
BUILD_FOLDER="./build"
CONFIG_FILE="configs/v1.config.js"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
echo "🔐 Checking Azure login status..."
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi
echo "✅ Azure login verified"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Build the React app with environment-specific configuration
echo "🔨 Building React app for V1 environment..."
node build-and-replace.js "$CONFIG_FILE"
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Exiting."
    exit 1
fi

# Enable static website hosting
echo "🌐 Enabling static website hosting..."
az storage blob service-properties update \
    --account-name $STORAGE_ACCOUNT_NAME \
    --static-website \
    --index-document index.html \
    --404-document index.html

# Create route-specific index.html files for client-side routing
echo "🔗 Creating route-specific index.html files for client-side routing..."
ROUTES=("login" "sign-up" "property-detail")

for ROUTE in "${ROUTES[@]}"; do
    echo "  📁 Creating $ROUTE route..."
    mkdir -p $BUILD_FOLDER/$ROUTE
    cp $BUILD_FOLDER/index.html $BUILD_FOLDER/$ROUTE/index.html
done

# Upload files to Azure Storage
echo "📤 Uploading files to Azure Storage..."
az storage blob upload-batch \
    --account-name $STORAGE_ACCOUNT_NAME \
    --source $BUILD_FOLDER \
    --destination $STORAGE_CONTAINER_NAME \
    --overwrite

# Get the website URL
echo ""
echo "🎉 Deployment completed successfully!"
WEBSITE_URL=$(az storage account show --name $STORAGE_ACCOUNT_NAME --query "primaryEndpoints.web" --output tsv)
echo "🌐 Your website is available at: $WEBSITE_URL"
echo "🌐 Custom domain: https://app.propease.eu"
echo ""
echo "📋 Deployment Summary:"
echo "  Environment: V1 (Production)"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Backend API: https://api.propease.eu"
echo "  Frontend URL: https://app.propease.eu"
