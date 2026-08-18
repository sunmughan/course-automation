#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 CodeCraft Platform - Production Deployment for classroom.codeair.tech"
echo "=========================================================="

APP_DIR="/www/wwwroot/classroom.codeair.tech"
REPO_URL="https://github.com/sunmughan/course-automation.git"
PORT="3010"

# 1. Create target directory
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 2. Clone or pull repository
if [ ! -d ".git" ]; then
    echo "📦 Cloning repository..."
    git clone "$REPO_URL" .
else
    echo "🔄 Pulling latest master branch..."
    git reset --hard HEAD
    git pull origin master
fi

# 3. Setup production environment file
echo "⚙️ Configuring production environment..."
cat << 'EOF' > "$APP_DIR/platform/.env"
PORT=3010
DATABASE_URL="file:./prod.db"
NEXT_PUBLIC_APP_URL="https://classroom.codeair.tech"
NODE_ENV="production"
SMTP_HOST="127.0.0.1"
SMTP_PORT="587"
SMTP_USER="updates@codeair.tech"
SMTP_FROM="CodeCraft Classroom <updates@codeair.tech>"
JWT_SECRET="codecraft_prod_super_secure_jwt_secret_2026_classroom_vps"
EOF

# 4. Install dependencies and build
cd "$APP_DIR/platform"
echo "📦 Installing production dependencies..."
npm install --legacy-peer-deps

echo "🗄️ Initializing Prisma database..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🏗️ Building Next.js application..."
npm run build

# 5. Start / Restart with PM2
echo "⚡ Starting application with PM2 on port $PORT..."
pm2 delete classroom-codeair 2>/dev/null || true
pm2 start npm --name "classroom-codeair" -- start -- -p "$PORT"
pm2 save

# 6. Configure Nginx Virtual Host
echo "🌐 Configuring Nginx for classroom.codeair.tech..."
cat << 'EOF' > /www/server/panel/vhost/nginx/classroom.codeair.tech.conf
server {
    listen 80;
    listen 443 ssl http2;
    server_name classroom.codeair.tech;
    
    root /www/wwwroot/classroom.codeair.tech/platform/public;

    # SSL Configuration
    ssl_certificate /www/server/panel/vhost/cert/codeair.tech/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/codeair.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse Proxy to Next.js on Port 3010
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Forbidden files
    location ~ ^/(\..*|package\.json|package-lock\.json) {
        return 404;
    }

    access_log /www/wwwlogs/classroom.codeair.tech.log;
    error_log /www/wwwlogs/classroom.codeair.tech.error.log;
}
EOF

# 7. Reload Nginx
nginx -t && nginx -s reload

echo "=========================================================="
echo "✅ DEPLOYMENT COMPLETE! https://classroom.codeair.tech is LIVE"
echo "=========================================================="
