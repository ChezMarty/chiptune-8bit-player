#!/usr/bin/env node
/**
 * scripts/capture-screenshots-v3.mjs
 *
 * Captures styled screenshots of Chiptune 8-Bit Player v0.3.0 with the
 * Monochrome theme, English locale, mock content, and the full AudioLab
 * DSP panel in all its glory.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/capture-screenshots-v3.mjs
 *
 * Requires: puppeteer (npm install puppeteer)
 * The app must expose stores on window.__CHIPTUNE_STORES__ in dev mode.
 */

import puppeteer from 'puppeteer'
import { mkdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = join(__dirname, '..', 'screenshots')
const APP_URL = 'http://localhost:1420'

// v0.3.0 default window size
const VIEWPORT = { width: 1833, height: 980 }

// ── Mock album art SVGs (pixel-art style, diverse colors) ────────

const art1 = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#1a0a2e"/>' +
  '<rect x="8" y="8" width="48" height="48" fill="#2d1b4e" rx="4"/>' +
  '<circle cx="32" cy="32" r="16" fill="#6a3dc4"/>' +
  '<circle cx="32" cy="32" r="6" fill="#9a6dff"/>' +
  '</svg>'
)
const art2 = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#0a2a0a"/>' +
  '<rect x="8" y="8" width="48" height="48" fill="#1a4a1a" rx="4"/>' +
  '<circle cx="32" cy="32" r="16" fill="#2d8a2d"/>' +
  '<circle cx="32" cy="32" r="6" fill="#5abf5a"/>' +
  '</svg>'
)
const art3 = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#2a0a0a"/>' +
  '<rect x="8" y="8" width="48" height="48" fill="#4a1a1a" rx="4"/>' +
  '<circle cx="32" cy="32" r="16" fill="#8a2d2d"/>' +
  '<circle cx="32" cy="32" r="6" fill="#bf5a5a"/>' +
  '</svg>'
)
const art4 = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#0a0a2a"/>' +
  '<rect x="8" y="8" width="48" height="48" fill="#1a1a4a" rx="4"/>' +
  '<circle cx="32" cy="32" r="16" fill="#2d2d8a"/>' +
  '<circle cx="32" cy="32" r="6" fill="#5a5abf"/>' +
  '</svg>'
)
const art5 = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" fill="#2a1a00"/>' +
  '<rect x="8" y="8" width="48" height="48" fill="#4a2a00" rx="4"/>' +
  '<circle cx="32" cy="32" r="16" fill="#c48a2d"/>' +
  '<circle cx="32" cy="32" r="6" fill="#f1b94c"/>' +
  '</svg>'
)

// ── Mock data ────────────────────────────────────────────────────

const MOCK_TRACKS = [
  { id: 'mock-1', path: '/mock/synthwave.mp3', title: 'Midnight Drive', artist: 'Neon Circuit', album: 'Synthwave Dreams', durationSec: 284, hasArt: true, artDataUrl: art1 },
  { id: 'mock-2', path: '/mock/chiptune.mp3', title: '8-Bit Heart', artist: 'Pixel Master', album: 'Chip Tunes Vol. 3', durationSec: 197, hasArt: true, artDataUrl: art2 },
  { id: 'mock-3', path: '/mock/rock.mp3', title: 'Electric Storm', artist: 'The Amplifiers', album: 'Live at the Garage', durationSec: 342, hasArt: true, artDataUrl: art3 },
  { id: 'mock-4', path: '/mock/jazz.mp3', title: 'Moonlit Serenade', artist: 'Blue Note Collective', album: 'Late Night Sessions', durationSec: 415, hasArt: true, artDataUrl: art4 },
  { id: 'mock-5', path: '/mock/electronic.mp3', title: 'Pulse Wave', artist: 'Circuit Breaker', album: 'Voltage', durationSec: 223, hasArt: true, artDataUrl: art5 },
  { id: 'mock-6', path: '/mock/ambient.mp3', title: 'Digital Rain', artist: 'Neon Circuit', album: 'System Dreams', durationSec: 368, hasArt: true, artDataUrl: art1 },
  { id: 'mock-7', path: '/mock/classical.mp3', title: 'Pixel Étude No. 3', artist: 'Virtua Pianist', album: 'Classical Bits', durationSec: 291, hasArt: true, artDataUrl: art2 },
  { id: 'mock-8', path: '/mock/lo-fi.mp3', title: 'Chillwave Sunset', artist: 'Lo-Fi Beats', album: 'Study & Relax', durationSec: 176, hasArt: true, artDataUrl: art3 },
]

