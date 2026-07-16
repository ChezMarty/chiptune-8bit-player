🎵 Chiptune 8-Bit Player

A retro-inspired desktop music player designed with a nostalgic 8-bit aesthetic, bringing the look and feel of classic NES-era interfaces to modern systems.

The application features a clean pixel-art UI, a built-in music library, album artwork display with a virtual vinyl record, intuitive playback controls, and customizable visual themes. Every element has been carefully crafted to recreate the charm of vintage gaming while providing a smooth and modern user experience.

✨ Features
🎮 Authentic 8-bit / NES-inspired pixel interface
🎵 Local audio library management
💿 Animated virtual vinyl record with album artwork
⏯️ Play, Pause, Stop, Previous and Next controls
📊 Playback progress bar with seeking support
🔊 Volume control
📁 Simple drag & drop or file import
🎨 Multiple retro themes
⚙️ Settings panel for customization
🖥️ Native desktop application
⚡ Lightweight and responsive
🖼️ Interface

The interface is divided into three main sections:

Library Panel – Browse and manage your music collection.
Now Playing – Displays album artwork on a stylized vinyl record along with the current track information.
Playback Controls – Retro-inspired media controls, progress slider, and volume adjustment.
🎨 Design Philosophy

This project aims to combine the simplicity of vintage console interfaces with the convenience of a modern music player. Every pixel, color, and animation is inspired by the golden age of 8-bit gaming while maintaining usability and performance.

Whether you're listening to chiptune, game soundtracks, or your favorite playlist, Chiptune 8-Bit Player delivers a nostalgic experience without sacrificing modern functionality.

◷ Icon Maintenance

The application icon is a 16×16 pixel-art cassette tape, generated
from a single source-of-truth (`GRID` + `PALETTE` in
`scripts/gen-favicon.mjs`). Every Tauri bundle asset (`bundle.icon`
+ the Windows MSIX `Square*Logo.png` tile set + the macOS legacy
`icon.png`/Apple `icon.icns`) is emitted from this script — there is
no second source of truth and no opportunity for stale residue.

Workflow:

```
npm run icons          # regenerate every emitted icon asset
npm run build          # implicit prebuild hook runs the same script
npm run tauri build    # Tauri’s beforeBuildCommand runs build → icons
npm run verify:icons   # decode every emitted PNG/ICO/ICNS and assert
                       # the cassette signature (cyan #4EE2EC + cream
                       # #F0E6C4) is present
```

To change the icon: edit `GRID` / `PALETTE` in
`scripts/gen-favicon.mjs` and re-run `npm run icons`. NEVER regenerate
via `npx tauri icon <source.png>` — Tauri's icon tool rasterises from
a source PNG with bilinear filtering and will re-introduce exactly
the softening this generator exists to avoid.

For already-installed copies on Windows, run
`tmp-refresh-icon-cache.ps1` (elevated) to drop the per-user
icon/thumbnail cache DBs and restart Explorer so the new icon shows
up immediately in Start menu / taskbar / desktop shortcuts.

For users who ALREADY have the old `.exe` installed: rebuilding the
app alone does not retroactively update the icon on their machine.
Either (a) uninstall and reinstall the new build, or (b) install the
new build over the old and run `tmp-refresh-icon-cache.ps1` once. New
installs (clean install on a fresh machine) require no manual cache
reset — the NSIS installer registers the new icon at install time.

For users who ALREADY have the old `.exe` installed: rebuilding the
app alone does not retroactively update the icon on their machine.
Either (a) uninstall and reinstall the new build, or (b) install the
new build over the old and run `tmp-refresh-icon-cache.ps1` once. New
installs (clean install on a fresh machine) require no manual cache
reset — the NSIS installer registers the new icon at install time.
