'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const STORAGE_KEY = 'mda_bgm_muted'

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(false)
  const [primed, setPrimed] = useState(false)

  // Restore mute preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '1') setMuted(true)
  }, [])

  // Try autoplay on mount; if browser blocks, wait for first user interaction.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.35

    const start = () => {
      if (!audio || muted) return
      audio.play().then(() => setPrimed(true)).catch(() => {
        // Autoplay blocked — will start on first interaction below
      })
    }

    start()

    // First user interaction (anywhere on the page) starts the music
    const onFirstInteraction = () => {
      if (audio && !muted) {
        audio.play().then(() => setPrimed(true)).catch(() => {})
      }
      window.removeEventListener('pointerdown', onFirstInteraction)
      window.removeEventListener('keydown', onFirstInteraction)
      window.removeEventListener('touchstart', onFirstInteraction)
    }
    window.addEventListener('pointerdown', onFirstInteraction)
    window.addEventListener('keydown', onFirstInteraction)
    window.addEventListener('touchstart', onFirstInteraction)

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction)
      window.removeEventListener('keydown', onFirstInteraction)
      window.removeEventListener('touchstart', onFirstInteraction)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply mute changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (muted) {
      audio.pause()
    } else if (primed) {
      audio.play().catch(() => {})
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
    }
  }, [muted, primed])

  return (
    <>
      <audio ref={audioRef} loop preload="auto" playsInline>
        <source src="/bgm.opus" type="audio/ogg; codecs=opus" />
        <source src="/bgm.mp3" type="audio/mpeg" />
      </audio>

      <motion.button
        className="fixed bottom-3 right-3 z-50 pixel-btn pixel-btn-ghost text-pixel-sm"
        style={{ minHeight: 36, padding: '6px 12px' }}
        onClick={() => setMuted((m) => !m)}
        whileTap={{ scale: 0.9 }}
        title={muted ? 'Unmute music' : 'Mute music'}
        aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      >
        {muted ? '♪ OFF' : '♪ ON'}
      </motion.button>
    </>
  )
}
