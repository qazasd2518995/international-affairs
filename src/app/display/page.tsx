'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Vote as VoteIcon, Flame, Zap, Scale } from 'lucide-react'
import {
  StageBackground,
  Logo,
  VoteResults,
  AllMatchups,
  SyncedCountdown,
  AudienceVoteResults,
  MatchResult,
  Leaderboard,
  FinalAwards,
  DifficultyStars,
  CategoryTag,
  QRCodeDisplay,
  PhaseTransition,
} from '@/components'
import { useRealtimeGame, type DebateSubPhase } from '@/lib/useRealtimeGame'
import { TOPICS } from '@/lib/types'

const DEBATE_SUB_INFO: Record<DebateSubPhase, { label: string; duration: number; team: 'A' | 'B' | 'HOST' }> = {
  'team-a-opening': { label: 'OPENING STATEMENT', duration: 20, team: 'A' },
  'team-b-opening': { label: 'OPENING STATEMENT', duration: 20, team: 'B' },
  'host-challenge': { label: 'HOST CHALLENGE', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'RESPONSE', duration: 15, team: 'A' },
  'team-b-response': { label: 'RESPONSE', duration: 15, team: 'B' },
  'done': { label: 'DEBATE COMPLETE', duration: 0, team: 'A' },
}

function DisplayContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

  // Show phase transition on phase change
  useEffect(() => {
    if (game.phase !== 'lobby') {
      setShowPhaseTransition(true)
      const timer = setTimeout(() => setShowPhaseTransition(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [game.phase])

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
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
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
          <Logo size="lg" />
          <div className="loading-spinner mx-auto mt-8" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      {/* Phase transition overlay */}
      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <Logo size="md" animate={false} />
          <div className="flex items-center gap-6">
            <span className="text-[var(--text-muted)]">
              Round {game.currentRound} / 3
            </span>
            <motion.span
              key={game.phase}
              className="px-4 py-2 rounded-full bg-[var(--neon-cyan)] bg-opacity-20 text-[var(--neon-cyan)] font-bold uppercase tracking-wider"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {game.phase.replace(/-/g, ' ')}
            </motion.span>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {/* Lobby */}
            {game.phase === 'lobby' && (
              <motion.div
                key="lobby"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="glass-card-strong p-12 spotlight-effect"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <h2 className="title-display text-5xl text-[var(--spotlight-gold)] mb-8 title-glow">
                    SCAN TO JOIN
                  </h2>

                  {typeof window !== 'undefined' && (
                    <motion.div
                      className="flex justify-center mb-6"
                      animate={{
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <QRCodeDisplay
                        url={`${window.location.origin}?session=${sessionId}`}
                        size={280}
                      />
                    </motion.div>
                  )}

                  <motion.p
                    className="text-[var(--spotlight-gold)] text-4xl title-display"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {Object.keys(game.players).length} PLAYERS JOINED
                  </motion.p>

                  <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                    {Object.values(game.teams).map((team) => (
                      <motion.div
                        key={team.id}
                        className="glass-card p-3 text-center"
                        animate={{
                          borderColor: team.members.length > 0 ? 'var(--spotlight-gold)' : 'var(--glass-border)',
                        }}
                      >
                        <p className="text-sm font-bold">{team.name}</p>
                        <motion.p
                          key={team.members.length}
                          className="text-[var(--spotlight-gold)]"
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                        >
                          {team.members.length}
                        </motion.p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Topic Reveal */}
            {game.phase === 'topic-reveal' && currentTopic && (
              <motion.div
                key="topic"
                className="w-full max-w-5xl"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 80 }}
              >
                <div className="glass-card-strong p-12 neon-border spotlight-effect text-center">
                  <motion.div
                    className="flex justify-center items-center gap-6 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CategoryTag category={currentTopic.category} size="lg" />
                    <div className="h-8 w-px bg-[var(--glass-border)]" />
                    <DifficultyStars difficulty={currentTopic.difficulty} size="lg" />
                  </motion.div>

                  <motion.h2
                    className="text-4xl md:text-5xl font-bold leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {currentTopic.question}
                  </motion.h2>

                  {currentTopic.difficulty === 3 && (
                    <motion.div
                      className="mt-8"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, type: 'spring' }}
                    >
                      <motion.div
                        className="flex items-center justify-center gap-3"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Star size={28} className="text-[var(--spotlight-gold)]" fill="currentColor" />
                        <span className="text-[var(--spotlight-gold)] text-xl uppercase tracking-wider title-display">
                          Challenge Topic — Bonus Points!
                        </span>
                        <Star size={28} className="text-[var(--spotlight-gold)]" fill="currentColor" />
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Voting Phase */}
            {game.phase === 'voting' && (
              <motion.div
                key="voting"
                className="w-full max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentTopic && (
                  <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="title-display text-3xl text-[var(--spotlight-gold)] mb-4">
                      CAST YOUR VOTE
                    </h2>
                    <p className="text-xl text-[var(--text-secondary)]">{currentTopic.question}</p>
                  </motion.div>
                )}

                <div className="flex justify-center mb-8">
                  <SyncedCountdown
                    duration={30}
                    startedAt={game.phaseStartedAt}
                    label="Time to Vote"
                    size="md"
                  />
                </div>

                <VoteResults votes={game.votes} totalVoters={Object.keys(game.players).length} />
              </motion.div>
            )}

            {/* Matchup Reveal */}
            {game.phase === 'matchup-reveal' && (
              <motion.div
                key="matchup"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AllMatchups matches={currentRoundMatches} teams={game.teams} />
              </motion.div>
            )}

            {/* Preparation */}
            {game.phase === 'preparation' && (
              <motion.div
                key="prep"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h2
                  className="title-display text-5xl text-[var(--spotlight-gold)] mb-8 title-glow"
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                      '0 0 50px rgba(255, 215, 0, 1)',
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  PREPARATION TIME
                </motion.h2>

                <SyncedCountdown
                  duration={90}
                  startedAt={game.phaseStartedAt}
                  label="Teams Preparing"
                  size="lg"
                />

                <motion.p
                  className="text-[var(--text-secondary)] mt-8 text-2xl"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Teams are writing their arguments...
                </motion.p>

                {/* Show competing teams */}
                {currentMatch && (
                  <motion.div
                    className="flex justify-center gap-8 mt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="team-card team-card-a p-4">
                      <h3 className="title-display text-lg text-[var(--team-a)]">
                        {game.teams[currentMatch.teamA]?.name}
                      </h3>
                      <p className="text-sm text-[var(--agree-green)] mt-1">AGREE</p>
                    </div>
                    <div className="flex items-center text-[var(--text-muted)] text-2xl">VS</div>
                    <div className="team-card team-card-b p-4">
                      <h3 className="title-display text-lg text-[var(--team-b)]">
                        {game.teams[currentMatch.teamB]?.name}
                      </h3>
                      <p className="text-sm text-[var(--disagree-red)] mt-1">DISAGREE</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Debate */}
            {game.phase === 'debate' && currentMatch && (() => {
              const subInfo = DEBATE_SUB_INFO[game.debateSubPhase]
              const activeTeam = subInfo.team
              const phaseColor = activeTeam === 'A' ? 'var(--team-a)' : activeTeam === 'B' ? 'var(--team-b)' : 'var(--spotlight-gold)'

              return (
                <motion.div
                  key="debate"
                  className="w-full text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Sub-phase label */}
                  <motion.div
                    key={game.debateSubPhase}
                    className="mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-[var(--text-muted)] uppercase tracking-[0.3em] text-sm mb-2">
                      Now Speaking
                    </p>
                    <motion.h2
                      className="title-display text-5xl md:text-7xl title-glow"
                      style={{ color: phaseColor }}
                      animate={{
                        textShadow: [
                          `0 0 20px ${phaseColor}`,
                          `0 0 60px ${phaseColor}`,
                          `0 0 20px ${phaseColor}`,
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {activeTeam === 'HOST'
                        ? 'HOST CHALLENGE'
                        : `${game.teams[activeTeam === 'A' ? currentMatch.teamA : currentMatch.teamB]?.name} — ${subInfo.label}`}
                    </motion.h2>
                  </motion.div>

                  {/* Teams row */}
                  <div className="flex justify-center items-center gap-8 mb-8">
                    <motion.div
                      className="team-card team-card-a p-6"
                      animate={{
                        scale: activeTeam === 'A' ? [1, 1.05, 1] : 0.9,
                        opacity: activeTeam === 'A' ? 1 : 0.4,
                      }}
                      transition={{ duration: 1.5, repeat: activeTeam === 'A' ? Infinity : 0 }}
                    >
                      <div className="flex justify-center mb-2">
                        <Flame size={40} className="text-[var(--team-a)]" fill="currentColor" />
                      </div>
                      <h3 className="title-display text-2xl text-[var(--team-a)]">
                        {game.teams[currentMatch.teamA]?.name}
                      </h3>
                      <span className="text-sm text-[var(--agree-green)]">AGREE</span>
                    </motion.div>

                    <div className="vs-badge text-5xl">VS</div>

                    <motion.div
                      className="team-card team-card-b p-6"
                      animate={{
                        scale: activeTeam === 'B' ? [1, 1.05, 1] : 0.9,
                        opacity: activeTeam === 'B' ? 1 : 0.4,
                      }}
                      transition={{ duration: 1.5, repeat: activeTeam === 'B' ? Infinity : 0 }}
                    >
                      <div className="flex justify-center mb-2">
                        <Zap size={40} className="text-[var(--team-b)]" fill="currentColor" />
                      </div>
                      <h3 className="title-display text-2xl text-[var(--team-b)]">
                        {game.teams[currentMatch.teamB]?.name}
                      </h3>
                      <span className="text-sm text-[var(--disagree-red)]">DISAGREE</span>
                    </motion.div>
                  </div>

                  {/* Big synced countdown */}
                  {game.debateSubPhase !== 'done' && (
                    <SyncedCountdown
                      key={game.debateSubPhase}
                      duration={subInfo.duration}
                      startedAt={game.debateSubPhaseStartedAt}
                      label={subInfo.label}
                      size="lg"
                    />
                  )}
                </motion.div>
              )
            })()}

            {/* Audience Vote */}
            {game.phase === 'audience-vote' && currentMatch && (
              <motion.div
                key="audience-vote"
                className="w-full max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-center mb-8"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="flex items-center justify-center gap-6">
                    <VoteIcon size={56} className="text-[var(--spotlight-gold)]" strokeWidth={2} />
                    <h2 className="title-display text-5xl text-[var(--spotlight-gold)] title-glow">
                      VOTE NOW!
                    </h2>
                    <VoteIcon size={56} className="text-[var(--spotlight-gold)]" strokeWidth={2} />
                  </div>
                  <p className="text-xl text-[var(--text-secondary)] mt-4">
                    Use your phone to cast your vote
                  </p>
                </motion.div>

                <div className="flex justify-center mb-8">
                  <SyncedCountdown
                    duration={20}
                    startedAt={game.phaseStartedAt}
                    label="Vote Time"
                    size="md"
                  />
                </div>

                <AudienceVoteResults
                  teamA={game.teams[currentMatch.teamA]}
                  teamB={game.teams[currentMatch.teamB]}
                  votes={currentMatch.audienceVotes}
                />
              </motion.div>
            )}

            {/* Scoring */}
            {game.phase === 'scoring' && (
              <motion.div
                key="scoring"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="glass-card-strong p-12 spotlight-effect">
                  <motion.div
                    className="flex justify-center mb-6"
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Scale size={120} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))' }} />
                  </motion.div>
                  <h2 className="title-display text-5xl text-[var(--spotlight-gold)] mb-4 title-glow">
                    JUDGES DELIBERATING
                  </h2>
                  <div className="loading-spinner mx-auto mt-8" />
                </div>
              </motion.div>
            )}

            {/* Result */}
            {game.phase === 'result' && currentMatch && (
              <motion.div
                key="result"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  const scores = getMatchScores()
                  if (!scores) return null
                  return (
                    <MatchResult
                      match={currentMatch}
                      teamA={game.teams[currentMatch.teamA]}
                      teamB={game.teams[currentMatch.teamB]}
                      judgeScoreA={scores.judgeScoreA}
                      judgeScoreB={scores.judgeScoreB}
                      audiencePercentA={scores.audiencePercentA}
                      audiencePercentB={scores.audiencePercentB}
                    />
                  )
                })()}
              </motion.div>
            )}

            {/* Leaderboard */}
            {game.phase === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                className="w-full max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Leaderboard teams={Object.values(game.teams)} />
              </motion.div>
            )}

            {/* Final Awards */}
            {game.phase === 'final-awards' && (
              <motion.div
                key="awards"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FinalAwards teams={Object.values(game.teams)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}

export default function DisplayPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
          <div className="loading-spinner mx-auto mt-8" />
        </div>
      </main>
    }>
      <DisplayContent />
    </Suspense>
  )
}
