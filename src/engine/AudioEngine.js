'use client'

import { Howl, Howler } from 'howler'

const SFX_TYPES = ['birth', 'death', 'combat', 'marriage', 'era_change', 'building_complete', 'lightning', 'plague', 'god_power', 'blessing']
const ERA_IDS = ['ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'singularity']

class AudioEngine {
  constructor() {
    this.sfx = {}
    this.ambientHowls = {}
    this.currentAmbient = null
    this.masterVolume = 0.5
    this.muted = false
    this.initialized = false
    this.audioAvailable = false // true only if audio directory exists
  }

  _init() {
    if (this.initialized) return
    this.initialized = true

    // Probe for audio directory with a quiet HEAD request.
    // A Howl XHR probe produces noisy 404 console errors when files are missing;
    // fetch() fails silently in the network tab without polluting the console.
    fetch('/audio/sfx/birth.mp3', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          this.audioAvailable = true
          this._loadAll()
        }
      })
      .catch(() => {
        // No audio files present — run in silent mode
      })
  }

  _loadAll() {
    // Load all SFX
    for (const type of SFX_TYPES) {
      try {
        this.sfx[type] = new Howl({
          src: [`/audio/sfx/${type}.mp3`],
          volume: this.masterVolume,
          preload: true,
          onloaderror: () => {},
        })
      } catch {
        // Missing audio asset — game continues without sound
      }
    }

    // Load ambient loops per era
    for (const era of ERA_IDS) {
      try {
        this.ambientHowls[era] = new Howl({
          src: [`/audio/ambient/${era}.mp3`],
          volume: this.masterVolume * 0.3,
          loop: true,
          preload: true,
          onloaderror: () => {},
        })
      } catch {
        // Missing ambient asset
      }
    }
  }

  playEvent(type) {
    if (this.muted) return
    this._init()
    const sound = this.sfx[type]
    if (sound) {
      try { sound.play() } catch { /* no audio file */ }
    }
  }

  playAmbient(era) {
    this._init()
    if (this.currentAmbient === era) return

    // Fade out previous
    if (this.currentAmbient && this.ambientHowls[this.currentAmbient]) {
      const prev = this.ambientHowls[this.currentAmbient]
      prev.fade(prev.volume(), 0, 2000)
      setTimeout(() => prev.stop(), 2100)
    }

    this.currentAmbient = era
    if (this.muted) return

    const next = this.ambientHowls[era]
    if (next) {
      try {
        next.volume(0)
        next.play()
        next.fade(0, this.masterVolume * 0.3, 2000)
      } catch { /* no audio file */ }
    }
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v))
    // Update all playing sounds
    for (const s of Object.values(this.sfx)) {
      if (s) s.volume(this.masterVolume)
    }
    for (const a of Object.values(this.ambientHowls)) {
      if (a) a.volume(this.masterVolume * 0.3)
    }
  }

  mute() {
    this.muted = true
    try { Howler.mute(true) } catch {}
    // Stop ambient
    if (this.currentAmbient && this.ambientHowls[this.currentAmbient]) {
      this.ambientHowls[this.currentAmbient].pause()
    }
  }

  unmute() {
    this.muted = false
    try { Howler.mute(false) } catch {}
    // Resume ambient
    if (this.currentAmbient && this.ambientHowls[this.currentAmbient]) {
      try { this.ambientHowls[this.currentAmbient].play() } catch {}
    }
  }
}

export const audioEngine = new AudioEngine()
