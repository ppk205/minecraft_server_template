# Advanced Minecraft Server Template

Welcome to the advanced self-deployable Minecraft Server Template. This template solves the pain points of scaling and managing a containerized server by providing an out-of-the-box management dashboard (built using React and Node.js), robust configuration syncing, tunneling capabilities, and automated CurseForge-to-Modrinth fallbacks.

## Features

- 🖥️ **Sleek Web Interface:** Manage start/stop/restart logic directly from a sleek dark-mode glassmorphism dashboard.
- 💾 **File Manager & Editor:** Browse your `/data` server volume and edit text files directly without needing SFTP.
- 🚀 **Software Switcher:** Swap between Vanilla, Paper, Fabric, or custom CurseForge modpacks with automatic backup prompts.
- 🔄 **CF to Modrinth Engine:** Bypasses Curseforge API blocks by fetching missing mods from the Modrinth API.
- 🌐 **Integrated Tunnels:** Bind Playit.gg, Cloudflared, or tailscale keys easily to host the server globally without port-forwarding.
- ☸️ **DevOps Ready:** K8s resources provided for StateFulSets deployment to Google Cloud/AWS out of the box.

## Getting Started

1. **Clone the repo.**
2. Set up your `.env` configuration. You must define `WEBUI_ADMIN_USER` and `WEBUI_ADMIN_PASS` inside `webui/backend/.env`. A `.env.example` has been provided for you.
3. Bring up the stack via Docker Compose:
```bash
docker compose build
docker compose up -d
```
4. Find the web control panel at `http://localhost:3001`. Login with your defined administrator credentials.

## Crash Solution

If your server crashes continuously and you are locked out of the Game Server Console:
- Log in to the WebUI.
- View the "Live Console" to find the error stack trace.
- Go to **File Explorer**, navigate to `crash-reports/` and read the latest crash.
- Usually, out-of-memory crashes can be resolved by increasing the `MEMORY: 8G` inside the configuration panel and restarting. Conflicting mods should be removed using the File Explorer.

## Modrinth Fallback Downloader
In the **Settings** tab, type the namespace of any Curseforge mod that blocked external downloads. The engine will query and download the Modrinth equivalent directly into your `mods/` directory.

## Kubernetes Demo
To deploy this setup using K8s instead of Docker Compose (for orchestrating multiple game instances):
```bash
kubectl apply -f ./k8s/minecraft-stack.yaml
```
