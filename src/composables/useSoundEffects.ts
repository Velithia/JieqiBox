import { ref, watch } from 'vue'
import { useInterfaceSettings } from './useInterfaceSettings'

// Import sound files
import captureSound from '@/assets/sounds/capture.wav'
import checkSound from '@/assets/sounds/check.wav'
import checkmateSound from '@/assets/sounds/checkmate.wav'
import drawSound from '@/assets/sounds/draw.wav'
import flipSound from '@/assets/sounds/flip.wav'
import invalidSound from '@/assets/sounds/invalid.wav'
import liftOrReleaseSound from '@/assets/sounds/lift_or_release.wav'
import loadingSound from '@/assets/sounds/loading.wav'
import lossSound from '@/assets/sounds/loss.wav'
import winSound from '@/assets/sounds/win.wav'

// Sound types
export type SoundType =
  | 'capture'
  | 'check'
  | 'checkmate'
  | 'draw'
  | 'flip'
  | 'invalid'
  | 'liftOrRelease'
  | 'loading'
  | 'loss'
  | 'win'

// Sound file mapping
const soundFiles: Record<SoundType, string> = {
  capture: captureSound,
  check: checkSound,
  checkmate: checkmateSound,
  draw: drawSound,
  flip: flipSound,
  invalid: invalidSound,
  liftOrRelease: liftOrReleaseSound,
  loading: loadingSound,
  loss: lossSound,
  win: winSound,
}

// Audio cache to avoid recreating audio elements
const audioCache: Record<string, HTMLAudioElement> = {}

// Web Audio API resources for seamless looping
const audioBuffers: Partial<Record<SoundType, AudioBuffer>> = {}
let audioContext: AudioContext | null = null
let loopSourceNode: AudioBufferSourceNode | null = null
let loopGainNode: GainNode | null = null

// HTMLAudioElement fallback resources
let loopingAudio: HTMLAudioElement | null = null
let loopingAudioEndHandler: (() => void) | null = null

// Track the current looping mode
let loopingMode: 'webAudio' | 'htmlAudio' | null = null

// Global sound enabled state (will be synced with interface settings)
const soundEnabled = ref(true)
const soundVolume = ref(0.7) // Default volume 70%

// Flag to track initialization
let isInitialized = false

/**
 * Initialize sound settings from interface settings
 */
const initSoundSettings = () => {
  if (isInitialized) {
    console.log('[SOUND] Settings already initialized')
    return
  }
  isInitialized = true
  console.log('[SOUND] Initializing sound settings...')

  try {
    const { enableSoundEffects, soundVolume: volumeSetting } =
      useInterfaceSettings()

    // Sync initial values
    soundEnabled.value = enableSoundEffects.value
    soundVolume.value = volumeSetting.value / 100 // Convert from 0-100 to 0-1

    console.log('[SOUND] Initial settings:', {
      enabled: soundEnabled.value,
      volume: soundVolume.value,
      volumeSetting: volumeSetting.value,
    })

    // Watch for changes
    watch(enableSoundEffects, newValue => {
      console.log('[SOUND] Sound enabled changed:', newValue)
      soundEnabled.value = newValue
      if (!newValue) {
        stopSoundLoop()
      }
    })

    watch(volumeSetting, newValue => {
      console.log('[SOUND] Sound volume changed:', newValue)
      const normalized = newValue / 100 // Convert from 0-100 to 0-1
      soundVolume.value = normalized

      if (loopGainNode) {
        loopGainNode.gain.value = normalized
      }

      if (loopingAudio) {
        loopingAudio.volume = normalized
      }
    })
  } catch (error) {
    console.error('[SOUND] Failed to initialize sound settings:', error)
  }
}

/**
 * Get or create an audio element for the given sound type
 */
const getAudio = (soundType: SoundType): HTMLAudioElement => {
  if (!audioCache[soundType]) {
    const soundFile = soundFiles[soundType]
    console.log('[SOUND] Creating audio element:', {
      soundType,
      soundFile,
      exists: !!soundFile,
    })
    audioCache[soundType] = new Audio(soundFile)
  }
  return audioCache[soundType]
}

