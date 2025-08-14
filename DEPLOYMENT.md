# AutoBot Deployment Guide

This guide covers the professional deployment of AutoBot to Cloudflare Workers with proper configuration, security, and monitoring.

## 🚀 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Domain**: A domain managed by Cloudflare (optional but recommended)
4. **API Keys**: Gemini API key and Gmail App Password

### 📋 Plan Requirements

**Free Plan Features:**
- ✅ Basic Workers deployment
- ✅ KV namespaces (up to 3)
- ✅ R2 buckets (up to 1GB storage)
- ✅ Basic analytics
- ✅ Custom domains

**Paid Plan Features (Recommended for Production):**
- ✅ CPU limits and performance optimization
- ✅ Analytics Engine datasets
- ✅ Advanced monitoring
- ✅ Higher KV and R2 limits
- ✅ Priority support

## 🔧 Initial Setup

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

### 2. Create KV Namespaces

```bash
# Create KV namespaces for email templates and user sessions
npm run kv:create EMAIL_TEMPLATES
npm run kv:create USER_SESSIONS

# Note the IDs and update wrangler.jsonc
```

### 3. Create R2 Buckets

```bash
# Create R2 buckets for file storage
npm run r2:create autobot-resumes
npm run r2:create autobot-contacts
npm run r2:create autobot-resumes-preview
npm run r2:create autobot-contacts-preview
```

### 4. Create Analytics Dataset (Paid Plan Only)

```bash
npm run analytics:create AUTOBOT_ANALYTICS
```

**Note**: Analytics Engine datasets require a paid Cloudflare plan. For free plans, basic analytics are available through the Cloudflare dashboard.

### 5. Set Environment Secrets

```bash
# Set production secrets
npm run secret:set GEMINI_API_KEY --env production
npm run secret:set GMAIL_APP_PASSWORD --env production
npm run secret:set JWT_SECRET --env production

# Set staging secrets
npm run secret:set GEMINI_API_KEY --env staging
npm run secret:set GMAIL_APP_PASSWORD --env staging
npm run secret:set JWT_SECRET --env staging
```

## 🌍 Environment Configuration

### Production Environment

```bash
# Deploy to production
npm run deploy:production

# View production logs
npm run tail --env production
```

### Staging Environment

```bash
# Deploy to staging
npm run deploy:staging

# View staging logs
npm run tail --env staging
```

## 🔒 Security Configuration

### 1. Update wrangler.jsonc

Replace placeholder values in `wrangler.jsonc`:

```json
{
  "kv_namespaces": [
    {
      "binding": "EMAIL_TEMPLATES",
      "id": "YOUR_ACTUAL_KV_ID",
      "preview_id": "YOUR_ACTUAL_PREVIEW_KV_ID"
    }
  ],
  "routes": [
    {
      "pattern": "autobot.yourdomain.com/*",
      "zone_name": "yourdomain.com"
    }
  ]
}
```

### 2. Security Configuration

The configuration includes:
- Smart placement for optimal routing
- Minification for better performance
- Environment-specific variables
- Proper asset handling

### 3. Performance Optimization

The configuration includes:
- Smart placement for optimal data center routing
- Minification for reduced bundle sizes
- Asset optimization

**Note**: CPU limits are available on paid plans only. The free plan configuration is optimized for basic performance.

## 📊 Monitoring & Analytics

### 1. Real-time Logs

```bash
# View real-time logs
npm run tail

# View specific environment logs
npm run tail --env production
```

### 2. Analytics Engine (Paid Plan Only)

Analytics Engine provides:
- Email campaign metrics
- User engagement tracking
- Performance monitoring

**Note**: For free plans, use basic Cloudflare analytics available in the dashboard.

### 3. Metrics Dashboard

Access metrics at:
- Cloudflare Dashboard → Workers & Pages → Your Worker → Metrics

## 🗄️ Data Storage

### KV Namespaces

- **EMAIL_TEMPLATES**: Store generated email templates
- **USER_SESSIONS**: Store user session data

### R2 Buckets

- **autobot-resumes**: Production resume storage
- **autobot-contacts**: Production contact storage
- **autobot-resumes-preview**: Staging resume storage
- **autobot-contacts-preview**: Staging contact storage

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
```

## 💳 Plan Limitations & Upgrading

### Free Plan Limitations

The current configuration is optimized for Cloudflare Workers Free plan:

- **CPU Limits**: Not available (removed from configuration)
- **Analytics Engine**: Not available (removed from configuration)
- **Advanced Services**: Limited to basic Workers functionality
- **Storage Limits**: 3 KV namespaces, 1GB R2 storage

### Upgrading to Paid Plan

To enable advanced features:

1. **Upgrade your Cloudflare plan** at [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Re-enable advanced features** in `wrangler.jsonc`:
   ```json
   {
     "limits": {
       "cpu_ms": 50
     },
     "analytics_engine_datasets": [
       {
         "binding": "AUTOBOT_ANALYTICS",
         "dataset": "AUTOBOT_ANALYTICS"
       }
     ]
   }
   ```
3. **Redeploy** your application

### Cost Optimization

- **Free Plan**: $0/month (limited features)
- **Paid Plan**: $5/month (full features)
- **Enterprise**: Custom pricing (advanced features)

## 🚨 Troubleshooting

### Common Issues

1. **KV Namespace Not Found**
   ```bash
   # Recreate KV namespace
   npm run kv:create EMAIL_TEMPLATES
   ```

2. **R2 Bucket Access Denied**
   ```bash
   # Check bucket permissions
   wrangler r2 bucket list
   ```

3. **Secret Not Found**
   ```bash
   # Re-set secrets
   npm run secret:set GEMINI_API_KEY --env production
   ```

4. **Build Failures**
   ```bash
   # Clear build cache
   rm -rf .next .open-next
   npm run build
   ```

### Performance Optimization

1. **Enable Smart Placement**
   - Already configured in wrangler.jsonc
   - Routes requests to optimal data centers

2. **CPU Limits**
   - Set to 50ms for optimal performance
   - Adjust based on your application needs

3. **Asset Optimization**
   - Minification enabled for scripts, styles, and HTML
   - Assets served from R2 for better performance

## 📈 Scaling Considerations

### Auto-scaling

Cloudflare Workers automatically scale based on:
- Request volume
- Geographic distribution
- Resource usage

### Rate Limiting

Implement rate limiting for:
- Email sending (2-second delays)
- API calls to Gemini
- File uploads

### Cost Optimization

Monitor usage at:
- Cloudflare Dashboard → Billing
- Set up usage alerts
- Optimize KV and R2 usage

## 🔄 Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Rotate Secrets**
   ```bash
   # Generate new secrets
   npm run secret:set JWT_SECRET --env production
   ```

3. **Monitor Logs**
   ```bash
   npm run tail --env production
   ```

4. **Backup Data**
   - Export KV data regularly
   - Backup R2 buckets
   - Monitor analytics data

## 📞 Support

For deployment issues:
1. Check Cloudflare Workers documentation
2. Review wrangler logs
3. Contact Cloudflare support
4. Check project GitHub issues

## 🎯 Next Steps

After deployment:
1. Set up custom domain
2. Configure SSL certificates
3. Set up monitoring alerts
4. Implement backup strategies
5. Plan for scaling 