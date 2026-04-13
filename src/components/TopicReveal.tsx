'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Target, Star } from 'lucide-react'
import type { Topic } from '@/lib/types'
import { TOPICS } from '@/lib/types'
import { DifficultyStars } from './DifficultyStars'
import { CategoryTag } from './CategoryTag'

interface TopicRevealProps {
  onReveal: (topic: Topic) => void
  usedTopicIds?: string[]
}

export function TopicReveal({ onReveal, usedTopicIds = [] }: TopicRevealProps) {
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'shuffling' | 'revealed'>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [countdown, setCountdown] = useState(3)

  const availableTopics = TOPICS.filter((t) => !usedTopicIds.includes(t.id))

  const startShuffle = () => {
    setPhase('countdown')
    setCountdown(3)
  }

  // Countdown before shuffle
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800)
      return () => clearTimeout(timer)
    } else {
      setPhase('shuffling')
    }
  }, [phase, countdown])

  useEffect(() => {
    if (phase !== 'shuffling') return

    let shuffleSpeed = 60
    let elapsed = 0
    const totalDuration = 3500

    // Accelerating then decelerating shuffle
    const shuffleTick = () => {
      elapsed += shuffleSpeed
      setCurrentIndex((prev) => (prev + 1) % availableTopics.length)

      // Slow down near the end
      if (elapsed > totalDuration * 0.6) {
        shuffleSpeed = Math.min(shuffleSpeed + 30, 300)
      }

      if (elapsed >= totalDuration) {
        const finalIndex = Math.floor(Math.random() * availableTopics.length)
        const topic = availableTopics[finalIndex]
        setSelectedTopic(topic)
        setPhase('revealed')
        onReveal(topic)
        return
      }

      setTimeout(shuffleTick, shuffleSpeed)
    }

    const initTimer = setTimeout(shuffleTick, shuffleSpeed)
    return () => clearTimeout(initTimer)
  }, [phase, availableTopics, onReveal])

  const displayTopic = phase === 'revealed' ? selectedTopic : availableTopics[currentIndex]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card-strong p-12 cursor-pointer spotlight-effect"
              onClick={startShuffle}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="flex justify-center mb-6"
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Dices size={96} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' }} />
              </motion.div>
              <h2 className="title-display text-4xl text-[var(--spotlight-gold)] mb-4">
                DRAW A TOPIC
              </h2>
              <p className="text-[var(--text-secondary)] text-lg">
                Click to randomly select a debate topic
              </p>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                {availableTopics.length} topics available
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Countdown 3-2-1 */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                className="title-display text-[16rem] title-glow leading-none"
                style={{ color: 'var(--spotlight-gold)' }}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1, 1],
                  rotate: [0, 0, 0, 0],
                  opacity: [0, 1, 1, 0.5]
                }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.8, times: [0, 0.3, 0.6, 1] }}
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'shuffling' && displayTopic && (
          <motion.div
            key="shuffling"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Slot machine effect */}
            <motion.div
              className="glass-card-strong p-10 neon-border-animated relative overflow-hidden"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(255, 215, 0, 0.4)',
                  '0 0 60px rgba(0, 245, 255, 0.4)',
                  '0 0 30px rgba(255, 0, 255, 0.4)',
                  '0 0 60px rgba(255, 215, 0, 0.4)',
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {/* Shuffling overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    'linear-gradient(180deg, rgba(255,215,0,0) 0%, rgba(255,215,0,0.2) 50%, rgba(255,215,0,0) 100%)',
                    'linear-gradient(180deg, rgba(255,215,0,0) 100%, rgba(255,215,0,0.2) 50%, rgba(255,215,0,0) 0%)',
                  ],
                  backgroundPosition: ['0% 0%', '0% 100%'],
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="flex justify-center gap-4 mb-4">
                    <CategoryTag category={displayTopic.category} />
                    <DifficultyStars difficulty={displayTopic.difficulty} animate={false} />
                  </div>
                  <p className="text-xl text-[var(--text-secondary)] min-h-[60px]">
                    {displayTopic.question}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-3 mt-6"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Target size={24} className="text-[var(--spotlight-gold)]" />
              <p className="text-[var(--spotlight-gold)] text-xl title-display tracking-widest">
                SELECTING TOPIC...
              </p>
            </motion.div>
          </motion.div>
        )}

        {phase === 'revealed' && selectedTopic && (
          <motion.div
            key="revealed"
            className="reveal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Explosion burst */}
            <motion.div
              className="fixed inset-0 pointer-events-none z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1 }}
            >
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4) 0%, transparent 50%)',
              }} />
            </motion.div>

            <motion.div
              className="reveal-card glass-card-strong p-10 neon-border spotlight-effect"
              initial={{ rotateY: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 12,
              }}
            >
              {/* Topic header */}
              <motion.div
                className="flex justify-center items-center gap-6 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CategoryTag category={selectedTopic.category} size="lg" />
                <div className="h-8 w-px bg-[var(--glass-border)]" />
                <DifficultyStars difficulty={selectedTopic.difficulty} size="lg" />
              </motion.div>

              {/* Topic question */}
              <motion.h2
                className="text-2xl md:text-4xl font-bold text-center leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {selectedTopic.question}
              </motion.h2>

              {/* Difficulty bonus hint */}
              {selectedTopic.difficulty === 3 && (
                <motion.div
                  className="mt-6 text-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ delay: 1, type: 'spring' }}
                >
                  <motion.div
                    className="flex items-center justify-center gap-3"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Star size={24} className="text-[var(--spotlight-gold)]" fill="currentColor" />
                    <span className="text-[var(--spotlight-gold)] text-lg uppercase tracking-wider title-display">
                      Challenge Topic — Bonus Points!
                    </span>
                    <Star size={24} className="text-[var(--spotlight-gold)]" fill="currentColor" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
