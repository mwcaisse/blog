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
it required me to manually update the packages, and I was building the packages on the host operating system. The latter
could introduce issues with building software against non-updated packages if the host system wasn't recently updated, and
the build scripts ran directly on a server, which could result in malicious code running directly on the host. In this 
post we will walk through addressing these two issues. We'll create a way to automate the updating of the packages in the 
repository to ensure they stay up to date. We'll also build the packages in a way that runs the packages in a separate, 
isolated environment. How we address the second issue will determine our methodology for automating the process, 
therefore we will start there.

## Docker Image

When thinking about running a process in an isolated environment that can be easily spun up, discards any state between
runs, and can easily have all packages updated, Docker comes to mind. We'll walk through the process of creating a docker
image that can be used to build AUR packages.

As we are building packages for Arch it makes sense to base our image off of the latest version of ArchLinux. Then 
immediately perform a system update to ensure that we have the latest packages installed.

```Dockerfile
FROM archlinux:latest

RUN pacman -Syyu --noconfirm
```

Through the process of building packages we are going to need to download a lot of other packages, and system updates and 
the build dependencies for the packages we wish to build. It would make sense to ensure that the mirrors we are provide 
optimal download speed. Thankfully ArchLinux offers a [Mirrorlist Generator](https://www.archlinux.org/mirrorlist/) that 
we can use to download a list of mirrors for our country and other criteria.

ArchLinux also has a `rankmirrors` utility to rank all of your mirrors in your mirror list according to their speed.
We can use this in combination with the mirrorlist generator mentioned above to ensure that we have a good set of mirrors
on the Dockerimage. 

```Dockerfile
# `rankmirrors` is in the `pacman-contrib` package
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
