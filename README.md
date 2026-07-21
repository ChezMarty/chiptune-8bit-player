# 🎵 Chiptune 8-Bit Player

**Version 0.1.0**

A retro-inspired desktop music player with a nostalgic 8-bit aesthetic, bringing the look and feel of classic NES-era interfaces to modern systems — with **Spotify streaming** support powered by Librespot.

Built with [Tauri 2](https://v2.tauri.app/) (Rust) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/), designed to feel like a native app with pixel-perfect retro charm.

![Chiptune 8-Bit Player](https://img.shields.io/badge/version-0.1.0-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Tauri](https://img.shields.io/badge/Tauri-2-purple) ![React](https://img.shields.io/badge/React-19-61DAFB)

---

## ✨ Features

### 🎮 Core Experience
- **Authentic 8-bit / NES-inspired pixel interface** — every pixel is crafted for that vintage console feel
- **Animated virtual vinyl record** with album artwork display
- **Playback controls** — Play, Pause, Stop, Previous, Next with keyboard shortcuts
- **Progress/seek bar** with click-to-seek and drag support
- **Volume control** with configurable starting volume
- **Playback queue** management — shuffle, reorder by drag, clear queue
- **Upcoming track count** displayed in the footer

### 🎵 Audio Support
- **Local audio files** — import via drag & drop, file picker, or right-click menu
- **Song metadata** — auto-detected title, artist, album, album art via `music-metadata`
- **Playback persistence** — library survives app restarts

### 🟢 Spotify Integration
- **OAuth PKCE login** — secure, no server-side secret needed
- **Browse Spotify library** — liked songs, playlists, top tracks
- **Spotify search** — search tracks, albums, artists, and playlists
- **Two playback engines:**
  - **🔊 Librespot** (primary) — direct Spotify audio streaming via the open-source [librespot](https://github.com/librespot-org/librespot) library (v0.8) — streams audio directly without the official Spotify client
  - **🎧 Spotify Web Playback SDK** (fallback) — browser-based playback via Spotify's official SDK
- **Experimental warning dialog** — informs users that Librespot is an independent open-source project
- **Automatic tab switching** — auto-switches to Spotify tab when connected (if local library is empty)

### 🎨 Theme System
- **70+ retro themes** organized into 6 categories:
  - 🎮 **Classic Consoles** — NES, SNES, Game Boy, Sega Genesis, PlayStation, Nintendo Switch, and more
  - 💾 **Retro Computers** — Windows 95/98/XP/7, MS-DOS, Macintosh Classic, Commodore 64, Amiga
  - 🖥️ **CRT & Terminal** — Green phosphor, Amber terminal, Matrix hacker, Monochrome
  - 🎭 **Artistic** — Vaporwave, Synthwave sunset, Tokyo Night, Dracula, Nord, Catppuccin, Cyberpunk 2077
  - 🔊 **Music & Audio** — Vinyl Studio, Cassette Player, Walkman, Hi-Fi Stereo, Boombox
  - 🌿 **Nature & Mood** — Midnight Purple, Ocean Blue, Sakura Pink, Forest Pixel, Halloween, Christmas
- **Theme search** — quickly find themes by name
- **Theme favorites** — bookmark your favorites for quick access
- **Theme sort modes** — sort by name or favorites
- **Smooth theme transitions** — animated crossfade when switching themes

### ⚙️ Settings Panel
- **Language** — English, French, or OS auto-detect
- **Playback** — starting volume, auto-play on import, stop behavior (pause/rewind), shuffle on import
- **Display** — always-on-top mode
- **Spotify** — Client ID configuration, connection status, Librespot version info, experimental warning toggle

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Seek ±5 seconds |
| `Shift + ←` / `Shift + →` | Previous / Next track |
| `↑` / `↓` | Volume ±5% |
| `Esc` | Close dialog / menu |

### 🖱️ Context Menus
- **App context menu** (right-click anywhere) — Play/Pause, Next, Prev, Stop, Add Files, Shuffle Queue, Clear Queue, Theme selection, Shortcuts, About, Quit
- **Track context menu** (right-click a track) — Play, Play Next, Move Up/Down, Show in Folder, Copy Path, Track Info, Remove (with confirmation)

### 🖼️ Interface Sections
The interface is divided into four main sections:
1. **Library Panel** — Browse and manage your local music collection and/or Spotify library
2. **Now Playing Sidebar** — Shows the current queue, upcoming tracks, and end-of-queue state
3. **Record Player** — Displays album artwork on a stylized vinyl record with track info
4. **Transport Controls** — Retro-inspired media controls, progress slider, and volume adjustment

### 🌍 Internationalization
- English and French translations included
- Auto-detect from system language
- Architecture ready for additional locales

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **State Management** | Zustand 5 |
| **Desktop Shell** | Tauri 2 (Rust) |
| **Audio - Local** | HTML5 Web Audio API |
| **Audio - Spotify** | Librespot (core + playback v0.8) / Spotify Web Playback SDK |
| **Metadata** | music-metadata |
| **Styling** | CSS (pixel-art custom properties), Google Fonts (Press Start 2P, VT323) |
| **Storage** | Tauri plugin-fs, OS secure credential store (keyring) |
| **Icons** | SVG + ICO favicon |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) (latest stable) with Cargo
- [Tauri CLI](https://v2.tauri.app/start/cli/) (`cargo install tauri-cli --version "^2"`)
- For Spotify features: A [Spotify Developer](https://developer.spotify.com/) account with a registered app

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd chiptune-8bit-player

# 2. Install frontend dependencies
npm install

# 3. Generate favicons
npm run icons

# 4. Run in development mode
npm run tauri dev
```

The app window will open with the retro interface. Add audio files via the `+ ADD` button or right-click → `Add Files`.

### 🔌 Setting Up Spotify

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app
2. Add `http://127.0.0.1:49436/callback` to the Redirect URIs in your Spotify app settings
3. Open the app → click the gear icon ⚙ → navigate to the **SPOTIFY** section
4. Enter your Spotify **Client ID** and click **SAVE**
5. Click **CONNECT TO SPOTIFY** to authorize via your browser

> ⚠️ Spotify playback requires a **Premium** account when using the Librespot engine. The Spotify Web Playback SDK works with any account type but requires the official Spotify client to be running.

---

## 📦 Building

```bash
npm run tauri build
```

The bundled application will be available in `src-tauri/target/release/bundle/`.

---

## 🎯 Design Philosophy

This project aims to combine the simplicity of vintage console interfaces with the convenience of a modern music player. Every pixel, color, and animation is inspired by the golden age of 8-bit gaming while maintaining usability and performance.

Whether you're listening to chiptune, game soundtracks, or your favorite playlist, **Chiptune 8-Bit Player** delivers a nostalgic experience alongside modern features — and with Spotify integration, your entire streaming library is just a click away.

---

## 📁 Project Structure

```
chiptune-8bit-player/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # React components
│   │   ├── TitleBar.tsx          # Custom window title bar
│   │   ├── Library.tsx           # Local library browser
│   │   ├── SpotifyPanel.tsx      # Spotify library browser
│   │   ├── RecordPlayer.tsx      # Animated vinyl record display
│   │   ├── TransportControls.tsx # Playback controls
│   │   ├── SettingsDrawer.tsx    # Settings panel
│   │   ├── ThemeSwitcher.tsx     # Theme selection UI
│   │   ├── AppContextMenu.tsx    # Right-click app menu
│   │   ├── ContextMenu.tsx       # Reusable context menu
│   │   ├── AboutDialog.tsx       # About dialog
│   │   ├── KeyboardShortcutsDialog.tsx
│   │   ├── TrackInfoDialog.tsx   # Track metadata dialog
│   │   ├── LibrespotWarningDialog.tsx
│   │   ├── SettingsButton.tsx    # Settings toggle button
│   │   ├── NowPlaying.tsx        # Now playing sidebar
│   │   └── ...
│   ├── lib/                      # Business logic
│   │   ├── playback/             # Playback engine & providers
│   │   │   ├── engine.ts         # Singleton playback facade
│   │   │   ├── localProvider.ts  # Local file audio provider
│   │   │   ├── librespotProvider.ts  # Librespot provider
│   │   │   ├── spotifySdkProvider.ts # Spotify SDK provider
│   │   │   └── types.ts          # Provider interfaces
│   │   ├── addAudioFiles.ts      # File import logic
│   │   ├── libraryPersistence.ts # Save/restore library state
│   │   ├── metadata.ts           # Audio metadata extraction
│   │   ├── pixelate.ts           # Pixel art utility
│   │   ├── preferences.ts        # Persisted preferences
│   │   └── spotify.ts            # Spotify API client (frontend)
│   ├── state/                    # Zustand state stores
│   │   ├── usePlayerStore.ts     # Main player state
│   │   └── useSpotifyStore.ts    # Spotify auth & data state
│   ├── themes/                   # Theme engine & definitions
│   │   ├── definitions/          # 6 category files, ~60 themes
│   │   ├── engine.ts             # Theme application & persistence
│   │   ├── patterns.ts           # Reusable pattern definitions
│   │   └── types.ts              # Theme type definitions
│   ├── i18n/                     # Internationalization
│   │   ├── I18nProvider.tsx
│   │   ├── useT.ts
│   │   └── locales/
│   │       ├── en.json           # English translations
│   │       └── fr.json           # French translations
│   ├── styles/                   # CSS style modules
│   │   ├── 8bit.css              # Main pixel-art styles
│   │   ├── settings.css          # Settings drawer styles
│   │   ├── spotify.css           # Spotify panel styles
│   │   └── titlebar.css          # Title bar styles
│   ├── App.tsx                   # Root component
│   ├── App.css                   # App-level styles
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── src-tauri/                    # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs               # Desktop entry point
│   │   ├── lib.rs                # Tauri plugin & command registration
│   │   ├── commands.rs           # Tauri IPC commands
│   │   ├── librespot/            # Librespot integration
│   │   │   └── mod.rs            # Session, player, PCM audio sink
│   │   └── spotify/              # Spotify Web API integration
│   │       ├── mod.rs            # Service & token management
│   │       ├── api.rs            # Web API client
│   │       ├── auth.rs           # OAuth PKCE flow
│   │       ├── models.rs         # API response types
│   │       └── token_store.rs    # Secure credential storage
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── scripts/                      # Build utilities
│   ├── gen-favicon.mjs           # Favicon generation
│   └── verify-icons.mjs          # Icon verification
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

### Third-Party Components

- **Librespot** — licensed under MIT. Copyright © 2024 librespot-org. See [github.com/librespot-org/librespot](https://github.com/librespot-org/librespot).
- **Spotify Web Playback SDK** — proprietary, used under Spotify's Developer Terms.
- Spotify playback is powered by Librespot, an independent open-source implementation of the Spotify protocol. Librespot is **not** developed or endorsed by Spotify.
