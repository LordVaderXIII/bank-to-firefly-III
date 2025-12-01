# Use Node 20 on Debian Bookworm as base
FROM node:20-bookworm

# Install basic utilities and X11/VNC dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    x11vnc \
    fluxbox \
    supervisor \
    net-tools \
    python3 \
    git \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC (web-based VNC viewer)
RUN git clone --depth 1 https://github.com/novnc/noVNC.git /opt/novnc \
    && git clone --depth 1 https://github.com/novnc/websockify /opt/novnc/utils/websockify \
    && ln -s /opt/novnc/vnc.html /opt/novnc/index.html

# Create app directory
WORKDIR /app

# Copy root package files if any (we are in monorepo but effectively building flat)
# We will copy backend and frontend separately to build.

# Backend Setup
COPY src/backend/package.json ./backend/package.json
WORKDIR /app/backend
RUN npm install
COPY src/backend ./

# Frontend Setup
# We assume the frontend is pre-built or we build it here.
# Let's build it here for a single container solution.
WORKDIR /app/frontend
COPY src/frontend/package.json ./
# We will init frontend later, so this might fail if files don't exist yet.
# For now, let's assume we copy the whole src structure.

# Let's adjust the context. We will copy everything.
WORKDIR /app
COPY . .

# Build Backend
WORKDIR /app/backend
RUN npm run build

# Build Frontend (We will scaffold it in next steps, but adding instruction here)
# WORKDIR /app/src/frontend
# RUN npm install && npm run build
# For the VNC/UI to work on same port, we might serve frontend via Express backend
# OR run a separate simple http server.
# Plan: Express backend serves the React static files.

# Set up Supervisor to run Xvfb, Fluxbox, x11vnc, noVNC, and Node App
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment variables
ENV DISPLAY=:0
ENV SCREEN_WIDTH=1280
ENV SCREEN_HEIGHT=1024
ENV SCREEN_DEPTH=24
ENV NODE_ENV=production

# Expose ports
# 3000: Main App (Express + React)
# 6080: noVNC (Web VNC)
EXPOSE 3000 6080

# Volumes
VOLUME ["/config", "/downloads"]

# Entrypoint via supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
