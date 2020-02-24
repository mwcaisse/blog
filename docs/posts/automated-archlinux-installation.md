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
### Cons
* We need a way to get the script onto the fresh installation

In the end Bash Script approach is better, as it doesn't require having another computer to drive the installation. Ultimately
we want to remove dependencies on user action, and having to drive the installation on another computer involves more interaction
that running a script.
    
# References:
* https://disconnected.systems/blog/archlinux-installer/#setting-variables-and-collecting-user-input
* https://wiki.archlinux.org/index.php/archiso
* https://disconnected.systems/blog/archlinux-installer/#partioning-and-formatting-the-disk