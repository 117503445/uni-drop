#!/usr/bin/env bash

rm -f /workspace/*.log

# Start Xvfb
export DISPLAY=:1
Xvfb :1 -screen 0 1024x768x16 > /workspace/xvfb.stdout.log 2>&1 &
sleep 5
fluxbox > /workspace/fluxbox.stdout.log 2>&1 &

# start x11
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever > /workspace/x11vnc.stdout.log 2>&1 &

# Start noVNC
/workspace/noVNC/utils/novnc_proxy --vnc localhost:5900 --listen localhost:9001 > /workspace/noVNC.stdout.log 2>&1 &

