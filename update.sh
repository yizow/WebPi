#!/bin/bash
# Above line is known as a 'shebang', and is used to tell Linux what program to execute this file with.

# If called with the -a flag (Autodeploy), only update if we're on master
while getopts ":m" opt; do
  case ${opt} in
    a )
      BRANCH=$(git rev-parse --abbrev-ref HEAD)
      if [[ "$BRANCH" != "master" ]]; then
        echo 'WebPi not on master, not updating';
        exit 1;
      fi
      ;;
  esac
done


echo 'Deploying WebPi update'

# Get git updates
cd ~/WebPi
git pull

# Restart nginx service
sudo /usr/bin/systemctl restart nginx.service

# Restart node.js service.
pm2 restart all