const MOCK_SPOTIFY_TRACKS = [
  { id: 'spot-1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration_ms: 200000, image_url: art1, uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b' },
  { id: 'spot-2', title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide', duration_ms: 233000, image_url: art2, uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3' },
  { id: 'spot-3', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration_ms: 354000, image_url: art3, uri: 'spotify:track:3z8h0TU7ReDPLIbEnYhWZb' },
  { id: 'spot-4', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration_ms: 482000, image_url: art4, uri: 'spotify:track:5CQ30WqJwcep0pYcV4AmNv' },
  { id: 'spot-5', title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', duration_ms: 225000, image_url: art5, uri: 'spotify:track:2WfaOiMkCvy7F5fcp2zZ8L' },
  { id: 'spot-6', title: 'Africa', artist: 'Toto', album: 'Toto IV', duration_ms: 295000, image_url: art1, uri: 'spotify:track:2374M0fQpWi3dLnB54qaLX' },
  { id: 'spot-7', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration_ms: 391000, image_url: art2, uri: 'spotify:track:40riOy7x9W7GXjyGp4pjAv' },
  { id: 'spot-8', title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration_ms: 294000, image_url: art3, uri: 'spotify:track:5ChkMS8OtdzJeqyybCc9R5' },
]

const MOCK_PLAYLISTS = [
  { id: 'pl-1', name: 'Chiptune Favorites', description: 'Best 8-bit tracks and retro game music', image_url: null, tracks_count: 42 },
  { id: 'pl-2', name: 'Synthwave Nights', description: 'Outrun the darkness with synthwave', image_url: null, tracks_count: 87 },
  { id: 'pl-3', name: 'Lo-Fi Study', description: 'Focus and relax with lo-fi beats', image_url: null, tracks_count: 56 },
  { id: 'pl-4', name: 'Late Night Coding', description: 'The perfect soundtrack for late dev sessions', image_url: null, tracks_count: 33 },
  { id: 'pl-5', name: 'Retro Gaming', description: 'OSTs from classic video games', image_url: null, tracks_count: 124 },
  { id: 'pl-6', name: 'Pixel Perfect', description: 'Chiptune and electronic favorites', image_url: null, tracks_count: 68 },
]

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms) })
}

function deleteIfExists(path) {
  try { unlinkSync(path) } catch (e) { /* ok */ }
}

async function injectMockData(page) {
  // Retry up to 5 times waiting for stores to be available
  for (var attempt = 1; attempt <= 5; attempt++) {
    var storesReady = await page.evaluate(function() {
      return !!(window.__CHIPTUNE_STORES__ && window.__CHIPTUNE_STORES__.player)
    })
    if (storesReady) break
    console.log('  Waiting for stores... (attempt ' + attempt + '/5)')
    await sleep(1000)
  }

  // Inject mock local tracks
  var tracksInjected = await page.evaluate(function(tracks) {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.player) {
      stores.player.setState({
        tracks: tracks,
        currentIndex: 0,
        volume: 0.7,
      })
      return true
    }
    return false
  }, MOCK_TRACKS)
  console.log('  Tracks injected:', tracksInjected)

  // Wait for library to render
  try {
    await page.waitForSelector('.library__row, [class*="track"]', { timeout: 5000 })
    console.log('  Library rows rendered')
  } catch (e) {
    console.log('  Library rows may not have rendered')
  }

  // Inject Spotify mock data
  var spotifyInjected = await page.evaluate(function(data) {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.spotify) {
      stores.spotify.setState({
        likedSongs: data.tracks,
        playlists: data.playlists,
        isConfigured: true,
        clientId: 'mock-client-id',
        account: {
          connected: true,
          display_name: 'Player One',
          email: 'player@example.com',
          product: 'premium',
        },
        librespotInitialised: true,
        librespotVersion: '0.8.0',
      })
      return true
    }
    return false
  }, { tracks: MOCK_SPOTIFY_TRACKS, playlists: MOCK_PLAYLISTS })
  console.log('  Spotify data injected:', spotifyInjected)
}

