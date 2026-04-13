'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, Swords } from 'lucide-react'
import type { Match, Team } from '@/lib/types'

interface MatchupRevealProps {
  match: Match
  teamA: Team
  teamB: Team
  index: number
}

export function MatchupReveal({ match, teamA, teamB, index }: MatchupRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 14,
        delay: index * 0.5,
      }}
    >
      <div className="glass-card-strong p-6 md:p-8 relative overflow-hidden">
        {/* Background spotlight effect */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, var(--spotlight-gold), transparent 70%)',
          }}
          animate={{
            opacity: [0, 0.3, 0.1, 0.3],
          }}
          transition={{ duration: 2, delay: index * 0.5, repeat: Infinity }}
        />

        {/* Round indicator */}
        <div className="text-center mb-4 relative z-10">
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.5 + 0.3 }}
          >
            <Zap size={16} className="text-[var(--spotlight-gold)]" fill="currentColor" />
            <span className="text-[var(--spotlight-gold)] text-sm uppercase tracking-wider title-display">
              Round {match.round} — Match {index + 1}
            </span>
            <Zap size={16} className="text-[var(--spotlight-gold)]" fill="currentColor" />
          </motion.div>
        </div>

        {/* Teams vs layout */}
        <div className="flex items-center justify-center gap-4 md:gap-8 relative z-10">
          {/* Team A */}
          <motion.div
            className="team-card team-card-a flex-1 text-center"
            initial={{ x: -100, opacity: 0, rotateY: -90 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{
              delay: index * 0.5 + 0.5,
              type: 'spring',
              stiffness: 100,
            }}
          >
            <motion.div
              className="flex justify-center mb-2"
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.5 + 0.8,
              }}
            >
              <Flame size={40} className="text-[var(--team-a)]" fill="currentColor" />
            </motion.div>
            <h3 className="title-display text-xl md:text-2xl text-[var(--team-a)]">
              {teamA.name}
            </h3>
            <motion.span
              className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-[var(--agree-green)] bg-opacity-20 text-[var(--agree-green)] font-semibold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.5 + 1, type: 'spring', stiffness: 200 }}
            >
              AGREE
            </motion.span>
          </motion.div>

          {/* VS Badge with explosion effect */}
          <motion.div
            className="vs-badge relative"
            initial={{ scale: 0, rotate: -360 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              delay: index * 0.5 + 0.7,
            }}
          >
            {/* Explosion burst */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.5 + 0.8,
              }}
            >
              <div className="w-full h-full rounded-full" style={{
                background: 'radial-gradient(circle, var(--spotlight-gold), transparent)',
              }} />
            </motion.div>
            <span className="relative z-10">VS</span>
          </motion.div>

          {/* Team B */}
          <motion.div
            className="team-card team-card-b flex-1 text-center"
            initial={{ x: 100, opacity: 0, rotateY: 90 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{
              delay: index * 0.5 + 0.5,
              type: 'spring',
              stiffness: 100,
            }}
          >
            <motion.div
              className="flex justify-center mb-2"
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.5 + 0.8,
              }}
            >
              <Zap size={40} className="text-[var(--team-b)]" fill="currentColor" />
            </motion.div>
            <h3 className="title-display text-xl md:text-2xl text-[var(--team-b)]">
              {teamB.name}
            </h3>
            <motion.span
              className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-[var(--disagree-red)] bg-opacity-20 text-[var(--disagree-red)] font-semibold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.5 + 1, type: 'spring', stiffness: 200 }}
            >
              DISAGREE
            </motion.span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// All matchups display with staggered entry
interface AllMatchupsProps {
  matches: Match[]
  teams: Record<string, Team>
}

export function AllMatchups({ matches, teams }: AllMatchupsProps) {
  const [showMatches, setShowMatches] = useState(false)

  useEffect(() => {
    // Dramatic pause before revealing
    const timer = setTimeout(() => setShowMatches(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex justify-center mb-2"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Swords size={72} className="text-[var(--spotlight-gold)]" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' }} />
        </motion.div>
        <h2 className="title-display text-4xl md:text-5xl text-[var(--spotlight-gold)] title-glow">
          MATCHUPS REVEALED!
        </h2>
        <motion.p
          className="text-[var(--text-secondary)] mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          The battle lines are drawn...
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {showMatches && matches.map((match, index) => (
          <MatchupReveal
            key={match.id}
            match={match}
            teamA={teams[match.teamA]}
            teamB={teams[match.teamB]}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
