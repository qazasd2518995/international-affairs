'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface SyncedCountdownProps {
  duration: number
  startedAt: number | null
  onComplete?: () => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SyncedCountdown({
  duration,
  startedAt,
  onComplete,
  label = 'TIME',
  size = 'md',
}: SyncedCountdownProps) {
  const [seconds, setSeconds] = useState(duration)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    hasCompletedRef.current = false

    if (!startedAt) {
      setSeconds(duration)
      return
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      setSeconds(remaining)

      if (remaining === 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true
        onComplete?.()
      }
    }

    tick()
    const interval = setInterval(tick, 200)
    return () => clearInterval(interval)
  }, [duration, startedAt, onComplete])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const isUrgent = seconds <= 5 && seconds > 0
  const isWarning = seconds <= 10 && seconds > 5
  const progress = duration > 0 ? (seconds / duration) * 100 : 0

  const sizeClasses = {
    sm: 'text-pixel-2xl',
    md: 'text-pixel-3xl',
    lg: 'text-pixel-4xl md:text-[80px]',
  }

  const containerSizes = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  }

  return (
    <div className={`${containerSizes[size]} mx-auto w-full`}>
      <div className="pixel-panel pixel-panel-sm">
        {/* Label bar */}
        <div className="flex items-center justify-center mb-3">
          <span className="font-pixel text-pixel-sm text-neon-yellow">
            {label.toUpperCase()}
          </span>
        </div>

        {/* Big timer */}
        <div className="text-center my-3">
          <div
            className={`pixel-timer font-pixel ${sizeClasses[size]} ${isUrgent ? 'timer-danger neon-glow-pink' : isWarning ? 'neon-glow-yellow' : 'neon-glow-cyan'}`}
          >
            {minutes > 0 ? `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : String(secs).padStart(2, '0')}
          </div>
        </div>

        {/* Pixel HP bar */}
        <div className="pixel-bar-container">
          <span className="font-pixel text-pixel-sm text-neon-yellow">T</span>
          <div className="pixel-bar flex-1">
            <motion.div
              className={`pixel-bar-fill ${isUrgent ? 'pixel-bar-red' : isWarning ? 'pixel-bar-exp' : 'pixel-bar-hp'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Warning text */}
        {isUrgent && (
          <motion.p
            className="font-pixel text-pixel-sm text-neon-red text-center mt-3 animate-shake"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ※ HURRY UP! ※
          </motion.p>
        )}
      </div>
    </div>
  )
}
