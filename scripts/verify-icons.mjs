#!/usr/bin/env node
// scripts/verify-icons.mjs
//
// Post-generation verification: re-decode every cassette icon we just
// emitted and assert that the recognisable cassette signature (at
// least one cyan #4EE2EC and one cream #F0E6C4 pixel, both with the
// expected alpha) appears in each one. Catches silent regressions
// where a stale PNG slips through copy/paste, or where emitRaster
// silently produces an empty frame.
//
// Run via:  node scripts/verify-icons.mjs
// or:       npm run verify:icons
//
// Exits non-zero (and prints a per-file table) if any expected file
// is missing or lacks the cassette signature.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

// ─── Source of truth ──────────────────────────────────────────────
// Mirror the 16×16 palette used by gen-favicon.mjs so the signature
// check is independent of the generator's runtime state (we read icons
// from disk, we don't import gen-favicon.mjs to keep coupling minimal).
const CYAN  = [0x4e, 0xe2, 0xec]; // palette index 6
const CREAM = [0xf0, 0xe6, 0xc4]; // palette index 3

// ─── Decoder ─────────────────────────────────────────────────────
// Re-inflate IDAT and parse out either palette-indexed (1 byte/pixel)
// or RGBA (4 bytes/pixel) PNGs. Just enough to count palette hits;
// we do not need to render anti-aliased output.
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('not a PNG (bad magic)');
  }
  let p = 8;
  let idat = Buffer.alloc(0);
  let ihdr = null;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const typ = buf.slice(p + 4, p + 8).toString('ascii');
    const data = buf.slice(p + 8, p + 8 + len);
    if (typ === 'IHDR') ihdr = data;
    if (typ === 'IDAT') idat = Buffer.concat([idat, data]);
    if (typ === 'IEND') break;
    p += 8 + len + 4;
  }
  if (!ihdr) throw new Error('missing IHDR');
  const width  = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth  = ihdr[8];   // bit depth
  const colorType = ihdr[9]; // 3 = indexed, 6 = RGBA, 2 = RGB
  const raw = inflateSync(idat);
  return { width, height, depth, colorType, raw };
}

// Decode one entry inside a multi-frame ICO. Mirrors Tauri's
// `tauri::generate_context!()`'s ICO walk so a regression that would
// break Tauri compilation surfaces here.
function decodeICOEntry(buf, entryIndex) {
  const o = 6 + entryIndex * 16;
  const size = buf.readUInt32LE(o + 8);
  const off  = buf.readUInt32LE(o + 12);
  return decodePNG(buf.subarray(off, off + size));
}

// Decode one entry inside an ICNS container. Per-entry header is
// 4-byte OSType code + 4-byte big-endian size, then payload (PNG).
function decodeICNSEntry(buf, entryIndex) {
  const entryHeaderSize = 8;
  let p = 8; // skip outer 4-byte 'icns' + 4-byte total length
  for (let i = 0; p < buf.length; i++) {
    const size = buf.readUInt32BE(p + 4);
    const payload = buf.slice(p + entryHeaderSize, p + size);
    if (i === entryIndex) return decodePNG(payload);
    p += size;
  }
  throw new Error(`ICNS entry ${entryIndex} not found`);
}

// Count occurrences of an exact RGB triple in an RGBA-decoded PNG.
// Treats alpha=0 pixels as invisible too (defensive — palette index 0
// is the transparent sentinel).
function countRGB(rgbaRaw, channels, w, h, target) {
  let n = 0;
  const scanlineBytes = 1 + w * channels;
  for (let y = 0; y < h; y++) {
    const off = y * scanlineBytes + 1;
    for (let x = 0; x < w; x++) {
      const p = off + x * channels;
      const r = rgbaRaw[p], g = rgbaRaw[p + 1], b = rgbaRaw[p + 2];
      if (channels === 4 && rgbaRaw[p + 3] !== 255) continue; // skip transparent
      if (r === target[0] && g === target[1] && b === target[2]) n++;
    }
  }
  return n;
}

// Count palette-index hits in an indexed PNG. Skips the leading
// filter byte on every scanline (PNG layout: filter_type byte, then
// `w` palette indices, repeating). The constant PALETTE_BY_INDEX
// below maps each index to its RGB triple; the helper itself just
// counts, so we don't need to pass it in here.
function countIndexedMatches(indexedRaw, w, h, paletteIndex) {
  let n = 0;
  const scanlineBytes = 1 + w;
  for (let y = 0; y < h; y++) {
    const off = y * scanlineBytes + 1;
    for (let x = 0; x < w; x++) {
      if (indexedRaw[off + x] === paletteIndex) n++;
    }
  }
  return n;
}

