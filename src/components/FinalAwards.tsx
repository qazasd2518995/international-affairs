'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, TrendingUp, PartyPopper, Sparkles } from 'lucide-react'
import type { Team } from '@/lib/types'

interface FinalAwardsProps {
  teams: Team[]
}

interface Award {
  title: string
  Icon: typeof Trophy
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
      Icon: Trophy,
      team: sortedByScore[0],
      description: 'Highest total score',
      color: 'var(--spotlight-gold)',
    },
    {
      title: 'RUNNER UP',
      Icon: Medal,
      team: sortedByScore[1],
      description: 'Second highest score',
      color: '#c0c0c0',
    },
    {
      title: 'MOST IMPROVED',
      Icon: TrendingUp,
      team: sortedByScore[sortedByScore.length - 1],
      description: 'Great effort!',
      color: 'var(--neon-cyan)',
    },
  ]

  useEffect(() => {
    if (currentAward < awards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentAward((prev) => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (currentAward === awards.length - 1) {
      const timer = setTimeout(() => {
        setShowAll(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentAward, awards.length])

  const startReveal = () => {
    setCurrentAward(0)
  }

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
            <motion.div
              className="glass-card-strong p-12 cursor-pointer spotlight-effect"
              onClick={startReveal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="flex justify-center mb-6"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PartyPopper size={96} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))' }} />
              </motion.div>
              <h2 className="title-display text-4xl text-[var(--spotlight-gold)] mb-4">
                AWARD CEREMONY
              </h2>
              <p className="text-[var(--text-secondary)]">
                Click to reveal the winners!
              </p>
            </motion.div>
          </motion.div>
        )}

        {currentAward >= 0 && !showAll && (
          <motion.div
            key={`award-${currentAward}`}
            className="text-center"
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <motion.div className="glass-card-strong p-12 neon-border spotlight-effect">
              <motion.div
                className="flex justify-center mb-6"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                {(() => {
                  const Icon = awards[currentAward].Icon
                  const color = awards[currentAward].color
                  return (
                    <Icon
                      size={120}
                      style={{ color, filter: `drop-shadow(0 0 30px ${color})` }}
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                  )
                })()}
              </motion.div>

              <motion.h2
                className="title-display text-3xl text-[var(--spotlight-gold)] mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {awards[currentAward].title}
              </motion.h2>

              <motion.h3
                className="title-display text-5xl text-white title-glow mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {awards[currentAward].team.name}
              </motion.h3>

              <motion.p
                className="text-[var(--text-secondary)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {awards[currentAward].description}
              </motion.p>

              <motion.p
                className="text-4xl mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Score: <span className="score-display">{awards[currentAward].team.totalScore.toFixed(1)}</span>
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {showAll && (
          <motion.div
            key="all-awards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="flex items-center justify-center gap-4 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles size={36} className="text-[var(--spotlight-gold)]" fill="currentColor" />
              <h2 className="title-display text-4xl text-center text-[var(--spotlight-gold)]">
                CONGRATULATIONS TO ALL!
              </h2>
              <Sparkles size={36} className="text-[var(--spotlight-gold)]" fill="currentColor" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {awards.map((award, index) => {
                const Icon = award.Icon
                return (
                  <motion.div
                    key={award.title}
                    className="glass-card-strong p-6 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="flex justify-center mb-4">
                      <Icon size={64} style={{ color: award.color }} fill="currentColor" strokeWidth={1.5} />
                    </div>
                    <h3 className="title-display text-xl text-[var(--spotlight-gold)]">
                      {award.title}
                    </h3>
                    <h4 className="text-xl font-bold mt-2">{award.team.name}</h4>
                    <p className="text-2xl mt-2">
                      <span className="score-display">{award.team.totalScore.toFixed(1)}</span>
                    </p>
                  </motion.div>
                )
              })}
            </div>

            <motion.p
              className="text-center text-[var(--text-secondary)] mt-8 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Thank you for participating in Mini Debate Arena!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
