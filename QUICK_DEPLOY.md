# Quick Deploy Guide - Free Plan

This guide helps you quickly deploy AutoBot to Cloudflare Workers using the free plan.

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
- Cloudflare account (free)
- Gemini API key
- Gmail App Password

### 2. Setup
```bash
# Clone and install
git clone <your-repo>
cd AutoBot
npm install

# Run automated setup
./setup.sh
```

### 3. Deploy
```bash
# Deploy to production
npm run deploy:production

# Or deploy to staging first
npm run deploy:staging
```

## 📋 Free Plan Features

✅ **What's Included:**
- Basic Workers deployment
- 3 KV namespaces
- 1GB R2 storage
- Custom domains
- Basic analytics

❌ **What's Not Included:**
- CPU limits
- Analytics Engine datasets
- Advanced monitoring
- Priority support

## 🔧 Configuration

The current `wrangler.jsonc` is optimized for free plans:

```json
{
  "name": "autobot-cold-email-platform",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-01-27",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "placement": {
    "mode": "smart"
  },
  "minify": true
}
```

## 💰 Cost

**Free Plan**: $0/month
- 100,000 requests/day
- 10ms CPU time per request
- 3 KV namespaces
- 1GB R2 storage

## 🚨 Common Issues

### "CPU limits are not supported"
- ✅ **Fixed**: Removed CPU limits from configuration
- The app works fine without CPU limits

### "Analytics Engine not available"
- ✅ **Fixed**: Removed Analytics Engine from configuration
- Use Cloudflare dashboard for basic analytics

### "Storage limits exceeded"
- Free plan: 3 KV namespaces, 1GB R2
- Consider upgrading for more storage

## 🔄 Upgrading to Paid Plan

If you need advanced features:

1. **Upgrade at**: [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Cost**: $5/month
3. **Features**: CPU limits, Analytics Engine, higher limits

## 📞 Support

- **Free Plan**: Community support
- **Paid Plan**: Priority support
- **Documentation**: See `DEPLOYMENT.md` for full guide

## 🎯 Next Steps

After deployment:
1. Test your application
2. Set up custom domain (optional)
3. Monitor usage in Cloudflare dashboard
4. Consider upgrading if you need more features 