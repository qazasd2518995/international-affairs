'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Topic, Vote } from '@/lib/types'

interface VotingPanelProps {
  topic: Topic
  playerId: string
  teamId: string
  onVote: (stance: Vote['stance']) => void
  currentVote?: Vote['stance']
}

export function VotingPanel({ topic, onVote, currentVote }: VotingPanelProps) {
  const [selected, setSelected] = useState<Vote['stance'] | null>(currentVote || null)
  const [submitted, setSubmitted] = useState(!!currentVote)

  const handleVote = (stance: Vote['stance']) => {
    setSelected(stance)
    setSubmitted(true)
    onVote(stance)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="pixel-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4">
          <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">
            <span className="rpg-cursor">►</span> CAST YOUR VOTE
          </p>
          <div className="dialogue-box">
            <p className="font-terminal text-terminal-base">
              {topic.question}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            className={`pokemon-option w-full ${selected === 'agree' ? 'selected' : ''}`}
            onClick={() => handleVote('agree')}
            disabled={submitted && selected !== 'agree'}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === 'agree' ? 'var(--neon-green)' : undefined,
              borderColor: 'var(--neon-green)',
            }}
          >
            <span className="font-pixel">AGREE</span>
          </motion.button>

          <motion.button
            className={`pokemon-option w-full ${selected === 'disagree' ? 'selected' : ''}`}
            onClick={() => handleVote('disagree')}
            disabled={submitted && selected !== 'disagree'}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === 'disagree' ? 'var(--neon-red)' : undefined,
              borderColor: 'var(--neon-red)',
              color: selected === 'disagree' ? 'var(--text-white)' : undefined,
            }}
          >
            <span className="font-pixel">DISAGREE</span>
          </motion.button>

          <motion.button
            className={`pokemon-option w-full ${selected === 'not-sure' ? 'selected' : ''}`}
            onClick={() => handleVote('not-sure')}
            disabled={submitted && selected !== 'not-sure'}
            whileTap={{ scale: 0.97 }}
            style={{
              background: selected === 'not-sure' ? 'var(--neon-cyan)' : undefined,
              borderColor: 'var(--neon-cyan)',
              color: selected === 'not-sure' ? 'var(--text-dark)' : undefined,
            }}
          >
            <span className="font-pixel">NOT SURE</span>
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
              <p className="font-pixel text-pixel-sm neon-glow-green">
                ★ VOTE LOCKED IN ★
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

interface VoteResultsProps {
  votes: Vote[]
  totalVoters: number
}

export function VoteResults({ votes, totalVoters }: VoteResultsProps) {
  const agreeCount = votes.filter((v) => v.stance === 'agree').length
  const disagreeCount = votes.filter((v) => v.stance === 'disagree').length
  const notSureCount = votes.filter((v) => v.stance === 'not-sure').length

  const total = votes.length || 1
  const agreePercent = (agreeCount / total) * 100
  const disagreePercent = (disagreeCount / total) * 100
  const notSurePercent = (notSureCount / total) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pixel-panel pixel-panel-neon">
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-base neon-glow-green">
            ★ PARTY VOTE RESULTS ★
          </p>
        </div>

        <div className="space-y-4">
          {/* AGREE */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-pixel-sm text-neon-green">
                AGREE
              </span>
              <span className="font-pixel text-pixel-sm text-text-white">
                {agreeCount} / {Math.round(agreePercent)}%
              </span>
            </div>
            <div className="pixel-bar-container">
              <div className="pixel-bar flex-1">
                <motion.div
                  className="pixel-bar-fill pixel-bar-hp"
                  initial={{ width: 0 }}
                  animate={{ width: `${agreePercent}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          {/* DISAGREE */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-pixel-sm text-neon-red">
                DISAGREE
              </span>
              <span className="font-pixel text-pixel-sm text-text-white">
                {disagreeCount} / {Math.round(disagreePercent)}%
              </span>
            </div>
            <div className="pixel-bar-container">
              <div className="pixel-bar flex-1">
                <motion.div
                  className="pixel-bar-fill pixel-bar-red"
                  initial={{ width: 0 }}
                  animate={{ width: `${disagreePercent}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          {/* NOT SURE */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-pixel-sm text-neon-cyan">
                NOT SURE
              </span>
              <span className="font-pixel text-pixel-sm text-text-white">
                {notSureCount} / {Math.round(notSurePercent)}%
              </span>
            </div>
            <div className="pixel-bar-container">
              <div className="pixel-bar flex-1">
                <motion.div
                  className="pixel-bar-fill pixel-bar-mp"
                  initial={{ width: 0 }}
                  animate={{ width: `${notSurePercent}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center font-terminal text-text-dim mt-6 text-terminal-base">
          {votes.length} / {totalVoters} PARTY MEMBERS VOTED
        </p>
      </div>
    </div>
  )
}
