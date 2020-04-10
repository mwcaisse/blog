
Install `aurutils`

Create a directory to use as a local repo `mkdir /aur-repo/`

Create the repo `repo-add /aur-repo/mitchell-aur.db.tar.xz `

Add the repo to your pacman.conf
```text
[mitchell-aur]
SigLevel = Optional TrustAll
Server = https://home.fourfivefire.com/aur-repo/
```

Add our first package!
`aur sync -d mitchell-aur --root /mnt/data/aur-repo/ --no-confirm --noview aurutils`

# TODO:
* Need to automate this in some fashion
* Add signing to the packages
* Run in a docker container to avoid dependency issues / create in a clean environment

# References:
* https://disconnected.systems/blog/archlinux-repo-in-aws-bucket
* https://www.reddit.com/r/archlinux/comments/angrel/ive_finally_set_up_my_own_automated_repository/