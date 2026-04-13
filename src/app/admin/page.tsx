'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StageBackground,
  Logo,
  TopicReveal,
  VoteResults,
  AllMatchups,
  SyncedCountdown,
  SkipButton,
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
import { useRealtimeGame, type DebateSubPhase } from '@/lib/useRealtimeGame'
import { TOPICS, type Topic, type GamePhase, type Match } from '@/lib/types'

const DEBATE_SUB_PHASES: Record<DebateSubPhase, { label: string; duration: number; team: 'A' | 'B' | 'HOST' }> = {
  'team-a-opening': { label: 'A OPENING', duration: 20, team: 'A' },
  'team-b-opening': { label: 'B OPENING', duration: 20, team: 'B' },
  'host-challenge': { label: 'CHALLENGE', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'A RESPONSE', duration: 15, team: 'A' },
  'team-b-response': { label: 'B RESPONSE', duration: 15, team: 'B' },
  'done': { label: 'DONE', duration: 0, team: 'A' },
}

function AdminContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')

  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)
  const [usedTopicIds, setUsedTopicIds] = useState<string[]>([])
  const [gameUrl, setGameUrl] = useState<string>('')
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)
  const debateSubPhase = game.debateSubPhase

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      setGameUrl(`${window.location.origin}?session=${sessionId}`)
    }
  }, [sessionId])

  useEffect(() => {
    if (game.phase !== 'lobby') {
      setShowPhaseTransition(true)
      const timer = setTimeout(() => setShowPhaseTransition(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [game.phase])

  useEffect(() => {
    if (game.phase === 'debate' && game.debateSubPhase !== 'team-a-opening') {
      game.updateDebateSubPhase('team-a-opening')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentMatchId])

  useEffect(() => {
    if (game.phase === 'debate' && !game.debateSubPhaseStartedAt) {
      game.updateDebateSubPhase('team-a-opening')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase])

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

  const handleDebateSubPhaseNext = async () => {
    const subPhases: DebateSubPhase[] = ['team-a-opening', 'team-b-opening', 'host-challenge', 'team-a-response', 'team-b-response', 'done']
    const currentIdx = subPhases.indexOf(debateSubPhase)
    if (currentIdx < subPhases.length - 1) {
      await game.updateDebateSubPhase(subPhases[currentIdx + 1])
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
      await game.updateDebateSubPhase('team-a-opening')
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

  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pixel-panel pixel-panel-yellow text-center">
              <p className="font-pixel text-pixel-lg neon-glow-yellow mb-6">
                ★ HOST CONSOLE ★
              </p>
              <motion.button
                className="pixel-btn pixel-btn-green"
                onClick={handleCreateSession}
                whileTap={{ scale: 0.95 }}
              >
                ► START NEW GAME ◄
              </motion.button>
            </div>
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
          <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
            LOADING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    )
  }

  const debateInfo = DEBATE_SUB_PHASES[debateSubPhase]

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

      <div className="relative z-10 min-h-screen">
        <header className="p-4 flex items-center justify-between border-b-2 border-panel-border">
          <div className="font-pixel text-pixel-base neon-glow-yellow">
            ♚ HOST MODE
          </div>
          <div className="flex items-center gap-3">
            <span className="pixel-tag pixel-tag-cyan">
              ROUND {game.currentRound}/3
            </span>
            <motion.span
              key={game.phase}
              className="pixel-tag pixel-tag-yellow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {game.phase.replace(/-/g, ' ')}
            </motion.span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {game.phase === 'lobby' && (
              <motion.div
                key="lobby-content"
                className="max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="pixel-panel pixel-panel-neon">
                  <div className="text-center mb-6">
                    <p className="font-pixel text-pixel-xl md:text-pixel-2xl neon-glow-green">
                      ★ WAITING FOR PLAYERS ★
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                    {gameUrl && <QRCodeDisplay url={gameUrl} size={200} />}
                    <div className="pixel-panel-sm pixel-panel max-w-xs w-full">
                      <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">
                        ► GAME URL
                      </p>
                      <p className="font-terminal text-terminal-sm text-neon-cyan break-all mb-3">
                        {gameUrl}
                      </p>
                      <motion.button
                        className="pixel-btn pixel-btn-cyan w-full text-pixel-sm"
                        onClick={() => navigator.clipboard.writeText(gameUrl)}
                        whileTap={{ scale: 0.95 }}
                      >
                        COPY
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {Object.values(game.teams).map((team) => (
                      <motion.div
                        key={team.id}
                        className="pixel-panel-sm pixel-panel text-center"
                        animate={{
                          boxShadow: team.members.length > 0
                            ? '0 0 0 2px var(--neon-green), 0 0 0 4px var(--arcade-void), 0 0 0 6px var(--neon-green), 4px 4px 0 0 rgba(0, 0, 0, 0.8)'
                            : undefined,
                        }}
                      >
                        <p className="font-pixel text-pixel-sm text-text-white">
                          {team.name.toUpperCase()}
                        </p>
                        <motion.p
                          key={team.members.length}
                          className="font-pixel text-pixel-lg neon-glow-green"
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                        >
                          {team.members.length}
                        </motion.p>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-center font-pixel text-pixel-base text-neon-yellow mb-4">
                    TOTAL: {Object.keys(game.players).length} HEROES
                  </p>

                  <div className="text-center">
                    <motion.button
                      className="pixel-btn pixel-btn-green"
                      onClick={handleNextPhase}
                      whileTap={{ scale: 0.95 }}
                    >
                      ► START GAME ◄
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {game.phase === 'topic-reveal' && (
              <motion.div
                key="topic-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!game.currentTopicId ? (
                  <TopicReveal onReveal={handleTopicReveal} usedTopicIds={usedTopicIds} />
                ) : currentTopic && (
                  <div className="max-w-3xl mx-auto">
                    <div className="pixel-panel pixel-panel-neon">
                      <div className="flex justify-center gap-4 mb-4 flex-wrap">
                        <CategoryTag category={currentTopic.category} size="lg" />
                        <DifficultyStars difficulty={currentTopic.difficulty} size="lg" />
                      </div>
                      <div className="dialogue-box">
                        <p className="font-terminal text-terminal-lg md:text-terminal-xl">
                          {currentTopic.question}
                        </p>
                      </div>
                    </div>
                    <div className="text-center mt-6">
                      <motion.button
                        className="pixel-btn pixel-btn-green"
                        onClick={handleNextPhase}
                        whileTap={{ scale: 0.95 }}
                      >
                        ► START VOTING ◄
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {game.phase === 'voting' && (
              <motion.div
                key="voting-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentTopic && (
                  <div className="max-w-2xl mx-auto dialogue-box">
                    <p className="font-terminal text-terminal-base md:text-terminal-lg">
                      {currentTopic.question}
                    </p>
                  </div>
                )}

                <SyncedCountdown
                  duration={30}
                  startedAt={game.phaseStartedAt}
                  label="VOTING"
                  size="md"
                  onComplete={handleNextPhase}
                />

                <div className="flex justify-center">
                  <SkipButton onClick={handleNextPhase} label="Skip Voting" variant="skip" />
                </div>

                <VoteResults votes={game.votes} totalVoters={Object.keys(game.players).length} />

                <div className="text-center">
                  <motion.button
                    className="pixel-btn pixel-btn-pink"
                    onClick={handleNextPhase}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► REVEAL MATCHUPS ◄
                  </motion.button>
                </div>
              </motion.div>
            )}

            {game.phase === 'matchup-reveal' && (
              <motion.div
                key="matchup-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AllMatchups matches={currentRoundMatches} teams={game.teams} />
                <div className="text-center">
                  <motion.button
                    className="pixel-btn pixel-btn-green"
                    onClick={handleNextPhase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► START PREP ◄
                  </motion.button>
                </div>
              </motion.div>
            )}

            {game.phase === 'preparation' && (
              <motion.div
                key="prep-content"
                className="space-y-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  ♪ CHARGING MP ♪
                </motion.p>

                <SyncedCountdown
                  duration={90}
                  startedAt={game.phaseStartedAt}
                  label="PREPARATION"
                  size="lg"
                  onComplete={handleNextPhase}
                />

                <div className="flex justify-center">
                  <SkipButton onClick={handleNextPhase} label="Skip Prep" variant="skip" />
                </div>

                <motion.button
                  className="pixel-btn pixel-btn-red"
                  onClick={handleNextPhase}
                  whileTap={{ scale: 0.95 }}
                >
                  ► BATTLE START! ◄
                </motion.button>
              </motion.div>
            )}

            {game.phase === 'debate' && currentMatch && currentTopic && (
              <motion.div
                key="debate-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  key={debateSubPhase}
                  className="text-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p
                    className="font-pixel text-pixel-3xl md:text-pixel-4xl animate-glitch"
                    style={{
                      color: debateInfo.team === 'A' ? 'var(--team-red)'
                        : debateInfo.team === 'B' ? 'var(--team-blue)'
                        : 'var(--neon-yellow)',
                    }}
                  >
                    {debateInfo.label}
                  </p>
                </motion.div>

                <div className="flex justify-center items-center gap-4 flex-wrap">
                  <motion.div
                    className="battle-card battle-card-red"
                    animate={{
                      scale: debateInfo.team === 'A' ? 1.05 : 0.9,
                      opacity: debateInfo.team === 'A' ? 1 : 0.5,
                    }}
                  >
                    <p className="font-pixel text-pixel-sm text-team-red mb-1">◆ A ◆</p>
                    <p className="font-pixel text-pixel-base text-text-white">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </p>
                  </motion.div>

                  <div className="vs-pixel text-pixel-2xl">VS</div>

                  <motion.div
                    className="battle-card battle-card-blue"
                    animate={{
                      scale: debateInfo.team === 'B' ? 1.05 : 0.9,
                      opacity: debateInfo.team === 'B' ? 1 : 0.5,
                    }}
                  >
                    <p className="font-pixel text-pixel-sm text-team-blue mb-1">◆ B ◆</p>
                    <p className="font-pixel text-pixel-base text-text-white">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </p>
                  </motion.div>
                </div>

                {debateSubPhase !== 'done' && (
                  <SyncedCountdown
                    key={debateSubPhase}
                    duration={debateInfo.duration}
                    startedAt={game.debateSubPhaseStartedAt}
                    label={debateInfo.label}
                    size="md"
                    onComplete={handleDebateSubPhaseNext}
                  />
                )}

                <div className="flex justify-center gap-3 flex-wrap">
                  {debateSubPhase !== 'done' ? (
                    <>
                      <SkipButton onClick={handleDebateSubPhaseNext} label="Skip Speaker" variant="skip" />
                      <SkipButton onClick={handleNextPhase} label="End Debate" variant="next" />
                    </>
                  ) : (
                    <motion.button
                      className="pixel-btn pixel-btn-pink"
                      onClick={handleNextPhase}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ► AUDIENCE VOTE ◄
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {game.phase === 'audience-vote' && currentMatch && (
              <motion.div
                key="audience-vote-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-pixel text-pixel-2xl md:text-pixel-3xl text-center neon-glow-yellow">
                  ♪ CROWD CHEERS ♪
                </p>

                <SyncedCountdown
                  duration={20}
                  startedAt={game.phaseStartedAt}
                  label="CHEERING"
                  size="md"
                  onComplete={handleNextPhase}
                />

                <div className="flex justify-center">
                  <SkipButton onClick={handleNextPhase} label="Skip Cheering" variant="skip" />
                </div>

                <AudienceVoteResults
                  teamA={game.teams[currentMatch.teamA]}
                  teamB={game.teams[currentMatch.teamB]}
                  votes={currentMatch.audienceVotes}
                />

                <div className="text-center">
                  <motion.button
                    className="pixel-btn pixel-btn-green"
                    onClick={handleNextPhase}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► JUDGE TIME ◄
                  </motion.button>
                </div>
              </motion.div>
            )}

            {game.phase === 'scoring' && currentMatch && (
              <motion.div
                key="scoring-content"
                className="text-center space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  ♦ JUDGING ♦
                </motion.p>

                <div className="flex justify-center gap-4 flex-wrap">
                  {[1, 2].map((i) => {
                    const submitted = currentMatch.judgeScores.some((s) => s.judgeId === `judge${i}`)
                    return (
                      <motion.div
                        key={i}
                        className={`pixel-panel-sm pixel-panel text-center ${submitted ? 'pixel-panel-neon' : ''}`}
                        animate={{ scale: submitted ? [1, 1.05, 1] : 1 }}
                      >
                        <p className="font-pixel text-pixel-base">
                          {submitted ? '✓' : '?'}
                        </p>
                        <p className="font-pixel text-pixel-sm text-text-white mt-2">
                          JUDGE {i}
                        </p>
                        <p className="font-terminal text-terminal-sm text-text-dim">
                          {submitted ? 'Done!' : 'Waiting...'}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>

                <motion.button
                  className="pixel-btn pixel-btn-green"
                  onClick={async () => {
                    await handleCalculateResult()
                    await game.updatePhase('result')
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  ► REVEAL RESULT ◄
                </motion.button>
              </motion.div>
            )}

            {game.phase === 'result' && currentMatch && (
              <motion.div
                key="result-content"
                className="space-y-6"
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
                  <motion.button
                    className="pixel-btn pixel-btn-green"
                    onClick={handleNextMatch}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► {currentRoundMatches.findIndex((m) => m.id === game.currentMatchId) < currentRoundMatches.length - 1 ? 'NEXT BATTLE' : 'HI-SCORE'} ◄
                  </motion.button>
                </div>
              </motion.div>
            )}

            {game.phase === 'leaderboard' && (
              <motion.div
                key="leaderboard-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Leaderboard teams={Object.values(game.teams)} />
                <div className="text-center flex justify-center gap-3 flex-wrap">
                  {game.currentRound < 3 && (
                    <motion.button
                      className="pixel-btn pixel-btn-green"
                      onClick={async () => await game.updatePhase('topic-reveal')}
                      whileTap={{ scale: 0.95 }}
                    >
                      ► NEXT ROUND ◄
                    </motion.button>
                  )}
                  <motion.button
                    className="pixel-btn pixel-btn-pink"
                    onClick={() => game.updatePhase('final-awards')}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► AWARDS ◄
                  </motion.button>
                </div>
              </motion.div>
            )}

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

        {game.phase !== 'lobby' && game.phase !== 'final-awards' && Object.values(game.teams).some((t) => t.matchesPlayed > 0) && (
          <div className="fixed bottom-4 right-4 w-64 max-w-[calc(100vw-2rem)]">
            <MiniLeaderboard teams={Object.values(game.teams)} />
          </div>
        )}
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
          <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
            LOADING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    }>
      <AdminContent />
    </Suspense>
  )
}