// Pull the palette source index for #4EE2EC and #F0E6C4 from the
// gen-favicon.mjs PALETTE definition. We duplicate the palette here
// rather than importing it so this script stays standalone-runnable.
const PALETTE_BY_INDEX = [
  [0x00, 0x00, 0x00], // 0
  [0x2b, 0x2b, 0x2b], // 1
  [0x4a, 0x4a, 0x4a], // 2
  [0xf0, 0xe6, 0xc4], // 3 → CREAM
  [0xe5, 0x25, 0x21], // 4
  [0xf9, 0xa0, 0x3f], // 5
  [0x4e, 0xe2, 0xec], // 6 → CYAN
  [0x18, 0x18, 0x18], // 7
];
const PALETTE_INDEX_OF_CYAN  = 6;
const PALETTE_INDEX_OF_CREAM = 3;

// ─── Per-file verification ───────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const projectDir = join(here, '..');
const publicDir = join(projectDir, 'public');
const tauriIconsDir = join(projectDir, 'src-tauri', 'icons');

const results = [];

function record(label, ok, detail) {
  results.push({ label, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${label}  ${detail}`);
}

// PNG / ICO / ICNS files we expect to find on disk after `npm run icons`.
const indexedPNGs = [
  ['public/favicon-source.png',         join(publicDir,    'favicon-source.png'), [512, 512]],
  ['src-tauri/icons/32x32.png',         join(tauriIconsDir, '32x32.png'),         [32, 32]],
  ['src-tauri/icons/128x128.png',       join(tauriIconsDir, '128x128.png'),       [128, 128]],
  ['src-tauri/icons/128x128@2x.png',    join(tauriIconsDir, '128x128@2x.png'),    [256, 256]],
  ['src-tauri/icons/64x64.png',         join(tauriIconsDir, '64x64.png'),         [64, 64]],
  ['src-tauri/icons/icon.png',          join(tauriIconsDir, 'icon.png'),          [512, 512]],
  ['src-tauri/icons/Square30x30Logo.png',   join(tauriIconsDir, 'Square30x30Logo.png'),   [30, 30]],
  ['src-tauri/icons/Square44x44Logo.png',   join(tauriIconsDir, 'Square44x44Logo.png'),   [44, 44]],
  ['src-tauri/icons/Square71x71Logo.png',   join(tauriIconsDir, 'Square71x71Logo.png'),   [71, 71]],
  ['src-tauri/icons/Square89x89Logo.png',   join(tauriIconsDir, 'Square89x89Logo.png'),   [89, 89]],
  ['src-tauri/icons/Square107x107Logo.png', join(tauriIconsDir, 'Square107x107Logo.png'), [107, 107]],
  ['src-tauri/icons/Square142x142Logo.png', join(tauriIconsDir, 'Square142x142Logo.png'), [142, 142]],
  ['src-tauri/icons/Square150x150Logo.png', join(tauriIconsDir, 'Square150x150Logo.png'), [150, 150]],
  ['src-tauri/icons/Square284x284Logo.png', join(tauriIconsDir, 'Square284x284Logo.png'), [284, 284]],
  ['src-tauri/icons/Square310x310Logo.png', join(tauriIconsDir, 'Square310x310Logo.png'), [310, 310]],
  ['src-tauri/icons/StoreLogo.png',         join(tauriIconsDir, 'StoreLogo.png'),         [50, 50]],
];

// ICO files. Each entry carries { colorType: 3 = indexed for browser
// favicon.ico, 6 = RGBA for the Tauri-bound icon.ico }, so the
// verifier picks the right per-pixel counter below.
const icoFiles = [
  { label: 'public/favicon.ico',       path: join(publicDir,    'favicon.ico'), sizes: [16, 32, 48],                     colorType: 3 },
  { label: 'src-tauri/icons/icon.ico', path: join(tauriIconsDir, 'icon.ico'),    sizes: [16, 32, 48, 64, 128, 256],       colorType: 6 },
];

// ICNS file (each entry is RGBA, all sizes we baked in).
const icnsSizes = [16, 32, 64, 128, 256, 512, 1024];

console.log('─── Indexed PNG cassette signature check ───');
for (const [label, path, [w, h]] of indexedPNGs) {
  if (!existsSync(path)) {
    record(label, false, 'MISSING');
    continue;
  }
  const buf = readFileSync(path);
  let decoded;
  try {
    decoded = decodePNG(buf);
  } catch (e) {
    record(label, false, `decode error: ${e.message}`);
    continue;
  }
  if (decoded.colorType !== 3) {
    record(label, false, `color type ${decoded.colorType} (expected 3 indexed)`);
    continue;
  }
  if (decoded.width !== w || decoded.height !== h) {
    record(label, false, `dims ${decoded.width}x${decoded.height} (expected ${w}x${h})`);
    continue;
  }
  const cyanHits  = countIndexedMatches(decoded.raw, decoded.width, decoded.height, PALETTE_INDEX_OF_CYAN);
  const creamHits = countIndexedMatches(decoded.raw, decoded.width, decoded.height, PALETTE_INDEX_OF_CREAM);
  const ok = cyanHits > 0 && creamHits > 0;
  record(label, ok, `${w}x${h}, cyan=${cyanHits}, cream=${creamHits}`);
}

console.log('\n─── ICO frame cassette signature check ───');
for (const { label, path, sizes, colorType } of icoFiles) {
  if (!existsSync(path)) {
    record(label, false, 'MISSING');
    continue;
  }
  const buf = readFileSync(path);
  const numEntries = buf.readUInt16LE(4);
  if (numEntries !== sizes.length) {
    record(label, false, `entries ${numEntries} (expected ${sizes.length})`);
    continue;
  }
  let allOk = true;
  let totals = [];
  for (let i = 0; i < numEntries; i++) {
    try {
      const f = decodeICOEntry(buf, i);
      if (f.colorType !== colorType) {
        allOk = false;
        totals.push(`frame${i}=CT${f.colorType}(want ${colorType})`);
        continue;
      }
      let cyanHits, creamHits;
      if (colorType === 6) {
        cyanHits  = countRGB(f.raw, 4, f.width, f.height, CYAN);
        creamHits = countRGB(f.raw, 4, f.width, f.height, CREAM);
      } else {
        // colorType 3 (indexed): match by palette index, not RGB triple.
        cyanHits  = countIndexedMatches(f.raw, f.width, f.height, PALETTE_INDEX_OF_CYAN);
        creamHits = countIndexedMatches(f.raw, f.height, f.width, PALETTE_INDEX_OF_CREAM);
      }
      totals.push(`${f.width}x${f.height}` + (cyanHits > 0 && creamHits > 0 ? '✓' : '✗'));
      if (!(cyanHits > 0 && creamHits > 0)) allOk = false;
    } catch (e) {
      allOk = false;
      totals.push(`frame${i}=err(${e.message})`);
    }
  }
  record(label, allOk, `[CT${colorType}] ${totals.join(', ')}`);
}

console.log('\n─── ICNS entry cassette signature check (RGBA) ───');
{
  const path = join(tauriIconsDir, 'icon.icns');
  if (!existsSync(path)) {
    record('src-tauri/icons/icon.icns', false, 'MISSING');
  } else {
    const buf = readFileSync(path);
    if (buf.slice(0, 4).toString('ascii') !== 'icns') {
      record('src-tauri/icons/icon.icns', false, 'bad magic');
    } else {
      let allOk = true;
      const totals = [];
      for (let i = 0; i < icnsSizes.length; i++) {
        try {
          const f = decodeICNSEntry(buf, i);
          const cyanHits  = countRGB(f.raw, 4, f.width, f.height, CYAN);
          const creamHits = countRGB(f.raw, 4, f.width, f.height, CREAM);
          totals.push(`${f.width}x${f.height}` + (cyanHits > 0 && creamHits > 0 ? '✓' : '✗'));
          if (!(cyanHits > 0 && creamHits > 0)) allOk = false;
        } catch (e) {
          allOk = false;
          totals.push(`entry${i}=err(${e.message})`);
        }
      }
      record('src-tauri/icons/icon.icns', allOk, totals.join(', '));
    }
  }
}

console.log('\n─── SVG (textual sanity check) ───');
{
  const path = join(publicDir, 'favicon.svg');
  if (!existsSync(path)) {
    record('public/favicon.svg', false, 'MISSING');
  } else {
    const txt = readFileSync(path, 'utf8');
    const hasCyan  = txt.includes('#4ee2ec');
    const hasCream = txt.includes('#f0e6c4');
    const ok = hasCyan && hasCream && txt.includes('<svg');
    record('public/favicon.svg', ok, `cyan=${hasCyan} cream=${hasCream} svg=${txt.includes('<svg')}`);
  }
}

const passCount = results.filter((r) => r.ok).length;
const failCount = results.filter((r) => !r.ok).length;
console.log(`\n─── Summary: ${passCount} PASS, ${failCount} FAIL ───`);
process.exit(failCount === 0 ? 0 : 1);
