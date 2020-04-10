# AUR Repo for ArchLinux

As I was working on creating my automated installation script for Arch Linux, I realized that I would also like to
install packages from the AUR. Building the packages in the installation would be time-consuming, and a bit cumbersome
due needing to make the packages as a non-root user, but needing to be a root user to install the packages. Having
a repo with the packages already pre-built sounds like a much better option. Plus I can continue to use this repo
after the installation and let my server spend the time building the packages, rather than me waiting at the command line.

## Setting up the repo

I decided to use [aurutils](https://github.com/AladW/aurutils) as it was the most feature complete [AUR helper](https://wiki.archlinux.org/index.php/AUR_helpers#Comparison_tables)
that supported setting up a local repository. I already had an HTTP server running on my server, all I had to do
was set up the local repo and install the packages I wanted with `aurutils`.

1. Install `aurutils`
```bash
git clone https://aur.archlinux.org/aurutils.git
cd aurutils
makepkg -si
```

If you get an error `unknown key` error you'll have to import the PGP key.
```bash
gpg -vvv --recv-key 6BC26A17B9B7018A
```

2. Create the directory to use as a local repo. 
```bash
mkdir /aur-repo
```

This can be where ever you like, I used `/aur-repo` in this example.

3. Initialize the repo
```bash
repo-add /aur-repo/mitchell-aur.db.tar.xz 
```

4. Tell pacman about the repo
Add the following to your pacman config file, `/etc/pacman.conf`
```text
[mitchell-aur]
SigLevel = Optional TrustAll
Server = https://mwcaisse.com/aur-repo/
```

Replace the Server property with the URL to your local repo. I already had a HTTP server setup, I created a symlink from
`/aur-repo` to my server's content directory. `ln -s /srv/http/aur-repo /aur-repo`

5. Install the first package
I installed `aurutils` as the first package, but you can install any AUR package, and you can install multiple at the same time.
```bash
aur sync -d mitchell-aur --root /aur-repo/ --no-confirm --noview aurutils
```
* `--noview` prevents `aurutils` from opening a text editor to show build files for inspection
* `--no-confirm` is passed to makepkg and prevents waiting for user input.
Both of these options are helpful to run this in an automated state as it will not prompt for user input.

## Future Plans
This setup works as a proof of concept and to test it out with my installation script. There are a few things that it could
do better:

* Automate the updating of packages. Create a script or other mechanism to automatically update all of the packages in the repo
once every few days.
* Sign the packages for added security that they haven't been tampered with or someone else didn't upload packages
* Build the packages in a docker container or other clean environment. A docker container won't have any unneeded packages
that could create dependency issues when installed on another machine. It will also be easier to ensure all of the 
dependent packages are up to date.

## References:
* https://disconnected.systems/blog/archlinux-repo-in-aws-bucket
* https://www.reddit.com/r/archlinux/comments/angrel/ive_finally_set_up_my_own_automated_repository/