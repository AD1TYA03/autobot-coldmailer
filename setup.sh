#!/bin/bash

# AutoBot Setup Script
# This script helps you set up AutoBot for deployment to Cloudflare Workers

set -e

echo "🚀 AutoBot Setup Script"
echo "========================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare..."
    wrangler login
fi

echo "✅ Wrangler CLI is ready"

# Create KV namespaces
echo "📦 Creating KV namespaces..."

echo "Creating EMAIL_TEMPLATES namespace..."
EMAIL_TEMPLATES_OUTPUT=$(wrangler kv:namespace create EMAIL_TEMPLATES 2>&1)
EMAIL_TEMPLATES_ID=$(echo "$EMAIL_TEMPLATES_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
echo "✅ EMAIL_TEMPLATES namespace created with ID: $EMAIL_TEMPLATES_ID"

echo "Creating USER_SESSIONS namespace..."
USER_SESSIONS_OUTPUT=$(wrangler kv:namespace create USER_SESSIONS 2>&1)
USER_SESSIONS_ID=$(echo "$USER_SESSIONS_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
echo "✅ USER_SESSIONS namespace created with ID: $USER_SESSIONS_ID"

# Create preview namespaces
echo "Creating preview namespaces..."
EMAIL_TEMPLATES_PREVIEW_OUTPUT=$(wrangler kv:namespace create EMAIL_TEMPLATES --preview 2>&1)
EMAIL_TEMPLATES_PREVIEW_ID=$(echo "$EMAIL_TEMPLATES_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

USER_SESSIONS_PREVIEW_OUTPUT=$(wrangler kv:namespace create USER_SESSIONS --preview 2>&1)
USER_SESSIONS_PREVIEW_ID=$(echo "$USER_SESSIONS_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

# Create R2 buckets
echo "🗄️ Creating R2 buckets..."

echo "Creating autobot-resumes bucket..."
wrangler r2 bucket create autobot-resumes
echo "✅ autobot-resumes bucket created"

echo "Creating autobot-contacts bucket..."
wrangler r2 bucket create autobot-contacts
echo "✅ autobot-contacts bucket created"

echo "Creating autobot-resumes-preview bucket..."
wrangler r2 bucket create autobot-resumes-preview
echo "✅ autobot-resumes-preview bucket created"

echo "Creating autobot-contacts-preview bucket..."
wrangler r2 bucket create autobot-contacts-preview
echo "✅ autobot-contacts-preview bucket created"

echo ""
echo "📋 Note: This configuration is optimized for Cloudflare Workers Free plan."
echo "   For advanced features (CPU limits, Analytics Engine), upgrade to a paid plan."

# Update wrangler.jsonc with the actual IDs
echo "📝 Updating wrangler.jsonc with actual IDs..."

# Create a backup
cp wrangler.jsonc wrangler.jsonc.backup

# Update the KV namespace IDs
sed -i.bak "s/your-kv-namespace-id-here/$EMAIL_TEMPLATES_ID/g" wrangler.jsonc
sed -i.bak "s/your-preview-kv-namespace-id-here/$EMAIL_TEMPLATES_PREVIEW_ID/g" wrangler.jsonc
sed -i.bak "s/your-sessions-kv-namespace-id-here/$USER_SESSIONS_ID/g" wrangler.jsonc
sed -i.bak "s/your-preview-sessions-kv-namespace-id-here/$USER_SESSIONS_PREVIEW_ID/g" wrangler.jsonc

echo "✅ wrangler.jsonc updated with actual IDs"

# Prompt for secrets
echo "🔐 Setting up secrets..."
echo "You'll need to provide the following secrets:"
echo ""

read -p "Enter your Gemini API Key: " GEMINI_API_KEY
read -s -p "Enter your Gmail App Password: " GMAIL_APP_PASSWORD
echo ""
read -s -p "Enter a JWT Secret (or press Enter to generate one): " JWT_SECRET
echo ""

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo "Generated JWT Secret: $JWT_SECRET"
fi

# Set secrets for production
echo "Setting production secrets..."
echo "$GEMINI_API_KEY" | wrangler secret put GEMINI_API_KEY --env production
echo "$GMAIL_APP_PASSWORD" | wrangler secret put GMAIL_APP_PASSWORD --env production
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env production

# Set secrets for staging
echo "Setting staging secrets..."
echo "$GEMINI_API_KEY" | wrangler secret put GEMINI_API_KEY --env staging
echo "$GMAIL_APP_PASSWORD" | wrangler secret put GMAIL_APP_PASSWORD --env staging
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env staging

echo "✅ Secrets configured for both environments"

# Test the configuration
echo "🧪 Testing configuration..."
if wrangler deploy --dry-run --env="" &> /dev/null; then
    echo "✅ Configuration test passed!"
else
    echo "❌ Configuration test failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your AutoBot is ready for deployment."
echo ""
echo "Next steps:"
echo "1. Update your domain in wrangler.jsonc (optional)"
echo "2. Deploy to staging: npm run deploy:staging"
echo "3. Deploy to production: npm run deploy:production"
echo ""
echo "Configuration summary:"
echo "- KV Namespaces: EMAIL_TEMPLATES ($EMAIL_TEMPLATES_ID), USER_SESSIONS ($USER_SESSIONS_ID)"
echo "- R2 Buckets: autobot-resumes, autobot-contacts (and preview versions)"
echo "- Secrets: Configured for both staging and production"
echo ""
echo "For more information, see DEPLOYMENT.md and CONFIGURATION.md" 