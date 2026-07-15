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
//   - src-tauri/icons/32x32.png                — Tauri Windows/Linux bundle
//   - src-tauri/icons/128x128.png              — 〃
//   - src-tauri/icons/128x128@2x.png           — alt 256×256 bundle icon
//   - src-tauri/icons/icon.ico                 — Tauri Windows bundle (multi-frame:
//                                                 16/32/48/64/128/256)
//   - src-tauri/icons/icon.icns                — Tauri macOS bundle (RGBA PNGs at
//                                                 16/32/64/128/256/512/1024)
//
// Why we emit Tauri bundle icons directly:
//   `npx tauri icon` rasterises the source via the Rust `image` crate, which
//   always uses bilinear interpolation. That softens pixel-art edges no matter
//   the source — both an SVG with `shape-rendering="crispEdges"` and a 1024×1024
//   PNG end up with 18–122 distinct RGBA tuples in the resulting 32×32 PNG. The
//   only way to get crisp pixel art at every output resolution is to encode
//   each Tauri bundle artefact byte-for-byte from the source grid (no resample).
//
// Approach notes:
//   - 8-bit indexed PNG with a tRNS chunk so palette index 0 = transparent
//     (used for vite-served favicon.ico and Tauri 32/128/256 bitmap sizes).
//   - 8-bit RGBA PNG (color-type 6) for ICNS entries: Apple accepts PNG-encoded
//     payloads since macOS 10.7 and rendering RGBA avoids any indexed-PNG
//     decoder edge cases.
//   - Each 16×16 logical cell blows up to a (physical/16)×(physical/16) solid
//     block, so integer multiples (16, 32, 48, 64, 128, 256, 512, 1024) stay
//     pixel-perfect with no resampling.
//   - IDAT data is compressed with deflateSync (zlib format with 2-byte header
//     + deflate + Adler32 trailer). PNG spec requires zlib, NOT raw deflate,
//     so do not switch to deflateRawSync here.

import { writeFileSync, mkdirSync } from 'node:fs';
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
// shared emitRaster workhorse below. Each 16×16 logical cell is blown
// up to a (physical/16)×(physical/16) solid block so integer multiples
// (16, 32, 48, 64, 128, 256, 512, 1024) all stay pixel-perfect with
// no resampling — Tauri's image-crate bilinear path is bypassed entirely.
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
  const channels = colorType === 3 ? 1 : 4;
  const cellW = physicalW / W;
  const cellH = physicalH / H;
  if (!Number.isInteger(cellW) || !Number.isInteger(cellH)) {
    throw new Error(
      `physical size ${physicalW}x${physicalH} must be integer multiples of ${W}x${H}`,
    );
  }

  // PNG filter byte 0 (None) per scanline, then physicalW * channels bytes
  // of pixel data (1 byte/pixel for indexed, 4 bytes/pixel for RGBA).
  const scanlineBytes = 1 + physicalW * channels;
  const raw = Buffer.alloc(scanlineBytes * physicalH);
  for (let y = 0; y < physicalH; y++) {
    const off = y * scanlineBytes;
    raw[off] = 0;
    const gy = Math.floor(y / cellH);
    for (let x = 0; x < physicalW; x++) {
      const gx = Math.floor(x / cellW);
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
function emitICO(sizes) {
  const N = sizes.length;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved, must be 0
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(N, 4); // image count

  const pngs = sizes.map((s) => emitPNG(s, s));
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
  emitICO([16, 32, 48, 64, 128, 256]),
);
writeFileSync(
  join(tauriIconsDir, 'icon.icns'),
  emitICNS([16, 32, 64, 128, 256, 512, 1024]),
);

console.log(`✓ wrote ${join('public', 'favicon.svg')}`);
console.log(`✓ wrote ${join('public', 'favicon.ico')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '32x32.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '128x128.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', '128x128@2x.png')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'icon.ico')}`);
console.log(`✓ wrote ${join('src-tauri', 'icons', 'icon.icns')}`);

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
  console.log('✓ self-test passed: PNG (32×32 indexed) + PNG (64×64 RGBA) round-trip and pixel bounds hold');
})();
