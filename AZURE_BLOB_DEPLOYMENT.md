# Deploying to Azure Blob Storage

This document provides instructions for deploying the PropEase frontend application to Azure Blob Storage with Static Website hosting.

## Prerequisites

1. Azure account with an active subscription
2. Azure CLI installed locally
3. Node.js and npm installed

## Setup Azure Storage Account

1. Create a new Azure Storage Account:

```bash
az storage account create --name <storage-account-name> --resource-group <resource-group-name> --location <location> --sku Standard_LRS --kind StorageV2
```

2. Enable Static Website hosting:

```bash
az storage blob service-properties update --account-name <storage-account-name> --static-website --index-document index.html --404-document index.html
```

3. Get the primary endpoint URL:

```bash
az storage account show --name <storage-account-name> --query "primaryEndpoints.web" --output tsv
```

## Configure GitHub Actions for Deployment

1. Add the following secrets to your GitHub repository:
   - `AZURE_STORAGE_ACCOUNT_NAME`: Your Azure Storage account name
   - `AZURE_STORAGE_ACCOUNT_KEY`: Your Azure Storage account key
   - If using CDN:
     - `AZURE_CDN_PROFILE_NAME`: Your CDN profile name
     - `AZURE_CDN_ENDPOINT_NAME`: Your CDN endpoint name
     - `AZURE_RESOURCE_GROUP_NAME`: Your resource group name

2. The GitHub Actions workflow will automatically deploy your application to Azure Blob Storage when you push to the main branch.

## Manual Deployment

You can also deploy manually using the provided script:

1. Update the `deploy-to-azure-storage.sh` script with your storage account name
2. Make the script executable: `chmod +x deploy-to-azure-storage.sh`
3. Run the script: `./deploy-to-azure-storage.sh`

## Setting Up a Custom Domain (Optional)

1. Configure your custom domain in Azure:

```bash
az storage account update --name <storage-account-name> --resource-group <resource-group-name> --custom-domain <domain-name> --use-subdomain false
```

2. Update your DNS settings to point to the Azure Blob Storage endpoint

## Setting Up Azure CDN (Optional)

For better performance and HTTPS support with custom domains:

1. Create a CDN profile:

```bash
az cdn profile create --name <cdn-profile-name> --resource-group <resource-group-name> --sku Standard_Microsoft
```

2. Create a CDN endpoint:

```bash
az cdn endpoint create --name <cdn-endpoint-name> --profile-name <cdn-profile-name> --resource-group <resource-group-name> --origin <storage-account-web-endpoint> --origin-host-header <storage-account-web-endpoint-hostname> --enable-compression
```

3. Map your custom domain to the CDN endpoint:

```bash
az cdn custom-domain create --endpoint-name <cdn-endpoint-name> --hostname <custom-domain> --profile-name <cdn-profile-name> --resource-group <resource-group-name> --name <custom-domain-name>
```

4. Enable HTTPS for your custom domain:

```bash
az cdn custom-domain enable-https --endpoint-name <cdn-endpoint-name> --profile-name <cdn-profile-name> --resource-group <resource-group-name> --name <custom-domain-name>
```

## Handling Client-Side Routing

Azure Blob Storage doesn't natively support client-side routing for SPAs. There are two main approaches to handle this:

### Option 1: Create Route-Specific Files (Implemented in our scripts)

The deployment scripts now automatically create copies of `index.html` for each route in your application. This allows direct access to routes like `/login` or `/sign-up`.

If you add new routes to your application, update the `ROUTES` array in:
- `deploy-to-azure-storage.sh`
- `.github/workflows/azure-blob-storage-deploy.yml`

### Option 2: Use Azure CDN with URL Rewriting (Recommended for production)

For a more elegant solution:

1. Set up Azure CDN in front of your Blob Storage
2. Configure URL rewrite rules to redirect all requests to `index.html`

```bash
# Create a CDN profile
az cdn profile create --name <cdn-profile-name> --resource-group <resource-group-name> --sku Standard_Microsoft

# Create a CDN endpoint
az cdn endpoint create --name <cdn-endpoint-name> --profile-name <cdn-profile-name> --resource-group <resource-group-name> --origin <storage-account-web-endpoint> --origin-host-header <storage-account-web-endpoint-hostname>
```

Then configure URL rewrite rules through the Azure Portal:
- Go to your CDN endpoint > Rules engine > Add a rule
- If URL path does not contain a file extension
- Rewrite URL to /index.html

## Troubleshooting

- **CORS Issues**: Ensure your backend API allows requests from your Azure Blob Storage static website URL
- **Routing Issues**: If you encounter 404 errors on direct route access, make sure all your routes are included in the `ROUTES` array in the deployment scripts
- **Authentication Issues**: If using authentication, you may need to update your authentication flow to work with the new domain
- **Cache Issues**: If using CDN, you may need to purge the CDN cache after deployment
