# Minimal DSP Pipeline — Runtime Test Plan

Run `npm run tauri dev`, open DevTools Console, and follow each scenario.

---

## 1. Local playback produces audible sound

**Steps:**
1. Click a local file to play it
2. Watch console for:

```
[LOCAL] _connectToDspEngine: Connecting MediaElementSource...
[LOCAL] ✅ MediaElementSource created.
[LOCAL] ✅ MediaElementSource connected to DspEngine._inputNode
[LOCAL] ✅ audio.play() succeeded
[LOCAL]   Scheduling DSP confirmation in 200ms...
[LOCAL] ✅ DSP path CONFIRMED — native path can now be safely silenced
[DSP] Source connected to _inputNode successfully
```

**Expected:** Audio is audible. If silent, check that `_connectToDspEngine` succeeded (no ❌ error).

---

## 2. Spotify playback produces audible sound

**Steps:**
1. Play a Spotify track
2. Watch console for:

```
[DSP] connectSource called. source node type: AudioBufferSourceNode
[DSP] Source connected to _inputNode successfully
[LIBRESPOT-CHUNK] #1 connected to DSP engine input
```

**Expected:** Audio is audible. Volume controlled by `_masterGain`.

---

## 3. Volume slider immediately affects Local playback

**Steps:**
1. With local audio playing, move the volume slider
2. Watch console for:

```
[LOCAL] setVolume: 0.5 -> 0.5 mediaSourceConnected=true dspConfirmed=true dspInitialized=true
[LOCAL]   ✅ DSP confirmed — MasterVolume= 0.5 audio.volume=0.0 (native path SILENCED)
[DSP] setMasterVolume( 0.5 ) — clamped to 0.5
[DSP]   _masterGain.gain.value: 0.7 → 0.5
```

**Expected:** Volume changes instantly. `_masterGain.gain.value` changes to match.

---

## 4. Volume slider immediately affects Spotify playback

**Steps:**
1. With Spotify playing, move the volume slider
2. Watch console for:

```
[LIBRESPOT] setVolume: 0.5 -> 0.5 dspConnected=true hasGainNode=false
[LIBRESPOT]   Volume routed through DSP MasterVolume: 0.5
[DSP] setMasterVolume( 0.5 ) — clamped to 0.5
[DSP]   _masterGain.gain.value: 0.7 → 0.5
```

**Expected:** Volume changes instantly. Same `_masterGain` controls both providers.

---

## 5. Setting volume to 0 = complete silence

**Steps:**
1. Move volume slider to 0
2. Watch console for:

```
[LOCAL] setVolume: 0 -> 0 ...
[DSP] setMasterVolume( 0 ) — clamped to 0
[DSP]   _masterGain.gain.value: X → 0
```

**Expected:** Complete silence. `_masterGain.gain.value = 0`.

---

## 6. Setting volume back to 1 restores full volume

**Steps:**
1. Move volume to 1
2. Watch console for:

```
[DSP] setMasterVolume( 1 ) — clamped to 1
[DSP]   _masterGain.gain.value: 0 → 1
```

**Expected:** Full volume restored.

---

## 7. Seeking continues through DSP path

**Steps:**
1. While playing, click on progress bar to seek
2. Watch console for:

```
[LOCAL] seek( 45 ) — setting audio.currentTime = 45
```

**Expected:** Audio continues playing after seek. DSP path remains active (no reconnect needed).

---

## 8. Pause / Resume preserves the DSP path

**Steps:**
1. Click pause
2. Click play/resume
3. Watch console for:

```
// Pause:
[LOCAL] emitProgress() → ... isPlaying=false

// Resume:
[LOCAL] _ensureAudioContextRunning: AudioContext already running
[LOCAL] ✅ audio.play() succeeded
```

**Expected:** Audio resumes. No new `_connectToDspEngine()` or `_dspConfirmed` cycle.

---

## 9. Switching Local → Spotify → Local works

**Steps:**
1. Play a local file (confirm DSP path)
2. Switch to a Spotify track
3. Switch back to a local file
4. Watch console for:

```
// Local → Spotify:
[playback] Switched to spotify-librespot

// Back to Local:
[playback] Switched to local
[LOCAL] _connectToDspEngine: Already connected, skipping   ← KEY: no reconnection!
```

**Expected:** No reconnection. `_connectToDspEngine` returns "Already connected, skipping".

---

## 10. Native HTMLAudioElement path never becomes the ONLY audible path

**Steps:**
1. After DSP is confirmed, play a local file
2. Watch for `[LOCAL]   ✅ DSP confirmed ... audio.volume=0.0` in the logs
3. The test: when `_dspConfirmed = true`, `audio.volume = 0.0`
4. If `audio.volume` ever becomes > 0 while `_dspConfirmed = true`, the native path is leaking

**Expected:** `audio.volume` stays at `0.0` after DSP confirmation. If you hear audio, it's ONLY through the DSP path (monitor via `_masterGain.gain.value` changes).
