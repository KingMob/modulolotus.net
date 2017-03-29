{:title "Using Algo to setup the strongSwan VPN"
 :slug "setting-up-algo-strongswan"
 :layout :post
 :tags  ["vpn" "algo" "strongswan"]}

Recently, it was in the news that [Congress declined to prevent ISPs from requiring consumer opt-in before ~~spying on you~~ selling your browsing history to advertisers](https://www.washingtonpost.com/news/the-switch/wp/2017/03/28/the-house-just-voted-to-wipe-out-the-fccs-landmark-internet-privacy-protections/). Of course, the rule they're trying to kill hasn't even been applied yet, so ISPs do this currently *anyway*. Browser extensions like [HTTPS Everywhere](https://www.eff.org/https-everywhere) help, since with HTTPS, ISPs can only see what domains you connect to, but even that's a bit much.

The natural solution is a VPN. Tunnel all your traffic through another server, and there's nothing for an ISP or malicious coffee shop to spy on. There's no shortage of commercial VPNs offering their services, but all of them require that you trust them over your ISP. This might be reasonable, or it might not be. Personally, I already *had* a server set up for this website, so I decided to add a VPN to it.

I used [Algo](https://blog.trailofbits.com/2016/12/12/meet-algo-the-vpn-that-works/), since I'm not a strongSwan configuration expert, and it promised to get me up and running quickly. By default, it creates a brand-new server, which is simpler, but it supports existing servers, too, albeit with less support. What follows are the steps I took to make it work on an existing Ubuntu 16.10 server on Vultr. Hopefully this helps.

## Algo

Algo runs as a shell script which collects some info and then runs a series of Ansible playbooks. To get started, just run:

```shell
$ ./algo

  What provider would you like to use?
    1. DigitalOcean
    2. Amazon EC2
    3. Google Compute Engine
    4. Microsoft Azure
    5. Install to existing Ubuntu server

Enter the number of your desired provider
: 5

...
```
Select your options, and if all goes well, great! You can stop reading this post. (See [Algo's docs](https://github.com/trailofbits/algo) for more.)

## Problems I Encountered

### Root login is disabled

I disabled root login, and do everything through my personal user with `sudo`. However, Algo really expects to run as root. To fix this, open up the `ansible.cfg` file, and add the privilege escalation section:

```ini
[privilege_escalation]
become = True
become_user = root
become_ask_pass = True
```

If you allow root login, there should be no need for the above step.

### SSH connection errors

I added the server's SSH key to ssh-agent, but for some inexplicable reason, Algo couldn't connect. After trying half a dozen possibilities, the culprit turned out to be the SSH option, `-o IdentitiesOnly=yes`. This forces SSH to use only identities in the main `~/.ssh/config` file or passed-in on the command-line. But since I created a special keypair just for Vultr, it can't use it. The solution is to remove `-o IdentitiesOnly=yes` from `ssh_args` in `ansible.cfg`.

### Firewall issues

After Algo completed, my monitoring service immediately blew up my phone to tell me the website was down. Turns out, it disabled UFW, and with it, my web server firewall ports. Luckily the fix for that was just a simple re-enable on the server:

```shell
sudo ufw enable
```
(Note: UFW won't show the VPN's firewall rules, but iptables will.)

Finally, for Vultr, they (wisely) set up an external firewall available for instances. This is generally a good idea, but trying to match it to the rules necessary for the VPN is a lot of work, so the final thing to do is to disable the firewall from the Vultr control panel. **Be sure your firewall is set up correctly on the server first.**
