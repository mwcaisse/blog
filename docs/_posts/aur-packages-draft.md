---
title: Automating Archlinux AUR Package Building
date: 2020-10-19
tags: 
    - archlinux
    - aur
    - automation 
    - docker
author: Mitchell Caisse
---
In [AUR Repo for Arch Linux](#link pls?) I set up a custom repository to maintain AUR packages. This was good, but
it requires me to manually update the packages and the packages are built on the host operating system rather than
an isolated environment.

To start I created a Docker image that I could use to build the packages. Then I created two scripts, one to 
build the packages and one to make it easy to run the docker image and add packages to the repository.

## Docker Image

I wanted to use a clean environment that was always up to date to build my AUR packages. This provides a few benefits:
1. Less changes of package conflicts, as they are always built against the most up to date libraries.
2. Less risk with a malicious build script. The build scripts run in a container vs the host OS.

I used the latest version of archlinux as the base for my docker image and immediately ran a full system update.

```Dockerfile
FROM archlinux:latest

RUN pacman -Syyu --noconfirm
```

I updated my mirrors and ranked the according to their speed relative to my internet connection. To ensure I was using the
fastest repositories for me to decrease time needed to install packages. 
To do this we can download a customized mirror list using ArchLinux's [Mirrorlist Generator](https://www.archlinux.org/mirrorlist/).
Then we can rank the mirrors by speed using the `rankmirrors` utility that is found in the `pacman-contrib` package.

```Dockerfile
RUN pacman -S --noconfirm pacman-contrib

# Download and rank a mirror list by speed
RUN curl -s "https://www.archlinux.org/mirrorlist/?country=US&protocol=http&protocol=https&ip_version=4&use_mirror_status=on" \
 |  sed -e 's/^#Server/Server/' -e '/^#/d'  \
 | rankmirrors -n 5 - > /etc/pacman.d/mirrorlist
```

Next I installed the dependencies required to build packages and required by `aurutils`, the AUR helper I am using
to build AUR packages.

```Dockerfile
# Install dependencies needed to build packages
RUN pacman -S base-devel base sudo git --noconfirm

# Install Aurutils dependencies
RUN pacman -S diffstat expac jq pacutils wget devtools vifm bash-completion --noconfirm
```

`aurutils` itself is an AUR package, which means it needs to downloaded and built manually using `makepkg`. `makepkg` 
cannot be run as root, to resolve this I created a `build` user to build the `aurutils` package with.

```Dockerfile
# Download aurutils
WORKDIR /tmp/pkg/aurutils
RUN git clone https://aur.archlinux.org/aurutils.git

# Change into the directory with aurutils source
WORKDIR /tmp/pkg/aurutils/aurutils

# Create a build user to build the package
RUN useradd -m build

# Grant the build user permissions to the working directory
RUN chown -R build:build .

# switch over to the build user
USER build

# Now we can run makepkg
RUN makepkg

# Switch back to root and install the package
USER root
RUN pacman -U *.pkg.* --noconfirm
```


## Building the Packages

I have the container to use for building the packages, now I need the script that will actually build the packages. Building
the packages is simple enough with `aurutils` but I need to have access to the repository to update the existing packages
and store the new packages.