/**
 * Play a sound effect
 * @param soundType The type of sound to play
 */
const playSound = (soundType: SoundType): void => {
  // Initialize settings on first sound play
  initSoundSettings()

  if (!soundEnabled.value) return

  try {
    const soundFile = soundFiles[soundType]
    if (!soundFile) {
      console.debug('Sound file not found for type:', soundType)
      return
    }

    // Create a new Audio instance each time to allow overlapping playback
    // This is especially important for sounds like 'liftOrRelease' that may
    // be played in quick succession (lift and place sounds)
    const audio = new Audio(soundFile)
    audio.volume = soundVolume.value
    audio.currentTime = 0 // Reset to start

    // Clean up the audio element after it finishes playing to prevent memory leaks
    const handleEnded = () => {
      // Remove event listener and allow garbage collection
      audio.removeEventListener('ended', handleEnded)
    }
    audio.addEventListener('ended', handleEnded)

    audio.play().catch(err => {
      // Ignore autoplay policy errors silently
      console.debug('Sound playback failed:', err)
    })
  } catch (error) {
    console.debug('Failed to play sound:', error)
  }
}

/**
 * Set sound enabled state
 */
const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled.value = enabled
}

/**
 * Set sound volume
 * @param volume Volume level from 0 to 1
 */
const setSoundVolume = (volume: number): void => {
  soundVolume.value = Math.max(0, Math.min(1, volume))
}

/**
 * Lazily create or return the shared AudioContext
 */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (audioContext) return audioContext

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextCtor) {
    console.warn('[SOUND] Web Audio API is not supported in this environment')
    return null
  }

  audioContext = new AudioContextCtor()
  console.log('[SOUND] Created new AudioContext')
  return audioContext
}

/**
 * Decode an ArrayBuffer to an AudioBuffer (with compatibility fallback)
 */
const decodeToAudioBuffer = (
  ctx: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject)
  })
}

/**
 * Load (and cache) an AudioBuffer for the given sound type
 */
const loadAudioBuffer = async (
  soundType: SoundType
): Promise<AudioBuffer | null> => {
  if (audioBuffers[soundType]) {
    return audioBuffers[soundType] as AudioBuffer
  }

  const ctx = getAudioContext()
  if (!ctx) return null

  const soundFile = soundFiles[soundType]
  if (!soundFile) {
    console.error('[SOUND] Unable to load audio buffer, missing sound file:', {
      soundType,
    })
    return null
  }

  try {
    const response = await fetch(soundFile)
    if (!response.ok) {
      console.error('[SOUND] Failed to fetch audio file:', {
        soundType,
        status: response.status,
        statusText: response.statusText,
      })
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const decodedBuffer = await decodeToAudioBuffer(ctx, arrayBuffer)
    audioBuffers[soundType] = decodedBuffer
    console.log('[SOUND] Audio buffer decoded and cached:', soundType)
    return decodedBuffer
  } catch (error) {
    console.error('[SOUND] Error loading audio buffer:', {
      soundType,
      error,
    })
    return null
  }
}

/**
 * Start seamless looping using the Web Audio API
 */
const startWebAudioLoop = async (soundType: SoundType): Promise<boolean> => {
  const ctx = getAudioContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(error => {
        console.error('[SOUND] Failed to resume AudioContext:', error)
        throw error
      })
    }

    const buffer = await loadAudioBuffer(soundType)
    if (!buffer) return false

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.loopStart = 0
    source.loopEnd = buffer.duration

    const gain = ctx.createGain()
    gain.gain.value = soundVolume.value

    source.connect(gain)
    gain.connect(ctx.destination)

    source.start(0)

    loopSourceNode = source
    loopGainNode = gain
    loopingMode = 'webAudio'

    console.log('[SOUND] Web Audio loop started:', {
      soundType,
      duration: buffer.duration,
    })

    return true
  } catch (error) {
    console.error('[SOUND] Failed to start Web Audio loop:', {
      soundType,
      error,
    })
    stopWebAudioLoop()
    return false
  }
}

/**
 * Stop any active Web Audio loop
 */
