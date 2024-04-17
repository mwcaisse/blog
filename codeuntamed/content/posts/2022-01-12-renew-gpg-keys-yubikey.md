---
title: Renewing GPG Keys on Yubikey
date: 2022-01-13
tags:
- gpg
- yubikey
author: Mitchell Caisse
---

When I setup my GPG keys on my Yubikey I set the expiration of the keys to be two years and forgot all about it. Until recently
when the keys hit the two-year mark and expired. I had of course forgotten how exactly I set up the keys initially and
how to renew them. After some research and experimenting with the `gpg2` commands, I was able to renew them.

I decided I would document the process for when this inevitably happens again in two years.

## Renewing the expired keys

1. First we will need to get the ID of the keys we will be renewing. There are two ways to do this:
    * With your Yubikey plugged in you can run `gpg2 --card-status`. This will print out information about the card, including the keys on it.
    * You can also run `gpg2 --list-secret-keys`. This will list all the gpg keys that you have the private key for. 

   From the output of these commands, you will want to copy of the ID from the main key. The main key is identified by having
   `sec` in the first column. The ID will be the sequence of hexadecimal numbers next to it.
   
   ```
   sec  rsa4096/A32231B41FCC3E18
        created: 2020-01-12  expires: 2024-01-13  usage: SC  
        card-no: 0006 06645024
        trust: unknown       validity: unknown
   sub  rsa4096/06F83DE8FBEBF491
        created: 2020-01-12  expires: 2024-01-13  usage: S   
   sub  rsa4096/455A454783C762BD
        created: 2020-01-12  expires: 2024-01-13  usage: A   
   ssb  rsa4096/3CA276AA203A53E2
        created: 2020-01-12  expires: 2024-01-13  usage: E   
        card-no: XXXX XXXXXXXX
   [ unknown] (1). Mitchell Caisse <email@example.com>
   ```
   
   For example, in the above `A32231B41FCC3E18` is the id of my main key and `06F83DE8FBEBF491` is the id of the first sub key.

2. Now that we have the ID of the main key we can run `gpg2 --edit-key <<key-id>>` to start editing the key. This will drop
us into an interactive shell. If you want to explore a bit typing `help` will list all available commands, `list` will print
out the key information, and `quit` will exit.
3. To renew the key enter `expire` This will open a prompt to enter how long the key should be valid for, with examples 
 of the accepted options. `2y` means the key will expire 2 years from now.
4. However, that only extends the validity of the main key, you will need to repeat the process for each sub key that you have.
   * First you will need to select the sub key, which you can do by typing `key <index>` or `key <<sub-key-id>>` where `index` is the
   index of the key in the list and `sub-key-id` is the id of the key to select. Running the command again will deselect the key.
   You can select multiple keys at a time.
   * After your desired sub keys are selected, repeat the process in step 3 to new the keys. Note: When you run `list`
   any selected keys will have an asterisk (*) next to them.
5. Finally, to save the changes and quit type `save`

The expiration date of your key(s) are now updated and valid once again. You might want to share your updated, which to do so you'll need to 
export the key. 

Which you can do by running:
```bash
gpg2 --armor --export <<key-id>> > public_key.gpg
```
