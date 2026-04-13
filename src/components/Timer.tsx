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
    const interval = setInterval(() => tickTimer(), 1000)
    return () => clearInterval(interval)
  }, [timer.isRunning, tickTimer])

  useEffect(() => {
    if (timer.isRunning && timer.seconds === 0) onComplete?.()
  }, [timer.seconds, timer.isRunning, onComplete])

  const minutes = Math.floor(timer.seconds / 60)
  const seconds = timer.seconds % 60
  const isUrgent = timer.seconds <= 10 && timer.seconds > 0
  const progress = timer.totalSeconds > 0 ? (timer.seconds / timer.totalSeconds) * 100 : 0

  return (
    <div className="max-w-sm mx-auto">
      <div className="pixel-panel pixel-panel-sm">
        <div className="text-center my-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={timer.seconds}
              className={`pixel-timer font-pixel text-pixel-3xl ${isUrgent ? 'timer-danger neon-glow-pink' : 'neon-glow-cyan'}`}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.1, ease: 'linear' }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pixel-bar-container">
          <span className="font-pixel text-pixel-sm text-neon-yellow">T</span>
          <div className="pixel-bar flex-1">
            <motion.div
              className={`pixel-bar-fill ${isUrgent ? 'pixel-bar-red' : 'pixel-bar-hp'}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
