## Future Steps

* Encryption
* PGP / Yubikey setup
* Automatically clone git repositories?
    
# TODO

Not really sure where I was going with this, might have just been notes

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
* Install and configure git_posts with pgp key / commit signing
    
    
# Post workable installation steps

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
       
## Future Steps


* Encryption
* PGP / Yubikey setup
* Automatically clone git repositories?
    
# References:
* https://disconnected.systems/blog/archlinux-installer/#setting-variables-and-collecting-user-input
* https://wiki.archlinux.org/index.php/archiso
* https://disconnected.systems/blog/archlinux-installer/#partioning-and-formatting-the-disk
* https://wiki.archlinux.org/index.php/installation_guide
* https://www.atlassian.com/git/tutorials/dotfiles