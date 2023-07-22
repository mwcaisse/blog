---
title: Automated ArchLinux Installation
date: 2020-04-13
tags: 
    - archlinux
    - aur
    - automation
author: Mitchell Caisse
---
## Part 1: Basic Bootable Installation

I wanted to reinstall Arch Linux on my laptop and after having just re-installed it and configured it how I liked
on my desktop, I thought there had to be a better way than manually installing packages and doing configuration
every time I install. I was in no rush to get a working installation on my laptop, I decided now would be the time
to explore a way to automate the installation.

## Goal
The ultimate goal of this is to automate the installation and configuration of Arch Linux and get to the point where
I could re-install weekly and wouldn't notice a difference or a huge time sink. The reasons why this is desirable:

* No longer have to worry about messing up my installation in some way. If I accidentally delete everything on my hard
    drive I can just re-install
* Future installations on to new devices become much easier.

## Methodology
There are a few ways in which one could automate a linux installation: a bash script or a configuration management tool like
ansible. I ultimately decided that I would use a bash script. This was the easiest approach:

* Default Arch Linux iso already has bash and wouldn't need anything extra to run the bash script
* I could use the same commands I normally do to install

I approached this in phases to not make it overwhelming.

1. Basic Bootable Installation
1. Desktop Environment and Configuration  
    
## Part 1: Basic Bootable Installation

The first thing I wanted to accomplish was to get basic and bootable installation up and running. Once I had that working
I could then worry about installing a desktop environment, the programs I wanted, and configuring the installation. The following
are the steps that are needed to get a bootable installation:

* Partition Disks
* Format the disks
* Mount the file system
* Select mirrors
* Install the base packages
* Generate and save `fstab`
* Set the timezone
* Set the locale
* Set the hostname
* Create the initramfs
* Set the root password
* Install a boot loader
* Create a non-root user
* Setup networking

### Partitioning Disks
The partition layout I used is as below. To make it simpler I hard coded the partition to my laptop with the intention
of making this more modular later on. 

* EFI System Partition `/efi` with size 512MB
* Swap partition. with size 16GB, double my laptops RAM.
* Root partition `/` utilizing the rest of the disk.

`parted` is a disk partitioning tool and allows partitioning of a disk via command line arguments, perfect for running in a script.

```bash
parted "${DEVICE}" \
  mklabel gpt \
  mkpart efi fat32 1MiB 513MiB \
  set 1 esp on \
  mkpart swap linux-swap 513MiB 16897MiB \
  mkpart root ext4 16897MiB 100%
```

### Formatting the Disks

```bash
mkfs.fat -F32 "${DEVICE}p1"
mkswap "${DEVICE}p2"
mkfs.ext4 "${DEVICE}p3"
```

### Mount the partitions
```bash
# Mount the file systems
mount "${DEVICE}/p3" /mnt
mkdir /mnt/efi
mount "${DEVICE}p1" /mnt/efi
swapon "${DEVICE}p2
```

