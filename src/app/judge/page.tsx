'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Scale, CheckCircle2 } from 'lucide-react'
import { StageBackground, Logo, JudgePanel, JudgeCard } from '@/components'
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { TOPICS, type JudgeScore } from '@/lib/types'

function JudgeContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [judgeId, setJudgeId] = useState<'judge1' | 'judge2' | null>(null)
  const [submittedScore, setSubmittedScore] = useState<JudgeScore | null>(null)

  const game = useRealtimeGame(sessionId || undefined)

  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null

  // Check if already scored this match
  const hasScored = currentMatch?.judgeScores.some((s) => s.judgeId === judgeId)

  // Reset submitted score when match changes
  useEffect(() => {
    setSubmittedScore(null)
  }, [game.currentMatchId])

  const handleSubmitScore = async (score: JudgeScore) => {
    if (!currentMatch) return
    await game.submitJudgeScore(currentMatch.id, score)
    setSubmittedScore(score)
  }

  // No session
  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />
          <p className="text-[var(--text-muted)] mt-8">No session specified</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Add ?session=SESSION_ID to the URL
          </p>
        </div>
      </main>
    )
  }

  // Loading
  if (game.isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />
          <div className="loading-spinner mx-auto mt-8" />
        </div>
      </main>
    )
  }

  // Select judge role
  if (!judgeId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />

          <motion.div
            className="glass-card-strong p-8 mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="title-display text-2xl text-[var(--spotlight-gold)] mb-6">
              SELECT YOUR ROLE
            </h2>

            <div className="flex gap-4">
              <motion.button
                className="glass-card p-6 flex-1 text-center hover:bg-[var(--glass-white)]"
                onClick={() => setJudgeId('judge1')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex justify-center mb-2">
                  <Scale size={48} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold">Judge 1</h3>
              </motion.button>

              <motion.button
                className="glass-card p-6 flex-1 text-center hover:bg-[var(--glass-white)]"
                onClick={() => setJudgeId('judge2')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex justify-center mb-2">
                  <Scale size={48} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold">Judge 2</h3>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      <div className="relative z-10 min-h-screen p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Logo size="sm" animate={false} />
          <span className="px-3 py-1 rounded-full bg-[var(--spotlight-gold)] bg-opacity-20 text-[var(--spotlight-gold)] font-bold uppercase">
            {judgeId === 'judge1' ? 'Judge 1' : 'Judge 2'}
          </span>
        </header>

        {/* Content based on phase */}
        {(game.phase === 'scoring' || game.phase === 'audience-vote' || game.phase === 'debate') && currentMatch ? (
          <div className="max-w-2xl mx-auto">
            {/* Topic reminder */}
            {currentTopic && (
              <motion.div
                className="glass-card p-4 mb-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-[var(--text-muted)]">Current Topic</p>
                <p className="text-[var(--text-secondary)]">{currentTopic.question}</p>
              </motion.div>
            )}

            {!hasScored && !submittedScore ? (
              <JudgePanel
                judgeId={judgeId}
                match={currentMatch}
                teamA={game.teams[currentMatch.teamA]}
                teamB={game.teams[currentMatch.teamB]}
                onSubmit={handleSubmitScore}
              />
            ) : (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <CheckCircle2 size={64} className="text-[var(--agree-green)]" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--spotlight-gold)] mb-6">
                  Scores Submitted!
                </h2>

                {submittedScore && (
                  <div className="grid grid-cols-2 gap-6">
                    <JudgeCard
                      teamName={game.teams[currentMatch.teamA]?.name || ''}
                      score={submittedScore.teamAScore}
                      color="var(--team-a)"
                    />
                    <JudgeCard
                      teamName={game.teams[currentMatch.teamB]?.name || ''}
                      score={submittedScore.teamBScore}
                      color="var(--team-b)"
                    />
                  </div>
                )}

                <p className="text-[var(--text-muted)] mt-6">
                  Waiting for the host to reveal results...
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            className="glass-card-strong p-8 text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <Scale size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold mb-2">Waiting...</h2>
            <p className="text-[var(--text-secondary)]">
              Current phase: {game.phase.replace(/-/g, ' ')}
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-4">
              The scoring panel will appear during the debate.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default function JudgePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />
          <div className="loading-spinner mx-auto mt-8" />
        </div>
      </main>
    }>
      <JudgeContent />
    </Suspense>
  )
}
