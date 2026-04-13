'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock } from 'lucide-react'

interface CountdownTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
  autoStart?: boolean
}

export function CountdownTimer({
  duration,
  onComplete,
  label = 'Time Remaining',
  size = 'md',
  autoStart = true,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(duration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const hasCompletedRef = useRef(false)

  // Reset timer when duration changes
  useEffect(() => {
    setSeconds(duration)
    setIsRunning(autoStart)
    hasCompletedRef.current = false
  }, [duration, autoStart])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true
            onComplete?.()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onComplete])

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

  return (
    <div className="text-center">
      {/* Progress ring */}
      <div className="relative inline-block">
        <svg width="240" height="240" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="120"
            cy="120"
            r="110"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress ring */}
          <motion.circle
            cx="120"
            cy="120"
            r="110"
            stroke={
              isUrgent ? 'var(--disagree-red)' :
              isWarning ? 'var(--spotlight-amber)' :
              'var(--spotlight-gold)'
            }
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 110}`}
            strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress / 100)}`}
            style={{
              filter: isUrgent ? 'drop-shadow(0 0 20px var(--disagree-red))' :
                      isWarning ? 'drop-shadow(0 0 15px var(--spotlight-amber))' :
                      'drop-shadow(0 0 10px var(--spotlight-gold))',
            }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* Timer number in center */}
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
                ...(isUrgent ? {
                  scale: [1, 1.15, 1],
                } : {}),
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

      {/* Label */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-2 uppercase tracking-wider"
        animate={{
          color: isUrgent ? 'var(--disagree-red)' : 'var(--text-secondary)',
        }}
      >
        {isUrgent && <AlertTriangle size={18} className="text-[var(--disagree-red)]" />}
        {isWarning && !isUrgent && <Clock size={18} className="text-[var(--spotlight-amber)]" />}
        <span>{isUrgent ? 'HURRY UP!' : isWarning ? 'Wrap it up' : label}</span>
      </motion.div>

      {/* Pulse effect when urgent */}
      {isUrgent && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
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
