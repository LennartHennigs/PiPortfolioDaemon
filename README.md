# PiPortfolioDaemon

*Disclaimer*: This is a work in progress!

- Author: Lennart Hennigs (<https://www.lennarthennigs.de>)
- Copyright (C) 2023 Lennart Hennigs.
- Released under the MIT license.
- To see the latest changes look at the [Changelog](https://github.com/LennartHennigs/PiPortfolioDaemon/blob/master/CHANGELOG.md).
- If you find this library helpful please consider giving it a ⭐️ at [GitHub](https://github.com/LennartHennigs/Button2) and/or [buy me a ☕️](https://ko-fi.com/lennart0815).

Thank you!

## Description

- This is a NodeJS web server that runs on a Raspberry Pi, connected to the Portfolio's Parallel interface.
- It offers web interface to upload and download software to and from the Portfolio.

<kbd><img src="images/preview.png" width="600px" /></kbd>

## Introduction

The [Atari Portfolio](https://en.wikipedia.org/wiki/Atari_Portfolio) was the first palmtop computer.
Using and experiencing one today is hard, as you have hard time putting any files onto it.

- The storage cards it uses are no longer produced ([Bee Cards](https://en.wikipedia.org/wiki/Bee_Card_(game_cartridge))) and are kind of rare.
- To transfer files you need the [Atari Portfolio Parallel Interface](https://www.atari-computermuseum.de/hpc_peri.htm),...
- ... and a PC that actually still has a parallel port,...
- ... and a transfer program like [transfolio](http://www.pofowiki.de/doku.php?id=software:vorstellung:exchanges:transfolio)

Without the above, the Atari is mostly a pretty plastic brick that you cannot access.

To fix this, I wanted to provide an easy way to transfer data to the Portfolio with modern computers.

## Functions

- Provides a web page on `[Pi IP-Address]:3000`
- There you can...
  - list folder content on the Portfolio
  - download files
  - upload files
  - see an activity log
- In addition, it watches a shared SAMBA folder for uoloaded files to send them to the Portfolio.
- It also detects whether the connection to the Portfolio has timed out.

<kbd><img src="images/output.png" width="600px" /></kbd>

## Prerequisites

- Atari Portfolio with Parallel Interface
- Raspberry Pi (Zero)
- Atari Portfolio connected to Pi
- NodeJS installed on the Pi
- `rpfolio` installed on the Pi
- Nice to have: A shared SAMBA folder on the Pi

<kbd><img src="images/parallel.png" /></kbd>

## How To Use

- [connect the Pi to the Portfolio](https://lennarthennigs.de/how-to-connect-an-atari-portfolio/)
- run the transfer system util on the Portfolio (in server mode)
  - `Atari + S >  F > S`
- copy the project files onto your Pi
  - `git clone https://github.com/LennartHennigs/PiPortfolioDaemon.git`
- [set up a public SAMBA share](https://pimylifeup.com/raspberry-pi-samba/) for the `~/upload/` folder (optional)
- [install NodeJS on your Pi](https://gist.github.com/davps/6c6e0ba59d023a9e3963cea4ad0fb516)
- build [rpfolio](https://lennarthennigs.de/how-to-connect-an-atari-portfolio/)
- run the server via `node ~/PiPortfolioDaemon/server.js`
- open `[ip address of your Pi]:3000` in your browser
- transfer away

<kbd><img src="images/platine1.png" /></kbd>
<kbd><img src="images/platine2.png" /></kbd>
