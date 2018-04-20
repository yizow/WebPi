## Initial Setup

1. Setup Raspberry Pi 3 Model B using [this guide](https://ubuntu-mate.org/raspberry-pi/). Gave up on headless mode (couldn't get ssh to work even with adding the ssh file on boot partition).

2. Execute `raspi-config` and enable ssh.

3. Set your router to assign a static IP address to the Raspberry Pi. Most routers will identify devices by MAC address, and always assign that reserved IP address to the Pi. Reboot the Pi to get it to switch off it's DHCP assigned IP address.

    Everything from this point onwards was done using an ssh connection.

4. Update everything.
    1. `sudo apt-get update`
    2. `sudo apt-get upgrade`
    3. `sudo apt-get dist-upgrade`

5. Install tmux so you can preserve sessions across ssh logins (`sudo apt-get install tmux`)

6. Install vim `sudo apt-get install vim`

7. Install nginx `sudo apt-get install nginx`

8. And start it `sudo systemctl enable nginx`.
    * At this point you can verify that nginx is working by navigating to localhost
    * `curl 127.0.0.1` should give you the nginx welcome html page.

9. Install [nodejs](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
    1. `curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`
    2. `sudo apt-get install nodejs`
    3. You can verify everything is working with:
        * `node --version`
        * `npm --version`

## Setting up nginx

Next we're going to setup nginx to load a specific configuration file from user space. Our end goal is to have all out webserver code hosted in an easily updatable github folder.

1. I will be putting my website files in `~/webserver/www`. Replace the path in the following steps with wherever you decide to keep your files.

2. I will be putting my nginx configuration files in `~/webserver/nginx`. We will be copying the contents of this folder into `/etc/nginx/`. This requires sudo. Eventually we'll automate this with a script.

3. Let's create a minimal nginx configuration file.
    * `cd ~/webserver/nginx`
    * `vim nginx.conf`
    * In the `server_name` directive, replace with your host name.

            events{
            }

            http{
              server{
                listen 80;

                autoindex on;

                location / {
                  root /home/$USER/webserver/www;
                }
              }
            }
        * Replace `$USER` with your username.
        * `events` is necessary, but we leave it empty.
        * `autoindex on` will serve an automatically generated index file when we navigate to localhost at `127.0.0.1`

4. To make sure autoindex works, let's create a simple html file for it to find.
    * `cd ../`
    * `mkdir `www`
    * `cd www`
    * `vim hello.world`

            <html>
            <header><title>This is title</title></header>
            <body>
            Hello world
            </body>
            </html>


5. Finally lets copy over our new nginx configuration file.
    * You'll want to make a backup of the original nginx.conf file. This is just good practice before changing anything. You'll probably need `sudo` for some of these commands.
        * `sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.old`
    * `sudo cp nginx.conf /etc/nginx/`

6. Lets restart the nginx server and see if it works!
    * `sudo systemctl restart nginx.service`
        * You can check the timestamps of `sudo systemctl status nginx.service` to verify that your command took effect.
    * Check your server, 1 of 2 ways.
        * From the ssh terminal, `curl 127.0.0.1`. This will give you the html as text.
        * From a separate computer on your local network (such as the one you are sshing _from_), navigate to the Raspberry Pi's IP address.


## Hello Node.js

1. Let's create a simple Node.js Hello World app.

2. `vim hello_world.js`
    * Declare that we're going to use the http protocol
        * `var http = require("http");`
    * Create a server to listen for requests. Lets listen on port 8081, since the default http port (80) is being used by nginx

            http.createServer(function (request, response) {
               // Send the HTTP header 
               // HTTP Status: 200 : OK
               // Content Type: text/plain
               response.writeHead(200, {'Content-Type': 'text/plain'});

               // Send the response body
               response.end('Hello World. This is Node.js.\n');
            }).listen(8081);

3. Test it out by executing `node hello_world.js`, and then navigating to `127.0.0.1:8081`


## Starting Node.js automatically

1. You may have noticed that running the `node hello_world.js` command will lock that terminal session until you kill the process; but, this will also bring down the node server. We're going to tell the Raspberry Pi to automatically run node on startup, similar to nginx.

2. We're going to make this easier on ourselves by using [PM2](https://github.com/Unitech/pm2)
    1. Install
        * `sudo npm install pm2 -g`
    2. Start our application (forever)
        * `pm2 start hello_world.js`
    3. Start pm2 on boot
        * `pm2 startup`
    4. Save current process list to restore
        * `pm2 save`

3. Reboot and check that both `127.0.0.1` and `127.0.0.1:8081` are available.


## Nginx as reverse proxy for node.js

1. Next we're going to set up nginx as a reverse proxy for our node server. We want all http request coming in on port 80 to first go to nginx, which can then decide to pass on the request to our node server.

2. Open up your nginx config file, and inside the http block, add a new location block:

        location /node {
            proxy_pass http://127.0.0.1:8081
        }

3. Copy over the nginx config file and restart as above. You should now be able to access `hello_world.js` at `127.0.0.1/node`


## *Setting up automatic deployment*

1. Create a script that will do all our deployment things. Currently deployment is:
    * Copy over nginx scripts
    * restart nginx server
    * restart node server  
Don't forget to `chmod +x` the script to make it executable.
2. Modify sudoers file using `visudo` to allow our script to be run by the current user as sudo without requiring a password input. This will allow us to automatically run this script when we get a specific request (such as, for example, a github pull request webhook).
    1. Replace `$USER` with your username
    2. Add the following line to the end of the file after executing `visudo`
    3. `$USER ALL=(ALL) NOPASSWD: /absolute/path/to/script`


## Setting up auto DNS updating

1. Your ISP has assigned you a public IP address that the world can use to reach you. However, unless you pay extra money, that public IP can change at any moment. For the normal user, thiss isn't an issue; however, if you're trying to host a website, you will need to update the public DNS servers with your updated IP each time it changes. We're going to be using `ddclient` to automatically detect our public IP changing and update the DNS servers accordingly.

2. We'll be using the free DDNS service [dynu.com](dynu.com). Create an account; we'll use your credentials in the next step.

3. `sudo apt-get install ddclient`
    1. When it asks for service, choose other, then enter in `api.dynu.com`
    2. Enter your credentials from above when prompted.
    3. Follow the reset of the ddclient setup.
    4. By default, ddclient will be started on boot, and check for a changed IP once every 5 minutes.

4. We're going to use a webservice to get our public IP, because my Raspberry Pi is behind a router.
    1. `sudo vim /etc/ddclient.conf`
    2. Replace the line containg `use=if` with the following

            use=web

    3. Test that it's working by running `sudo ddclient -query`.


## Change the public ssh port

1. Having a public accessible open port 22 is  generally bad as every hacker on the planet will try and get in. We're simply going to change it to be a different port.

2. Edit the line `Port 22` is `/etc/ssh/sshd_config to a different number greater than 1000. (Ports 0-999 are reserved for OS things)

3. Restart the sshd service with `service sshd restart`

4. From now on, your ssh connection command will look like `ssh -p port_you_chose user@ip_address`


## Port Forwarding

If your Rasbperry Pi is sitting behind a router like mine is, you'll need to setup port forwarding. The exact procedures vary depending on the router, but you want to accomplish the following tasks:

1. Depending on how smart your router is, it _may_ be able to identify the Rasbperry Pi based on it's MAC address, and consistently assign it the same IP address and/or automatically update it's port forwarding rules. I prefer to avoid the hassle and just assign it a static IP, such as `10.0.0.201` or `192.168.0.201`. (Unfortunately, `314` is outside the allowed range of IP addresses so we can't use that)  
An interesting side note is that most ISP routers will refuse to follow a DNS response if the resulting IP is it's own public address. This means that anywhere _except_ in your home, you'll be able to access your Raspberry Pi website by going to `your_url.com`. However, this won't work on your home network! You'll have to navigate directly to the IP address assigned to the Raspberry Pi. Having a static IP here makes things much easier.

2. Forward the SSH port you chose above.

3. Forward port `80`. This is for http.


## Initializing a git repo

1. Change directory into the root of your project and execute `git init`

2. I'm going to use github to host. [This guide](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/) walks you through setting up your SSH key, and linking it to github.

3. `git remote add origin git@github.com:your_url
git push -u origin master`


## *Github Webhooks*
1. Setup webhook for new github repo.
2. Configure nginx to forward those webhooks to a particular port
3. Setup node.js using githubhook to listen for those requests
4. Spawn child process to execute `update.sh`


## *VPN using Raspberry Pi*
