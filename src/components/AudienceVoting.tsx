'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  playerTeamId,
  onVote,
  currentVote,
}: AudienceVotingProps) {
  const [selected, setSelected] = useState<string | null>(currentVote || null)
  const [submitted, setSubmitted] = useState(!!currentVote)

  const isCompeting = playerTeamId === teamA.id || playerTeamId === teamB.id

  const handleVote = (teamId: string) => {
    if (isCompeting) return
    setSelected(teamId)
    setSubmitted(true)
    onVote(teamId)
  }

  if (isCompeting) {
    return (
      <div className="w-full max-w-md mx-auto">
        <motion.div
          className="pixel-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center py-4">
            <p className="font-pixel text-pixel-base neon-glow-pink mb-2">
              ※ YOU ARE IN BATTLE ※
            </p>
            <p className="font-terminal text-terminal-base text-text-dim">
              &gt; You can&apos;t vote in your own battle!<br/>
              &gt; Wait for results...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="pixel-panel pixel-panel-yellow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-base neon-glow-yellow">
            ★ CHOOSE YOUR WINNER ★
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            className="battle-card battle-card-red w-full"
            onClick={() => handleVote(teamA.id)}
            disabled={submitted && selected !== teamA.id}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === teamA.id ? 'var(--team-red)' : 'var(--panel-bg)',
            }}
          >
            <div className="flex items-center justify-between px-2">
              <span className="font-pixel text-pixel-sm text-team-red">◆ A ◆</span>
              <span className="font-pixel text-pixel-lg text-text-white">
                {teamA.name.toUpperCase()}
              </span>
              {selected === teamA.id && (
                <motion.span
                  className="font-pixel text-pixel-lg text-text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </div>
          </motion.button>

          <motion.button
            className="battle-card battle-card-blue w-full"
            onClick={() => handleVote(teamB.id)}
            disabled={submitted && selected !== teamB.id}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === teamB.id ? 'var(--team-blue)' : 'var(--panel-bg)',
            }}
          >
            <div className="flex items-center justify-between px-2">
              <span className="font-pixel text-pixel-sm text-team-blue">◆ B ◆</span>
              <span className="font-pixel text-pixel-lg text-text-white">
                {teamB.name.toUpperCase()}
              </span>
              {selected === teamB.id && (
                <motion.span
                  className="font-pixel text-pixel-lg text-text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {submitted && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-sm neon-glow-yellow">
                ★ CHEER COUNTED ★
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

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
      <div className="pixel-panel pixel-panel-yellow">
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-base neon-glow-yellow">
            ★ CROWD CHEER ★
          </p>
        </div>

        <div className="space-y-5">
          {/* Team A */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-pixel text-pixel-sm text-team-red">
                {teamA.name.toUpperCase()}
              </span>
              <span className="font-pixel text-pixel-lg neon-glow-pink">
                {Math.round(percentA)}%
              </span>
            </div>
            <div className="pixel-bar-container">
              <div className="pixel-bar flex-1 h-6">
                <motion.div
                  className="pixel-bar-fill pixel-bar-red"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentA}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          {/* Team B */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-pixel text-pixel-sm text-team-blue">
                {teamB.name.toUpperCase()}
              </span>
              <span className="font-pixel text-pixel-lg neon-glow-cyan">
                {Math.round(percentB)}%
              </span>
            </div>
            <div className="pixel-bar-container">
              <div className="pixel-bar flex-1 h-6">
                <motion.div
                  className="pixel-bar-fill pixel-bar-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentB}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center font-terminal text-terminal-base text-text-dim mt-6">
          {votes.length} CHEERS RECEIVED
        </p>
      </div>
    </div>
  )
}
