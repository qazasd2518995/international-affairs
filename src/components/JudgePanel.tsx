'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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

  if (!teamA || !teamB) return null

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit({
      judgeId,
      teamAScore: scoreA,
      teamBScore: scoreB,
    })
  }

  const ScoreSection = ({
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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <span className={`font-pixel text-pixel-base ${color}`}>
          ◆ {label.toUpperCase()} ◆
        </span>
        <span className={`font-pixel text-pixel-3xl neon-glow-yellow`}>
          {value}
        </span>
      </div>

      {/* Score buttons 1-10 */}
      <div className="grid grid-cols-10 gap-1 mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            disabled={submitted}
            className={`font-pixel text-pixel-sm py-2 transition-all ${
              n <= value
                ? 'bg-neon-yellow text-text-dark'
                : 'bg-arcade-void text-text-muted'
            }`}
            style={{
              border: `2px solid ${n <= value ? 'var(--neon-yellow)' : 'var(--text-muted)'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* AI Analysis */}
      {analysis && (
        <motion.div
          className="pixel-panel-sm pixel-panel mt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-pixel-sm text-neon-cyan">
              ► AI SAYS
            </span>
            <span className="font-pixel text-pixel-base neon-glow-yellow">
              {analysis.score}/10
            </span>
          </div>
          <p className="font-terminal text-terminal-base text-text-dim">
            &gt; {analysis.commentary}
          </p>
        </motion.div>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="pixel-panel pixel-panel-yellow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-base neon-glow-yellow">
            ★ {judgeId === 'judge1' ? 'JUDGE 1' : 'JUDGE 2'} ★
          </p>
        </div>

        {!submitted ? (
          <>
            <ScoreSection
              label={teamA.name}
              value={scoreA}
              onChange={setScoreA}
              color="text-team-red"
              analysis={match.aiAnalysisA}
            />

            <ScoreSection
              label={teamB.name}
              value={scoreB}
              onChange={setScoreB}
              color="text-team-blue"
              analysis={match.aiAnalysisB}
            />

            <motion.button
              className="pixel-btn pixel-btn-green w-full mt-4"
              onClick={handleSubmit}
              whileTap={{ scale: 0.97 }}
            >
              ► LOCK IN JUDGMENT ◄
            </motion.button>
          </>
        ) : (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="font-pixel text-pixel-2xl neon-glow-green mb-6">
              ★ JUDGED ★
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="pixel-panel pixel-panel-sm">
                <p className="font-pixel text-pixel-sm text-team-red mb-2">
                  {teamA.name.toUpperCase()}
                </p>
                <p className="font-pixel text-pixel-3xl neon-glow-yellow">
                  {scoreA}
                </p>
              </div>
              <div className="pixel-panel pixel-panel-sm">
                <p className="font-pixel text-pixel-sm text-team-blue mb-2">
                  {teamB.name.toUpperCase()}
                </p>
                <p className="font-pixel text-pixel-3xl neon-glow-yellow">
                  {scoreB}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

interface JudgeCardProps {
  teamName: string
  score: number
  color: string
}

export function JudgeCard({ teamName, score, color }: JudgeCardProps) {
  return (
    <motion.div
      className="pixel-panel pixel-panel-sm text-center"
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'linear' }}
    >
      <p className="font-pixel text-pixel-sm mb-3" style={{ color }}>
        {teamName.toUpperCase()}
      </p>
      <p className="font-pixel text-pixel-3xl neon-glow-yellow">
        {score}
      </p>
    </motion.div>
  )
}
