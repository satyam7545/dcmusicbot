# 🎵 Harmonix — Discord Music Bot & Real-Time Web Dashboard

Harmonix is a high-fidelity Discord music bot with streaming support for **YouTube** and **Spotify**, paired with a **cyber-vinyl Web Dashboard** offering real-time bi-directional control via WebSockets.

---

## ✨ Features

- **Multi-Source Streaming**: Native audio extraction from YouTube videos/playlists and Spotify tracks/albums/playlists.
- **Modern Web Dashboard**:
  - **Live Vinyl Player**: Rotating 3D vinyl record displaying current album art and playback state.
  - **Audio Wave Visualizer**: Dynamic HTML5 Canvas frequency spectrum waves responding to audio.
  - **Live Scrubber**: Millisecond-precision seeking with hover timestamp previews.
  - **Real-Time Control Dock**: Play, pause, skip, previous, shuffle, and 4-state loop modes (Off, Track, Queue, Autoplay).
  - **Universal Search Modal**: Search YouTube & Spotify songs simultaneously with instant 1-click add to queue or play immediately (`Ctrl+K`).
  - **Equalizer & Sound FX**: Live hardware-accelerated DSP audio filters (Bass Boost, Nightcore, Vaporwave, 8D Spatial Audio, Treble Boost).
  - **Synced Lyrics Drawer**: On-demand song lyrics viewer.
  - **Drag-and-Drop Queue Management**: Move track positions, jump to track, or clear queue.
- **Interactive Discord Embeds**: Rich embeds featuring dynamic progress bars and interactive Discord button rows (`⏮️`, `⏯️`, `⏭️`, `🔀`, `🔁`, `⏹️`).
- **Real-Time Synchronization**: Changes made in Discord reflect in the browser instantly via WebSockets (Socket.IO), and vice versa.
- **Embedded Audio Engine**: Self-contained Node.js + `discord-player` + bundled `ffmpeg-static`. No external Java runtime or Lavalink daemon needed.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v26)
- **Git**

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your Discord credentials:
```env
# Discord Bot Credentials (from https://discord.com/developers/applications)
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Spotify API (optional for metadata & playlist extraction)
# Get credentials at https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Web Dashboard Configuration
PORT=3000
DASHBOARD_URL=http://localhost:3000
SESSION_SECRET=harmonix_super_secret_session_key
```

#### Setting up Discord Developer Portal:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications) and create a New Application.
2. Under **Bot**, click **Reset Token** and copy the token to `DISCORD_TOKEN`.
3. Under **Privileged Gateway Intents**, enable **Guild Voice States** and **Guilds**.
4. Under **OAuth2**:
   - Copy Client ID to `DISCORD_CLIENT_ID` and Client Secret to `DISCORD_CLIENT_SECRET`.
   - Add Redirect URI: `http://localhost:3000/api/auth/callback`.
5. Under **OAuth2 > URL Generator**:
   - Select scopes: `bot`, `applications.commands`.
   - Bot permissions: `Send Messages`, `Embed Links`, `Connect`, `Speak`, `Use Voice Activity`.
   - Open generated URL to invite the bot to your Discord server!

---

### 3. Launch Harmonix

#### Build & Run:
```bash
# Build frontend and server
npm run build

# Start production server & bot
npm start
```

#### Development Mode:
```bash
# Run server with live reload
npm run dev

# (Optional) Run Vite client dev server with HMR on port 5173
npm run dev:client
```

Open your browser to:
👉 **http://localhost:3000**

> **Note for testing without Discord keys configured yet**:
> The dashboard includes an **"Explore Demo Mode"** button on the landing page so you can immediately preview and interact with the full UI console, sound effects, scrubber, and queue!

---

## 💬 Discord Slash Commands

| Command | Description |
|---|---|
| `/play <query>` | Play a song or playlist from YouTube, Spotify, or SoundCloud (supports autocomplete) |
| `/pause` | Pause current playback |
| `/resume` | Resume paused playback |
| `/skip` | Skip to next track in queue |
| `/stop` | Stop playback, clear queue, and leave voice channel |
| `/queue` | View upcoming server playlist |
| `/volume <1-150>` | Adjust volume percentage |
| `/loop <mode>` | Set repeat mode (`off`, `track`, `queue`, `autoplay`) |
| `/shuffle` | Shuffle tracks in queue |
| `/filters <effect>` | Toggle DSP audio filters (Bass Boost, Nightcore, 8D Audio, etc.) |
| `/lyrics [song]` | Display lyrics for current track or search query |
| `/nowplaying` | Display rich embed with interactive button controls |
| `/dashboard` | Get instant link to the Web Dashboard |

---

## 🎛️ Architecture & Tech Stack

- **Audio Engine**: `discord-player` v7 + `discord-player-youtubei` + `@discord-player/extractor` + `play-dl` + `ffmpeg-static`
- **Discord Gateway**: `discord.js` v14 + `@discordjs/voice` + `opusscript` + `libsodium-wrappers`
- **Server**: Express.js + Socket.IO + Discord OAuth2 session authentication
- **Web Dashboard**: React 18 + Vite 6 + Tailwind CSS + Lucide Icons + Canvas Audio Visualizer
- **Bundler**: `esbuild` for zero-overhead server bundling + `vite` for modern frontend bundling
