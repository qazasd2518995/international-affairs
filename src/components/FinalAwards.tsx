'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Team } from '@/lib/types'

interface FinalAwardsProps {
  teams: Team[]
}

interface Award {
  title: string
  symbol: string
  team: Team
  description: string
  color: string
}

export function FinalAwards({ teams }: FinalAwardsProps) {
  const [currentAward, setCurrentAward] = useState(-1)
  const [showAll, setShowAll] = useState(false)

  const sortedByScore = [...teams].sort((a, b) => b.totalScore - a.totalScore)

  const awards: Award[] = [
    {
      title: 'CHAMPION',
      symbol: '♛',
      team: sortedByScore[0],
      description: 'Highest XP earned',
      color: 'var(--neon-yellow)',
    },
    {
      title: 'RUNNER UP',
      symbol: '♞',
      team: sortedByScore[1],
      description: 'Second highest',
      color: 'var(--neon-cyan)',
    },
    {
      title: 'BRAVE SOUL',
      symbol: '♟',
      team: sortedByScore[sortedByScore.length - 1],
      description: 'Fought hard!',
      color: 'var(--neon-pink)',
    },
  ]

  useEffect(() => {
    if (currentAward < awards.length - 1) {
      const timer = setTimeout(() => setCurrentAward((prev) => prev + 1), 3000)
      return () => clearTimeout(timer)
    } else if (currentAward === awards.length - 1) {
      const timer = setTimeout(() => setShowAll(true), 2500)
      return () => clearTimeout(timer)
    }
  }, [currentAward, awards.length])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {currentAward === -1 && (
          <motion.div
            key="intro"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="pixel-panel pixel-panel-yellow cursor-pointer"
              onClick={() => setCurrentAward(0)}
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
                  AWARDS
                </p>
                <p className="font-terminal text-terminal-lg text-text-dim">
                  &gt; Press A to continue...
                </p>
                <p className="press-start mt-4 text-pixel-sm">
                  ► PRESS A ◄
                </p>
              </div>
            </motion.button>
          </motion.div>
        )}

        {currentAward >= 0 && !showAll && (
          <motion.div
            key={`award-${currentAward}`}
            className="text-center crt-on"
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ duration: 0.4, ease: 'linear' }}
          >
            <div className="pixel-panel pixel-panel-yellow">
              <motion.div
                className="font-pixel text-[100px] md:text-[140px] leading-none mb-6"
                style={{ color: awards[currentAward].color }}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                {awards[currentAward].symbol}
              </motion.div>

              <motion.p
                className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {awards[currentAward].title}
              </motion.p>

              <motion.div
                className="dialogue-box my-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="font-terminal text-terminal-xl md:text-terminal-2xl text-text-white">
                  {awards[currentAward].team?.name.toUpperCase()}
                </p>
                <p className="font-terminal text-terminal-base text-text-dim mt-2">
                  &gt; {awards[currentAward].description}
                </p>
              </motion.div>

              <motion.div
                className="font-pixel text-pixel-xl neon-glow-green"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                XP: {awards[currentAward].team?.totalScore.toFixed(1)}
              </motion.div>
            </div>
          </motion.div>
        )}

        {showAll && (
          <motion.div
            key="all-awards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow animate-glitch">
                THE END
              </p>
              <p className="font-terminal text-terminal-xl text-text-dim mt-2">
                &gt; GG everyone!
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {awards.map((award, index) => (
                <motion.div
                  key={award.title}
                  className="pixel-panel text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, ease: 'linear' }}
                >
                  <div
                    className="font-pixel text-[60px] leading-none mb-3"
                    style={{ color: award.color }}
                  >
                    {award.symbol}
                  </div>
                  <p className="font-pixel text-pixel-sm neon-glow-yellow">
                    {award.title}
                  </p>
                  <p className="font-pixel text-pixel-lg text-text-white mt-2">
                    {award.team?.name.toUpperCase()}
                  </p>
                  <p className="font-pixel text-pixel-xl neon-glow-green mt-2">
                    {award.team?.totalScore.toFixed(1)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
