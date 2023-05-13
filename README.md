# PiPortfolioDaemon

*Disclaimer*: This is a work in progress!

LH 05/2023

## Description

- This is Raspberry Pi web server that makes transferring files to the Atari Portfolio easier.
- It is based on NodeJS.

## Functions

- It watches a shared SAMBA folder for files for uploads.
- If files are detected it tries to send them via [rpfolio](https://github.com/LennartHennigs/transfolio) to the Atari Portfolio.
- It provided a web interface to change the target folder.
- There you can also donwload files.

![preview](images/preview.png)

## Prerequisites

- Pi Zero
- Pi to Atari Portfolio Parallel adapter (built my own)
- rpfolio (Transfolio for the Pi)
- A shared SAMBA folder on the Pi
- NodeJS

![Pi to Portfolio](images/platine2.png)

