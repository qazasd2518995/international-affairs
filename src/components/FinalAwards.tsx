'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Team } from '@/lib/types'

interface FinalAwardsProps {
  teams: Team[]
}

export function FinalAwards({ teams }: FinalAwardsProps) {
  const [revealed, setRevealed] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const sortedByScore = [...teams].sort((a, b) => b.totalScore - a.totalScore)
  const champion = sortedByScore[0]

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (!champion) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="pixel-panel text-center">
          <p className="font-pixel text-pixel-base text-text-dim">
            LOADING CHAMPION<span className="loading-dots"></span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="pixel-panel pixel-panel-yellow cursor-pointer"
              onClick={() => setShowIntro(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="py-8 px-12">
                <motion.div
                  className="font-pixel text-pixel-4xl neon-glow-yellow mb-4"
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ★
                </motion.div>
                <p className="font-pixel text-pixel-2xl neon-glow-yellow mb-4">
                  CROWN THE CHAMPION
                </p>
                <p className="font-terminal text-terminal-lg text-text-dim">
                  &gt; Who earned the most XP?
                </p>
                <p className="press-start mt-4 text-pixel-sm">
                  ► PRESS A ◄
                </p>
              </div>
            </motion.button>
          </motion.div>
        ) : !revealed ? (
          <motion.div
            key="drumroll"
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="font-pixel text-[100px] md:text-[160px] neon-glow-yellow leading-none mb-6"
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.2, 0.9, 1.2, 0.9, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              ♛
            </motion.div>
            <motion.p
              className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-pink animate-glitch"
            >
              WHO IS...
            </motion.p>
            <motion.p
              className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow mt-4 animate-glitch"
            >
              THE CHAMPION?
            </motion.p>
            <p className="font-terminal text-terminal-lg text-text-dim mt-6">
              &gt; Calculating final XP<span className="loading-dots"></span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="champion"
            className="crt-on"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'linear' }}
          >
            <div className="pixel-panel pixel-panel-yellow text-center">
              <p className="font-pixel text-pixel-sm text-neon-yellow mb-4">
                ★ STAGE CLEAR! ★
              </p>

              <motion.div
                className="font-pixel text-[120px] md:text-[180px] neon-glow-yellow leading-none mb-4"
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ♛
              </motion.div>

              <motion.p
                className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                CHAMPION
              </motion.p>

              <motion.div
                className="dialogue-box my-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="font-terminal text-terminal-2xl md:text-terminal-3xl text-neon-yellow">
                  {champion?.name.toUpperCase()}
                </p>
                <p className="font-terminal text-terminal-lg text-text-dim mt-4">
                  &gt; The greatest debater of all!
                </p>
              </motion.div>

              <motion.div
                className="inline-block pixel-panel-sm pixel-panel"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, ease: 'linear' }}
              >
                <p className="font-pixel text-pixel-sm text-neon-cyan mb-2">
                  FINAL XP
                </p>
                <p className="font-pixel text-pixel-4xl neon-glow-green">
                  {champion?.totalScore.toFixed(1)}
                </p>
              </motion.div>

              {/* Confetti-like pixel sparkles around the winner */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="font-terminal text-terminal-xl text-text-white">
                  ♪ GG! THANKS FOR PLAYING! ♪
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
