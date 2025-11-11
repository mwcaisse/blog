---
title: "Archlinux YubiKey Login"
date: 2025-11-11
tags:
  - archlinux
  - yubikey
  - login
author: Mitchell Caisse
---

I needed to log into one of my servers locally, not over SSH, which meant I needed to manually type in my long
password manager managed password via keyboard, rather than copying and pasting it. Which made me wonder if there is an
easier way. Could I log into it, without typing out that long password, but without reducing security too much. I already
have a few YubiKeys, could I use that to authentically locally instead of the password?

The answer was yes, with `pam_u2f`. This allows you to configure PAM to use YubiKey as an authentication option. To configure 
this there are a few things you need to do:
* Install `pacm_u2f`
* Create an Authorization Mapping
* Update PAM Configuration

## Install pam_u2f
This is provided as an arch package, so it is as easy as
```bash
pacman -S pam_u2f
```


## Create an Authorization Mapping
There are two approaches to creating a mapping file, either Central Authorization Mapping or Individual Authorization Mapping by User.
The first is a central file for all mappings and second is a file per user, similar to the `authorized_keys` file that is used by ssh.
I opted for the former, since I am the only user of my machines and don't need to support multiple users.

The first step is to create the value that will go into the mapping file. This can be done with the `pamu2fcfg` tool.
```bash
pamu2fcfg --username=mitchell --pin-verification
```
That will create a configuration for the user `mitchell` and require pin verification on login. It will use the default values for origin (`pam://hostname`) 
and appid (value for origin). However, those can be specified with `-o` and `-i` respectively. It also requires user presence, i.e. to press
the button on the YubiKey. That can be disabled with the `--no-user-presence` flag.

Next step is to create the mapping file and put the results from that command in it.
```bash
nano /etc/u2f_mappings
```

Since this is a centralized file, we will want to make sure the permissions are correct, and that only `root` can read/write it.
```bash
chmod 0600 /etc/u2f_mappings
```

## Configure PAM
Now we can configure PAM to use the new login option. I wanted the YubiKey to be used for any login operations (tty, greeter, sudo, etc) and I wanted
it to take precedence over the password, if my YubiKey was plugged in prefer to auth with that instead of password.

In order to do that I modified the `system-auth` PAM config file (`/etc/pam.d/system-auth`) as all logins referenced this file.
I added the following line to the top of the file
```text
auth    sufficient  pam_u2f.so authfile=/etc/u2f_mappings
```

Now when you login and your YubiKey is connected, you should be prompted to auth with that first. If it is not connected,
it will fallback to password auth.

# References:
* https://developers.yubico.com/pam-u2f/
* https://wiki.archlinux.org/title/Universal_2nd_Factor#Authentication_for_user_sessions
* https://wiki.archlinux.org/title/YubiKey#Linux_user_authentication_with_PAM