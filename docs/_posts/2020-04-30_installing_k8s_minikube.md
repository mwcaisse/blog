---
title: Installing Minikube
date: 2020-04-30
tags: 
    - archlinux
    - kubernetes
    - containers
    - docker
author: Mitchell Caisse
---


```bash

pacman -S minikube

# MiniKube's dependencies
# TOOD: If we are using docker do we really need qemu and libvirt?
pacman -S libvirt qemu ebtables dnsmasq docker

```

Add your user to the docker group, as you can't run minikube as root.
Alternativly you can configure docker to run rootless (maybe?) (https://docs.docker.com/engine/security/rootless/) But
for now, for sake of simplicity we are going to add our user to the docker group

```console
gpasswd -a user docker
```

## References:
* https://kubernetes.io/docs/tasks/tools/install-minikube/
* https://kubernetes.io/docs/setup/learning-environment/minikube/