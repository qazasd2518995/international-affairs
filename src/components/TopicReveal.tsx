'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [shuffleProgress, setShuffleProgress] = useState(0) // 0..100 during shuffling

  const availableTopics = TOPICS.filter((t) => !usedTopicIds.includes(t.id))

  const startShuffle = () => {
    setPhase('countdown')
    setCountdown(3)
  }

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

    // Decide the final topic up-front so the animation lands on it predictably.
    const finalIndex = Math.floor(Math.random() * availableTopics.length)

    // Shuffle timing: fast ramp-up, slow-down with decreasing frequency so
    // the audience can feel each card slot in. Final 3 slots are clearly
    // spaced 400ms / 550ms / 700ms apart, no long silent hang.
    const schedule = [
      // phase 1: fast shuffle (32 ticks × 50ms ≈ 1.6s)
      ...Array(32).fill(50),
      // phase 2: ease out (8 ticks with increasing delay)
      80, 110, 150, 200, 260, 330, 400, 550,
      // phase 3: final dramatic beat before reveal
      700,
    ]
    const totalTicks = schedule.length

    let tick = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const runTick = () => {
      if (tick >= totalTicks) {
        setShuffleProgress(100)
        setCurrentIndex(finalIndex)
        timeoutId = setTimeout(() => {
          const topic = availableTopics[finalIndex]
          setSelectedTopic(topic)
          setPhase('revealed')
          onReveal(topic)
        }, 400)
        return
      }
      setCurrentIndex((prev) => (prev + 1) % availableTopics.length)
      tick++
      setShuffleProgress(Math.round((tick / totalTicks) * 100))
      timeoutId = setTimeout(runTick, schedule[tick - 1])
    }

    timeoutId = setTimeout(runTick, 50)
    return () => clearTimeout(timeoutId)
  }, [phase, availableTopics, onReveal])

  const displayTopic = phase === 'revealed' ? selectedTopic : availableTopics[currentIndex]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="pixel-panel pixel-panel-yellow cursor-pointer"
              onClick={startShuffle}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="py-8 px-12">
                <motion.div
                  className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow mb-4"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  [ ? ? ? ]
                </motion.div>
                <div className="font-pixel text-pixel-lg text-neon-yellow">
                  OPEN TREASURE
                </div>
                <div className="font-terminal text-terminal-base text-text-dim mt-2">
                  {availableTopics.length} topics in the box
                </div>
                <div className="press-start mt-6 text-pixel-sm">
                  ► PRESS A ◄
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* 3-2-1 Countdown */}
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
                className="font-pixel text-[120px] md:text-[200px] neon-glow-yellow animate-glitch leading-none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'linear' }}
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </AnimatePresence>
            <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
              SHUFFLING<span className="loading-dots"></span>
            </p>
          </motion.div>
        )}

        {phase === 'shuffling' && displayTopic && (() => {
          const nearEnd = shuffleProgress >= 80
          const locking = shuffleProgress >= 97
          const label = locking ? '[ LOCKING IN... ]' : nearEnd ? '[ SLOWING DOWN ]' : '[ SHUFFLING ]'

          return (
            <motion.div
              key="shuffling"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="pixel-panel pixel-panel-pink">
                <div className="text-center mb-4">
                  <motion.p
                    key={label}
                    className="font-pixel text-pixel-base text-neon-pink animate-glitch"
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {label}
                  </motion.p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.05, ease: 'linear' }}
                  >
                    <div className="flex justify-center gap-3 mb-4 flex-wrap">
                      <CategoryTag category={displayTopic.category} />
                      <DifficultyStars difficulty={displayTopic.difficulty} animate={false} />
                    </div>
                    <p className="font-terminal text-terminal-base md:text-terminal-lg text-text-white min-h-[60px] px-4">
                      {displayTopic.question}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar so audience always knows roughly where we are */}
                <div className="mt-6 max-w-md mx-auto">
                  <div className="pixel-bar-container">
                    <div className="pixel-bar flex-1 h-4">
                      <motion.div
                        className={`pixel-bar-fill ${locking ? 'pixel-bar-red' : 'pixel-bar-hp'}`}
                        style={{ width: `${shuffleProgress}%` }}
                        transition={{ duration: 0.1, ease: 'linear' }}
                      />
                    </div>
                  </div>
                  <p className="font-pixel text-pixel-sm text-neon-yellow mt-2">
                    {shuffleProgress}%
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })()}

        {phase === 'revealed' && selectedTopic && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.4, ease: 'linear' }}
            className="crt-on"
          >
            <div className="pixel-panel pixel-panel-neon">
              <div className="text-center mb-6">
                <p className="font-pixel text-pixel-sm text-neon-yellow">
                  ★ NEW QUEST UNLOCKED ★
                </p>
              </div>

              <div className="flex justify-center items-center gap-4 mb-6 flex-wrap">
                <CategoryTag category={selectedTopic.category} size="lg" />
                <span className="font-pixel text-neon-yellow">|</span>
                <DifficultyStars difficulty={selectedTopic.difficulty} size="lg" />
              </div>

              <motion.div
                className="dialogue-box"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="font-terminal text-terminal-lg md:text-terminal-xl">
                  {selectedTopic.question}
                </p>
              </motion.div>

              {selectedTopic.difficulty === 3 && (
                <motion.div
                  className="text-center mt-6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, ease: 'linear' }}
                >
                  <div className="pixel-tag pixel-tag-yellow animate-float">
                    <span>★</span>
                    <span>BOSS LEVEL · BONUS XP</span>
                    <span>★</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
