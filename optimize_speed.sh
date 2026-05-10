#!/bin/bash
# Speed-Boost Script for CrewCanvas
# CC-SPEED-001: Optimization Suite [Nelpatla Venkatesh]

echo "🚀 Starting Speed Optimization Suite..."

# 1. Update Nginx Configuration for Gzip Compression
echo "📦 Step 1: Enabling Gzip Compression in Nginx..."
NGINX_CONF="/etc/nginx/nginx.conf"

if [ -f "$NGINX_CONF" ]; then
    # Backup
    sudo cp $NGINX_CONF "${NGINX_CONF}.bak"
    
    # Enable Gzip settings if not already present
    sudo sed -i 's/gzip on;/gzip on; gzip_types text\/plain text\/css application\/json application\/javascript text\/xml application\/xml application\/xml+rss text\/javascript; gzip_comp_level 6; gzip_min_length 1000; gzip_proxied any;/g' $NGINX_CONF
    
    # Reload Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx Compression Enabled."
else
    echo "⚠️ Nginx config not found at $NGINX_CONF. Skipping Step 1."
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

echo "🎉 Speed Optimization Suite Completed! Please refresh your site."
