# AutoBot Configuration Guide

This guide helps you configure AutoBot for both development and production environments.

## 🔧 Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Required Variables

```bash
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (for development)
GMAIL_APP_PASSWORD=your_gmail_app_password_here
GMAIL_USER=your_email@gmail.com

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Database URL (if using external database)
DATABASE_URL=your_database_url_here
```

### Optional Variables

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Application Configuration
NEXT_PUBLIC_APP_NAME=AutoBot
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_TRACKING=true
NEXT_PUBLIC_ENABLE_FILE_STORAGE=true

# Rate Limiting
EMAIL_SEND_DELAY=2000
API_RATE_LIMIT=100
FILE_UPLOAD_LIMIT=10485760

# Security
NEXT_PUBLIC_CSP_NONCE=your_csp_nonce_here
NEXT_PUBLIC_HSTS_MAX_AGE=31536000
```

## 🔑 API Keys Setup

### 1. Google Gemini API

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to `NEXT_PUBLIC_GEMINI_API_KEY`

### 2. Gmail App Password

1. Enable 2-Step Verification on your Google Account
2. Go to Security → 2-Step Verification → App passwords
3. Select "Mail" and generate a password
4. Use the 16-character password in `GMAIL_APP_PASSWORD`

### 3. JWT Secret

Generate a secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use an online generator
# https://generate-secret.vercel.app/64
```

## 🌍 Environment-Specific Configuration

### Development

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Staging

```bash
# Set via Cloudflare Workers secrets
wrangler secret put NODE_ENV --env staging
wrangler secret put NEXT_PUBLIC_ENVIRONMENT --env staging
```

### Production

```bash
# Set via Cloudflare Workers secrets
wrangler secret put NODE_ENV --env production
wrangler secret put NEXT_PUBLIC_ENVIRONMENT --env production
```

## 🔒 Security Configuration

### Content Security Policy

The CSP in `wrangler.jsonc` allows:
- Self-hosted resources
- Google Gemini API (`https://generativelanguage.googleapis.com`)
- Gmail API (`https://gmail.googleapis.com`)
- Inline styles and scripts (required for Next.js)

### Security Headers

Configured headers provide:
- XSS protection (`X-Content-Type-Options: nosniff`)
- Clickjacking prevention (`X-Frame-Options: DENY`)
- Referrer policy (`Referrer-Policy: strict-origin-when-cross-origin`)
- Permissions policy (restricts camera, microphone, geolocation)

## 📊 Analytics Configuration

### Cloudflare Analytics Engine

1. Create analytics dataset:
   ```bash
   wrangler analytics-engine dataset create AUTOBOT_ANALYTICS
   ```

2. Configure in your application:
   ```typescript
   // Track email campaigns
   env.AUTOBOT_ANALYTICS.writeDataPoint({
     blobs: ['email_sent', contact.email, template.company],
     doubles: [1, campaignId],
     indexes: ['email_campaigns']
   });
   ```

## 🗄️ Storage Configuration

### KV Namespaces

Create KV namespaces for data storage:

```bash
# Create namespaces
wrangler kv:namespace create EMAIL_TEMPLATES
wrangler kv:namespace create USER_SESSIONS

# Note the IDs and update wrangler.jsonc
```

### R2 Buckets

Create R2 buckets for file storage:

```bash
# Create buckets
wrangler r2 bucket create autobot-resumes
wrangler r2 bucket create autobot-contacts
wrangler r2 bucket create autobot-resumes-preview
wrangler r2 bucket create autobot-contacts-preview
```

## 🔄 Rate Limiting

### Email Sending

Configure delays between emails:
```typescript
const EMAIL_SEND_DELAY = parseInt(process.env.EMAIL_SEND_DELAY || '2000');
await new Promise(resolve => setTimeout(resolve, EMAIL_SEND_DELAY));
```

### API Rate Limiting

Implement rate limiting for API endpoints:
```typescript
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT || '100')
};
```

## 🚨 Troubleshooting

### Common Configuration Issues

1. **API Key Not Working**
   - Verify the key is correct
   - Check API quota limits
   - Ensure the key has proper permissions

2. **Email Authentication Failed**
   - Use App Password, not regular password
   - Enable 2-Step Verification
   - Check Gmail account settings

3. **Environment Variables Not Loading**
   - Restart development server
   - Check file naming (`.env.local`)
   - Verify variable names

4. **Cloudflare Configuration Issues**
   - Check wrangler authentication
   - Verify account permissions
   - Review wrangler logs

### Validation Script

Create a validation script to check configuration:

```bash
#!/bin/bash
# validate-config.sh

echo "Validating AutoBot configuration..."

# Check required environment variables
required_vars=(
  "NEXT_PUBLIC_GEMINI_API_KEY"
  "GMAIL_APP_PASSWORD"
  "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo "✅ Configuration validation complete!"
```

## 📈 Performance Tuning

### Build Optimization

```bash
# Optimize build for production
NEXT_TELEMETRY_DISABLED=1 npm run build

# Analyze bundle size
npm install --save-dev @next/bundle-analyzer
```

### Runtime Optimization

```typescript
// Enable caching for API responses
export const runtime = 'edge';
export const revalidate = 3600; // 1 hour
```

## 🔄 Configuration Updates

### Adding New Features

1. Add environment variables to `.env.local`
2. Update `wrangler.jsonc` if needed
3. Set secrets for production
4. Update documentation

### Updating Secrets

```bash
# Update production secrets
wrangler secret put GEMINI_API_KEY --env production

# Update staging secrets
wrangler secret put GEMINI_API_KEY --env staging
```

## 📞 Support

For configuration issues:
1. Check this guide
2. Review Cloudflare documentation
3. Check project GitHub issues
4. Contact support team 