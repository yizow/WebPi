#!/bin/sh
echo 'Deploying WebPi update'

# Copy over nginx configuration files
sudo cp --backup ~/WebPi/nginx/nginx.conf /etc/nginx/nginx.conf

# Restart nginx service
sudo systemctl restart nginx.service

# Restart node.js service.
pm2 restart all

