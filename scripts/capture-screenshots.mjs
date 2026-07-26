#!/usr/bin/env node
/**
 * scripts/capture-screenshots.mjs
 *
 * Captures styled screenshots of Chiptune 8-Bit Player with the Monochrome
 * theme and mock content, saves them to ../screenshots/.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/capture-screenshots.mjs
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

const VIEWPORT = { width: 1550, height: 935 }

// Simple SVG placeholder art data URIs for album covers
var art1 = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a1a4e"/><circle cx="32" cy="32" r="18" fill="#6a3dc4"/><circle cx="32" cy="32" r="8" fill="#9a6dff"/></svg>')
var art2 = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a3a1a"/><circle cx="32" cy="32" r="18" fill="#2d8a2d"/><circle cx="32" cy="32" r="8" fill="#5abf5a"/></svg>')
var art3 = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#3a1a1a"/><circle cx="32" cy="32" r="18" fill="#8a2d2d"/><circle cx="32" cy="32" r="8" fill="#bf5a5a"/></svg>')
var art4 = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a1a3a"/><circle cx="32" cy="32" r="18" fill="#2d2d8a"/><circle cx="32" cy="32" r="8" fill="#5a5abf"/></svg>')

var MOCK_TRACKS = [
  { id: 'mock-1', path: '/mock/guitar-hero.mp3', title: 'Through the Fire and Flames', artist: 'DragonForce', album: 'Inhuman Rampage', durationSec: 427, hasArt: true, artDataUrl: art1 },
  { id: 'mock-2', path: '/mock/portal.mp3', title: 'Still Alive', artist: 'Jonathan Coulton', album: 'Portal OST', durationSec: 179, hasArt: true, artDataUrl: art2 },
  { id: 'mock-3', path: '/mock/undertale.mp3', title: 'Megalovania', artist: 'Toby Fox', album: 'Undertale OST', durationSec: 180, hasArt: true, artDataUrl: art3 },
  { id: 'mock-4', path: '/mock/beethoven.mp3', title: 'Moonlight Sonata', artist: 'Ludwig van Beethoven', album: 'Classical Masterpieces', durationSec: 380, hasArt: true, artDataUrl: art4 },
  { id: 'mock-5', path: '/mock/pokemon.mp3', title: 'Pokemon Theme', artist: 'Jason Paige', album: 'Pokemon 2.B.A. Master', durationSec: 196, hasArt: true, artDataUrl: art1 },
  { id: 'mock-6', path: '/mock/zelda.mp3', title: 'Gerudo Valley', artist: 'Koji Kondo', album: 'The Legend of Zelda: OoT', durationSec: 164, hasArt: true, artDataUrl: art2 },
  { id: 'mock-7', path: '/mock/ff7.mp3', title: 'One-Winged Angel', artist: 'Nobuo Uematsu', album: 'Final Fantasy VII OST', durationSec: 422, hasArt: true, artDataUrl: art3 },
  { id: 'mock-8', path: '/mock/tetris.mp3', title: 'Tetris Theme (Korobeiniki)', artist: 'Hirokazu Tanaka', album: 'Tetris OST', durationSec: 148, hasArt: true, artDataUrl: art4 },
]

var MOCK_SPOTIFY_TRACKS = [
  { id: 'spot-1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration_ms: 200000, image_url: art1, uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b' },
  { id: 'spot-2', title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide', duration_ms: 233000, image_url: art2, uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3' },
  { id: 'spot-3', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration_ms: 354000, image_url: art3, uri: 'spotify:track:3z8h0TU7ReDPLIbEnYhWZb' },
  { id: 'spot-4', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration_ms: 482000, image_url: art4, uri: 'spotify:track:5CQ30WqJwcep0pYcV4AmNv' },
  { id: 'spot-5', title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', duration_ms: 225000, image_url: art1, uri: 'spotify:track:2WfaOiMkCvy7F5fcp2zZ8L' },
]

var MOCK_PLAYLISTS = [
  { id: 'pl-1', name: 'Chiptune Favorites', description: 'Best 8-bit tracks', image_url: null, tracks_count: 42 },
  { id: 'pl-2', name: 'Gaming OSTs', description: 'Epic game soundtracks', image_url: null, tracks_count: 87 },
  { id: 'pl-3', name: 'Retro Vibes', description: 'Nostalgic classics', image_url: null, tracks_count: 56 },
  { id: 'pl-4', name: 'Late Night Coding', description: 'Focus music', image_url: null, tracks_count: 33 },
  { id: 'pl-5', name: 'Synthwave Journey', description: 'Outrun the night', image_url: null, tracks_count: 24 },
]

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms) })
}

// Delete a file if it exists
function deleteIfExists(path) {
  try { unlinkSync(path) } catch (e) { /* file doesn't exist, ok */ }
}