### Select mirrors
We can use [ArchLinux's mirror generator](https://www.archlinux.org/mirrorlist/) to generate a list of mirrors that meet our desired criteria.

This will download a list of all the mirrors in the US, uncomment out each of the mirrors, and save it as the mirror list
that pacman will use when installing packages.

```bash
curl -s "https://www.archlinux.org/mirrorlist/?country=US&protocol=http&protocol=https&ip_version=4&use_mirror_status=on" \
 |  sed -e 's/^#Server/Server/' -e '/^#/d' > /etc/pacman.d/mirrorlist
```
   
### Install the base packages
Similar to how you install packages when installing arch linux manually, we'll use `pacstrap`.

```bash
pacstrap /mnt base linux linux-firmware base-devel git sudo grub efibootmgr dhcpcd nano openssh
```
   
### General System Configuration
Once we have the base packages installed, we can do the basic configuration
* Create the fstab
* Set the timezone
* Sync the clock
* Set the locale
* Set the hostname
* Create the initramfs

```bash
# Create the fstab
genfstab -U /mnt >> /mnt/etc/fstab

# Set the timezone
ln -sf /mnt/usr/share/zoneinfo/America/New_York /etc/localtime

# Generate /etc/adjtime
arch-chroot /mnt hwclock --systohc

# Set the locale
sed -i "s/^#${LOCALE} UTF-8/${LOCALE} UTF-8/" /mnt/etc/locale.gen
arch-chroot /mnt locale-gen
echo "LANG=${LOCALE}" > /mnt/etc/locale.conf

# Network Stuff
echo "${HOSTNAME}" >> /mnt/etc/hostname
echo "127.0.1.1   ${HOSTNAME}.localdomain ${HOSTNAME}" >> /mnt/etc/hosts

# Initramfs
arch-chroot /mnt mkinitcpio -p linux
```
   
### Install bootloader
I decided to use grub as the bootloader as it works well with EFI systems and supports encrypted discs. 
```bash
# Install GRUB as bootloader
arch-chroot /mnt grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg
```

### Create a non-root user
We will create the non-root user that you will use the system as and set its password along with the root user's password.
To do this we will use `useradd` to add the user and `chpasswd` to change the password as it allows reading the
password from a pipe. 

```bash
# Create a user
arch-chroot /mnt useradd -m -s /bin/bash --groups wheel mitchell

# Set the passwords
set +x # Disable printing commands around password setting
echo "Setting passwords"
echo "mitchell:<<mitchells_password>>" | arch-chroot /mnt chpasswd
echo "root:<<root_password>>" | arch-chroot /mnt chpasswd
set -x
```

**Note:** The `set -x` is used to disable echoing the commands the script runs, this stops the password from being
printed to the screen while it is being set. The `set +x` at the end re-enables it for the rest of the script.

To allow our non-root user to execute sudo commands we can update sudo to allow the `wheel` group to execute commands. We can
do this by setting the editor to `tee` and calling `visudo` in the target system. `tee` allows us to append to the file
by piping the line in.

```bash
# Let members of group wheel run sudo command
export EDITOR="tee -a"
echo "%wheel ALL=(ALL) ALL" | arch-chroot /mnt visudo
```

### Setup networking
We'll need to set up networking on our new installation. We will use `ip link` to list all the available network 
interfaces, and then use `grep` and `awk` to filter out the name of the ethernet device. Then enable `dhcpcd` on that device.   
   
```bash
echo "Setting up networking"
# Set up networking. We are going to assume ethernet for now
ETHERNET_DEVICE=$(ip link | grep enp | awk '{gsub(":","", $2);  print $2}')
arch-chroot /mnt systemctl enable "dhcpcd@${ETHERNET_DEVICE}"
```

## Script so far
```bash
#!/bin/bash

set -exu

DEVICE="/dev/nvme0n1"
LOCALE="en_US.UTF-8"
HOSTNAME="arch-laptop"

parted -a optimal --script \
  "${DEVICE}" \
  mklabel gpt \
  mkpart efi fat32 1MiB 513MiB \
  set 1 esp on \
  mkpart swap linux-swap 513MiB 16897MiB \
  mkpart root ext4 16897MiB 100%

# Now we have to format the partitions
mkfs.fat -F32 "${DEVICE}p1"
mkswap "${DEVICE}p2"
mkfs.ext4 -F "${DEVICE}p3"

# Mount the file systems
mount "${DEVICE}p3" /mnt
mkdir /mnt/efi
mount "${DEVICE}p1" /mnt/efi
swapon "${DEVICE}p2"

# Download and rank a mirror list by speed
curl -s "https://www.archlinux.org/mirrorlist/?country=US&protocol=http&protocol=https&ip_version=4&use_mirror_status=on" \
 |  sed -e 's/^#Server/Server/' -e '/^#/d' > /etc/pacman.d/mirrorlist

# Install base packages
pacstrap /mnt base linux linux-firmware base-devel git sudo grub efibootmgr dhcpcd nano openssh

# Create the fstab
genfstab -U /mnt >> /mnt/etc/fstab

# Set the timezone
ln -sf /mnt/usr/share/zoneinfo/America/New_York /etc/localtime

# Generate /etc/adjtime
arch-chroot /mnt hwclock --systohc

# Locale stuff
sed -i "s/^#${LOCALE} UTF-8/${LOCALE} UTF-8/" /mnt/etc/locale.gen
arch-chroot /mnt locale-gen
echo "LANG=${LOCALE}" > /mnt/etc/locale.conf

# Network Stuff
echo "${HOSTNAME}" >> /mnt/etc/hostname
echo "127.0.1.1   ${HOSTNAME}.localdomain ${HOSTNAME}" >> /mnt/etc/hosts

# Initramfs
arch-chroot /mnt mkinitcpio -p linux

# Install GRUB as bootloader
arch-chroot /mnt grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg

# Create a user
arch-chroot /mnt useradd -m -s /bin/bash --groups wheel mitchell

# Set the passwords
set +x # Disable printing commands around password setting
echo "Setting passwords"
echo "mitchell:<<mitchells_password>>" | arch-chroot /mnt chpasswd
echo "root:<<roots_password>>" | arch-chroot /mnt chpasswd
set -x

# Let members of group wheel run sudo command
export EDITOR="tee -a"
echo "%wheel ALL=(ALL) ALL" | arch-chroot /mnt visudo

echo "Setting up networking"
# Set up networking. We are going to assume ethernet for now
ETHERNET_DEVICE=$(ip link | grep enp | awk '{gsub(":","", $2);  print $2}')
arch-chroot /mnt systemctl enable "dhcpcd@${ETHERNET_DEVICE}"

echo "Installation complete. Rebooting..."
reboot
```

Now we have a bootable system. We can now remove the installation media, reboot, and see our installation start up and then
log in with the user we set up earlier. There isn't much installed in the way of packages, but you have a functional 
installation that was completed automated!

## Future Steps
* Installing Desktop Environment
* Installing AUR packages
* Creating a custom installation media
* Full Disk Encryption
* PGP / Yubikey setup
* Automatically clone git repositories
