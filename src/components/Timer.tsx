'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'

interface TimerProps {
  onComplete?: () => void
}

export function Timer({ onComplete }: TimerProps) {
  const { timer, tickTimer } = useGameStore()

  useEffect(() => {
    if (!timer.isRunning) return

    const interval = setInterval(() => {
      tickTimer()
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, tickTimer])

  useEffect(() => {
    if (timer.isRunning && timer.seconds === 0) {
      onComplete?.()
    }
  }, [timer.seconds, timer.isRunning, onComplete])

  const minutes = Math.floor(timer.seconds / 60)
  const seconds = timer.seconds % 60
  const isUrgent = timer.seconds <= 10 && timer.seconds > 0
  const progress = timer.totalSeconds > 0 ? (timer.seconds / timer.totalSeconds) * 100 : 0

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={timer.seconds}
          className={`timer-display ${isUrgent ? 'timer-urgent' : ''}`}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="progress-bar mt-4 w-64 mx-auto">
        <motion.div
          className="progress-fill"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Status text */}
      <p className="text-[var(--text-secondary)] text-sm mt-2 uppercase tracking-wider">
        {timer.isRunning ? (isUrgent ? 'Time Running Out!' : 'Time Remaining') : 'Ready'}
      </p>
    </div>
  )
}
