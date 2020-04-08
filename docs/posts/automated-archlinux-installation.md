# Automated ArchLinux Installation

## Goal

What am I actually trying to accomplish with this? 

We want to install arch linux and we want to configure it after arch linux is installed. Eventually to get to a point
where I could re-install ArchLinux weekly and wouldn't really notice a difference (except for the time loss of install)

### Install
* Automate the setting up of a arch linux install to make future installations easy and painless
* Format discs and set up an encrypted disc
* Get to a bootable system with Cinnamon installed and a non-root user
* Want a way to make things that are different between systems parameratized
    * Disk / partition setup
    * Hostname
    
### Post Install
* Add Cinnamon Theme
* Add software / configuration for software
    * Web Browser
    * IDEs
    * Fish Shell
* Install and configure git with pgp key / commit signing

## Methodology

ArchLinux has `Archiso` a tool for building ArchLinux Live CD ISO images. We can use this create a custom installation image
that will automatically install archlinux depending on a profile that we have selected for a particular machine. 

* We could use `Archiso` to do as described above, install everything needed to get us to a bootable installation
* We could use `Archiso` to create an image that has requirements for `Ansible` pre-installed.

Either approach requires creating a custom image, as the default arch installation media does not come with OpenSSH
    daemon started. I would prefer not to have to boot up the image, start OpenSSH, and the trigger the installation via
    Ansible on another machine. I like the simplicity that booting from the disk and the installation automatically starting 
    grants us. (Of course want to add some sort of confirmation before the installation starts, to prevent accidentally booting 
    from the disk and erasing everything.) Building off of this, we could potentially utilize NetBoot to store these images on
    a network and automatically boot from them.
    
## Configuration Methodology

Now that we have a bootable installation we need to decide how to install all of the software and configure said software. 
Again we have two choices for doing this
* Ansible
* Simple bash script

In this case Ansible is more feasible, as we have an installation and can easily enable OpenSSH. The downside of this
is that it requires a computer to drive the installation. The bash script on the other hand does not require another computer
to run the installation / configuration. We do however need a way to host it / copy it into our installation. But perhaps
we could take advantage of our custom image or a git repo to do this.

### Ansible
#### Pros
* Don't have to worry about copying a script to the installation.
* Might be easier to maintain as we have a buffer between command syntax changing as long as we keep Ansible updated.
#### Cons
* Requires another computer to drive the installation.
* Have to convert shell commands into Ansible commands.

### Bash Script
#### Pros
* Don't need to have another computer to drive the installation
* Can use familiar commands to drive the installation. One can look at the script and easily run the commands on their own.
* Can host the script on the web, and all is needed is a simple command to download script.
### Cons
* We need a way to get the script onto the fresh installation

**TODO**: Pros and Cons conflict a little bit here don't they?

In the end Bash Script approach is better, as it doesn't require having another computer to drive the installation. Ultimately
we want to remove dependencies on user action, and having to drive the installation on another computer involves more interaction
that running a script.
    
    
## Creating the Script

### Outline of what we need to do / hope to accomplish
What we need to do to install?

* Partition Disks
* Format the disks
* TODO: Set up encryption?
* Mount the file system
* Select mirrors / generate a mirror list
    * We can use arch linux's website to download an optimized list of mirrors
    * and use pac rank command against it if needed (for speed optimization)
* Install the base packages
* Generate and save `fstab`
* Chroot into the new system
* Set the timezone
* Set the locale
* Set the hostname
* Create the initramfs
* Set the root password
* Create a non-root user
* Install sudo
* Install a boot loader
    * Most likely this will be grub, since it supports encryption

What do we do after the installation? Do we want to continue with the bash script? Or do we want to use ansible at this point. I think
we will want to continue with the bash script, as using ansible has the problem of needing another computer. Or does it?
Can we run and ansible playbook against the computer that is running ansible? Yes we can run ansible on localhost. Once we have 
an installation, we could instruct our script to download ansible and requirements, then clone a git repo containing
ansible playbooks and run them accordingly.

Either way, things we will need to do once we have a working install
* Install graphics drivers
* Install a DE
* Install themes and fonts for desktop environment
    * Set the themes and fonts 
* Configure shell (fish)
    * Install OhMyFish
    * Install powerline fonts
    * Install the git plugin? **TODO:** Figure out what the plugin is
* Install web browser
    * Configure browser / plugins
* Install VLC
* Install IDEs
    * WebStorm
    * Rider
    * PyCharm
* Configure connecting to NAS

### Partitioning Disks
* Create EFI System Partition `/efi` Using standard of 512MB
* Create the swap partition. Using 16GB, since laptop has 8GB of RAM
* Create the root partition `/` Using the rest of the disc

We use parted since it has a easy to use command line interface

```shell script
parted "${DEVICE}" \
  mklabel gpt \
  mkpart efi fat32 1MiB 513MiB \
  set 1 esp on \
  mkpart swap linux-swap 513MiB 16897MiB \
  mkpart root ext4 16897MiB 100%
```

### Formatting the Disks

```shell script
mkfs.fat -F32 "${DEVICE}p1"
mkswap "${DEVICE}p2"
mkfs.ext4 "${DEVICE}p3"
```

### Mount the partitions
```shell script
# Mount the file systems
mount "${DEVICE}/p3" /mnt
mkdir /mnt/efi
mount "${DEVICE}p1" /mnt/efi
swapon "${DEVICE}p2
```


### Setup Networking
To fetch the name of the ethernet device, we can list all the devices with `ip link` then use `grep` to find
the ethernet device, then we can use `awk` to get the 2nd parameter of the output, which contains the network device name
and to remove the ":" from the command output. This assumes that there will only be one matching device.

TODO: Add support for wireless

`ETHERNET_DEVICE=$(ip link | grep enp | awk '{gsub(":","", $2);  print $2}')`
### Selecting the Mirrors
We can use ArchLinux's mirror generator to generate a list of mirrors that meet our desired criteria. (https://www.archlinux.org/mirrorlist/)

### Copy over dotfiles
I setup my dotfiles using the [Atlassian Guide](https://www.atlassian.com/git/tutorials/dotfiles). After the installation
I wanted to clone my dotfiles repo onto the fresh install. In order to automate this, I added a read-only deploy key to
my dotfiles repo. Then added that deploy key to my custom arch installation image. Then I restored the dot files as follows:

```bash
arch-chroot /mnt su mitchell -c "mkdir ~/.ssh"
cp ./<<private-key-file>> /mnt/home/mitchell/.ssh/id_rsa

#Fix the permissions on the ssh key
arch-chroot /mnt chown mitchell:mitchell -R /home/mitchell/.ssh
arch-chroot /mnt chmod 600 /home/mitchell/.ssh/id_rsa

# Setup the dotfiles repo
arch-chroot /mnt su mitchell -c "git clone --bare <<dotfiles-repo-url>> ~/.cfg"
arch-chroot /mnt su mitchell -c "git --git-dir=~/.cfg/ --work-tree=~ checkout --force"
arch-chroot /mnt su mitchell -c "git --git-dir=~/.cfg/ --work-tree=~ config --local status.showUntrackedFiles no"
```
    
# References:
* https://disconnected.systems/blog/archlinux-installer/#setting-variables-and-collecting-user-input
* https://wiki.archlinux.org/index.php/archiso
* https://disconnected.systems/blog/archlinux-installer/#partioning-and-formatting-the-disk
* https://wiki.archlinux.org/index.php/installation_guide
* https://www.atlassian.com/git/tutorials/dotfiles