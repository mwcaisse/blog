---
title: Setting up GPG Keys on Yubikey
date: 2024-04-16
tags:
- gpg
- yubikey
- ssh
author: Mitchell Caisse
---

I recently purchased a new Yubikey and found myself needing to set it up and configure it with PGP keys. As I use it for SSH
authentication and commit signing. I of course forgot how I initially configured my older Yubikey for this. Thankfully a quick
google search later I was able to figure out how to set it up. I am going to document it this time for future reference and
as a more condensed version of the results I found.

## Initial Yubikey Setup

First need to make sure that your computer can see the yubikey and specifically `gpg2` can. `gpg2 --card-status` will list 
out all smart cards that gpg2 detects and their status. 

Once the card is detected we can go ahead and configure the PIN and Admin PIN for the GPG keys. These will be needed to unlock 
the card whenever you want to access the keys and to update any configuration on the card, including generating new keys.
These have default values initially, which are `123456` and `12345678` respectively. 
[Yubikey's guide](https://support.yubico.com/hc/en-us/articles/360013790259-Using-Your-YubiKey-with-OpenPGP) 
has more information on this. 

To start editing the card, we can go into the card edit console by using `gpg2 --card-edit`. This will drop us into a
console that allows us to edit the card. `help` will list available commands.

The PIN can be set with the `passwd` command. It will prompt for the current PIN, then the new PIN twice.

To set the Admin PIN, admin commands need to be enabled, which can be done with `admin` command. Once that is enabled, we
can set the admin PIN with `passwd`, this time it will prompt what action we want take, which is "Change Admin PIN". It
will prompt for the current Admin PIN and then the new PIN twice. Then we can use`Q` to return back to the main menu.

You can optionally set your name with the `name` command.

## Generating Keys

For generating keys on the Yubikey there are two options, generating them on the Yubikey directly or generating them on 
your computer and importing them to the yubikey. I prefer to generate them on the Yubikey itself, as the keys never
leave the Yubikey with this method, which means the private key matter will never be exposed to the host computer. This
has the downside that if your Yubikey is lost or damaged there is no way to recover the keys.

### Configure Key Type
The type of key that is generated can be configured with the `key-attr` command. I chose to use ECC keys with the
Curve 25519 elliptic curve, as ed25519 keys are commonly supported now.

### Generating the Keys
Generating the keys can be done by issuing the `generate` command. It will prompt you for how long the keys should be
valid for, as well as a Name, Email, and a Comment to associate with the key. I normally leave Comment field empty.

Now we can quit out of the card edit with `quit`.

To view your newly generated keys you can use `gpg2 --card-status`.

## Exporting Public Key
In order to use the keys we need to have the public key available. We can export the public key with:
```bash
gpg2 --armor --export key-id > public_key.gpg
```

Where `key-id` is the ID of the key just generated. Running `gpg2 --card-status` will print out the key ID under "General key info".


To use the key for SSH authentication we will need to have the SSH public key or identifier as well. If your ssh agent is
already configured to use gpg keys, it should already detect your new keys. You can use `ssh-add -L` to print out all
identities that the ssh agent knows. 


Then you can add the gpg public key and ssh public key to Github, servers, or where-ever you desire to use them.



# References:
* https://support.yubico.com/hc/en-us/articles/360013790259-Using-Your-YubiKey-with-OpenPGP
* https://github.com/drduh/YubiKey-Guide
