---
title: System Monitoring with Conky
date: 2020-10-26
tags: 
    - archlinux
    - conky
    - monitoring
author: Mitchell Caisse
---

I just build a new computer and used watercooling for the first time, as such I wanted to make sure the system
was working correctly and keeping my components at a good temperature. I could just occasionally run `sensors` and check
the temperatures, but I wanted something more real time. Conky was a great solution for this. In this post we will
walk through installing and configuring Conky on Arch Linux.

## Installation

```bash
pacman -S conky
```

## References
* https://wiki.archlinux.org/index.php/conky
* https://askubuntu.com/questions/235713/how-to-detect-processor-correct-temperature-in-conky