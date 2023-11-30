FROM mcr.microsoft.com/playwright

RUN npm install -g pnpm

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt-get update && apt-get install -y \
    xvfb \
    fluxbox \
    x11vnc \
    supervisor \
    && apt-get autoclean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/

RUN git clone https://github.com/novnc/noVNC.git


EXPOSE 6080

ENV DISPLAY :0
ENV GEOMETRY 1024x768x24

WORKDIR /workspace/uni-drop
ENTRYPOINT [ "/usr/bin/supervisord" ]