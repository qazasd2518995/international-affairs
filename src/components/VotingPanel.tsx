'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, HelpCircle, Check } from 'lucide-react'
import type { Topic, Vote } from '@/lib/types'

interface VotingPanelProps {
  topic: Topic
  playerId: string
  teamId: string
  onVote: (stance: Vote['stance']) => void
  currentVote?: Vote['stance']
}

export function VotingPanel({ topic, playerId, teamId, onVote, currentVote }: VotingPanelProps) {
  const [selected, setSelected] = useState<Vote['stance'] | null>(currentVote || null)
  const [submitted, setSubmitted] = useState(!!currentVote)

  const handleVote = (stance: Vote['stance']) => {
    setSelected(stance)
    setSubmitted(true)
    onVote(stance)
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Topic display */}
        <div className="text-center mb-8">
          <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider mb-2">
            What's your stance?
          </p>
          <h3 className="text-lg font-semibold leading-relaxed">
            {topic.question}
          </h3>
        </div>

        {/* Voting buttons */}
        <div className="space-y-4">
          <motion.button
            className={`w-full btn-agree flex items-center justify-center gap-3 ${selected === 'agree' ? 'ring-4 ring-[var(--agree-green)] ring-opacity-50' : ''}`}
            onClick={() => handleVote('agree')}
            disabled={submitted && selected !== 'agree'}
            whileHover={{ scale: submitted ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsUp size={24} />
            <span>AGREE</span>
            {selected === 'agree' && <Check size={20} />}
          </motion.button>

          <motion.button
            className={`w-full btn-disagree flex items-center justify-center gap-3 ${selected === 'disagree' ? 'ring-4 ring-[var(--disagree-red)] ring-opacity-50' : ''}`}
            onClick={() => handleVote('disagree')}
            disabled={submitted && selected !== 'disagree'}
            whileHover={{ scale: submitted ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsDown size={24} />
            <span>DISAGREE</span>
            {selected === 'disagree' && <Check size={20} />}
          </motion.button>

          <motion.button
            className={`w-full btn-neutral flex items-center justify-center gap-3 ${selected === 'not-sure' ? 'ring-4 ring-[var(--neutral-blue)] ring-opacity-50' : ''}`}
            onClick={() => handleVote('not-sure')}
            disabled={submitted && selected !== 'not-sure'}
            whileHover={{ scale: submitted ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <HelpCircle size={22} />
            <span>NOT SURE</span>
            {selected === 'not-sure' && <Check size={20} />}
          </motion.button>
        </div>

        {/* Submitted confirmation */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-[var(--spotlight-gold)]">
                Vote submitted! Waiting for others...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Results display for big screen
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
      <motion.div
        className="glass-card-strong p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="title-display text-2xl text-center mb-6 text-[var(--spotlight-gold)]">
          VOTING RESULTS
        </h3>

        {/* Progress bar */}
        <div className="vote-bar mb-6">
          <motion.div
            className="vote-bar-agree flex items-center justify-center text-white font-bold"
            initial={{ width: 0 }}
            animate={{ width: `${agreePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {agreePercent > 10 && `${Math.round(agreePercent)}%`}
          </motion.div>
          <motion.div
            className="vote-bar-neutral flex items-center justify-center text-white font-bold"
            initial={{ width: 0 }}
            animate={{ width: `${notSurePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          >
            {notSurePercent > 10 && `${Math.round(notSurePercent)}%`}
          </motion.div>
          <motion.div
            className="vote-bar-disagree flex items-center justify-center text-white font-bold"
            initial={{ width: 0 }}
            animate={{ width: `${disagreePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          >
            {disagreePercent > 10 && `${Math.round(disagreePercent)}%`}
          </motion.div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--agree-green)]" />
            <span>Agree ({agreeCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--neutral-blue)]" />
            <span>Not Sure ({notSureCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--disagree-red)]" />
            <span>Disagree ({disagreeCount})</span>
          </div>
        </div>

        {/* Voter count */}
        <p className="text-center text-[var(--text-muted)] mt-4">
          {votes.length} / {totalVoters} voted
        </p>
      </motion.div>
    </div>
  )
}
