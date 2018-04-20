#!/bin/sh
echo 'This is the update script.'

# Copy over nginx configuration files
sudo cp --backup ~/webserver/nginx/nginx.conf /etc/nginx/nginx.conf

# Restart nginx service
sudo systemctl restart nginx.service

# Restart node.js service.
pm2 restart all

