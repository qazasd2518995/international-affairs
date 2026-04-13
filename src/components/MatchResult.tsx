'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!teamA || !teamB) return null

  const finalScoreA = judgeScoreA * 0.7 + (audiencePercentA / 10) * 0.3
  const finalScoreB = judgeScoreB * 0.7 + (audiencePercentB / 10) * 0.3
  const winner = finalScoreA > finalScoreB ? teamA : teamB
  const winnerIsA = finalScoreA > finalScoreB
  const winnerColor = winnerIsA ? 'team-red' : 'team-blue'

  const pixelColors = ['#39ff14', '#ff00aa', '#ffcc00', '#00fff0', '#ff0040', '#0080ff', '#9d00ff']

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      {/* Pixel confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                width: '8px',
                height: '8px',
                background: pixelColors[Math.floor(Math.random() * pixelColors.length)],
                boxShadow: `0 0 4px ${pixelColors[Math.floor(Math.random() * pixelColors.length)]}`,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: '100vh',
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 0.8,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className={`pixel-panel ${winnerIsA ? 'pixel-panel-pink' : 'pixel-panel-neon'}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'linear' }}
      >
        {/* Winner announcement */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: 'linear' }}
        >
          <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">
            ★ STAGE {match.round} CLEAR ★
          </p>
          <motion.div
            className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow mb-2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            WINNER
          </motion.div>
          <motion.div
            className={`font-pixel text-pixel-3xl md:text-pixel-4xl text-${winnerColor}`}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3, ease: 'linear' }}
            style={{
              textShadow: `0 0 20px currentColor, 4px 4px 0 var(--arcade-void)`,
            }}
          >
            {winner.name.toUpperCase()}
          </motion.div>
        </motion.div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            className={`battle-card ${winnerIsA ? 'battle-card-red level-up' : 'battle-card-red'}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center">
              <p className="font-pixel text-pixel-sm text-team-red mb-2">
                {teamA.name.toUpperCase()}
              </p>
              <p className="font-pixel text-pixel-3xl neon-glow-yellow">
                {finalScoreA.toFixed(1)}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center justify-center">
            <span className="font-pixel text-pixel-2xl text-text-muted">VS</span>
          </div>

          <motion.div
            className={`battle-card ${!winnerIsA ? 'battle-card-blue level-up' : 'battle-card-blue'}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center">
              <p className="font-pixel text-pixel-sm text-team-blue mb-2">
                {teamB.name.toUpperCase()}
              </p>
              <p className="font-pixel text-pixel-3xl neon-glow-yellow">
                {finalScoreB.toFixed(1)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Breakdown */}
        <motion.div
          className="pixel-panel-sm pixel-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <p className="font-pixel text-pixel-sm text-neon-yellow mb-3">
            ► BATTLE LOG
          </p>

          <div className="space-y-2 font-terminal text-terminal-base">
            <div className="flex justify-between">
              <span className="text-text-dim">JUDGE (70%)</span>
              <span>
                <span className="text-team-red">{judgeScoreA.toFixed(1)}</span>
                <span className="text-text-muted mx-2">-</span>
                <span className="text-team-blue">{judgeScoreB.toFixed(1)}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">CROWD (30%)</span>
              <span>
                <span className="text-team-red">{Math.round(audiencePercentA)}%</span>
                <span className="text-text-muted mx-2">-</span>
                <span className="text-team-blue">{Math.round(audiencePercentB)}%</span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
