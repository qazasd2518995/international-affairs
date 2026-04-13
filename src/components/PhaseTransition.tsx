'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Dices,
  Vote,
  Swords,
  ClipboardList,
  Mic,
  Users,
  Scale,
  Trophy,
  BarChart3,
  Award,
} from 'lucide-react'
import type { GamePhase } from '@/lib/types'

interface PhaseTransitionProps {
  phase: GamePhase
  round: number
}

const PHASE_INFO: Record<GamePhase, { title: string; subtitle: string; Icon: typeof Target; color: string }> = {
  'lobby': { title: 'LOBBY', subtitle: 'Waiting for players', Icon: Target, color: 'var(--spotlight-gold)' },
  'topic-reveal': { title: 'TOPIC REVEAL', subtitle: 'Drawing a topic...', Icon: Dices, color: 'var(--spotlight-gold)' },
  'voting': { title: 'STANCE VOTE', subtitle: 'What do you think?', Icon: Vote, color: 'var(--neon-cyan)' },
  'matchup-reveal': { title: 'MATCHUPS', subtitle: 'The battle begins!', Icon: Swords, color: 'var(--neon-magenta)' },
  'preparation': { title: 'PREPARATION', subtitle: 'Teams are preparing...', Icon: ClipboardList, color: 'var(--spotlight-amber)' },
  'debate': { title: 'DEBATE', subtitle: 'Battle of arguments!', Icon: Mic, color: 'var(--disagree-red)' },
  'audience-vote': { title: 'AUDIENCE VOTE', subtitle: 'You decide!', Icon: Users, color: 'var(--agree-green)' },
  'scoring': { title: 'SCORING', subtitle: 'Judges deliberating', Icon: Scale, color: 'var(--spotlight-gold)' },
  'result': { title: 'RESULT', subtitle: 'The winner is...', Icon: Trophy, color: 'var(--spotlight-gold)' },
  'leaderboard': { title: 'LEADERBOARD', subtitle: 'Current standings', Icon: BarChart3, color: 'var(--neon-cyan)' },
  'final-awards': { title: 'FINAL AWARDS', subtitle: 'Ceremony time!', Icon: Award, color: 'var(--spotlight-gold)' },
}

export function PhaseTransition({ phase, round }: PhaseTransitionProps) {
  const info = PHASE_INFO[phase]
  const Icon = info.Icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.7, 1] }}
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.5, rotateX: -90 }}
          animate={{ scale: [0.5, 1.2, 1, 1], rotateX: [-90, 0, 0, 90] }}
          transition={{ duration: 1.8, times: [0, 0.3, 0.7, 1] }}
        >
          <motion.div
            className="flex justify-center mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <Icon size={120} strokeWidth={2} style={{ color: info.color, filter: `drop-shadow(0 0 30px ${info.color})` }} />
          </motion.div>
          <motion.h1
            className="title-display text-7xl md:text-9xl title-glow"
            style={{ color: info.color }}
            animate={{
              textShadow: [
                `0 0 20px ${info.color}`,
                `0 0 60px ${info.color}`,
                `0 0 20px ${info.color}`,
              ],
            }}
            transition={{ duration: 1.5, repeat: 1 }}
          >
            {info.title}
          </motion.h1>
          <p className="text-xl text-[var(--text-secondary)] mt-4 uppercase tracking-[0.3em]">
            {info.subtitle}
          </p>
          {round > 0 && phase !== 'lobby' && phase !== 'final-awards' && (
            <p className="text-[var(--text-muted)] text-sm mt-2">
              Round {round}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
