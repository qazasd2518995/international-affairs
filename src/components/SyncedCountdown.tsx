'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock } from 'lucide-react'

interface SyncedCountdownProps {
  duration: number
  startedAt: number | null // unix timestamp in ms
  onComplete?: () => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SyncedCountdown({
  duration,
  startedAt,
  onComplete,
  label = 'Time Remaining',
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
    sm: 'text-4xl',
    md: 'text-7xl',
    lg: 'text-[10rem]',
  }

  const svgSizes = {
    sm: { size: 120, radius: 55, stroke: 6 },
    md: { size: 240, radius: 110, stroke: 8 },
    lg: { size: 320, radius: 150, stroke: 10 },
  }

  const svg = svgSizes[size]

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg width={svg.size} height={svg.size} className="transform -rotate-90">
          <circle
            cx={svg.size / 2}
            cy={svg.size / 2}
            r={svg.radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={svg.stroke}
            fill="none"
          />
          <motion.circle
            cx={svg.size / 2}
            cy={svg.size / 2}
            r={svg.radius}
            stroke={
              isUrgent ? 'var(--disagree-red)' :
              isWarning ? 'var(--spotlight-amber)' :
              'var(--spotlight-gold)'
            }
            strokeWidth={svg.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * svg.radius}`}
            strokeDashoffset={`${2 * Math.PI * svg.radius * (1 - progress / 100)}`}
            style={{
              filter: isUrgent ? 'drop-shadow(0 0 20px var(--disagree-red))' :
                      isWarning ? 'drop-shadow(0 0 15px var(--spotlight-amber))' :
                      'drop-shadow(0 0 10px var(--spotlight-gold))',
            }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={seconds}
              className={`timer-display ${sizeClasses[size]} font-bold`}
              style={{
                color: isUrgent ? 'var(--disagree-red)' :
                       isWarning ? 'var(--spotlight-amber)' :
                       'var(--text-primary)',
              }}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                ...(isUrgent ? { scale: [1, 1.15, 1] } : {}),
              }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{
                duration: isUrgent ? 0.4 : 0.2,
                repeat: isUrgent ? Infinity : 0,
              }}
            >
              {minutes > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : secs}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        className="mt-4 flex items-center justify-center gap-2 uppercase tracking-wider"
        animate={{ color: isUrgent ? 'var(--disagree-red)' : 'var(--text-secondary)' }}
      >
        {isUrgent && <AlertTriangle size={18} className="text-[var(--disagree-red)]" />}
        {isWarning && !isUrgent && <Clock size={18} className="text-[var(--spotlight-amber)]" />}
        <span>{isUrgent ? 'HURRY UP!' : isWarning ? 'Wrap it up' : label}</span>
      </motion.div>

      {isUrgent && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-30"
          animate={{
            boxShadow: [
              'inset 0 0 0 rgba(239, 68, 68, 0)',
              'inset 0 0 150px rgba(239, 68, 68, 0.3)',
              'inset 0 0 0 rgba(239, 68, 68, 0)',
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  )
}
