'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Drama, Flame, Zap, Check } from 'lucide-react'
import type { Team, AudienceVote } from '@/lib/types'

interface AudienceVotingProps {
  teamA: Team
  teamB: Team
  playerId: string
  playerTeamId: string
  onVote: (votedFor: string) => void
  currentVote?: string
}

export function AudienceVoting({
  teamA,
  teamB,
  playerId,
  playerTeamId,
  onVote,
  currentVote,
}: AudienceVotingProps) {
  const [selected, setSelected] = useState<string | null>(currentVote || null)
  const [submitted, setSubmitted] = useState(!!currentVote)

  // Check if this player is on one of the competing teams
  const isCompeting = playerTeamId === teamA.id || playerTeamId === teamB.id

  const handleVote = (teamId: string) => {
    if (isCompeting) return
    setSelected(teamId)
    setSubmitted(true)
    onVote(teamId)
  }

  if (isCompeting) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <motion.div
          className="glass-card p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-4">
            <Drama size={56} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold mb-2">You&apos;re Competing!</h3>
          <p className="text-[var(--text-secondary)]">
            You can't vote in this round. Wait for the results!
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="title-display text-xl text-center text-[var(--spotlight-gold)] mb-6">
          WHO WAS MORE CONVINCING?
        </h3>

        <div className="space-y-4">
          {/* Team A */}
          <motion.button
            className={`w-full team-card team-card-a p-6 ${
              selected === teamA.id ? 'ring-4 ring-[var(--team-a)]' : ''
            }`}
            onClick={() => handleVote(teamA.id)}
            disabled={submitted && selected !== teamA.id}
            whileHover={{ scale: submitted ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Flame size={36} className="text-[var(--team-a)]" fill="currentColor" />
                <div className="text-left">
                  <h4 className="title-display text-lg text-[var(--team-a)]">{teamA.name}</h4>
                  <span className="text-sm text-[var(--agree-green)]">AGREE</span>
                </div>
              </div>
              {selected === teamA.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Check size={28} className="text-[var(--agree-green)]" />
                </motion.div>
              )}
            </div>
          </motion.button>

          {/* Team B */}
          <motion.button
            className={`w-full team-card team-card-b p-6 ${
              selected === teamB.id ? 'ring-4 ring-[var(--team-b)]' : ''
            }`}
            onClick={() => handleVote(teamB.id)}
            disabled={submitted && selected !== teamB.id}
            whileHover={{ scale: submitted ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Zap size={36} className="text-[var(--team-b)]" fill="currentColor" />
                <div className="text-left">
                  <h4 className="title-display text-lg text-[var(--team-b)]">{teamB.name}</h4>
                  <span className="text-sm text-[var(--disagree-red)]">DISAGREE</span>
                </div>
              </div>
              {selected === teamB.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Check size={28} className="text-[var(--agree-green)]" />
                </motion.div>
              )}
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {submitted && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-[var(--spotlight-gold)]">
                Vote submitted! Waiting for results...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Results display for big screen
interface AudienceVoteResultsProps {
  teamA: Team
  teamB: Team
  votes: AudienceVote[]
}

export function AudienceVoteResults({ teamA, teamB, votes }: AudienceVoteResultsProps) {
  const votesForA = votes.filter((v) => v.votedFor === teamA.id).length
  const votesForB = votes.filter((v) => v.votedFor === teamB.id).length
  const total = votes.length || 1

  const percentA = (votesForA / total) * 100
  const percentB = (votesForB / total) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="glass-card-strong p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="title-display text-2xl text-center mb-6 text-[var(--spotlight-gold)]">
          AUDIENCE VOTE
        </h3>

        <div className="flex items-center gap-4">
          {/* Team A bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--team-a)] font-bold">{teamA.name}</span>
              <span className="text-xl font-bold">{Math.round(percentA)}%</span>
            </div>
            <div className="h-8 bg-[var(--glass-white)] rounded-lg overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--team-a)] to-[var(--spotlight-amber)]"
                initial={{ width: 0 }}
                animate={{ width: `${percentA}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <span className="text-2xl text-[var(--text-muted)]">vs</span>

          {/* Team B bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--team-b)] font-bold">{teamB.name}</span>
              <span className="text-xl font-bold">{Math.round(percentB)}%</span>
            </div>
            <div className="h-8 bg-[var(--glass-white)] rounded-lg overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--team-b)] to-[var(--neon-magenta)]"
                initial={{ width: 0 }}
                animate={{ width: `${percentB}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-[var(--text-muted)] mt-4">
          {votes.length} audience votes
        </p>
      </motion.div>
    </div>
  )
}