async function main() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  console.log('Screenshots will be saved to: ' + SCREENSHOTS_DIR)

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

  // Set localStorage before navigation
  console.log('Setting localStorage for theme and language...')
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(function() {
    localStorage.setItem('chiptune-theme', 'monochrome')
    localStorage.setItem('chiptune-language', 'en')
  })
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 })
  await sleep(2000)

  // Inject mock local tracks
  console.log('Injecting mock tracks...')
  var tracksInjected = await page.evaluate(function(tracks) {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.player) {
      stores.player.setState({ tracks: tracks })
      return true
    }
    return false
  }, MOCK_TRACKS)
  console.log('  Tracks injected: ' + tracksInjected)

  try {
    await page.waitForSelector('.library__row', { timeout: 5000 })
    console.log('  Library rows rendered')
  } catch (e) {
    console.log('  Library rows may not have rendered')
  }

  // Inject Spotify mock data
  console.log('Injecting Spotify mock data...')
  var spotifyInjected = await page.evaluate(function(data) {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.spotify) {
      stores.spotify.setState({
        likedSongs: data.tracks,
        playlists: data.playlists,
        isConfigured: true,
        clientId: 'mock-client-id',
        account: { connected: true, display_name: 'Player One', email: 'player@example.com', product: 'premium' },
        librespotInitialised: true,
        librespotVersion: '0.8.0',
      })
      return true
    }
    return false
  }, { tracks: MOCK_SPOTIFY_TRACKS, playlists: MOCK_PLAYLISTS })
  console.log('  Spotify data injected: ' + spotifyInjected)

  await sleep(1000)

  // Helper: take a screenshot
  async function shoot(name) {
    var filePath = join(SCREENSHOTS_DIR, name + '.png')
    await page.screenshot({ path: filePath, fullPage: false })
    console.log('  OK ' + name + '.png')
    return filePath
  }

  console.log('\nCapturing screenshots...')

  // 1. Main View
  await page.evaluate(function() {
    var buttons = document.querySelectorAll('.library__tab')
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent || ''
      if (text.indexOf('LOCAL') !== -1 || text.indexOf('local') !== -1) {
        buttons[i].click()
        break
      }
    }
  })
  await sleep(800)
  await shoot('main-view')

  // 2. Library with first track selected
  await page.evaluate(function() {
    var rows = document.querySelectorAll('.library__row')
    if (rows.length > 0) rows[0].click()
  })
  await sleep(500)
  await shoot('library-full')

  // 3. Settings Drawer
  await page.evaluate(function() {
    var btn = document.querySelector('.settings-button')
    if (btn) btn.click()
  })
  await sleep(1000)
  await shoot('settings-drawer')

  // Close settings
  await page.keyboard.press('Escape')
  await sleep(500)

  // 4. Spotify Panel (Liked Songs)
  await page.evaluate(function() {
    var buttons = document.querySelectorAll('.library__tab')
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent || ''
      if (text.indexOf('SPOTIFY') !== -1) {
        buttons[i].click()
        break
      }
    }
  })
  await sleep(1500)
  await shoot('spotify-panel')

  // 5. Spotify Playlists
  await page.evaluate(function() {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.spotify) {
      stores.spotify.getState().setActiveSection('playlists')
    }
  })
  await sleep(1000)
  await shoot('spotify-playlists')

  // 6. Spotify Search
  await page.evaluate(function() {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.spotify) {
      stores.spotify.getState().setActiveSection('search')
    }
  })
  await sleep(500)

  // Type a search query
  await page.evaluate(function() {
    var inputs = document.querySelectorAll('input')
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i]
      var inputType = (input.getAttribute('type') || '').toLowerCase()
      var placeholder = (input.getAttribute('placeholder') || '').toLowerCase()
      if (inputType === 'text' || inputType === 'search' || placeholder.indexOf('search') !== -1 || placeholder.indexOf('track') !== -1) {
        input.focus()
        // Trigger React onChange
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        nativeSetter.call(input, 'chiptune')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        break
      }
    }
  })
  await sleep(2000)
  await shoot('spotify-search')

  // Switch back to local tab
  await page.evaluate(function() {
    var buttons = document.querySelectorAll('.library__tab')
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent || ''
      if (text.indexOf('LOCAL') !== -1 || text.indexOf('local') !== -1) {
        buttons[i].click()
        break
      }
    }
  })
  await sleep(500)

  // 7. Now Playing / Queue - simulate active playback with first track
  await page.evaluate(function() {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.player) {
      stores.player.setState({
        currentIndex: 0,
        isPlaying: true,
        currentTime: 45,
        duration: 427,
        playbackStatus: 'playing',
        nowPlaying: {
          id: 'mock-1',
          title: 'Through the Fire and Flames',
          artist: 'DragonForce',
          album: 'Inhuman Rampage',
          durationSec: 427,
          imageUrl: arguments[0],
        },
      })
    }
  }, art1)
  await sleep(1000)

  // Click first track to show it selected
  await page.evaluate(function() {
    var rows = document.querySelectorAll('.library__row')
    if (rows.length > 0) rows[0].click()
  })
  await sleep(800)
  await shoot('now-playing')

  // Reset playback state
  await page.evaluate(function() {
    var stores = window.__CHIPTUNE_STORES__
    if (stores && stores.player) {
      stores.player.setState({
        isPlaying: false,
        currentIndex: -1,
        nowPlaying: null,
        playbackStatus: 'stopped',
      })
    }
  })
  await sleep(300)

  // 8. Theme Switcher
  await page.evaluate(function() {
    var themeEl = document.querySelector('.theme-switcher')
    if (themeEl) {
      var toggle = themeEl.querySelector('button')
      if (toggle) toggle.click()
    }
  })
  await sleep(1000)
  await shoot('theme-switcher')

  // Close theme picker
  await page.evaluate(function() {
    document.body.click()
  })
  await sleep(300)

  // 9. Context Menu - right-click on third track
  await page.evaluate(function() {
    var rows = document.querySelectorAll('.library__row')
    if (rows.length >= 3) {
      var row = rows[2]
      var rect = row.getBoundingClientRect()
      var event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 2,
      })
      row.dispatchEvent(event)
    }
  })
  await sleep(800)
  await shoot('context-menu')

  // Close menu
  await page.evaluate(function() {
    document.body.click()
  })
  await sleep(300)

  // 10. About Dialog
  await page.evaluate(function() {
    var root = document.querySelector('.app-root') || document.body
    var event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
      button: 2,
    })
    root.dispatchEvent(event)
  })
  await sleep(500)

  await page.evaluate(function() {
    var items = document.querySelectorAll('[class*="context-menu"] button, [class*="app-context"] button')
    for (var i = 0; i < items.length; i++) {
      var text = items[i].textContent || ''
      if (text.toLowerCase().indexOf('about') !== -1) {
        items[i].click()
        break
      }
    }
  })
  await sleep(1000)
  await shoot('about-dialog')

  // Close dialog
  await page.keyboard.press('Escape')
  await sleep(300)

  // Clean up stale screenshots from previous runs
  console.log('\nCleaning up stale screenshots...')
  deleteIfExists(join(SCREENSHOTS_DIR, 'record-player.png'))
  console.log('  Removed stale record-player.png')

  await browser.close()
  console.log('\nAll screenshots captured successfully!')
  console.log('Saved to: ' + SCREENSHOTS_DIR)
}

main().catch(function(err) {
  console.error('Screenshot capture failed:', err)
  process.exit(1)
})
