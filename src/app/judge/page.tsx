'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, CheckCircle2, Trophy, Dices, Vote as VoteIcon, Swords, ClipboardList, Mic, Users, BarChart3, Award, PartyPopper } from 'lucide-react'
import {
  StageBackground,
  Logo,
  JudgePanel,
  JudgeCard,
  SyncedCountdown,
  DifficultyStars,
  CategoryTag,
  PhaseTransition,
} from '@/components'
import { useRealtimeGame, type DebateSubPhase } from '@/lib/useRealtimeGame'
import { TOPICS, type JudgeScore } from '@/lib/types'

const DEBATE_SUB_INFO: Record<DebateSubPhase, { label: string; duration: number; team: 'A' | 'B' | 'HOST' }> = {
  'team-a-opening': { label: 'OPENING', duration: 20, team: 'A' },
  'team-b-opening': { label: 'OPENING', duration: 20, team: 'B' },
  'host-challenge': { label: 'CHALLENGE', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'RESPONSE', duration: 15, team: 'A' },
  'team-b-response': { label: 'RESPONSE', duration: 15, team: 'B' },
  'done': { label: 'DONE', duration: 0, team: 'A' },
}

function JudgeContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [judgeId, setJudgeId] = useState<'judge1' | 'judge2' | null>(null)
  const [submittedScore, setSubmittedScore] = useState<JudgeScore | null>(null)
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)

  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

  const hasScored = currentMatch?.judgeScores.some((s) => s.judgeId === judgeId)

  useEffect(() => {
    setSubmittedScore(null)
  }, [game.currentMatchId])

  // Phase transition overlay
  useEffect(() => {
    if (game.phase !== 'lobby') {
      setShowPhaseTransition(true)
      const timer = setTimeout(() => setShowPhaseTransition(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [game.phase])

  const handleSubmitScore = async (score: JudgeScore) => {
    if (!currentMatch) return
    await game.submitJudgeScore(currentMatch.id, score)
    setSubmittedScore(score)
  }

  const getMatchScores = () => {
    if (!currentMatch) return null
    const judgeScoreA = currentMatch.judgeScores.reduce((sum, s) => sum + s.teamAScore, 0) / (currentMatch.judgeScores.length || 1)
    const judgeScoreB = currentMatch.judgeScores.reduce((sum, s) => sum + s.teamBScore, 0) / (currentMatch.judgeScores.length || 1)
    const totalAudienceVotes = currentMatch.audienceVotes.length || 1
    const votesForA = currentMatch.audienceVotes.filter((v) => v.votedFor === currentMatch.teamA).length
    const votesForB = currentMatch.audienceVotes.filter((v) => v.votedFor === currentMatch.teamB).length
    return {
      judgeScoreA,
      judgeScoreB,
      audiencePercentA: (votesForA / totalAudienceVotes) * 100,
      audiencePercentB: (votesForB / totalAudienceVotes) * 100,
      finalScoreA: judgeScoreA * 0.7 + ((votesForA / totalAudienceVotes) * 10) * 0.3,
      finalScoreB: judgeScoreB * 0.7 + ((votesForB / totalAudienceVotes) * 10) * 0.3,
    }
  }

  // No session
  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />
          <p className="text-[var(--text-muted)] mt-8">No session specified</p>
        </div>
      </main>
    )
  }

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

      {/* Phase transition overlay */}
      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

      <div className="relative z-10 min-h-screen p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-3">
            <motion.span
              key={game.phase}
              className="px-3 py-1 rounded-full bg-[var(--neon-cyan)] bg-opacity-20 text-[var(--neon-cyan)] text-sm font-bold uppercase"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {game.phase.replace(/-/g, ' ')}
            </motion.span>
            <span className="px-3 py-1 rounded-full bg-[var(--spotlight-gold)] bg-opacity-20 text-[var(--spotlight-gold)] font-bold uppercase">
              {judgeId === 'judge1' ? 'Judge 1' : 'Judge 2'}
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* Lobby */}
          {game.phase === 'lobby' && (
            <motion.div
              key="lobby"
              className="glass-card-strong p-8 text-center max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-center mb-4">
                <Scale size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold mb-2">Waiting to Start</h2>
              <p className="text-[var(--text-secondary)]">
                {Object.keys(game.players).length} players joined
              </p>
            </motion.div>
          )}

          {/* Topic Reveal */}
          {game.phase === 'topic-reveal' && currentTopic && (
            <motion.div
              key="topic"
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card-strong p-6 text-center mb-4">
                <div className="flex justify-center mb-4">
                  <Dices size={48} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider mb-2">
                  New Topic
                </p>
                <div className="flex justify-center gap-3 mb-4">
                  <CategoryTag category={currentTopic.category} />
                  <DifficultyStars difficulty={currentTopic.difficulty} />
                </div>
                <p className="text-lg font-semibold">{currentTopic.question}</p>
              </div>
            </motion.div>
          )}

          {/* Voting */}
          {game.phase === 'voting' && currentTopic && (
            <motion.div
              key="voting"
              className="max-w-2xl mx-auto space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card p-6 text-center">
                <div className="flex justify-center mb-3">
                  <VoteIcon size={40} className="text-[var(--neon-cyan)]" />
                </div>
                <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider">
                  Class Voting
                </p>
                <p className="text-lg font-semibold mt-2">{currentTopic.question}</p>
              </div>

              <SyncedCountdown
                duration={30}
                startedAt={game.phaseStartedAt}
                label="Voting"
                size="sm"
              />

              <p className="text-center text-[var(--text-secondary)]">
                {game.votes.length} / {Object.keys(game.players).length} voted
              </p>
            </motion.div>
          )}

          {/* Matchup Reveal */}
          {game.phase === 'matchup-reveal' && (
            <motion.div
              key="matchup"
              className="max-w-2xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <Swords size={48} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="title-display text-2xl text-[var(--spotlight-gold)]">MATCHUPS</h2>
              </div>

              {currentRoundMatches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  className="glass-card p-4 flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <span className="font-bold text-[var(--team-a)]">
                    {game.teams[match.teamA]?.name}
                  </span>
                  <span className="text-[var(--text-muted)] text-sm">vs</span>
                  <span className="font-bold text-[var(--team-b)]">
                    {game.teams[match.teamB]?.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Preparation */}
          {game.phase === 'preparation' && currentMatch && currentTopic && (
            <motion.div
              key="prep"
              className="max-w-2xl mx-auto space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card p-4 text-center">
                <div className="flex justify-center mb-2">
                  <ClipboardList size={36} className="text-[var(--spotlight-amber)]" strokeWidth={1.5} />
                </div>
                <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider mb-2">
                  Teams Preparing
                </p>
                <p className="text-base">{currentTopic.question}</p>
              </div>

              <div className="flex justify-center gap-4">
                <div className="team-card team-card-a p-4 flex-1 text-center">
                  <h3 className="title-display text-lg text-[var(--team-a)]">
                    {game.teams[currentMatch.teamA]?.name}
                  </h3>
                  <span className="text-xs text-[var(--agree-green)]">AGREE</span>
                </div>
                <div className="team-card team-card-b p-4 flex-1 text-center">
                  <h3 className="title-display text-lg text-[var(--team-b)]">
                    {game.teams[currentMatch.teamB]?.name}
                  </h3>
                  <span className="text-xs text-[var(--disagree-red)]">DISAGREE</span>
                </div>
              </div>

              <SyncedCountdown
                duration={90}
                startedAt={game.phaseStartedAt}
                label="Preparation"
                size="sm"
              />

              <p className="text-center text-[var(--text-muted)] text-sm">
                Get ready — you&apos;ll see AI suggestions during scoring.
              </p>
            </motion.div>
          )}

          {/* Debate */}
          {game.phase === 'debate' && currentMatch && currentTopic && (() => {
            const subInfo = DEBATE_SUB_INFO[game.debateSubPhase]
            const activeTeam = subInfo.team
            const color = activeTeam === 'A' ? 'var(--team-a)' : activeTeam === 'B' ? 'var(--team-b)' : 'var(--spotlight-gold)'

            return (
              <motion.div
                key="debate"
                className="max-w-2xl mx-auto space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="glass-card p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Mic size={36} className="text-[var(--disagree-red)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider">Now Speaking</p>
                  <motion.p
                    key={game.debateSubPhase}
                    className="title-display text-2xl mt-2"
                    style={{ color }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {activeTeam === 'HOST'
                      ? 'HOST CHALLENGE'
                      : `${game.teams[activeTeam === 'A' ? currentMatch.teamA : currentMatch.teamB]?.name} — ${subInfo.label}`}
                  </motion.p>
                </div>

                {game.debateSubPhase !== 'done' && (
                  <SyncedCountdown
                    key={game.debateSubPhase}
                    duration={subInfo.duration}
                    startedAt={game.debateSubPhaseStartedAt}
                    label={subInfo.label}
                    size="sm"
                  />
                )}

                <p className="text-center text-[var(--text-muted)] text-sm">
                  Listen carefully — scoring panel opens soon.
                </p>
              </motion.div>
            )
          })()}

          {/* Audience Vote */}
          {game.phase === 'audience-vote' && currentMatch && (
            <motion.div
              key="audience-vote"
              className="max-w-2xl mx-auto space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Users size={40} className="text-[var(--agree-green)]" />
                </div>
                <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider">
                  Audience Voting
                </p>
                <p className="text-base mt-2">
                  {currentMatch.audienceVotes.length} votes cast
                </p>
              </div>

              <SyncedCountdown
                duration={20}
                startedAt={game.phaseStartedAt}
                label="Voting"
                size="sm"
              />

              <p className="text-center text-[var(--text-secondary)]">
                Get your scores ready — you&apos;ll grade next.
              </p>
            </motion.div>
          )}

          {/* Scoring - JudgePanel */}
          {game.phase === 'scoring' && currentMatch && (
            <motion.div
              key="scoring"
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentTopic && (
                <div className="glass-card p-4 mb-6 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Current Topic</p>
                  <p className="text-[var(--text-secondary)]">{currentTopic.question}</p>
                </div>
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
            </motion.div>
          )}

          {/* Result */}
          {game.phase === 'result' && currentMatch && (() => {
            const scores = getMatchScores()
            if (!scores) return null
            const winner = scores.finalScoreA > scores.finalScoreB ? game.teams[currentMatch.teamA] : game.teams[currentMatch.teamB]
            const winnerColor = scores.finalScoreA > scores.finalScoreB ? 'var(--team-a)' : 'var(--team-b)'

            return (
              <motion.div
                key="result"
                className="max-w-2xl mx-auto space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="glass-card-strong p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <Trophy size={64} style={{ color: winnerColor }} fill="currentColor" strokeWidth={1.5} />
                  </div>
                  <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider mb-2">
                    Round {currentMatch.round} Winner
                  </p>
                  <h2 className="title-display text-4xl title-glow" style={{ color: winnerColor }}>
                    {winner?.name}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4 text-center">
                    <p className="text-sm text-[var(--team-a)]">{game.teams[currentMatch.teamA]?.name}</p>
                    <p className="score-display text-3xl">{scores.finalScoreA.toFixed(1)}</p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-sm text-[var(--team-b)]">{game.teams[currentMatch.teamB]?.name}</p>
                    <p className="score-display text-3xl">{scores.finalScoreB.toFixed(1)}</p>
                  </div>
                </div>
              </motion.div>
            )
          })()}

          {/* Leaderboard */}
          {game.phase === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              className="max-w-2xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                  <BarChart3 size={48} className="text-[var(--neon-cyan)]" strokeWidth={1.5} />
                </div>
                <h2 className="title-display text-2xl text-[var(--spotlight-gold)]">
                  LEADERBOARD
                </h2>
              </div>

              {[...Object.values(game.teams)]
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((team, idx) => (
                  <motion.div
                    key={team.id}
                    className="glass-card p-4 flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-[var(--spotlight-gold)]">#{idx + 1}</span>
                      <span className="font-bold">{team.name}</span>
                    </div>
                    <span className="score-display text-2xl">{team.totalScore.toFixed(1)}</span>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {/* Final Awards */}
          {game.phase === 'final-awards' && (
            <motion.div
              key="awards"
              className="max-w-md mx-auto text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-card-strong p-8">
                <div className="flex justify-center mb-4">
                  <PartyPopper size={80} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="title-display text-3xl text-[var(--spotlight-gold)] title-glow">
                  AWARDS CEREMONY
                </h2>
                <p className="text-[var(--text-secondary)] mt-4">
                  Watch the big screen for winners!
                </p>

                {(() => {
                  const sorted = [...Object.values(game.teams)].sort((a, b) => b.totalScore - a.totalScore)
                  return (
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[var(--spotlight-gold)] bg-opacity-10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Trophy size={20} className="text-[var(--spotlight-gold)]" fill="currentColor" />
                          <span className="font-bold">{sorted[0]?.name}</span>
                        </div>
                        <span className="text-[var(--spotlight-gold)] font-bold">
                          {sorted[0]?.totalScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award size={20} className="text-[#c0c0c0]" fill="currentColor" />
                          <span className="font-bold">{sorted[1]?.name}</span>
                        </div>
                        <span className="text-[var(--text-secondary)] font-bold">
                          {sorted[1]?.totalScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
