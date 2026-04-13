'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { GamePhase } from '@/lib/types'

interface PhaseTransitionProps {
  phase: GamePhase
  round: number
}

const PHASE_INFO: Record<GamePhase, { title: string; subtitle: string; symbol: string; color: string }> = {
  'lobby': { title: 'LOBBY', subtitle: '> Awaiting heroes...', symbol: '◆', color: 'var(--neon-yellow)' },
  'topic-reveal': { title: 'QUEST', subtitle: '> New topic drawn', symbol: '?', color: 'var(--neon-yellow)' },
  'voting': { title: 'VOTE!', subtitle: '> Cast your spell', symbol: '✦', color: 'var(--neon-cyan)' },
  'matchup-reveal': { title: 'MATCHUP', subtitle: '> Parties collide', symbol: '×', color: 'var(--neon-pink)' },
  'preparation': { title: 'PREP', subtitle: '> Charging moves...', symbol: '↯', color: 'var(--neon-yellow)' },
  'debate': { title: 'BATTLE!', subtitle: '> Attacks begin', symbol: '⚔', color: 'var(--neon-red)' },
  'audience-vote': { title: 'CHEER!', subtitle: '> Crowd decides', symbol: '♪', color: 'var(--neon-green)' },
  'scoring': { title: 'JUDGING', subtitle: '> Heroes ranked', symbol: '♦', color: 'var(--neon-yellow)' },
  'result': { title: 'RESULT', subtitle: '> Victor revealed', symbol: '♛', color: 'var(--neon-yellow)' },
  'leaderboard': { title: 'RANKS', subtitle: '> Hi-scores updated', symbol: '▲', color: 'var(--neon-cyan)' },
  'final-awards': { title: 'ENDING', subtitle: '> Roll credits', symbol: '★', color: 'var(--neon-yellow)' },
}

export function PhaseTransition({ phase, round }: PhaseTransitionProps) {
  const info = PHASE_INFO[phase]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.7, 1], ease: 'linear' }}
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.1, 1, 1] }}
          transition={{ duration: 1.8, times: [0, 0.3, 0.7, 1], ease: 'linear' }}
        >
          <motion.div
            className="font-pixel text-[120px] md:text-[180px] leading-none mb-4"
            style={{ color: info.color, textShadow: `0 0 30px ${info.color}, 4px 4px 0 var(--arcade-void)` }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, ease: 'linear' }}
          >
            {info.symbol}
          </motion.div>
          <motion.h1
            className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow animate-glitch"
            style={{ color: info.color, textShadow: `0 0 20px ${info.color}, 4px 4px 0 var(--arcade-void)` }}
          >
            {info.title}
          </motion.h1>
          <p className="font-terminal text-terminal-lg text-text-white mt-4">
            {info.subtitle}
          </p>
          {round > 0 && phase !== 'lobby' && phase !== 'final-awards' && (
            <p className="font-pixel text-pixel-sm text-neon-cyan mt-2">
              ROUND {round} / 3
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
