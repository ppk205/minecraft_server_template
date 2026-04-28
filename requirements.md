A damn simple minecraft server

Want it just look like aternos, but more advanced stuff and can install any modpack, plugin, or server software.

Requirements:

- Run with docker, depend on the compose file i already have in this directory
- Can solve the problem when downloading curseforge pack, if missing mods and can't download with curse api, automatically switch to modrinth api to download.
- Easy WebUI for manage, monitoring, and control server, easy and automatically change software installed inside
- If changed software installed inside, ask user if they want to backup their save files before delete everything inside the server folder and install new software, then start server.
- Because this is self-deployment, and lots of them don't know how to open ports, so prepare options and field for them to choose and setup their API keys for the server(ngrok, playit.gg, cloudflared (with domain), tailscale, or just radmin VPN for simple)
- User can easily access to their server files, editing configs and stuff, or even add their own mods, and configurable allocated RAM
- Seemless sync when edit and save files on the server, and the server automatically restart to apply the changes from docker compose
- Prepare this likes a DevOps demo project, and show how i can scale this into k8s services to make server even more scalable
- Not everyone have IT knowledge, so make an easy to understand documentation for them to follow and setup their server