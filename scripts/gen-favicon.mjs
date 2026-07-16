#!/usr/bin/env node
// scripts/gen-favicon.mjs
//
// Pixel-art cassette tape favicon + Tauri bundle icon generator.
//
// Source of truth: `GRID` (16×16 cell map) + `PALETTE` (8 RGB tuples) below.
// Edit either and re-run to regenerate every output.
//
// Usage:
//   node scripts/gen-favicon.mjs      # regenerate all favicons
//
// Outputs:
//   - public/favicon.svg                       — browser/webview tab icon
//                                                (sharp pixel art via
//                                                shape-rendering="crispEdges")
//   - public/favicon.ico                       — multi-frame ICO (16/32/48) for
//                                                legacy browsers / Windows tools
//   - public/favicon-source.png                — 512×512 PNG re-emitted from GRID
//                                                so any stale residue from a
//                                                previous icon set is overwritten
//   - src-tauri/icons/32x32.png                — Tauri Windows/Linux bundle
//   - src-tauri/icons/128x128.png              — 〃
//   - src-tauri/icons/128x128@2x.png           — alt 256×256 bundle icon
//   - src-tauri/icons/icon.ico                 — Tauri Windows bundle (multi-frame:
//                                                 16/32/48/64/128/256; RGBA PNG entries
//                                                so compile-time
//                                                `tauri::generate_context!()` accepts it)
//   - src-tauri/icons/icon.icns                — Tauri macOS bundle (RGBA PNGs at
//                                                16/32/64/128/256/512/1024)
//   - src-tauri/icons/64x64.png                — extra Tauri bitmap fallback
//   - src-tauri/icons/icon.png                 — legacy macOS / openable
//                                                "any-app" fallback at 512×512
//   - src-tauri/icons/Square{30,44,71,89,
//     107,142,150,284,310}x{N}Logo.png        — Tauri-generated Windows
//                                                MSIX/Appx tile set; sizes
//                                                are fixed by Tauri's icon
//                                                tool. Each is regenerated
//                                                from GRID via the
//                                                nearest-neighbour fallback
//                                                (see emitRaster below) so
//                                                no stale residue survives
//                                                a previous icon set.
//   - src-tauri/icons/StoreLogo.png            — Microsoft Store logo
//                                                placeholder (50×50)
//
// Why we emit Tauri bundle icons directly:
//   `npx tauri icon` rasterises the source via the Rust `image` crate, which
//   always uses bilinear interpolation. That softens pixel-art edges no matter
//   the source — both an SVG with `shape-rendering="crispEdges"` and a 1024×1024
//   PNG end up with 18–122 distinct RGBA tuples in the resulting 32×32 PNG. The
//   only way to get crisp pixel art at every output resolution is to encode
//   each Tauri bundle artefact byte-for-byte from the source grid (no resample).
//
// ◷ Maintenance contract:
//   To change the icon, edit GRID / PALETTE below and re-run this script
//   (`node scripts/gen-favicon.mjs` or `npm run icons`). NEVER regenerate
//   via `npx tauri icon <source.png>` — Tauri's icon tool rasterises from a
//   source PNG with bilinear filtering and will re-introduce exactly the
//   softening this script exists to avoid. This script also double-writes
//   `dist/favicon.*` if `dist/` exists, so a `npm run icons` call alone
//   (without `npm run build`) is enough to refresh a stale built bundle.
//
// Approach notes:
//   - 8-bit indexed PNG with a tRNS chunk so palette index 0 = transparent
//     (used for the standalone Tauri bitmap PNGs in 32×32 / 128×128 /
//     128×128@2x and for vite-served public/favicon.ico — all of these
//     consumers accept palette-indexed PNGs).
//   - 8-bit RGBA PNG (color-type 6) for entries inside the Tauri
//     `icon.ico` and for every ICNS entry: the Rust `ico` crate used by
//     `tauri::generate_context!()` rejects color-type-3 (indexed) PNGs
//     inside an ICO with "Unsupported PNG color type: Indexed", and
//     Apple accepts PNG-encoded ICNS payloads since macOS 10.7. RGBA
//     in both containers sidesteps these decoder quirks.
//   - Each 16×16 logical cell blows up to a (physical/16)×(physical/16) solid
//     block, so integer multiples (16, 32, 48, 64, 128, 256, 512, 1024) stay
//     pixel-perfect with no resampling.
//   - IDAT data is compressed with deflateSync (zlib format with 2-byte header
//     + deflate + Adler32 trailer). PNG spec requires zlib, NOT raw deflate,
//     so do not switch to deflateRawSync here.

