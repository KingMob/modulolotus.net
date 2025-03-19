---
title: "Setting up Rails 4.0.0 with Nginx and Postgres on Digital Ocean"
pubDate: 2014-06-08
tags:
  - Ruby
  - Rails
  - Digital Ocean
description: "A comprehensive guide to setting up a Ruby on Rails 4.0.0 application with Nginx and PostgreSQL on a Digital Ocean droplet, covering user creation, Ruby installation via RVM, Nginx configuration, and database setup."
---

I decided to tackle learning Ruby on Rails recently. I've heard great stuff about both Ruby and Rails, and have been curious to check them out for a while. I had just the little project, too: a site to help you locate restaurants offering free drink refills. See, in NYC, restaurants won't just give you another coke; oh no, they want to charge you another $2.00 for the privilege. Admittedly, soda is horrendous for you, but once in a while, I get a craving for serious sugar.

## Step 1: Hosting

Where to host? I've used Heroku in the past, and while it's great for ease of deployment, their database offerings jump straight from free and restrictive to really expensive. A database with any in-memory cache starts at $50/month, which is more than I feel like paying for a toy project. I considered AWS, but my free tier is expiring soon, and on top of that, I prefer Postgres, which RDS doesn't support. Given that this will be a geolocation-based app, I thought Postgres's PostGIS features would be worth trying. A friend recommended <a href="http://www.digitalocean.com" target="_blank">Digital Ocean</a>, and the pricing seemed right, so I gave it a shot. A few clicks later, and I had a basic Rails app up.

## Step 2: Setup

First issue: The default Ruby is 1.9.1, and Rails is the older 3.2 version. I'm starting afresh, why learn old versions? Plus, it defaults to MySQL. Ugh, hose it. So, I started with a fresh Ubuntu 13.04 x64 install.

First, create a user for the webapp:

```bash
adduser my_rails_app
```

### Ruby

It appears that Ruby is out-of-date on Ubuntu 13.04, and gem is considered broken, so the community recommends rvm for installation and configuration. Thankfully, Digital Ocean has a pretty nice guide, that I was able to use with only a few alterations: <a href="http://www.digitalocean.com/community/articles/how-to-install-rails-and-nginx-with-passenger-on-ubuntu" target="_blank">http://www.digitalocean.com/community/articles/how-to-install-rails-and-nginx-with-passenger-on-ubuntu</a>.

First, download the latest rvm and add the root user to it:

```bash
curl -L https://get.rvm.io | bash -s stable
adduser root rvm
```

Logout, login to pick up the group changes. Next, use rvm and gem to download the latest Ruby-related packages:

```bash
rvm get stable
rvm requirements
rvm install 2.0.0
rvm use 2.0.0 --default
rvm rubygems current
gem install rails
gem install passenger&lt;/pre&gt;
aptitude install nodejs # Rails uses Javascript for asset-handling
```

### Nginx

Now, install a few dev packages necessary to build Nginx:

```bash
aptitude upgrade curl
aptitude install libcurl4-openssl-dev
```

The next step would typically be `rvmsudo passenger-install-nginx-module`, which downloads, builds, and configures Nginx, but unfortunately, on the smallest droplet instance (512 MB) it dies for lack of memory. You could temporarily resize the instance, or you can add virtual memory:

```bash
sudo dd if=/dev/zero of=/swap bs=1M count=1024
sudo mkswap /swap
sudo swapon /swap
```

Finally, install Nginx:

```bash
rvmsudo passenger-install-nginx-module
```

Unfortunately, this doesn't install the service scripts to start Nginx on Ubuntu 13.04, so run this:

```bash
# Download nginx startup script
wget -O init-deb.sh http://library.linode.com/assets/660-init-deb.sh

# Move the script to the init.d directory and make executable
mv init-deb.sh /etc/init.d/nginx
chmod +x /etc/init.d/nginx

# Add nginx to the system startup
/usr/sbin/update-rc.d -f nginx defaults
```

In /opt/nginx/conf/nginx.conf, set the user at the top to the webapp user (only appropriate for a one-app instance.)

Change

```
#user nobody;
```

to

```
user my_rails_app;
```

and add a server entry for the webapp:

```
server {
    listen 80;
    server_name www.example.com;
    root /var/www/my_rails_app/public; # <--- be sure to point to 'public'!
    passenger_enabled on;
}
```

Finally, restart Nginx with the new configuration:

```bash
/etc/init.d/nginx start
```

### Postgres

The default Postgres for Ubuntu 13.04 is 9.1, which is current enough for my purposes, so we can rely on the lovely apt package system. We also need the pg gem to set up the Rails app with Postgres support, and to add the same user as we did at the start for access.

```bash
aptitude install postgresql libpq-dev
gem install pg

su postgres -c 'createuser my_rails_app -dSR'
/etc/init.d/postgresql start
```

### Rails

At last, we're ready to create the Rails app! First, we setup a new directory to store webapps, then we create the app and transfer ownership to the webapp user created at the beginning. Then, we become the user, and use rake to setup the necessary databases.

```bash
mkdir -p /var/www/
cd /var/www/
rails new my_rails_app -d
chown -R my_rails_app.my_rails_app /var/www/my_rails_app
su - my_rails_app
cd /var/www/my_rails_app
rake db:create:all
rake db:migrate
exit
```

At this point, you should be able to run:

```bash
su - my_rails_app -c 'cd /var/www/my_rails_app && rails server'
```

and get the WEBrick server running successfully!
