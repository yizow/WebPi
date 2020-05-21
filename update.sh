#!/bin/bash
# Above line is known as a 'shebang', and is used to tell Linux what program to execute this file with.

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo 'Aborting script';
  exit 1;
fi


echo 'Deploying WebPi update'

# Get git updates
cd ~/WebPi
git pull

# Restart nginx service
sudo /usr/bin/systemctl restart nginx.service

# Restart node.js service.
pm2 restart all
