---
title: "I declared nix bankruptcy"
pubDate: 2025-04-29
tags: 
  - nix
  - nix-darwin
  - homebrew
  - mac
description: "I gave up on nix-darwin, and reverted back to Homebrew"
---

## Nix

I started using nix last year when consulting for MIT. The lab had the perennial Python packaging problem of distributing their work to others, and used nix to solve it.

For those who aren't familiar, nix builds a hashed tree of every input to building a program. It knows exactly what versions of everything to use, and neatly avoids almost every versioning problem ever. 

I'd heard of nix but never tried it. I got set up with nix-darwin, and ran immediately into issues of poor and outdated docs, and a community kind of split on whether to recommend flakes yet. 

Another downside for nix-darwin in particular, is nonstandard filesystem locations, which caused issues for any app that just wanted to see things in common locations. This was especially bad for GUI apps, which don't have a good way to set up with environments, the standard way nix determines which actual programs to run. 

The first major casualty was Alfred. I might have muddled through, but the tech support staff were kind of rude, so I switched to Raycast. I don't like Raycast's choice to make everything multiple steps, but it works well enough.

Weirdly, even LLMs failed to produce great results. I suspect this is because they're trained on the existing docs and blog posts, which are already poor and confusing.

I muddled through for almost a year, but any time I wanted to do something even slightly unusual (like overlays), I'd have to dig through the docs and community to figure out how to do it, or use the LLMs and pray. 

I could have bit the bullet and become a nix expert, but that just wasn't what I wanted from a package manager.

## And Back Again
Some people have Homebrew issues, but I can't remember the last time it caused a problem, so I gave up on nix, and switched back to homebrew. (Saving almost 200 GB of disk space in the process.)

Nix-darwin was actually using a Brewfile to install mac GUI apps, so I kept that and expanded it.

My packaging has largely settled on a single command:

```bash
alias brew-me-up='brew update && brew upgrade && brew bundle dump --global --force --describe'
```

This updates Homebrew, upgrades out-of-date packages, and records everything in a global Brewfile for later.