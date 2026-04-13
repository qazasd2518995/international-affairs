'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, CheckCircle2, Scale } from 'lucide-react'
import {
  StageBackground,
  Logo,
  TopicReveal,
  VoteResults,
  AllMatchups,
  CountdownTimer,
  AudienceVoteResults,
  MatchResult,
  Leaderboard,
  FinalAwards,
  MiniLeaderboard,
  DifficultyStars,
  CategoryTag,
  QRCodeDisplay,
  PhaseTransition,
} from '@/components'
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { TOPICS, type Topic, type GamePhase, type Match } from '@/lib/types'

// Debate phase sub-stages
type DebateSubPhase = 'team-a-opening' | 'team-b-opening' | 'host-challenge' | 'team-a-response' | 'team-b-response' | 'done'

const DEBATE_SUB_PHASES: Record<DebateSubPhase, { label: string; duration: number; team: 'A' | 'B' | 'HOST' }> = {
  'team-a-opening': { label: 'Team A Opening', duration: 20, team: 'A' },
  'team-b-opening': { label: 'Team B Opening', duration: 20, team: 'B' },
  'host-challenge': { label: 'Host Challenge', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'Team A Response', duration: 15, team: 'A' },
  'team-b-response': { label: 'Team B Response', duration: 15, team: 'B' },
  'done': { label: 'Debate Complete', duration: 0, team: 'A' },
}

function AdminContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')

  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)
  const [usedTopicIds, setUsedTopicIds] = useState<string[]>([])
  const [gameUrl, setGameUrl] = useState<string>('')
  const [debateSubPhase, setDebateSubPhase] = useState<DebateSubPhase>('team-a-opening')
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

  // Generate game URL
  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      setGameUrl(`${window.location.origin}?session=${sessionId}`)
    }
  }, [sessionId])

  // Show phase transition on phase change
  useEffect(() => {
    if (game.phase !== 'lobby') {
      setShowPhaseTransition(true)
      const timer = setTimeout(() => setShowPhaseTransition(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [game.phase])

  // Reset debate sub-phase when match changes
  useEffect(() => {
    if (game.phase === 'debate') {
      setDebateSubPhase('team-a-opening')
    }
  }, [game.currentMatchId, game.phase])

  // Create new session
  const handleCreateSession = async () => {
    const id = await game.createSession()
    setSessionId(id)
    window.history.pushState({}, '', `/admin?session=${id}`)
  }

  const handleTopicReveal = async (topic: Topic) => {
    await game.setCurrentTopic(topic.id)
    setUsedTopicIds((prev) => [...prev, topic.id])
  }

  const handleNextPhase = async () => {
    const phases: GamePhase[] = [
      'lobby', 'topic-reveal', 'voting', 'matchup-reveal',
      'preparation', 'debate', 'audience-vote', 'scoring',
      'result', 'leaderboard', 'final-awards',
    ]
    const currentIndex = phases.indexOf(game.phase)
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1]
      await game.updatePhase(nextPhase)

      if (nextPhase === 'matchup-reveal') {
        await createMatchesFromVotes()
      }
    }
  }

  const createMatchesFromVotes = async () => {
    if (!game.currentTopicId) return

    const teamStances: { teamId: string; agreePercent: number; disagreePercent: number }[] = []

    Object.values(game.teams).forEach((team) => {
      const teamVotes = game.votes.filter((v) => v.teamId === team.id)
      const total = teamVotes.length || 1
      const agreeCount = teamVotes.filter((v) => v.stance === 'agree').length
      const disagreeCount = teamVotes.filter((v) => v.stance === 'disagree').length

      teamStances.push({
        teamId: team.id,
        agreePercent: (agreeCount / total) * 100,
        disagreePercent: (disagreeCount / total) * 100,
      })
    })

    const sortedByAgree = [...teamStances].sort((a, b) => b.agreePercent - a.agreePercent)
    const sortedByDisagree = [...teamStances].sort((a, b) => b.disagreePercent - a.disagreePercent)

    const paired: Set<string> = new Set()
    const newRound = game.currentRound + 1

    for (let i = 0; i < Math.floor(teamStances.length / 2); i++) {
      const teamA = sortedByAgree.find((t) => !paired.has(t.teamId))
      if (!teamA) break
      paired.add(teamA.teamId)

      const teamB = sortedByDisagree.find((t) => !paired.has(t.teamId))
      if (!teamB) break
      paired.add(teamB.teamId)

      const match: Omit<Match, 'judgeScores' | 'audienceVotes'> = {
        id: `match-${newRound}-${i + 1}-${Date.now()}`,
        round: newRound,
        topicId: game.currentTopicId,
        teamA: teamA.teamId,
        teamB: teamB.teamId,
        teamAStance: 'agree',
        teamBStance: 'disagree',
        teamAArguments: [],
        teamBArguments: [],
        completed: false,
      }

      await game.createMatch(match)

      if (i === 0) {
        await game.setCurrentMatch(match.id)
      }
    }
  }

  const handleDebateSubPhaseNext = () => {
    const subPhases: DebateSubPhase[] = ['team-a-opening', 'team-b-opening', 'host-challenge', 'team-a-response', 'team-b-response', 'done']
    const currentIdx = subPhases.indexOf(debateSubPhase)
    if (currentIdx < subPhases.length - 1) {
      setDebateSubPhase(subPhases[currentIdx + 1])
    }
  }

  const handleCalculateResult = async () => {
    if (!currentMatch) return

    const judgeScoreA = currentMatch.judgeScores.reduce((sum, s) => sum + s.teamAScore, 0) / (currentMatch.judgeScores.length || 1)
    const judgeScoreB = currentMatch.judgeScores.reduce((sum, s) => sum + s.teamBScore, 0) / (currentMatch.judgeScores.length || 1)

    const totalAudienceVotes = currentMatch.audienceVotes.length || 1
    const votesForA = currentMatch.audienceVotes.filter((v) => v.votedFor === currentMatch.teamA).length
    const votesForB = currentMatch.audienceVotes.filter((v) => v.votedFor === currentMatch.teamB).length
    const audiencePercentA = (votesForA / totalAudienceVotes) * 100
    const audiencePercentB = (votesForB / totalAudienceVotes) * 100

    const finalScoreA = judgeScoreA * 0.7 + (audiencePercentA / 10) * 0.3
    const finalScoreB = judgeScoreB * 0.7 + (audiencePercentB / 10) * 0.3

    const winner = finalScoreA > finalScoreB ? currentMatch.teamA : currentMatch.teamB

    await game.updateMatchResult(currentMatch.id, winner)

    const teamA = game.teams[currentMatch.teamA]
    const teamB = game.teams[currentMatch.teamB]

    await game.updateTeamScore(currentMatch.teamA, teamA.totalScore + finalScoreA, teamA.matchesPlayed + 1)
    await game.updateTeamScore(currentMatch.teamB, teamB.totalScore + finalScoreB, teamB.matchesPlayed + 1)
  }

  const handleNextMatch = async () => {
    const matchIndex = currentRoundMatches.findIndex((m) => m.id === game.currentMatchId)
    if (matchIndex < currentRoundMatches.length - 1) {
      await game.setCurrentMatch(currentRoundMatches[matchIndex + 1].id)
      setDebateSubPhase('team-a-opening')
      await game.updatePhase('preparation')
    } else {
      await game.updatePhase('leaderboard')
    }
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
    }
  }

  // No session yet
  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
          <motion.div
            className="glass-card-strong p-8 mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="title-display text-2xl text-[var(--spotlight-gold)] mb-6">
              HOST CONTROL PANEL
            </h2>
            <button className="btn-primary" onClick={handleCreateSession}>
              CREATE NEW GAME
            </button>
          </motion.div>
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
          <p className="text-[var(--text-muted)] mt-4">Loading game...</p>
        </div>
      </main>
    )
  }

  const debateInfo = DEBATE_SUB_PHASES[debateSubPhase]

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      {/* Phase transition overlay */}
      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-4">
            <span className="text-[var(--text-muted)] text-sm">
              Round {game.currentRound} / 3
            </span>
            <motion.span
              key={game.phase}
              className="px-3 py-1 rounded-full bg-[var(--neon-cyan)] bg-opacity-20 text-[var(--neon-cyan)] text-sm font-semibold uppercase"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {game.phase.replace(/-/g, ' ')}
            </motion.span>
          </div>
        </header>

        {/* Main content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Lobby */}
            {game.phase === 'lobby' && (
              <motion.div
                key="lobby-content"
                className="max-w-2xl mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-card-strong p-8">
                  <h2 className="title-display text-3xl text-[var(--spotlight-gold)] mb-6">
                    WAITING FOR PLAYERS
                  </h2>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                    {gameUrl && <QRCodeDisplay url={gameUrl} size={160} />}
                    <div className="glass-card p-4 flex-1">
                      <p className="text-sm text-[var(--text-muted)] mb-2">Share this link:</p>
                      <p className="text-[var(--neon-cyan)] text-xs break-all font-mono">{gameUrl}</p>
                      <button
                        className="btn-secondary text-sm mt-3"
                        onClick={() => navigator.clipboard.writeText(gameUrl)}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {Object.values(game.teams).map((team) => (
                      <motion.div
                        key={team.id}
                        className="glass-card p-4"
                        animate={{
                          borderColor: team.members.length > 0 ? 'var(--spotlight-gold)' : 'var(--glass-border)',
                        }}
                      >
                        <h3 className="font-bold">{team.name}</h3>
                        <motion.p
                          key={team.members.length}
                          className="text-[var(--spotlight-gold)]"
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                        >
                          {team.members.length} players
                        </motion.p>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-[var(--text-secondary)] mb-6">
                    Total: {Object.keys(game.players).length} players joined
                  </p>

                  <button className="btn-primary" onClick={handleNextPhase}>
                    START GAME →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Topic Reveal */}
            {game.phase === 'topic-reveal' && (
              <motion.div
                key="topic-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!game.currentTopicId ? (
                  <TopicReveal onReveal={handleTopicReveal} usedTopicIds={usedTopicIds} />
                ) : currentTopic && (
                  <div className="max-w-4xl mx-auto">
                    <div className="glass-card-strong p-10 neon-border spotlight-effect text-center">
                      <div className="flex justify-center items-center gap-6 mb-8">
                        <CategoryTag category={currentTopic.category} size="lg" />
                        <div className="h-8 w-px bg-[var(--glass-border)]" />
                        <DifficultyStars difficulty={currentTopic.difficulty} size="lg" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold leading-relaxed">
                        {currentTopic.question}
                      </h2>
                    </div>
                    <div className="text-center mt-8">
                      <motion.button
                        className="btn-primary"
                        onClick={handleNextPhase}
                        whileHover={{ scale: 1.05 }}
                      >
                        START VOTING →
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Voting Phase - with countdown */}
            {game.phase === 'voting' && (
              <motion.div
                key="voting-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentTopic && (
                  <div className="max-w-3xl mx-auto glass-card p-6 text-center mb-6">
                    <p className="text-[var(--text-muted)] text-sm mb-2">Topic</p>
                    <p className="text-lg font-semibold">{currentTopic.question}</p>
                  </div>
                )}

                <CountdownTimer
                  duration={30}
                  label="Vote Now"
                  size="md"
                  onComplete={handleNextPhase}
                />

                <VoteResults votes={game.votes} totalVoters={Object.keys(game.players).length} />

                <div className="text-center">
                  <button className="btn-primary" onClick={handleNextPhase}>
                    REVEAL MATCHUPS →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Matchup Reveal */}
            {game.phase === 'matchup-reveal' && (
              <motion.div
                key="matchup-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AllMatchups matches={currentRoundMatches} teams={game.teams} />
                <div className="text-center">
                  <motion.button
                    className="btn-primary"
                    onClick={handleNextPhase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    START PREPARATION →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Preparation Phase - with 90s countdown */}
            {game.phase === 'preparation' && (
              <motion.div
                key="prep-content"
                className="text-center space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h2
                  className="title-display text-4xl text-[var(--spotlight-gold)]"
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                      '0 0 40px rgba(255, 215, 0, 0.8)',
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  PREPARATION TIME
                </motion.h2>
                <p className="text-[var(--text-secondary)] text-lg">
                  Teams are writing their arguments...
                </p>

                <CountdownTimer
                  duration={90}
                  label="Preparation"
                  size="lg"
                  onComplete={handleNextPhase}
                />

                <button className="btn-primary" onClick={handleNextPhase}>
                  START DEBATE →
                </button>
              </motion.div>
            )}

            {/* Debate Phase with sub-phases and countdown */}
            {game.phase === 'debate' && currentMatch && currentTopic && (
              <motion.div
                key="debate-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Sub-phase header */}
                <motion.div
                  key={debateSubPhase}
                  className="text-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.div
                    className="title-display text-5xl md:text-6xl title-glow"
                    style={{
                      color: debateInfo.team === 'A' ? 'var(--team-a)' :
                             debateInfo.team === 'B' ? 'var(--team-b)' :
                             'var(--spotlight-gold)',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {debateInfo.label.toUpperCase()}
                  </motion.div>
                </motion.div>

                {/* Teams display */}
                <div className="flex justify-center items-center gap-8">
                  <motion.div
                    className="team-card team-card-a p-6"
                    animate={{
                      scale: debateInfo.team === 'A' ? [1, 1.05, 1] : 0.9,
                      opacity: debateInfo.team === 'A' ? 1 : 0.5,
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="flex justify-center mb-2">
                      <Flame size={32} className="text-[var(--team-a)]" fill="currentColor" />
                    </div>
                    <h3 className="title-display text-xl text-[var(--team-a)]">
                      {game.teams[currentMatch.teamA]?.name}
                    </h3>
                    <span className="text-sm text-[var(--agree-green)]">AGREE</span>
                  </motion.div>

                  <div className="vs-badge text-4xl">VS</div>

                  <motion.div
                    className="team-card team-card-b p-6"
                    animate={{
                      scale: debateInfo.team === 'B' ? [1, 1.05, 1] : 0.9,
                      opacity: debateInfo.team === 'B' ? 1 : 0.5,
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="flex justify-center mb-2">
                      <Zap size={32} className="text-[var(--team-b)]" fill="currentColor" />
                    </div>
                    <h3 className="title-display text-xl text-[var(--team-b)]">
                      {game.teams[currentMatch.teamB]?.name}
                    </h3>
                    <span className="text-sm text-[var(--disagree-red)]">DISAGREE</span>
                  </motion.div>
                </div>

                {/* Countdown for current sub-phase */}
                {debateSubPhase !== 'done' && (
                  <CountdownTimer
                    key={debateSubPhase}
                    duration={debateInfo.duration}
                    label={debateInfo.label}
                    size="md"
                    onComplete={handleDebateSubPhaseNext}
                  />
                )}

                <div className="text-center space-x-4">
                  {debateSubPhase !== 'done' ? (
                    <button className="btn-secondary" onClick={handleDebateSubPhaseNext}>
                      SKIP TO NEXT →
                    </button>
                  ) : (
                    <motion.button
                      className="btn-primary"
                      onClick={handleNextPhase}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      END DEBATE → AUDIENCE VOTE
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Audience Vote - with countdown */}
            {game.phase === 'audience-vote' && currentMatch && (
              <motion.div
                key="audience-vote-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="title-display text-3xl text-center text-[var(--spotlight-gold)]">
                  AUDIENCE VOTE
                </h2>

                <CountdownTimer
                  duration={20}
                  label="Cast Your Vote"
                  size="md"
                  onComplete={handleNextPhase}
                />

                <AudienceVoteResults
                  teamA={game.teams[currentMatch.teamA]}
                  teamB={game.teams[currentMatch.teamB]}
                  votes={currentMatch.audienceVotes}
                />

                <div className="text-center">
                  <button className="btn-primary" onClick={handleNextPhase}>
                    SHOW JUDGE SCORES →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Scoring Phase */}
            {game.phase === 'scoring' && currentMatch && (
              <motion.div
                key="scoring-content"
                className="text-center space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h2
                  className="title-display text-4xl text-[var(--spotlight-gold)]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  JUDGES SCORING...
                </motion.h2>

                <div className="flex justify-center gap-8">
                  {[1, 2].map((i) => {
                    const submitted = currentMatch.judgeScores.some((s) => s.judgeId === `judge${i}`)
                    return (
                      <motion.div
                        key={i}
                        className="glass-card p-6 text-center"
                        animate={{
                          borderColor: submitted ? 'var(--agree-green)' : 'var(--glass-border)',
                          scale: submitted ? [1, 1.05, 1] : 1,
                        }}
                      >
                        <div className="flex justify-center mb-2">
                          {submitted ? (
                            <CheckCircle2 size={48} className="text-[var(--agree-green)]" strokeWidth={2} />
                          ) : (
                            <Scale size={48} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                          )}
                        </div>
                        <p className="font-bold">Judge {i}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {submitted ? 'Scored!' : 'Scoring...'}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="loading-spinner mx-auto" />

                <button
                  className="btn-primary"
                  onClick={async () => {
                    await handleCalculateResult()
                    await game.updatePhase('result')
                  }}
                >
                  REVEAL RESULT →
                </button>
              </motion.div>
            )}

            {/* Result Phase */}
            {game.phase === 'result' && currentMatch && (
              <motion.div
                key="result-content"
                className="space-y-8"
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
                <div className="text-center">
                  <button className="btn-primary" onClick={handleNextMatch}>
                    {currentRoundMatches.findIndex((m) => m.id === game.currentMatchId) < currentRoundMatches.length - 1
                      ? 'NEXT MATCH →'
                      : 'SHOW LEADERBOARD →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            {game.phase === 'leaderboard' && (
              <motion.div
                key="leaderboard-content"
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Leaderboard teams={Object.values(game.teams)} />
                <div className="text-center space-x-4">
                  {game.currentRound < 3 && (
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        await game.updatePhase('topic-reveal')
                      }}
                    >
                      NEXT ROUND →
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => game.updatePhase('final-awards')}
                  >
                    FINAL AWARDS →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Final Awards */}
            {game.phase === 'final-awards' && (
              <motion.div
                key="awards-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FinalAwards teams={Object.values(game.teams)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mini Leaderboard */}
        {game.phase !== 'lobby' && game.phase !== 'final-awards' && Object.values(game.teams).some((t) => t.matchesPlayed > 0) && (
          <div className="fixed bottom-4 right-4 w-64">
            <MiniLeaderboard teams={Object.values(game.teams)} />
          </div>
        )}

        {/* Display link */}
        <div className="fixed bottom-4 left-4 glass-card px-4 py-2">
          <p className="text-xs text-[var(--text-muted)]">
            Display: <a href={`/display?session=${sessionId}`} className="text-[var(--neon-cyan)]" target="_blank">/display</a>
            {' | '}
            Judge: <a href={`/judge?session=${sessionId}`} className="text-[var(--neon-cyan)]" target="_blank">/judge</a>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function AdminPage() {
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
      <AdminContent />
    </Suspense>
  )
}
