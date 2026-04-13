'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, Bot } from 'lucide-react'
import type { Team, Match, AIAnalysis, JudgeScore } from '@/lib/types'

interface JudgePanelProps {
  judgeId: 'judge1' | 'judge2'
  match: Match
  teamA: Team
  teamB: Team
  onSubmit: (score: JudgeScore) => void
}

export function JudgePanel({ judgeId, match, teamA, teamB, onSubmit }: JudgePanelProps) {
  const [scoreA, setScoreA] = useState<number>(5)
  const [scoreB, setScoreB] = useState<number>(5)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit({
      judgeId,
      teamAScore: scoreA,
      teamBScore: scoreB,
    })
  }

  const ScoreSlider = ({
    label,
    value,
    onChange,
    color,
    analysis,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    color: string
    analysis?: AIAnalysis
  }) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h4 className="title-display text-lg" style={{ color }}>
          {label}
        </h4>
        <span className="score-display text-4xl">{value}</span>
      </div>

      {/* Score slider */}
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={submitted}
        className="w-full h-3 bg-[var(--glass-white)] rounded-lg appearance-none cursor-pointer accent-[var(--spotlight-gold)]"
      />

      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <motion.div
          className="mt-4 glass-card p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-[var(--neon-cyan)]" />
              <span className="text-sm text-[var(--neon-cyan)]">AI Suggestion</span>
            </div>
            <span className="text-lg font-bold text-[var(--spotlight-gold)]">
              {analysis.score}/10
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {analysis.commentary}
          </p>
        </motion.div>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="glass-card-strong p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="title-display text-2xl text-center text-[var(--spotlight-gold)] mb-8">
          {judgeId === 'judge1' ? 'JUDGE 1' : 'JUDGE 2'} SCORING
        </h2>

        {!submitted ? (
          <>
            <ScoreSlider
              label={teamA.name}
              value={scoreA}
              onChange={setScoreA}
              color="var(--team-a)"
              analysis={match.aiAnalysisA}
            />

            <ScoreSlider
              label={teamB.name}
              value={scoreB}
              onChange={setScoreB}
              color="var(--team-b)"
              analysis={match.aiAnalysisB}
            />

            <motion.button
              className="btn-primary w-full mt-6"
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SUBMIT SCORES
            </motion.button>
          </>
        ) : (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-center mb-4">
              <Scale size={56} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-[var(--spotlight-gold)]">
              Scores Submitted!
            </h3>

            <div className="mt-6 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)]">{teamA.name}</p>
                <p className="score-display text-4xl">{scoreA}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)]">{teamB.name}</p>
                <p className="score-display text-4xl">{scoreB}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// Quick cards for judges to show
interface JudgeCardProps {
  teamName: string
  score: number
  color: string
}

export function JudgeCard({ teamName, score, color }: JudgeCardProps) {
  return (
    <motion.div
      className="glass-card-strong p-8 text-center neon-border"
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <h3 className="title-display text-xl mb-4" style={{ color }}>
        {teamName}
      </h3>
      <div className="score-display text-6xl">{score}</div>
    </motion.div>
  )
}
