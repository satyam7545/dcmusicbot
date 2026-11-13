# ☁️ Deploying Harmonix on Google Cloud (GCP) Ubuntu Server

This guide provides step-by-step instructions for hosting Harmonix on a Google Cloud Compute Engine (GCP VM) running **Ubuntu Server 24.04 or 22.04 LTS**.

---

## 📋 1. Provision GCP Compute Engine Instance

1. In the [Google Cloud Console](https://console.cloud.google.com/), go to **Compute Engine > VM instances**.
2. Click **Create Instance**:
   - **Name**: `harmonix-bot`
   - **Region / Zone**: Choose the region closest to your Discord user base.
   - **Machine Configuration**: `e2-small` (2 vCPU, 2 GB memory) or `e2-medium` (2 vCPU, 4 GB memory) is plenty for a high-performance bot.
   - **Boot Disk**: Click *Change*, select **Ubuntu 24.04 LTS** or **Ubuntu 22.04 LTS** (x86/64, 25 GB SSD).
   - **Firewall**: Check both **Allow HTTP traffic** and **Allow HTTPS traffic**.
3. Under **Advanced options > Networking**:
   - Reserve a **Static External IP** (under Network interfaces > External IPv4 address > *Create IP address*).
4. Click **Create**.

---

## 🔑 2. Update Discord Developer Portal

With your static GCP External IP (or custom domain):
1. Go to [Discord Developer Portal](https://discord.com/developers/applications) > Your Application > **OAuth2**.
2. Add Redirect URI:
   - If using custom domain: `https://your-domain.com/api/auth/callback`
   - If using IP directly: `http://YOUR_STATIC_GCP_IP:3000/api/auth/callback`
3. Click **Save Changes**.

---

## 💻 3. Server Preparation & System Packages

SSH into your GCP VM:
```bash
# Update Ubuntu package repositories
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install audio dependencies, build tools & process tools
sudo apt install -y ffmpeg libopus-dev git build-essential nginx certbot python3-certbot-nginx

# Verify versions
node -v    # v22.x
npm -v
ffmpeg -version
```

---

## 📦 4. Clone and Build Harmonix

```bash
# Clone your project repository (or transfer files via scp/git)
git clone <your-repository-url> /home/ubuntu/dcmusic
cd /home/ubuntu/dcmusic

# Install dependencies
npm ci

# Configure production environment
cp .env.example .env
nano .env
```

Fill in your production values in `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

PORT=3000
DASHBOARD_URL=https://your-domain.com  # or http://YOUR_STATIC_GCP_IP:3000
SESSION_SECRET=a_long_random_64_character_secret_string
NODE_ENV=production
```

Build the React frontend and bundle the server:
```bash
npm run build
```

---

## 🚀 5. Production Process Management

You have two choices for production execution:

### Choice A: PM2 (Recommended for direct Node runtime)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start Harmonix via ecosystem config
pm2 start ecosystem.config.cjs --env production

# Ensure auto-restart on VM reboot
pm2 startup systemd
# (Run the sudo env PATH... command output by PM2)
pm2 save

# Useful PM2 commands:
pm2 status
pm2 logs harmonix
pm2 restart harmonix
```

### Choice B: Docker & Docker Compose
```bash
# Install Docker on Ubuntu
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker

# Start container
docker compose up -d --build

# View logs
docker compose logs -f
```

---

## 🔒 6. Nginx Reverse Proxy & Free Let's Encrypt SSL

1. Copy the Nginx configuration:
```bash
sudo cp deploy/nginx/harmonix.conf /etc/nginx/sites-available/harmonix.conf
sudo ln -s /etc/nginx/sites-available/harmonix.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

2. Edit `/etc/nginx/sites-available/harmonix.conf` to set your domain name:
```bash
sudo nano /etc/nginx/sites-available/harmonix.conf
```

3. Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. Obtain a free SSL Certificate with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically configure HTTPS, HTTP-to-HTTPS redirect, and automatic certificate renewals!

---

## 🛡️ 7. Security Hardening Checklist (Already Implemented)

- [x] **Strict OAuth2 CSRF Nonce**: Random cryptographic state token prevents OAuth injection.
- [x] **Broken Access Control / IDOR Guard**: `requireGuildAccess` middleware prevents users from controlling playback in guilds they don't have manage rights in.
- [x] **Dev Login Disabled in Production**: `/api/auth/dev-login` is disabled in `NODE_ENV=production`.
- [x] **Rate Limiting**: `express-rate-limit` prevents API brute force & YouTube scrape exhaustion.
- [x] **Helmet Security Headers**: Blocks MIME sniffing, clickjacking, and script exploits.
- [x] **Persistent FileStore Sessions**: Login sessions survive server restarts without MemoryStore leaks.
- [x] **Global Crash Guards**: `unhandledRejection` and `uncaughtException` prevent transient voice network drops from crashing the process.
