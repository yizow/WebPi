# Target Audience

This document is aimed at an absolute beginner: I'm writing this for pre-college freshman me<sup>1</sup>, who chose to install Linux Mint instead of Ubuntu because 

> what the hell is Ubuntu, that doesn't have 'linux' in its name.

Expect judicious handholding.

<sup>1</sup> Did pre-college freshman me know `vim`? No, but he's gonna learn it this time, dammit.

# Initial Setup

1. Thanks to the unending mark of technological progress, headless mode via Ubuntu server is now a one step process: [simply flash an sd card](https://ubuntu.com/download/raspberry-pi).

    We'll want to tweak a few additional settinsg from the default to setup a proper account. ssh with the default credentials, both user/pass are `ubuntu`.

    1. Create our new user account and add it to the sudo group

          ```bash
          sudo adduser {your_username}
          sudo usermod -aG sudo username
          ```

    2. Sign out and sign back in using the account you just created.

    3. Remove default ubuntu user

          ```bash
          sudo userdel -r ubuntu
          ```

    4. Change device hostname to something you want by editing `/etc/hostname`. I named mine `webpi`.

2. I like modifying the `sudoers` file so I don't have to type `sudo` and password for the most common commands (like `apt update/upgrade`.  
Edit the file with `sudo visudo`, then append the following to it, BEFORE the `#include` directive. The specific path will be given by `which apt`

    ```bash
    {your_username} ALL=(ALL) NOPASSWD: /usr/bin/apt
    ```

3. Set your router to assign a static IP address to the Raspberry Pi. Most routers will identify devices by MAC address, and always assign that reserved IP address to the Pi. Reboot the Pi to get it to switch off it's DHCP assigned IP address.

    Everything from this point onwards was done using an ssh connection.

4. Update everything.

    ```bash
    apt update
    apt upgrade
    apt dist-upgrade
    ```

5. Install some helpful utilities

    1. vim: My preferred editor
    2. silversearcher-ag: Fancier grep
    3. tree: Fancy directory viewer

    ```bash
    apt install vim silversearcher-ag tree
    ```

6. The SD card I/O is usually the bottleneck, follow [this guide] to overclock(https://www.jeffgeerling.com/blog/2016/how-overclock-microsd-card-reader-on-raspberry-pi-3).

    1. On Ubuntu Server, the `config.txt` file to edit is `/boot/firmware/usercfg.txt`. You'll want to add the line `dtoverlay=sdhost,overclock_50=100` to it.

7. Install nginx.  

    ```bash
    apt install nginx
    ```

    After this, you can verify that nginx is working by navigating to localhost.  
    `curl 127.0.0.1` should give you the nginx welcome html page.

9. Use `nvm` to install `nodejs` and `npm`.

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
    ```

    Close and reopen the terminal to load nvm, then:

    ```bash
    nvm install node
    ```

    You can verify everything is working with:

    * `node --version`
    * `npm --version`


# Initializing a git repo

1. Change directory into the root of your project and execute `git init`

2. I'm going to use github to host. [This guide](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/) walks you through setting up your SSH key, and linking it to github.

3. 
    ```bash
    git remote add origin git@github.com:your_url
    git push -u origin master`
    ```

# Setting up nginx

Next we're going to setup nginx to load a specific configuration file from user space. Our end goal is to have all our webserver code hosted in an easily updatable github folder.

1. I will be putting my website files in `~/WebPi/www`. Replace the path in the following steps with wherever you decide to keep your files.

2. I will be putting my nginx configuration files in `~/WebPi/nginx`. We'll modify the original `nginx.conf` file to just `include` our custom one.

    You'll want to make a backup of the original `nginx.conf` file. This is just good practice before changing anything. You'll probably need `sudo` for some of these commands.

    ```bash
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.old
    ```

    Delete everything in `/etc/nginx/nginx/conf` and replace with:

    ```nginx
    include /home/$USER/WebPi/nginx/nginx.conf;
    ```
    * Replace `$USER` with your username.

3. Our minimal `nginx.conf` file:

    ```bash
    cd ~/WebPi/nginx
    vim nginx.conf
    ```

    ```nginx
    events{
    }

    http{
      server{
        listen 80;

        autoindex on;

        location / {
          root /home/$USER/WebPi/www;
        }
      }
    }
    ```

    * Replace `$USER` with your username.
    * `events` block is necessary, but we leave it empty.
    * `autoindex on` will serve an automatically generated index file when we navigate to localhost at `127.0.0.1`

4. To make sure autoindex works, let's create a simple html file for it to find.

    ```bash
    cd ~/WebPi
    mkdir www
    vim www/hello.world
    ```

    Contents of `hello.world`:
    ```html
    <html>
    <header><title>This is title</title></header>
    <body>
    Hello world
    </body>
    </html>
    ```


6. Lets restart the nginx server and see if it works!

    ```bash
    systemctl restart nginx.service
    ```

    You can check the timestamps of `sudo systemctl status nginx.service` to verify that your command took effect.

    Check your server, 1 of 2 ways.
      1. From the ssh terminal, `curl 127.0.0.1`. This will give you the html as text.
      2. From a separate computer on your local network (such as the one you are sshing _from_), navigate to the Raspberry Pi's IP address.


# Hello Node.js

Let's create a simple Node.js Hello World app. This will be executing javascript instead of loading a static `html` file.

```bash
vim ~/WebPi/www/hello_world.js
```

First, declare that we're going to use the http protocol
```node
var http = require("http");
```

Create a server to listen for requests. We'll listen on port 8081, since the default http port (80) is being used by nginx

```node
http.createServer(function (request, response) {
// Send the HTTP header
// HTTP Status: 200 : OK
// Content Type: text/plain
response.writeHead(200, {'Content-Type': 'text/plain'});

// Send the response body
response.end('Hello World. This is Node.js.\n');
}).listen(8081);
```

3. Test it out by executing `node hello_world.js`, and then navigating to `127.0.0.1:8081`


# Starting Node.js automatically

You may have noticed that running the `node hello_world.js` command will lock that terminal session until you kill the process; but, this will also bring down the node server. We're going to tell the Raspberry Pi to automatically run node on startup, similar to nginx.

We're going to make this easier on ourselves by using [PM2](https://github.com/Unitech/pm2)

```bash
npm install pm2 -g # Install
pm2 start hello_world.js # Start our application (forever)
pm2 startup # Start pm2 on boot
pm2 save # Save current process list to restore
```

Reboot and check that both `127.0.0.1` and `127.0.0.1:8081` are available.


# Nginx as reverse proxy for node.js

Next we're going to set up nginx as a reverse proxy for our node server. We want all http requests coming in on port 80 to first go through nginx, which can then decide to pass on the request to our node server.

Open up your nginx config file, and inside the `http` block, add a new `location` block:

```nginx
location /node {
  proxy_pass http://127.0.0.1:8081
}
```

Copy over the nginx config file and restart as above. You should now be able to access `hello_world.js` at `127.0.0.1/node`


# Setting up auto DNS updating

Your ISP has assigned you a public IP address that the world can use to reach you. However, unless you pay extra money, that public IP can change at any moment. For the normal user, this isn't an issue; however, if you're trying to host a website, you will need to update the public DNS servers with your updated IP each time it changes. We're going to be using `ddclient` to automatically detect our public IP changing and update the DNS servers accordingly.

We'll be using the free DDNS (Dynamic DNS) service [dynu.com](https://www.dynu.com). Create an account; we'll use your credentials in the next step.

```bash
apt install ddclient
```

  1. When it asks for `service`, choose `other`, then enter in `api.dynu.com`
  2. When it asks for `protocol`, choose `dyndns2`
  3. Enter your account credentials when prompted.
  4. When it asks for `network interface`, enter in `eth0`
      * The interface name can be found with the command `ifconfig`. `ethX` usually represents an ethernet connection; the most consistent and reliable.
  5. By default, `ddclient` will be started on boot, and check for a changed IP once every 5 minutes.

We're going to use a webservice to get our public IP, because my Raspberry Pi is behind a router.

Edit the file `/etc/ddclient.conf`: replace
```
use=if
```
with
```
use=web
```

Test that it's working by running `sudo ddclient -query`.


# Change the public ssh port

Having a public accessible open port 22 is  generally bad as every hacker on the planet will try and get in. We're simply going to change it to be a different port.

(For fun, you can leave your device open for a few [days? weeks? hours? I don't know how active these haxx0r botnets are] and then inspect login attempts with `sudo grep "Failed password" /var/log/auth.log`. You can also attempt to "[trace them](https://whatismyipaddress.com/ip-lookup)".)

Edit the line `Port 22` in `/etc/ssh/sshd_config` to a different number greater than `1000`. (Ports `0`-`999` are reserved for OS things)

Restart the sshd service with `service sshd restart`

From now on, your ssh connection command will look like `ssh -p {port_you_chose} user@ip_address`


# Port Forwarding

If your Rasbperry Pi is sitting behind a router like mine is, you'll need to setup port forwarding. The exact procedures vary depending on the router, but you want to accomplish the following tasks:

1. Depending on how smart your router is, it _may_ be able to identify the Rasbperry Pi based on it's MAC address, and consistently assign it the same IP address and/or automatically update it's port forwarding rules. I prefer to avoid the hassle and just assign it a static IP, such as `10.0.0.201` or `192.168.0.201`. (Unfortunately, `314` is outside the allowed range of IP addresses so we can't use that)

    An interesting side note is that most ISP routers will refuse to follow a DNS response if the resulting IP is it's own public address. This means that anywhere _except_ in your home, you'll be able to access your Raspberry Pi website by going to `your_url.com`. However, this won't work on your home network! You'll have to navigate directly to the IP address assigned to the Raspberry Pi. Having a static IP here makes things much easier.

2. Forward port `80`. This is for http.

3. Forward the SSH port you chose above. This will allow you to remotely `ssh` in via `ssh -p your_port your_username@your_url.com`.


# Setting up automatic deployment

Instead of having to manually type a series of commands every time we want to deploy an update, we can Create a script that will do everything with a single command. Currently deployment is:

  1. restart nginx server
  2. restart node servers

  Create the file `~/WebPi/update.sh`

  ```bash
  #!/bin/bash
  # Above line is known as a 'shebang', and is used to tell Linux what program to execute this file with.

  echo 'Deploying WebPi update.'

  # Get git updates
  cd ~/WebPi
  git pull

  # Restart nginx service
  sudo /usr/bin/systemctl restart nginx.service

  # Restart node.js service.
  pm2 restart all
  ```

  Finally, mark the script executable.

  ```bash
  chmod +x ~/WebPi/update.sh
  ```

## Github Webhooks

Github can create webhooks to automatically notify us about changes made to our repo. We can leverage to automate deployment of any changes we make. 

1. Setup webhook for new github repo from [this guide](https://developer.github.com/webhooks/). We'll only be listening for push events.

2. Set the secret token on the Raspberry Pi by adding `export WEBPI_GITHUB_TOKEN="{your_token}"` to the end of your `~/.bashrc` file. You can have the changes take effect immediately by running `source ~/.bashrc`.

3. Configure nginx to forward these webhooks to a specific port (in this case, port `8082`). Add the following `location` block within the `server` block of `nginx.conf`.

```nginx
location /github_deploy {
  proxy_pass http://127.0.0.1:8082;
}
```

## npm and node_modules

The code below uses a package called `body` to cut down on code verboseness. Install from the root directory of your project (`~/WebPi`).

```bash
cd ~/WebPi
npm install body
```

This will create a new file `package-lock.json` and a new folder `node_modules`.

`package-lock.json` __SHOULD__ be checked into git. It helps maintain consistency across different installs.

`node_modules` __SHOULD NOT__ be checked into git. We'll tell `git` to ignore it automatically in the next section.

Confused? I was too. [This helped](https://nodejs.org/en/blog/npm/npm-1-0-global-vs-local-installation/).


## .gitignore

`git` looks in a file named `.gitignore` to decide what files or directories it should automatically ignore. Usually this is used to exclude binaries or local build logs that shouldn't be checked into version control. The `.gitignore` file(s) can exist in any folder in the git repo: any directives will be applied to the folder it is in, and any subfolders. This also means you can have multiple `.gitignore` files; those in subfolders will supersede those in higher level folders.

We'll tell `git` to ignore the `node_modules` folder by adding a file named `.gitignore` with these contents in the root directory of the repo:

`node_modules/`

Yep it's that simple.

If you use `vim`, you'll probably want to ignore the backup `.swp` files as well. Add:

`*.swp`

`*` is a wildcard that matches all strings. The above says `Ignore any file ending in .swp `

## Listening server

We want to create an http server listening on `8082` to process the request and the following operations:

1. Check that request is `POST`
2. Check `X-GitHub-Event` is push
3. Check `user-agent` prefixed with `GitHub-Hookshot/`
4. Check Github signature matches
5. Respond with `200` if successful, `403` otherwise
6. Spawn a child process to execute our update script


In a new file `~/www/auto_deploy.js`:

```node
var crypto = require('crypto');
var textBody = require('body');
var child_process = require ('child_process');

// Github webhooks
http.createServer(function (request, response) {
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
    return;
  });

  response.on('error', (err) => {
    console.error(err);
  });


  const { headers } = request;
  if (
    request.method === 'POST'
    && headers['x-github-event'] === 'push'
    && headers['user-agent'].startsWith('GitHub-Hookshot/')
  ) {
    textBody(request, response, function(err, payload_body) {
      var signature = Buffer.from(headers['x-hub-signature'], 'utf8');

      if (validate_github_webhook(signature, payload_body)) {
        console.log('Success');
        response.statusCode = 200;
        updateCounter++;
        updateCounter %= 1000;

        auto_update();
      } else {
        console.log('Failure');
        response.statusCode = 403;
      }

      response.setHeader('Content-Type', 'application/json');
      response.end();
    })
  } else {
    console.log('github_deploy not from github');
    response.statusCode = 403;
    response.end();
  }
}).listen(8082);


function validate_github_webhook(signature, payload_body) {
  console.log('Running validate function');

  var hmac = crypto.createHmac('sha1', process.env.WEBPI_GITHUB_TOKEN);
  hmac.update(payload_body);

  const digest = Buffer.from('sha1=' + hmac.digest('hex'), 'utf8');
  return crypto.timingSafeEqual(digest, signature);
}


function auto_update() {
  console.log('Auto-updating...');
  child_process.exec('UPDATE_SCRIPT_FULL_PATH', (err, stdout, stderr) => {
    if (err) {
      return;
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
```

Add to `PM2`

```bash
pm2 start auto_deploy.js
pm2 save
```

## Refining auto-deploy

We only want to automatically redeploy when we get a push event to the master branch. The GitHub webhook includes a `ref` field which is the name of the branch that was updated. We can check that it is the master branch by making sure it matches the string `refs/heads/master`. Update the following in the `validate_github_webhook` `if` block.

```node
const pushed_branch = JSON.parse(payload_body).ref;
console.log('Updated branch: ' + pushed_branch);
if (pushed_branch === 'refs/heads/master') {{
  response.statusCode = 200;

  auto_update();
} else {
  console.log('Not master branch. Ignoring.');
}
```

We also only want to update if we're on `master` branch. Prepend the following to `update.sh`.

```bash
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
```

And modify the `auto_deploy` function `child_process.exec` call to include the `-a` flag:

```node
child_process.exec('UPDATE_SCRIPT_FULL_PATH -a', (err, stdout, stderr) => {
```


## *Use debug instead of console.log*


## *VPN using Raspberry Pi*