import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

// ─── Source of truth ──────────────────────────────────────────────
const W = 16;
const H = 16;

// Palette: index → RGB. Index 0 is treated as the transparent sentinel
// (its RGB values are never seen because tRNS marks alpha = 0).
// Hex values chosen to harmonise with the default theme in src/index.css:
//   accent-red #E52521, accent-amber #F1B94C, accent-cyan #4EE2EC,
//   bg-panel #1A1A2E. The cassette is rendered against the dark
// "default" theme, so the cream label and the 3 accent dashes pop out.
const PALETTE = [
  [0x00, 0x00, 0x00], // 0: transparent sentinel (alpha forced to 0)
  [0x2b, 0x2b, 0x2b], // 1: shell border / outer edge of the housing
  [0x4a, 0x4a, 0x4a], // 2: shell body panel
  [0xf0, 0xe6, 0xc4], // 3: cream cassette label
  [0xe5, 0x25, 0x21], // 4: red text-dash on the label
  [0xf9, 0xa0, 0x3f], // 5: amber text-dash (F1B94C rounded slightly warmer)
  [0x4e, 0xe2, 0xec], // 6: cyan text-dash
  [0x18, 0x18, 0x18], // 7: reel / tape shadow
];

// 16×16 pixel grid. Row 0 = top, row 15 = bottom. Col 0 = left, col 15 = right.
// Rows 0 and 12–15 are all 0 (transparent) so the icon reads as a freestanding
// cassette on any background (browser tab, dock, installer). Inner rows build
// the recognisable cassette silhouette: cream label band (rows 3–5) above a
// dark reel section with two reel hubs (rows 7–9).
const GRID = [
  // R0  top margin
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // R1  top edge of the cassette (border runs the full width)
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  // R2  panel band above the label
  [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
  // R3  cream label, blank line
  [0,1,2,3,3,3,3,3,3,3,3,3,3,2,1,0],
  // R4  cream label with red/amber/cyan text-dashes
  [0,1,2,3,4,5,6,3,3,3,3,3,3,2,1,0],
  // R5  cream label, blank line
  [0,1,2,3,3,3,3,3,3,3,3,3,3,2,1,0],
  // R6  panel band between label and reel section
  [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
  // R7  reels (4 cols each) with 2-col gap between them
  [0,1,2,7,7,7,7,2,2,7,7,7,7,2,1,0],
  // R8  reels with cream hubs in the middle (recognisable cassette detail)
  [0,1,2,7,3,3,7,2,2,7,3,3,7,2,1,0],
  // R9  bottom of reels
  [0,1,2,7,7,7,7,2,2,7,7,7,7,2,1,0],
  // R10 panel band below the reel section
  [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
  // R11 bottom edge of the cassette
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  // R12–R15 bottom margin
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Validate the grid shape and palette indices up front so corrupt data
// fails loudly instead of producing a malformed PNG.
for (const row of GRID) {
  if (row.length !== W) throw new Error(`grid row has ${row.length} cols, expected ${W}`);
}
if (GRID.length !== H) throw new Error(`grid has ${GRID.length} rows, expected ${H}`);
for (const row of GRID) {
  for (const c of row) {
    if (!Number.isInteger(c) || c < 0 || c >= PALETTE.length) {
      throw new Error(`invalid palette index ${c}`);
    }
  }
}

// ─── Small helpers ────────────────────────────────────────────────
const hexByte = (n) => n.toString(16).padStart(2, '0');

// Precompute the CRC32 table once. PNG chunk CRCs use IEEE CRC-32.
const CRC_TABLE = (() => {
  const T = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    T[n] = c;
  }
  return T;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Wrap a Type + Data pair into a PNG chunk (length || type || data || crc32).
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// ─── 1. SVG emitter ───────────────────────────────────────────────
// Emits horizontal runs of same-coloured cells to keep the file tiny and
// the SVG fast to render (much fewer <rect> than 16*16=256 naïve emission).
function emitSVG() {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" role="img" aria-label="Chiptune 8-Bit Player">`,
    `<title>Chiptune 8-Bit Player</title>`,
  ];
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const c = GRID[y][x];
      if (c === 0) { x++; continue; }
      let len = 1;
      while (x + len < W && GRID[y][x + len] === c) len++;
      const [r, g, b] = PALETTE[c];
      parts.push(
        `<rect x="${x}" y="${y}" width="${len}" height="1" fill="#${hexByte(r)}${hexByte(g)}${hexByte(b)}"/>`,
      );
      x += len;
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

// ─── 2. PNG emitters (indexed + RGBA, via shared workhorse) ───────
// Both emitPNG (indexed, used by vite favicon.ico + Tauri bitmaps) and
// emitRGBA (used by the ICNS macOS bundle) are thin wrappers around the
// shared emitRaster workhorse below.
//
// emitRaster supports ANY positive integer physical size via a
// single nearest-neighbour sampling rule:
//
//     srcY = floor(y * H / physicalH)
//     srcX = floor(x * W / physicalW)
//
// For integer multiples of W=H=16 (16, 32, 48, 64, 128, 256, 512, 1024),
// this collapses to the same value as the previous "block-replication"
// path (`floor(y / cellH)` where cellH = physicalH / 16 is an integer),
// so every pre-existing PNG/ICO/ICNS output is byte-for-byte
// reproducible — re-running this script never changes a file that
// was already a cassette.
//
// For arbitrary sizes (e.g. the 30, 44, 71, 89, 107, 142, 150, 284,
// 310 px Square*Logo MSIX tiles that Tauri's icon tool pins at fixed
// dimensions every time it rasterises from a source PNG), the
// per-cell replication count varies between floor(physicalW/W)
// and ceil(physicalW/W) — standard nearest-neighbour behaviour that
// keeps the cassette silhouette intact, just with a slightly uneven
// cell stride. That's still recognisably pixel art and is
// dramatically better than letting any stale residue from a prior
// icon set survive on disk.
function emitPNG(physicalW, physicalH) {
  return emitRaster(physicalW, physicalH, 3);
}

function emitRGBA(physicalW, physicalH) {
  return emitRaster(physicalW, physicalH, 6);
}

function emitRaster(physicalW, physicalH, colorType) {
  if (colorType !== 3 && colorType !== 6) {
    throw new Error(`emitRaster: unsupported colorType ${colorType} (expected 3 or 6)`);
  }
  if (
    !Number.isInteger(physicalW) || physicalW < 1 ||
    !Number.isInteger(physicalH) || physicalH < 1
  ) {
    throw new Error(
      `emitRaster: physical size ${physicalW}x${physicalH} must be positive integers`,
    );
  }
  const channels = colorType === 3 ? 1 : 4;

  // PNG filter byte 0 (None) per scanline, then physicalW * channels bytes
  // of pixel data (1 byte/pixel for indexed, 4 bytes/pixel for RGBA).
  const scanlineBytes = 1 + physicalW * channels;
  const raw = Buffer.alloc(scanlineBytes * physicalH);
  for (let y = 0; y < physicalH; y++) {
    const off = y * scanlineBytes;
    raw[off] = 0;
    const gy = Math.min(H - 1, Math.floor((y * H) / physicalH));
    for (let x = 0; x < physicalW; x++) {
      const gx = Math.min(W - 1, Math.floor((x * W) / physicalW));
      const idx = GRID[gy][gx];
      if (colorType === 3) {
        raw[off + 1 + x] = idx;
      } else {
        const [r, g, b] = PALETTE[idx];
        const p = off + 1 + x * 4;
        raw[p + 0] = r;
        raw[p + 1] = g;
        raw[p + 2] = b;
        raw[p + 3] = idx === 0 ? 0 : 255; // palette[0] is the transparent sentinel
      }
    }
  }
  const idat = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(physicalW, 0);
  ihdr.writeUInt32BE(physicalH, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const parts = [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
  ];
  if (colorType === 3) {
    // PLTE: 3 bytes per palette entry.
    const N = PALETTE.length;
    const plte = Buffer.alloc(N * 3);
    for (let i = 0; i < N; i++) {
      plte[i * 3 + 0] = PALETTE[i][0];
      plte[i * 3 + 1] = PALETTE[i][1];
      plte[i * 3 + 2] = PALETTE[i][2];
    }
    // tRNS: per-palette alpha (255 except for the transparent sentinel).
    const trns = Buffer.alloc(N);
    for (let i = 0; i < N; i++) trns[i] = i === 0 ? 0 : 255;
    parts.push(pngChunk('PLTE', plte), pngChunk('tRNS', trns));
  }
  parts.push(pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// ─── 3. ICO emitter (PNG-encoded entries) ─────────────────────────
// Windows Vista+ happily reads PNG-encoded ICO entries; modern browsers,
// dev tools and TB+ installers all accept them. The output is a single
// ICO file containing multiple sizes, packed back-to-back.
//
// `opts.useRGBA` switches each entry from a palette-indexed PNG (color
// type 3, smaller bytes) to an RGBA PNG (color type 6, larger bytes).
// The Rust `ico` crate invoked by `tauri::generate_context!()` rejects
// indexed-color PNGs inside an ICO, so the Tauri-bound `icon.ico` must
// be emitted with `useRGBA: true`. The browser-bound `public/favicon.ico`
// keeps the indexed form for compactness since browser ICO decoders
// don't share that restriction.
function emitICO(sizes, { useRGBA = false } = {}) {
  const N = sizes.length;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved, must be 0
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(N, 4); // image count

  const pngs = sizes.map((s) => (useRGBA ? emitRGBA(s, s) : emitPNG(s, s)));
  const dirSize = N * 16;
  const entries = Buffer.alloc(dirSize);

  // Track running offset so each ICONDIRENTRY points at the right PNG.
  let dataOff = 6 + dirSize;
  for (let i = 0; i < N; i++) {
    const s = sizes[i];
    const png = pngs[i];
    const isLarge = s >= 256; // width/height byte = 0 means 256 (or larger)
    const o = i * 16;
    entries[o + 0] = isLarge ? 0 : s;       // width
    entries[o + 1] = isLarge ? 0 : s;       // height
    entries[o + 2] = 0;                      // colour count (unused for >256)
    entries[o + 3] = 0;                      // reserved
    entries.writeUInt16LE(1, o + 4);         // colour planes
    entries.writeUInt16LE(32, o + 6);        // bits per pixel
    entries.writeUInt32LE(png.length, o + 8); // data size
    entries.writeUInt32LE(dataOff, o + 12);  // data offset
    dataOff += png.length;
  }

  return Buffer.concat([header, entries, ...pngs]);
}

// ─── 4. ICNS emitter (Apple Icon Image format) ─────────────────────
// Header: 4-byte ASCII magic 'icns' + 4-byte big-endian total file size.
// Each entry: 4-byte ASCII OSType code + 4-byte big-endian entry size
// (including the 8-byte entry header) + payload. PNG-encoded payloads
// have been supported inside ICNS since macOS 10.7.
//
// OSType codes (Apple "icNN" convention):
//   ic04 = 16×16,   ic05 = 32×32,   ic06 = 64×64,
//   ic07 = 128×128, ic08 = 256×256, ic09 = 512×512, ic10 = 1024×1024
// We deliberately stay on the "natural" set (no @2x duplicates) — the
// RGBA PNGs already render crisply at every macOS display density.
function emitICNS(sizes) {
  const typeMap = {
    16: 'ic04',
    32: 'ic05',
    64: 'ic06',
    128: 'ic07',
    256: 'ic08',
    512: 'ic09',
    1024: 'ic10',
  };
  const entries = sizes.map((s) => {
    const type = typeMap[s];
    if (!type) throw new Error(`emitICNS: no OSType code for ${s}px`);
    const png = emitRGBA(s, s);
    const code = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(8 + png.length, 0);
    return Buffer.concat([code, len, png]);
  });
  const body = Buffer.concat(entries);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(8 + body.length, 4);
  return Buffer.concat([header, body]);
}

// ─── Run ──────────────────────────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const projectDir = join(here, '..');
const publicDir = join(projectDir, 'public');
const tauriIconsDir = join(projectDir, 'src-tauri', 'icons');
mkdirSync(publicDir, { recursive: true });
mkdirSync(tauriIconsDir, { recursive: true });

// 1. Browser / webview favicons (Vite serves `public/` at `/`).
writeFileSync(join(publicDir, 'favicon.svg'), emitSVG() + '\n', 'utf8');
writeFileSync(join(publicDir, 'favicon.ico'), emitICO([16, 32, 48]));

// 2. Tauri desktop bundle artefacts — emitted pixel-perfect from GRID so
//    Tauri's image-crate bilinear rasteriser never gets a chance to blur
//    the cassette's hard pixel edges.
writeFileSync(join(tauriIconsDir, '32x32.png'), emitPNG(32, 32));
writeFileSync(join(tauriIconsDir, '128x128.png'), emitPNG(128, 128));
writeFileSync(join(tauriIconsDir, '128x128@2x.png'), emitPNG(256, 256));
writeFileSync(
  join(tauriIconsDir, 'icon.ico'),
  emitICO([16, 32, 48, 64, 128, 256], { useRGBA: true }),
);
writeFileSync(
  join(tauriIconsDir, 'icon.icns'),
  emitICNS([16, 32, 64, 128, 256, 512, 1024]),
);

// 3. Tauri Windows MSIX / Appx tile set + extra legacy fallbacks.
//    Used here as belt-and-braces: Tauri's NSIS bundler only consumes
//    `bundle.icon` from tauri.conf.json (5 entries above), so the
//    Square*Logo / StoreLogo / 64x64 / icon.png files are NOT shipped
//    inside the NSIS installer. We still regenerate each of them
//    here because:
//      (a) they were left on disk from a previous (`npx tauri icon`)
//          run and would otherwise still carry the old icon;
//      (b) a future MSIX bundler / Windows resource compiler may
//          auto-probe any PNG in `src-tauri/icons/`;
//      (c) keeping them in sync makes `git status` clean.
//    Sizes here are NOT integer multiples of the 16×16 source grid,
//    so emitRaster's nearest-neighbour fallback (added above) emits
//    them as un-evenly-strided pixel art — the cassette silhouette
//    stays intact, just with each output cell spanning either ⌊n/16⌋
//    or ⌈n/16⌉ source cells.
writeFileSync(join(tauriIconsDir, '64x64.png'),             emitPNG( 64,  64));
writeFileSync(join(tauriIconsDir, 'icon.png'),              emitPNG(512, 512));
writeFileSync(join(tauriIconsDir, 'Square30x30Logo.png'),   emitPNG( 30,  30));
writeFileSync(join(tauriIconsDir, 'Square44x44Logo.png'),   emitPNG( 44,  44));
writeFileSync(join(tauriIconsDir, 'Square71x71Logo.png'),   emitPNG( 71,  71));
writeFileSync(join(tauriIconsDir, 'Square89x89Logo.png'),   emitPNG( 89,  89));
writeFileSync(join(tauriIconsDir, 'Square107x107Logo.png'), emitPNG(107, 107));
writeFileSync(join(tauriIconsDir, 'Square142x142Logo.png'), emitPNG(142, 142));
writeFileSync(join(tauriIconsDir, 'Square150x150Logo.png'), emitPNG(150, 150));
writeFileSync(join(tauriIconsDir, 'Square284x284Logo.png'), emitPNG(284, 284));
writeFileSync(join(tauriIconsDir, 'Square310x310Logo.png'), emitPNG(310, 310));
writeFileSync(join(tauriIconsDir, 'StoreLogo.png'),         emitPNG( 50,  50));

// 4. Re-emit a cassette copy of public/favicon-source.png so any
//    previous residue left behind by an older icon tool can never
//    surface as the "old" icon. The file is not referenced from
//    index.html, but Vite serves it at /favicon-source.png and some
//    Windows tools / OS file pickers auto-probe sibling assets.
writeFileSync(join(publicDir, 'favicon-source.png'), emitPNG(512, 512));

// 5. If `dist/` already exists from a previous `npm run build`, mirror
//    the cached favicon and source-PNG into it so a stale vite
//    build doesn't ship the old icon. Without this, running only
//    `npm run icons` (and not `npm run build`) would leave
//    `dist/favicon.ico`, `dist/favicon.svg`, and `dist/favicon-source.png`
//    at the bytes they had after the last Vite build, which can be
//    hours/days old and may predate this fix.
//
//    The existence guard exists because (a) we want `npm run icons`
//    to work for a contributor who has not run `npm run build` yet
//    (no dist/, no mirror, no error), and (b) creating `dist/` from
//    here would race with Vite's own write-stream if they ever
//    interleave. `copyFileSync` is non-atomic per-file but is fine
//    in practice since humans don't run the two commands back-to-back
//    against a live Vite watch.
const distDir = join(projectDir, 'dist');
if (existsSync(distDir)) {
  for (const name of ['favicon.svg', 'favicon.ico', 'favicon-source.png']) {
    copyFileSync(join(publicDir, name), join(distDir, name));
  }
  console.log(`✓ mirrored favicons into dist/`);
}

console.log(`✓ wrote ${join('public', 'favicon.svg')}`);
console.log(`✓ wrote ${join('public', 'favicon.ico')}`);
console.log(`✓ wrote ${join('public', 'favicon-source.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '32x32.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '128x128.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '128x128@2x.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'icon.ico')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'icon.icns')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '64x64.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'icon.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square30x30Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square44x44Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square71x71Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square89x89Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square107x107Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square142x142Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square150x150Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square284x284Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'Square310x310Logo.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'StoreLogo.png')}`);

// Round-trip self-test: re-inflate one PNG from each emitter and assert
// pixel/scanline integrity. Catches silent CRC / chunk-order regressions
// without needing an external PNG decoder. Covers BOTH the indexed path
// (used by vite favicon.ico + Tauri bitmaps) AND the RGBA path (used by
// the ICNS macOS bundle), so a regression that only breaks macOS fails
// here instead of on a real macOS dock.
function reInflateIdat(png) {
  let p = 8;
  let idat = Buffer.alloc(0);
  while (p < png.length) {
    const len = png.readUInt32BE(p);
    const typ = png.slice(p + 4, p + 8).toString('ascii');
    const data = png.slice(p + 8, p + 8 + len);
    if (typ === 'IDAT') idat = Buffer.concat([idat, data]);
    if (typ === 'IEND') break;
    p += 8 + len + 4;
  }
  return inflateSync(idat);
}

(() => {
  // Indexed: 32×32 PNG, 1 byte/pixel, palette indices strictly 0..7.
  const indexed = emitPNG(32, 32);
  const idxRaw = reInflateIdat(indexed);
  const idxScan = 1 + 32;
  if (idxRaw.length !== idxScan * 32) {
    throw new Error(`self-test failed: indexed raw ${idxRaw.length} != ${idxScan * 32}`);
  }
  for (let i = 0; i < idxRaw.length; i += idxScan) {
    const pix = idxRaw.subarray(i + 1, i + idxScan);
    for (const p of pix) {
      if (p < 0 || p >= PALETTE.length) {
        throw new Error(`self-test failed: out-of-range palette index ${p}`);
      }
    }
  }

  // Non-integer-multiple: 30×30 indexed PNG. Catches regressions in the
  // nearest-neighbour fallback path introduced so that the
  // Square*Logo/StoreLogo fixed-tile sizes (30, 44, 71, 89, 107, 142,
  // 150, 284, 310) emit clean PNGs without overrun / out-of-range
  // palette indices.
  {
    const nn = emitPNG(30, 30);
    const nnRaw = reInflateIdat(nn);
    const nnScan = 1 + 30;
    if (nnRaw.length !== nnScan * 30) {
      throw new Error(`self-test failed: 30×30 raw ${nnRaw.length} != ${nnScan * 30}`);
    }
    for (let i = 0; i < nnRaw.length; i += nnScan) {
      const pix = nnRaw.subarray(i + 1, i + nnScan);
      for (const p of pix) {
        if (p < 0 || p >= PALETTE.length) {
          throw new Error(`self-test failed: 30×30 out-of-range palette index ${p}`);
        }
      }
    }
    if (nn[25] !== 3) {
      throw new Error(`self-test failed: 30×30 IHDR color type ${nn[25]}, expected 3 (indexed)`);
    }
  }

  // Non-integer-multiple larger tile: 107×107 (the most-arbitrary size in
  // the Square*Logo family). Guards against integer-overflow mistakes
  // in the nearest-neighbour math.
  {
    const tile = emitPNG(107, 107);
    if (tile.length < 8 || tile.readUInt32BE(0) !== 0x89504e47) {
      throw new Error(`self-test failed: 107×107 missing PNG magic`);
    }
    if (tile[25] !== 3) {
      throw new Error(`self-test failed: 107×107 IHDR color type ${tile[25]}, expected 3 (indexed)`);
    }
    const tileRaw = reInflateIdat(tile);
    const tileScan = 1 + 107;
    if (tileRaw.length !== tileScan * 107) {
      throw new Error(`self-test failed: 107×107 raw ${tileRaw.length} != ${tileScan * 107}`);
    }
  }

  // Cassette signature check: at least one cyan (#4EE2EC = (78,226,236))
  // and one cream (#F0E6C4 = (240,230,196)) pixel must appear in the
  // RGBA-in-ICO payload — proves the cassette (not stale residue) is
  // what gets baked into `tauri::generate_context!()` at compile time.
  {
    const rgbaRef = emitRGBA(64, 64);
    const rg = reInflateIdat(rgbaRef);
    const rgScan = 1 + 64 * 4;
    let hasCyan = false, hasCream = false;
    for (let y = 0; y < 64; y++) {
      const off = y * rgScan;
      for (let x = 0; x < 64; x++) {
        const p = off + 1 + x * 4;
        const r = rg[p], g = rg[p + 1], b = rg[p + 2];
        if (r === 0x4e && g === 0xe2 && b === 0xec) hasCyan = true;
        if (r === 0xf0 && g === 0xe6 && b === 0xc4) hasCream = true;
      }
    }
    if (!hasCyan || !hasCream) {
      throw new Error(`self-test failed: 64×64 RGBA missing cassette signature (cyan=${hasCyan} cream=${hasCream})`);
    }
  }

  // RGBA: 64×64 PNG (mirrors one ICNS entry), 4 bytes/pixel, alpha=0
  // ONLY at palette[0].
  const rgba = emitRGBA(64, 64);
  const rgbRaw = reInflateIdat(rgba);
  const rgbScan = 1 + 64 * 4;
  if (rgbRaw.length !== rgbScan * 64) {
    throw new Error(`self-test failed: RGBA raw ${rgbRaw.length} != ${rgbScan * 64}`);
  }
  for (let y = 0; y < 64; y++) {
    const off = y * rgbScan;
    // Filter byte must be 0 (None) on every scanline.
    if (rgbRaw[off] !== 0) {
      throw new Error(`self-test failed: non-zero filter byte ${rgbRaw[off]} on scanline ${y}`);
    }
  }

  // RGBA-in-ICO: round-trip one entry out of a multi-frame RGBA ICO.
  // Mirrors what `tauri::generate_context!()` does over `icon.ico`, so a
  // future regression that breaks Tauri compilation fails here instead.
  const icoSizes = [16, 32, 48];
  const ico = emitICO(icoSizes, { useRGBA: true });
  const numEntries = ico.readUInt16LE(4);
  if (numEntries !== icoSizes.length) {
    throw new Error(`self-test failed: RGBA ICO reports ${numEntries} entries, expected ${icoSizes.length}`);
  }
  for (let i = 0; i < numEntries; i++) {
    const o = 6 + i * 16;
    const entrySize = ico.readUInt32LE(o + 8);
    const entryOff = ico.readUInt32LE(o + 12);
    const expected = emitRGBA(icoSizes[i], icoSizes[i]);
    const actual = ico.subarray(entryOff, entryOff + entrySize);
    if (!actual.equals(expected)) {
      throw new Error(`self-test failed: RGBA ICO entry ${i} bytes diverge from emitRGBA reference`);
    }
    if (actual.readUInt32BE(0) !== 0x89504e47) {
      throw new Error(`self-test failed: RGBA ICO entry ${i} does not start with PNG magic`);
    }
    // PNG layout: 8-byte signature, then IHDR chunk (4-byte length, 4-byte
    // 'IHDR' type, then 13-byte data). Color type is the second byte of
    // the IHDR data — i.e. PNG byte index 25 overall.
    if (actual[25] !== 6) {
      throw new Error(`self-test failed: RGBA ICO entry ${i} IHDR color type ${actual[25]}, expected 6`);
    }
  }
  console.log('✓ self-test passed: indexed (32×32 + 30×30 + 107×107) + RGBA (64×64 cassette signature) + RGBA ICO entries round-trip and pixel bounds hold');
})();
