#!/usr/bin/env bash

xpra start-desktop --start-child=fluxbox --exit-with-children=true --bind-tcp=0.0.0.0:5900 --html=on --daemon=no --xvfb="/usr/bin/Xvfb +extension Composite -screen 0 1920x1080x24+32 -nolisten tcp -noreset" --pulseaudio=no --notifications=no --bell=no :99