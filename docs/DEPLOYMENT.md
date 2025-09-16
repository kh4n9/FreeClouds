# 🚀 Free Clouds - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Free Clouds to various environments, from development to production. The application is designed to be deployed on Vercel but also supports Docker and traditional hosting platforms.

**Deployment Options:**
- 🌟 **Vercel** (Recommended) - One-click deployment with zero configuration
- 🐳 **Docker** - Containerized deployment for any platform
- 🖥️ **Traditional VPS** - Manual deployment on virtual private servers
- ☁️ **Cloud Platforms** - AWS, Google Cloud, Azure support

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher (or yarn 1.22+)
- **MongoDB**: 5.0 or higher
- **Memory**: Minimum 512MB RAM (1GB+ recommended)
- **Storage**: 1GB+ available space

### Required Services
- **MongoDB Database** - MongoDB Atlas (cloud) or self-hosted
- **Email Service** - Gmail SMTP or other email provider
- **File Storage** - Telegram Bot API (included)
- **Domain** - Custom domain for production (optional)

---

## 🌟 Vercel Deployment (Recommended)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hoangminhkhang/free-clouds)

### Manual Vercel Deployment

1. **Fork and Clone Repository**
   ```bash
   git clone https://github.com/hoangminhkhang/free-clouds.git
   cd free-clouds
   npm install
   ```

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   ```

3. **Configure Environment Variables**
   Create `.env.local` with required variables:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freeclouds

   # JWT Secret (generate: openssl rand -base64 32)
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password

   # Telegram Bot (for file storage)
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id

   # Application
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables in Vercel Dashboard**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure they're set for Production environment

6. **Configure Domain (Optional)**
   - In Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

### Vercel Configuration

Create `vercel.json` for advanced configuration:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

---

## 🐳 Docker Deployment

### Production Docker Setup

1. **Create Dockerfile**
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production && npm cache clean --force
   
   COPY . .
   RUN npm run build
   
   # Production stage
   FROM node:18-alpine AS runner
   
   WORKDIR /app
   
   # Create non-root user
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001
   
   # Copy built application
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"
   
   CMD ["node", "server.js"]
   ```

2. **Create Docker Compose**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=${MONGODB_URI}
         - JWT_SECRET=${JWT_SECRET}
         - EMAIL_USER=${EMAIL_USER}
         - EMAIL_PASS=${EMAIL_PASS}
         - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
         - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
         - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
       restart: unless-stopped
       depends_on:
         - mongodb
   
     mongodb:
       image: mongo:6.0
       ports:
         - "27017:27017"
       environment:
         - MONGO_INITDB_ROOT_USERNAME=admin
         - MONGO_INITDB_ROOT_PASSWORD=password
         - MONGO_INITDB_DATABASE=freeclouds
       volumes:
         - mongodb_data:/data/db
       restart: unless-stopped
   
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app
       restart: unless-stopped
   
   volumes:
     mongodb_data:
   ```

3. **Build and Run**
   ```bash
   # Create environment file
   cp .env.local.template .env
   # Edit .env with your values
   
   # Build and start services
   docker-compose up -d --build
   
   # View logs
   docker-compose logs -f app
   
   # Stop services
   docker-compose down
   ```

### Docker with External Database

For production with external MongoDB (MongoDB Atlas):

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/freeclouds
      # ... other environment variables
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

---

## 🖥️ Traditional VPS Deployment

### Ubuntu/Debian Setup

1. **Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install curl git nginx certbot python3-certbot-nginx -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs -y
   node --version  # Should be 18+
   npm --version
   ```

3. **Install MongoDB**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install mongodb-org -y
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/hoangminhkhang/free-clouds.git
   cd free-clouds
   
   # Install dependencies
   npm install
   
   # Create environment file
   cp .env.local.template .env.local
   # Edit with your configuration
   nano .env.local
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Create PM2 Ecosystem**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'free-clouds',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/free-clouds',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

7. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/freeclouds
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # File upload size limit
           client_max_body_size 100M;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   }
   ```

8. **Enable Site and SSL**
   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/freeclouds /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

---

## ☁️ Cloud Platform Deployment

### AWS Deployment

1. **Using AWS Amplify**
   ```bash
   # Install Amplify CLI
   npm install -g @aws-amplify/cli
   amplify configure
   
   # Initialize project
   amplify init
   amplify add hosting
   amplify publish
   ```

2. **Using AWS EC2**
   - Launch EC2 instance (Ubuntu 20.04 LTS)
   - Follow VPS deployment steps
   - Configure security groups for ports 80, 443
   - Use Amazon DocumentDB for MongoDB
   - Use Amazon SES for email service

3. **Using AWS ECS (Container)**
   ```yaml
   # docker-compose.aws.yml
   version: '3.8'
   services:
     app:
       image: your-repo/free-clouds:latest
       ports:
         - "3000:3000"
       environment:
         - MONGODB_URI=${MONGODB_URI}
         # ... other env vars
   ```

### Google Cloud Platform

1. **Using Cloud Run**
   ```bash
   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/PROJECT-ID/free-clouds
   
   # Deploy to Cloud Run
   gcloud run deploy --image gcr.io/PROJECT-ID/free-clouds --platform managed
   ```

2. **Using App Engine**
   ```yaml
   # app.yaml
   runtime: nodejs18
   
   env_variables:
     NODE_ENV: production
     MONGODB_URI: mongodb+srv://...
     JWT_SECRET: your-secret
   
   automatic_scaling:
     min_instances: 1
     max_instances: 10
   ```

### Microsoft Azure

1. **Using Azure Container Instances**
   ```bash
   # Create resource group
   az group create --name free-clouds-rg --location eastus
   
   # Deploy container
   az container create \
     --resource-group free-clouds-rg \
     --name free-clouds \
     --image your-repo/free-clouds:latest \
     --dns-name-label free-clouds \
     --ports 3000
   ```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/freeclouds  # Local
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/freeclouds  # Atlas

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Email Service (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password  # 16-character app password

# File Storage (Telegram Bot)
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
TELEGRAM_CHAT_ID=-1001234567890

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
SESSION_TIMEOUT=604800  # 7 days in seconds
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

### Environment Variable Sources

1. **Development**: `.env.local` file
2. **Vercel**: Dashboard environment variables
3. **Docker**: `.env` file or docker-compose environment
4. **VPS**: System environment variables or PM2 ecosystem
5. **Cloud**: Platform-specific environment configuration

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free account
   - Create new cluster

2. **Configure Database**
   ```bash
   # Database Name: freeclouds
   # Collections: users, files, folders, verificationcodes
   ```

3. **Setup Network Access**
   - Add IP addresses (0.0.0.0/0 for Vercel)
   - Create database user
   - Get connection string

4. **Create Indexes**
   ```javascript
   // Connect to MongoDB and run:
   
   // Users collection
   db.users.createIndex({ email: 1 }, { unique: true })
   db.users.createIndex({ createdAt: -1 })
   
   // Files collection
   db.files.createIndex({ userId: 1, createdAt: -1 })
   db.files.createIndex({ userId: 1, folderId: 1 })
   db.files.createIndex({ userId: 1, mime: 1 })
   db.files.createIndex({ name: "text", originalName: "text" })
   
   // Folders collection
   db.folders.createIndex({ userId: 1, parentId: 1 })
   db.folders.createIndex({ userId: 1, path: 1 })
   
   // Verification codes collection (TTL)
   db.verificationcodes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
   db.verificationcodes.createIndex({ email: 1, type: 1, used: 1 })
   ```

### Self-hosted MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo apt install mongodb-org
   
   # CentOS/RHEL
   sudo yum install mongodb-org
   
   # macOS
   brew install mongodb-community
   ```

2. **Configure MongoDB**
   ```yaml
   # /etc/mongod.conf
   storage:
     dbPath: /var/lib/mongodb
   
   systemLog:
     destination: file
     logAppend: true
     path: /var/log/mongodb/mongod.log
   
   net:
     port: 27017
     bindIp: 127.0.0.1
   
   security:
     authorization: enabled
   ```

3. **Create Database and User**
   ```javascript
   use freeclouds
   
   db.createUser({
     user: "freeclouds",
     pwd: "secure-password",
     roles: [
       { role: "readWrite", db: "freeclouds" }
     ]
   })
   ```

---

## 📧 Email Service Setup

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to Google Account Security
   - Enable 2-Step Verification

2. **Create App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Free Clouds"
   - Copy the 16-character password

3. **Configure Environment**
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  # 16-character app password
   ```

### Alternative Email Providers

1. **SendGrid**
   ```bash
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@your-domain.com
   ```

2. **Amazon SES**
   ```bash
   EMAIL_SERVICE=ses
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   EMAIL_FROM=noreply@your-domain.com
   ```

---

## 🤖 Telegram Bot Setup

1. **Create Bot**
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Use `/newbot` command
   - Follow instructions to create bot
   - Save the bot token

2. **Create Channel/Group**
   - Create a private channel or group
   - Add your bot as admin
   - Get chat ID using bot or tools

3. **Get Chat ID**
   ```bash
   # Method 1: Send message to bot, then:
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   
   # Method 2: Forward message from channel to @userinfobot
   ```

4. **Configure Environment**
   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
   TELEGRAM_CHAT_ID=-1001234567890
   ```

