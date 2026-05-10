#!/bin/bash
# Advanced Speed & WebSocket Fix for CrewCanvas
# TARGET: Custom nginx.conf with multiple server blocks

echo "🚀 Starting Full Optimization & Chat Fix..."

NGINX_CONF="/etc/nginx/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    echo "⚠️ Nginx config not found at $NGINX_CONF. Checking for other locations..."
    NGINX_CONF=$(sudo find /etc/nginx -name "*.conf" | head -n 1)
fi

echo "📦 Configuring Nginx at $NGINX_CONF..."

# 1. Backup
sudo cp $NGINX_CONF "${NGINX_CONF}.bak"

# 2. Enable Gzip in the http block if not already there
if ! grep -q "gzip on;" "$NGINX_CONF"; then
    sudo sed -i '/http {/a \    gzip on;\n    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;\n    gzip_comp_level 6;\n    gzip_min_length 1000;\n    gzip_proxied any;' $NGINX_CONF
fi

# 3. Add WebSocket Headers to ALL location / blocks
# We look for X-Real-IP and append the upgrade headers after it
sudo sed -i '/proxy_set_header X-Real-IP $remote_addr;/a \            proxy_set_header Upgrade $http_upgrade;\n            proxy_set_header Connection "upgrade";' $NGINX_CONF

# 4. Test and Reload Nginx
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx optimized and reloaded."
else
    echo "❌ Nginx test failed! Rolling back..."
    sudo cp "${NGINX_CONF}.bak" $NGINX_CONF
    sudo systemctl reload nginx
fi

# 5. Database Indexing
echo "📊 Ensuring Database Speed Indexes..."
# Password will be prompted
mysql -u root -p -e "USE crewcanvas_db; 
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_user (user_id);
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_created (created_at);
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_date (date);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_role (role);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_location (location);"

echo "✅ Database Optimized."
echo "🎉 Speed Optimization Completed! Refresh your site."
