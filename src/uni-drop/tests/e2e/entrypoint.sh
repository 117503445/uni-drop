#!/usr/bin/env bash

rm -f /workspace/logs/*.log

export GEOMETRY="$SCREEN_WIDTH""x""$SCREEN_HEIGHT""x""$SCREEN_DEPTH"

# Start Xvfb
Xvfb $DISPLAY -screen 0 $GEOMETRY -ac +extension RANDR > /workspace/xvfb.stdout.log 2>&1 &

# wait for Xvfb to start
# for i in $(seq 1 10); do
#  xdpyinfo -display $DISPLAY >/dev/null 2>&1
#  if [ $? -eq 0 ]; then
#    break
#  fi
#  echo Waiting xvfb...
#  sleep 1
# done
# echo xvfb start success

# Start fluxbox
fluxbox -display $DISPLAY > /workspace/fluxbox.stdout.log 2>&1 &

# start x11
x11vnc -display $DISPLAY -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever > /workspace/x11vnc.stdout.log 2>&1 &

# Start noVNC
/workspace/noVNC/utils/novnc_proxy --vnc localhost:5900 --listen localhost:9900 > /workspace/noVNC.stdout.log 2>&1 &

bash