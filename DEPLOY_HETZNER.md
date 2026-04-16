# AWDMS deployment on Hetzner (Docker Compose)

## 1) Server prep (Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Compose plugin check
docker compose version
```

## 2) Project copy

```bash
git clone <your-repo-url> awdms
cd awdms
```

## 3) Production env

```bash
cp apps/backend/.env.production.example apps/backend/.env.production
```

Update `apps/backend/.env.production`:
- database urls
- jwt secrets
- cors origin (`https://your-domain.com`)
- admin/teacher seed credentials

Optional root `.env` for compose build arg:

```bash
echo 'VITE_API_BASE_URL=/api' > .env
```

## 4) Build and run

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Backend runs Prisma migrate + seed automatically on startup.

## 4.1) One-command deploy script

Project includes scripts so you can deploy with one command:

```bash
chmod +x scripts/deploy-prod.sh scripts/install-docker-ubuntu.sh
sudo bash scripts/install-docker-ubuntu.sh   # run once if docker not installed
bash scripts/deploy-prod.sh
```

Optional custom path:

```bash
PROJECT_DIR=/opt/university-awdms bash scripts/deploy-prod.sh
```

## 5) Domain + TLS (recommended with Caddy)

If domain is ready, easiest path is Caddy as reverse proxy on host.
You can keep container frontend on port `8080` instead of `80`, then let Caddy handle HTTPS.

Minimal Caddyfile:

```caddy
your-domain.com {
    reverse_proxy 127.0.0.1:80
}
```

Install:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 6) Update deploy

```bash
cd awdms
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 7) Useful checks

```bash
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
curl -I http://localhost/
curl -I http://localhost/api/docs
```
