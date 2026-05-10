#!/bin/bash
# Speed-Boost & Chat-Fix Script for CrewCanvas
# CC-OPTIMIZE-V2: Speed + WebSocket Fix [Nelpatla Venkatesh]

echo "🚀 Starting Full Optimization & Chat Fix..."

# 1. Update Nginx Configuration for Speed & WebSockets
echo "📦 Step 1: Configuring Nginx (Compression + WebSocket Support)..."
NGINX_CONF="/etc/nginx/nginx.conf"

if [ -f "$NGINX_CONF" ]; then
    # Backup
    sudo cp $NGINX_CONF "${NGINX_CONF}.bak"
    
    # 1a. Enable Gzip Compression
    sudo sed -i 's/gzip on;/gzip on; gzip_types text\/plain text\/css application\/json application\/javascript text\/xml application\/xml application\/xml+rss text\/javascript; gzip_comp_level 6; gzip_min_length 1000; gzip_proxied any;/g' $NGINX_CONF
    
    # 1b. Fix WebSocket Headers (Upgrade/Connection)
    # We look for the proxy_pass line and insert the headers before it
    sudo sed -i '/proxy_pass http:\/\/127.0.0.1:8081/i \        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;' $NGINX_CONF
    
    # Reload Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx Compression & Chat Fixed."
else
    echo "⚠️ Nginx config not found at $NGINX_CONF."
fi

# 2. Database Indexing for Speed
echo "📊 Step 2: Optimizing Database Indexes..."
mysql -u root -p -e "USE crewcanvas_db; 
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_user (user_id);
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_created (created_at);
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_date (date);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_role (role);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_location (location);"

echo "✅ Database Optimized."

echo "🎉 All Done! Speed is UP and Chat is FIXED. Refresh your site!"
