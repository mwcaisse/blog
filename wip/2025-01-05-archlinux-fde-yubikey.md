---
title: ArchLinux Full Disc Encryption with Yubikey
date: 2025-01-05
tags:
- archlinux
- yubikey
- encryption
author: Mitchell Caisse
---

Installing Archlinux with full disc encryption and using your Yubikey to unlock the drive.

Uising LVM on LUKS for encryption method, without the encrypted bootloader. As encrypted
boot loader locks you into using GRUB for a boot loader. Which is less visually customizable
and slower to unlock the drive.

Essentially follow the instructions here: https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS
Then we will configure the Yubikey authentication later.

# References:
* https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS
* https://wiki.archlinux.org/title/YubiKey
* https://github.com/agherzan/yubikey-full-disk-encryption#usage