async function openAudioLab(page) {
  await page.evaluate(function() {
    window.dispatchEvent(new CustomEvent('toggle-audio-lab'))
  })
  await sleep(1000)

  var panelOpen = await page.evaluate(function() {
    var panel = document.querySelector('.audio-lab__panel')
    return panel ? panel.classList.contains('audio-lab__panel--open') : false
  })
  console.log('  AudioLab panel open:', panelOpen)
  return panelOpen
}

async function switchAudioLabTab(page, tabName) {
  await page.evaluate(function(tab) {
    var tabs = document.querySelectorAll('.audio-lab__tab')
    var tabOrder = { eq: 0, effects: 1, presets: 2, visualizer: 3 }
    var idx = tabOrder[tab]
    if (idx !== undefined && tabs[idx]) {
      tabs[idx].click()
    }
  }, tabName)
  await sleep(700)
}

async function closeAudioLab(page) {
  await page.evaluate(function() {
    window.dispatchEvent(new CustomEvent('toggle-audio-lab'))
  })
  await sleep(700)
}

async function shoot(page, name) {
  var filePath = join(SCREENSHOTS_DIR, name + '.png')
  await page.screenshot({ path: filePath, fullPage: false })
  console.log('  OK ' + name + '.png')
  return filePath
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  console.log('Screenshots will be saved to:', SCREENSHOTS_DIR)
  console.log('Viewport:', VIEWPORT.width + 'x' + VIEWPORT.height)
  console.log('Theme: Monochrome | Language: English\n')

  var browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=' + VIEWPORT.width + ',' + VIEWPORT.height,
    ],
  })

  var page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  // ── 0. Set localStorage & initial load ─────────────────────────
  console.log('[0] Setting up environment...')
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(function() {
    localStorage.setItem('chiptune-theme', 'monochrome')
    localStorage.setItem('chiptune-language', 'en')
    localStorage.setItem('chiptune-visualizer-settings', JSON.stringify({
      fftSize: 2048,
      barCount: 32,
      spectrumSmoothing: 0,
      waveformSmoothing: 0.3,
      circularSmoothing: 0,
      spectrumSensitivity: 1,
      waveformSensitivity: 1,
      circularSensitivity: 1,
      peakHoldMs: 1500,
      peakDecayDbPerSec: 12,
      rmsSmoothing: 0.3,
      colorTheme: 'theme',
      showPeakMeter: true,
      showRmsMeter: true,
      showClipIndicator: true,
    }))
  })
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 })
  await sleep(3000)
  console.log('  Environment ready (Monochrome theme, EN locale)')

  // ── 1. Inject mock data ────────────────────────────────────────
  console.log('[1] Injecting mock data...')
  await injectMockData(page)
  await sleep(1000)

  // ── 2. Click LOCAL tab ─────────────────────────────────────────
  async function clickLocalTab() {
    await page.evaluate(function() {
      var buttons = document.querySelectorAll('.library__tab, [class*="library"] button, [class*="tab"]')
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || '').toLowerCase()
        if (text.indexOf('local') !== -1 || text.indexOf('music') !== -1) {
          buttons[i].click()
          return true
        }
      }
      return false
    })
  }

  async function clickSpotifyTab() {
    await page.evaluate(function() {
      var buttons = document.querySelectorAll('.library__tab, [class*="library"] button, [class*="tab"]')
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || '').toLowerCase()
        if (text.indexOf('spotify') !== -1) {
          buttons[i].click()
          return true
        }
      }
      return false
    })
  }

  // ── 3. Screenshot: Main Player ─────────────────────────────────
  console.log('\n[2] Capturing: Main Player...')
  await clickLocalTab()
  await sleep(800)
  await shoot(page, 'main-view')

  // ── 4. Screenshot: Local Library ───────────────────────────────
  console.log('\n[3] Capturing: Local Library...')
  // Select the first track to show it highlighted with vinyl record art
  await page.evaluate(function(art) {
    var rows = document.querySelectorAll('.library__row')
    if (rows.length > 0) rows[0].click()

    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.player) {
      stores.player.setState({
        currentIndex: 0,
        isPlaying: false,
        playbackStatus: 'stopped',
        nowPlaying: {
          id: 'mock-1',
          title: 'Midnight Drive',
          artist: 'Neon Circuit',
          album: 'Synthwave Dreams',
          durationSec: 284,
          imageUrl: art,
        },
        currentTime: 0,
        duration: 284,
      })
    }
  }, art1)
  await sleep(800)
  await shoot(page, 'library-full')

  // ── 5. Screenshot: Spotify Browser ─────────────────────────────
  console.log('\n[4] Capturing: Spotify Browser...')
  await clickSpotifyTab()
  await sleep(1500)

  // Show playlists section for a richer view
  await page.evaluate(function() {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.spotify) {
      stores.spotify.getState().setActiveSection('playlists')
    }
  })
  await sleep(1000)
  await shoot(page, 'spotify-browser')

  // ── Open AudioLab for DSP screenshots ──────────────────────────
  console.log('\n[5] Opening AudioLab panel...')
  await page.keyboard.press('Escape') // close any open drawer
  await sleep(400)
  await clickLocalTab()
  await sleep(500)
  await openAudioLab(page)

  // ── 6. Screenshot: AudioLab — Equalizer ────────────────────────
  console.log('\n[6] Capturing: AudioLab — Equalizer...')
  await switchAudioLabTab(page, 'eq')
  // Use native value setter for React to recognize EQ slider changes
  await page.evaluate(function() {
    var sliders = document.querySelectorAll('.audio-lab__eq-slider')
    if (sliders.length >= 10) {
      var nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set
      var bands = [4, 3, 1, 0, -2, -1, 2, 3, 4, 5]
      for (var i = 0; i < bands.length; i++) {
        nativeSetter.call(sliders[i], String(bands[i]))
        sliders[i].dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  })
  await sleep(500)
  await shoot(page, 'audio-lab-eq')

  // ── 7. Screenshot: AudioLab — Effects ──────────────────────────
  console.log('\n[7] Capturing: AudioLab — Effects...')
  await switchAudioLabTab(page, 'effects')
  await sleep(500)

  // Expand a few effects to show their parameters
  await page.evaluate(function() {
    var expandButtons = document.querySelectorAll('.audio-lab__effect-expand')
    // Expand first 3 effects
    for (var i = 0; i < Math.min(3, expandButtons.length); i++) {
      expandButtons[i].click()
    }
  })
  await sleep(400)
  await shoot(page, 'audio-lab-effects')

  // ── 8. Screenshot: AudioLab — Presets ──────────────────────────
  console.log('\n[8] Capturing: AudioLab — Presets...')
  await switchAudioLabTab(page, 'presets')
  await sleep(500)
  await shoot(page, 'audio-lab-presets')

  // ── 9. Screenshot: AudioLab — Visualizer (Spectrum) ────────────
  console.log('\n[9] Capturing: AudioLab — Visualizer (Spectrum)...')
  await switchAudioLabTab(page, 'visualizer')
  await sleep(600)

  // Click spectrum mode button
  await page.evaluate(function() {
    var modeButtons = document.querySelectorAll('.audio-lab__visualizer-mode-btn')
    for (var i = 0; i < modeButtons.length; i++) {
      var text = (modeButtons[i].textContent || '').toLowerCase()
      if (text.indexOf('spectrum') !== -1) {
        modeButtons[i].click()
        return
      }
    }
  })
  await sleep(400)
  await shoot(page, 'audio-lab-visualizer-spectrum')

  // ── 10. Screenshot: AudioLab — Visualizer (Waveform) ───────────
  console.log('\n[10] Capturing: AudioLab — Visualizer (Waveform)...')
  await page.evaluate(function() {
    var modeButtons = document.querySelectorAll('.audio-lab__visualizer-mode-btn')
    for (var i = 0; i < modeButtons.length; i++) {
      var text = (modeButtons[i].textContent || '').toLowerCase()
      if (text.indexOf('waveform') !== -1) {
        modeButtons[i].click()
        return
      }
    }
  })
  await sleep(400)
  await shoot(page, 'audio-lab-visualizer-waveform')

  // ── 11. Screenshot: AudioLab — Visualizer (Circular) ───────────
  console.log('\n[11] Capturing: AudioLab — Visualizer (Circular)...')
  await page.evaluate(function() {
    var modeButtons = document.querySelectorAll('.audio-lab__visualizer-mode-btn')
    for (var i = 0; i < modeButtons.length; i++) {
      var text = (modeButtons[i].textContent || '').toLowerCase()
      if (text.indexOf('circular') !== -1) {
        modeButtons[i].click()
        return
      }
    }
  })
  await sleep(400)
  await shoot(page, 'audio-lab-visualizer-circular')

  // ── 12. Screenshot: Visualizer Settings Panel ──────────────────
  console.log('\n[12] Capturing: Visualizer Settings Panel...')
  // Back to spectrum mode
  await page.evaluate(function() {
    var modeButtons = document.querySelectorAll('.audio-lab__visualizer-mode-btn')
    for (var i = 0; i < modeButtons.length; i++) {
      var text = (modeButtons[i].textContent || '').toLowerCase()
      if (text.indexOf('spectrum') !== -1) {
        modeButtons[i].click()
        return
      }
    }
  })
  await sleep(300)

  // Open settings panel
  await page.evaluate(function() {
    var settingsBtn = document.querySelector('.audio-lab__visualizer-settings-btn')
    if (settingsBtn) settingsBtn.click()
  })
  await sleep(500)
  await shoot(page, 'audio-lab-visualizer-settings')

  // Close visualizer settings
  await page.evaluate(function() {
    var settingsBtn = document.querySelector('.audio-lab__visualizer-settings-btn')
    if (settingsBtn) settingsBtn.click()
  })
  await sleep(300)

  // Close AudioLab
  await closeAudioLab(page)

  // ── 13. Screenshot: Settings window ────────────────────────────
  console.log('\n[13] Capturing: Settings window...')
  await page.evaluate(function() {
    var btn = document.querySelector('.settings-button')
    if (btn) {
      btn.click()
    }
  })
  await sleep(1200)
  await shoot(page, 'settings-window')

  // ── Cleanup ────────────────────────────────────────────────────
  await browser.close()

  // Delete stale v0.2.0 screenshots that are no longer used
  console.log('\n[14] Cleaning up stale screenshots...')
  var staleFiles = [
    'record-player.png',
    'spotify-panel.png',
    'spotify-playlists.png',
    'spotify-search.png',
    'now-playing.png',
    'context-menu.png',
    'about-dialog.png',
    'theme-switcher.png',
  ]
  staleFiles.forEach(function(f) {
    deleteIfExists(join(SCREENSHOTS_DIR, f))
    console.log('  Removed stale:', f)
  })

  console.log('\n✅ All screenshots captured successfully!')
  console.log('Saved to:', SCREENSHOTS_DIR)
}

main().catch(function(err) {
  console.error('❌ Screenshot capture failed:', err)
  process.exit(1)
})
