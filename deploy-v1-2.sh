#!/bin/bash

# =============================================================================
# DEPLOY TO V1.2 ENVIRONMENT (New Deployment)
# =============================================================================
# This script deploys the frontend to the new v1.2 environment
# Storage Account: webappstoragev1dot2
# Backend: api-v1-2.propease.eu
# Frontend: app-v1-2.propease.eu

set -e  # Exit on any error

echo "🚀 Starting deployment to V1.2 environment..."
echo "📦 Storage Account: webappstoragev1dot2"
echo "🌐 Backend: api-v1-2.propease.eu"
echo "🌐 Frontend: app-v1-2.propease.eu"
echo ""

# Configuration
STORAGE_ACCOUNT_NAME="webappstoragev1dot2"
STORAGE_CONTAINER_NAME="\$web"  # This is the default container for static websites
BUILD_FOLDER="./build"
CONFIG_FILE="configs/v1-2.config.js"

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
echo "🔨 Building React app for V1.2 environment..."
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
echo "🌐 Custom domain: https://app-v1-2.propease.eu"
echo ""
echo "📋 Deployment Summary:"
echo "  Environment: V1.2 (New)"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Backend API: https://api-v1-2.propease.eu"
echo "  Frontend URL: https://app-v1-2.propease.eu"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Configure Cloudflare DNS for app-v1-2.propease.eu"
echo "  2. Point the domain to: $WEBSITE_URL"
echo "  3. Set up SSL certificate in Cloudflare"