const stopWebAudioLoop = () => {
  if (loopSourceNode) {
    try {
      loopSourceNode.onended = null
      loopSourceNode.stop()
    } catch (error) {
      console.debug('[SOUND] Error while stopping Web Audio source:', error)
    }
    loopSourceNode.disconnect()
    loopSourceNode = null
  }

  if (loopGainNode) {
    loopGainNode.disconnect()
    loopGainNode = null
  }
}

/**
 * Start looping using HTMLAudioElement fallback (less seamless)
 */
const startHtmlAudioLoop = (soundType: SoundType): boolean => {
  const soundFile = soundFiles[soundType]
  if (!soundFile) {
    console.error('[SOUND] HTML audio loop failed, missing sound file:', {
      soundType,
    })
    return false
  }

  try {
    const audio = new Audio(soundFile)
    audio.volume = soundVolume.value
    audio.currentTime = 0
    loopingAudio = audio

    const handleEnded = () => {
      if (loopingAudio !== audio || !soundEnabled.value) return
      audio.currentTime = 0
      audio.play().catch(err => {
        console.error('[SOUND] HTML audio loop restart failed:', err)
        stopSoundLoop()
      })
    }

    loopingAudioEndHandler = handleEnded
    audio.addEventListener('ended', handleEnded)

    audio.play().catch(err => {
      console.error('[SOUND] HTML audio loop playback failed:', err)
      stopSoundLoop()
    })

    loopingMode = 'htmlAudio'
    console.log('[SOUND] HTML audio loop started as fallback:', soundType)
    return true
  } catch (error) {
    console.error('[SOUND] Failed to start HTML audio loop:', {
      soundType,
      error,
    })
    return false
  }
}

/**
 * Stop the HTMLAudioElement fallback loop
 */
const stopHtmlAudioLoop = () => {
  if (!loopingAudio) return

  try {
    if (loopingAudioEndHandler) {
      loopingAudio.removeEventListener('ended', loopingAudioEndHandler)
      loopingAudioEndHandler = null
    }

    loopingAudio.pause()
    loopingAudio.currentTime = 0
  } catch (error) {
    console.debug('[SOUND] Error while stopping HTML audio loop:', error)
  }

  loopingAudio = null
}

/**
 * Play a sound in a loop
 * @param soundType The type of sound to play in loop
 */
const playSoundLoop = (soundType: SoundType): void => {
  console.log('[SOUND] playSoundLoop called:', {
    soundType,
    timestamp: new Date().toISOString(),
  })

  // Initialize settings on first sound play
  initSoundSettings()

  console.log('[SOUND] After init, sound enabled:', soundEnabled.value)

  if (!soundEnabled.value) {
    console.warn('[SOUND] Sound is disabled, skipping playback')
    return
  }

  // Stop any currently looping sound
  stopSoundLoop()

  const startLoop = async () => {
    const startedWebAudio = await startWebAudioLoop(soundType)
    if (startedWebAudio) {
      return
    }

    console.warn(
      '[SOUND] Web Audio loop unavailable, falling back to HTML audio loop'
    )
    startHtmlAudioLoop(soundType)
  }

  void startLoop()
}

/**
 * Stop the currently looping sound
 */
const stopSoundLoop = (): void => {
  console.log('[SOUND] stopSoundLoop called:', {
    mode: loopingMode,
    hasLoopingAudio: !!loopingAudio,
    timestamp: new Date().toISOString(),
  })

  if (loopingMode === 'webAudio') {
    stopWebAudioLoop()
  }

  if (loopingMode === 'htmlAudio' || loopingAudio) {
    stopHtmlAudioLoop()
  }

  loopingMode = null
}

/**
 * Preload all sounds to ensure they're ready when needed
 */
const preloadSounds = (): void => {
  Object.keys(soundFiles).forEach(soundType => {
    getAudio(soundType as SoundType)
  })
}

/**
 * Sound effects composable
 */
export function useSoundEffects() {
  // Initialize settings when composable is used
  initSoundSettings()

  return {
    // State
    soundEnabled,
    soundVolume,

    // Methods
    playSound,
    playSoundLoop,
    stopSoundLoop,
    setSoundEnabled,
    setSoundVolume,
    preloadSounds,
  }
}
