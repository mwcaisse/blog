---
title: ArchLinux Full Disc Encryption with YubiKey
date: 2025-01-06
tags:
- archlinux
- yubikey
- encryption
author: Mitchell Caisse
---

I performed my periodic refresh of my Arch Linux install and wanted to improve how my full disc encryption was handled. 
Previously I used LVM on LUKS with an encrypted boot partition. However, that limits which bootloader you can use to GRUB, and
GRUB is not the quickest to unlock the LUKS partition.

I was also curious if I could use my YubiKey for part of the encryption process rather than just a long password to type on boot. 
I can't say that I made it much more convenient though, as now I have to have my YubiKey inserted and press the button on it to
boot my computer, but it was fun implementing it and getting it to work. 

For my future reference, or anyone else who is curious on how to accomplish this, these are the steps I took.


## Configure YubiKey

The first step is to configure your YubiKey for a HMAC-SHA1 Challenge Response. This essentially serves as the passphrase that
is used to unlock the LUKS volume. For this we will need the YubiKey Personalization Tool which can be installed with the packages(s)
`yubikey-personalization` and `yubikey-personalization` for the optional GUI.

We'll need to configure a HMAC-SHA1 challenge in one of the slots on your YubiKey, ideally slot 2, because slot 1 defaults to FIDO. Will 
need to set the HMAC-SHA1 Mode to `Variable input` and you can optionally `Require user input` which means need to press the button before
the YubiKey will issue its response.

To perform this on the command line you can run

```bash
ykpersonalize -v -2 -ochal-resp -ochal-hmac -ohmac-lt64 -oserial-api-visible -ochal-btn-trig
```

A break-down of what the arguments mean:
* `-v`: Enable verbose output
* `-2`: Use slot 2
* `-ochal-resp`: Set the challenge response mode flag
* `-ochal-hmac`: Generate the HMAC challenge response
* `-ohmax-lt64`: Enable variable (less than 64bit) input
* `-oserial-api-visible`: Allow the serial key to be read using an API call
* `-ochal-btn-trig`: Require the button to be pressed before issuing the response

## Configuring Discs
I essentially followed the directions for [LVM on LUKS](https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS) on the ArchLinux wiki.
Substituting in the yubikey commands where needed.

The first step is to install YubiKey Full Disk Encryption `yubikey-full-disk-encryption`. Remember to install this on both
the installation media and on your final installation (i.e. the one you are installing) We'll need the utils during installation
and the hooks during boot.

### Creating LUKS encrypted container
Instead of running the `cryptsetup luksFormat` command that will be replaced with a `ykfde-format` command

```bash
ykfde-format /dev/sda1
```

This will take the same [parameters](https://wiki.archlinux.org/title/Dm-crypt/Device_encryption#Encryption_options_for_LUKS_mode) as `cryptsetup luksFormat`

### Unlocking LUKS encrypted container
Instead of running `cryptsetup open` to open the crypt container, that will be replaced with a `ykdfe-open` command

```bash
ykfde-open -d /dev/sda1 -n cryptlvm
```

This can be used to re-open the crypt container manually whenever needed. For example performing maintenance on the installation
if you forgot to install a network manager.

The rest of the installation remains the same, until modifying the initramfs hooks.

## Configuring initramfs hooks

When editing `/etc/mkinitcpio.conf` instead of adding the `encrypt` hook, add the `ykfde` hook instead.

## Bootloader Configuration
I used eEFInd for my bootloader as it has a nice GUI and makes dual booting between Windows and Linux easy (it auto-detects Windows)

You will need to update your `refind_linux.conf` to have the appropriate configuration to boot your new installation. If you used `refind-install`
script to install rEFInd it will have the values set for the linux running not the linux you are installing. We'll also need to add in
the correct disc to ensure it knows which disc to decrypt.

```text
"Boot with standard options"     "cryptdevice=UUID=<<crypt-device-uuid>>:cryptlvm root=<<volume-group-name>> rw loglevel=3 initrd=intel-ucode.img initrd=initramfs-linux.img"
"Boot using fallback initramfs"  "cryptdevice=UUID=<<crypt-device-uuid>>:cryptlvm root=<<volume-group-name>> rw loglevel=3 initrd=intel-ucode.img initrd=initramfs-linux-fallback.img"
"Boot to single-user mode"       "cryptdevice=UUID=<<crypt-device-uuid>>:cryptlvm root=<<volume-group-name>> rw loglevel=3 initrd=intel-ucode.img initrd=initramfs-linux.img single"
"Boot with minimal options"      "cryptdevice=UUID=<<crypt-device-uuid>>:cryptlvm root=<<volume-group-name>> ro initrd=intel-ucode.img initrd=initramfs-linux.img"
```

# Future Considerations
This leaves the boot partition unencrypted which means that the bootloader code could be more easily modified (encrypted it doesn't completely resolve this)
One additional layer of security to ensure the bootloader isn't tampered with is enabling Secure Boot. Likely not strictly necessarily
(fully encrypting my hard drive likely isn't either) but would be interesting to explore how to do it and learn how it works.

# References:
* https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS
* https://wiki.archlinux.org/title/YubiKey
* https://github.com/agherzan/yubikey-full-disk-encryption#usage