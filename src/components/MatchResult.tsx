'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { Team, Match } from '@/lib/types'

interface MatchResultProps {
  match: Match
  teamA: Team
  teamB: Team
  judgeScoreA: number
  judgeScoreB: number
  audiencePercentA: number
  audiencePercentB: number
}

export function MatchResult({
  match,
  teamA,
  teamB,
  judgeScoreA,
  judgeScoreB,
  audiencePercentA,
  audiencePercentB,
}: MatchResultProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  // Calculate final scores
  const finalScoreA = judgeScoreA * 0.7 + (audiencePercentA / 10) * 0.3
  const finalScoreB = judgeScoreB * 0.7 + (audiencePercentB / 10) * 0.3
  const winner = finalScoreA > finalScoreB ? teamA : teamB
  const winnerColor = finalScoreA > finalScoreB ? 'var(--team-a)' : 'var(--team-b)'

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#ffd700', '#ff00ff', '#00f5ff', '#39ff14', '#f97316', '#8b5cf6'][
                  Math.floor(Math.random() * 6)
                ],
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="glass-card-strong p-8 md:p-12 spotlight-effect"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        {/* Winner announcement */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[var(--text-muted)] uppercase tracking-wider mb-2">Round {match.round} Winner</p>
          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.5 }}
          >
            <Trophy size={56} style={{ color: winnerColor }} fill="currentColor" strokeWidth={1.5} />
            <h2
              className="title-display text-4xl md:text-6xl title-glow"
              style={{ color: winnerColor }}
            >
              {winner.name}
            </h2>
            <Trophy size={56} style={{ color: winnerColor }} fill="currentColor" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Team A */}
          <motion.div
            className={`text-center p-4 rounded-xl ${
              finalScoreA > finalScoreB ? 'bg-[var(--team-a)] bg-opacity-20' : ''
            }`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="title-display text-lg text-[var(--team-a)]">{teamA.name}</h3>
            <p className="score-display text-5xl">{finalScoreA.toFixed(1)}</p>
          </motion.div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-2xl text-[var(--text-muted)]">vs</span>
          </div>

          {/* Team B */}
          <motion.div
            className={`text-center p-4 rounded-xl ${
              finalScoreB > finalScoreA ? 'bg-[var(--team-b)] bg-opacity-20' : ''
            }`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="title-display text-lg text-[var(--team-b)]">{teamB.name}</h3>
            <p className="score-display text-5xl">{finalScoreB.toFixed(1)}</p>
          </motion.div>
        </div>

        {/* Detailed breakdown */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <h4 className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-4 text-center">
            Score Breakdown
          </h4>

          <div className="grid grid-cols-2 gap-8">
            {/* Judge scores */}
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Judge Score (70%)</p>
              <div className="flex justify-between items-center">
                <span className="text-[var(--team-a)]">{teamA.name}: {judgeScoreA.toFixed(1)}</span>
                <span className="text-[var(--team-b)]">{teamB.name}: {judgeScoreB.toFixed(1)}</span>
              </div>
            </div>

            {/* Audience scores */}
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Audience Vote (30%)</p>
              <div className="flex justify-between items-center">
                <span className="text-[var(--team-a)]">{teamA.name}: {Math.round(audiencePercentA)}%</span>
                <span className="text-[var(--team-b)]">{teamB.name}: {Math.round(audiencePercentB)}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
