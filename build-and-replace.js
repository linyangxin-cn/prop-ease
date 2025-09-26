#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the config file path from command line arguments
const configArg = process.argv[2];
if (!configArg) {
  console.error('Usage: node build-and-replace.js <config-file>');
  console.error('Example: node build-and-replace.js configs/v1.config.js');
  process.exit(1);
}

// Load the configuration
const configPath = path.resolve(__dirname, configArg);
if (!fs.existsSync(configPath)) {
  console.error(`Configuration file not found: ${configPath}`);
  process.exit(1);
}

const config = require(configPath);
console.log(`Building with configuration: ${config.ENVIRONMENT_NAME}`);

// Set environment variables
process.env.REACT_APP_API_URL = config.REACT_APP_API_URL;
process.env.NODE_ENV = 'production';

console.log('Environment variables set:');
console.log(`  REACT_APP_API_URL: ${process.env.REACT_APP_API_URL}`);

// Build the React app
console.log('\n🔨 Building React app...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Function to recursively find and replace text in files
function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [oldText, newText] of Object.entries(replacements)) {
    if (content.includes(oldText) && oldText !== newText) {
      content = content.replace(new RegExp(escapeRegExp(oldText), 'g'), newText);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated: ${path.relative(__dirname, filePath)}`);
  }
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to recursively process directory
function processDirectory(dirPath, replacements, extensions = ['.js', '.css', '.html', '.json']) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      processDirectory(itemPath, replacements, extensions);
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        replaceInFile(itemPath, replacements);
      }
    }
  }
}

// Replace hardcoded URLs in built files
console.log('\n🔄 Replacing hardcoded URLs in built files...');
const buildDir = path.join(__dirname, 'build');

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Make sure the build completed successfully.');
  process.exit(1);
}

processDirectory(buildDir, config.URL_REPLACEMENTS);

// Generate environment-specific staticwebapp.config.json
console.log('\n📝 Generating staticwebapp.config.json...');
const staticWebAppConfig = {
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/api/*"]
  },
  "routes": [
    {
      "route": "/api/v1/*",
      "allowedRoles": ["anonymous", "authenticated"],
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      "rewrite": `https://${config.API_DOMAIN}{path}`,
      "headers": {
        "X-Forwarded-Host": config.APP_DOMAIN
      }
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  }
};

const configOutputPath = path.join(buildDir, 'staticwebapp.config.json');
fs.writeFileSync(configOutputPath, JSON.stringify(staticWebAppConfig, null, 2));
console.log(`  ✅ Generated: ${path.relative(__dirname, configOutputPath)}`);

console.log(`\n🎉 Build and replacement completed for ${config.ENVIRONMENT_NAME} environment!`);
console.log(`📁 Build output: ${buildDir}`);
console.log(`🌐 API Domain: ${config.API_DOMAIN}`);
console.log(`🌐 App Domain: ${config.APP_DOMAIN}`);