---

## 🚦 Health Checks & Monitoring

### Application Health Check

Create health check endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await connectToDatabase();
    
    // Check email service
    // Check file storage
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

### Monitoring Setup

1. **Uptime Monitoring**
   - Use UptimeRobot, Pingdom, or similar
   - Monitor `/api/health` endpoint
   - Set up alerts for downtime

2. **Performance Monitoring**
   ```javascript
   // Add to app/layout.tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

3. **Error Tracking**
   ```bash
   npm install @sentry/nextjs
   
   # Configure Sentry
   npx @sentry/wizard -i nextjs
   ```

---

## 🔐 SSL/TLS Configuration

### Automatic SSL (Vercel)
- Automatic SSL certificates
- Automatic renewals
- No configuration required

### Manual SSL (VPS)

1. **Using Certbot (Let's Encrypt)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d your-domain.com
   
   # Test renewal
   sudo certbot renew --dry-run
   
   # Auto-renewal cron job
   echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
   ```

2. **Using Custom SSL Certificate**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers off;
       
       # ... rest of configuration
   }
   ```

---

## 🚀 Performance Optimization

### Build Optimization

1. **Next.js Configuration**
   ```javascript
   // next.config.js
   const nextConfig = {
     output: 'standalone',
     compress: true,
     poweredByHeader: false,
     
     images: {
       domains: ['api.telegram.org'],
       formats: ['image/webp', 'image/avif'],
       minimumCacheTTL: 86400
     },
     
     experimental: {
       outputFileTracingRoot: path.join(__dirname, '../../')
     },
     
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.resolve.fallback.fs = false;
       }
       return config;
     }
   };
   ```

2. **Environment Optimization**
   ```bash
   # Production environment variables
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

### Caching Strategy

1. **Browser Caching**
   ```nginx
   # Static assets
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   
   # API responses
   location /api/ {
       add_header Cache-Control "no-cache, no-store, must-revalidate";
   }
   ```

2. **CDN Setup**
   - Vercel: Automatic global CDN
   - Cloudflare: Add as proxy
   - AWS CloudFront: Configure distribution

---

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Clear node modules
   rm -rf node_modules package-lock.json
   npm install
   
   # Check Node.js version
   node --version  # Should be 18+
   ```

2. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongosh "mongodb+srv://cluster.mongodb.net/" --username username
   
   # Check environment variables
   echo $MONGODB_URI
   
   # Verify IP whitelist in MongoDB Atlas
   ```

3. **Email Service Issues**
   ```bash
   # Test Gmail app password
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: { user: 'EMAIL_USER', pass: 'EMAIL_PASS' }
   });
   transporter.verify().then(console.log).catch(console.error);
   "
   ```

4. **File Upload Issues**
   ```bash
   # Check Telegram bot token
   curl https://api.telegram.org/bot<TOKEN>/getMe
   
   # Verify file size limits
   # Check network connectivity
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development
```

### Performance Issues

1. **Monitor Memory Usage**
   ```bash
   # PM2 monitoring
   pm2 monit
   
   # System monitoring
   htop
   ```

2. **Database Performance**
   ```javascript
   // Enable MongoDB slow query logging
   db.setProfilingLevel(2, { slowms: 100 });
   
   // Check query performance
   db.collection.explain("executionStats").find({});
   ```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Email service tested
- [ ] Telegram bot configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Build process tested locally

### Post-Deployment

- [ ] Application accessibility verified
- [ ] User registration tested
- [ ] File upload/download tested
- [ ] Email functionality tested
- [ ] Preview system tested
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security headers verified

### Production Checklist

- [ ] Environment set to production
- [ ] Debug mode disabled
- [ ] Error tracking configured
- [ ] Monitoring dashboard setup
- [ ] Regular backup schedule
- [ ] SSL certificate auto-renewal
- [ ] Security scan completed
- [ ] Load testing performed

---

## 📚 Additional Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)

### Tools
- [Vercel CLI](https://vercel.com/cli)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [PM2 Process Manager](https://pm2.keymetrics.io/)

### Monitoring
- [Vercel Analytics](https://vercel.com/analytics)
- [UptimeRobot](https://uptimerobot.com/)
- [Sentry Error Tracking](https://sentry.io/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)

---

## 🆘 Support

### Getting Help
- **Documentation**: Check this guide and other docs
- **GitHub Issues**: Report deployment issues
- **Community**: Join discussions and forums
- **Email Support**: Contact for deployment assistance

### Professional Services
- Custom deployment setup
- Performance optimization
- Security hardening
- Monitoring implementation
- Training and consultation

---

**Free Clouds Deployment Guide** - *Deploy with confidence*

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintainer**: Hoàng Minh Khang