'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StageBackground,
  Logo,
  TopicReveal,
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
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { findLatestSessionId } from '@/lib/supabase'
import { TOPICS, type Topic, type GamePhase, type Match } from '@/lib/types'

function AdminContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')

  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)
  const [usedTopicIds, setUsedTopicIds] = useState<string[]>([])
  const [gameUrl, setGameUrl] = useState<string>('')
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)
  const [latestSessionId, setLatestSessionId] = useState<string | null>(null)

  const game = useRealtimeGame(sessionId || undefined)

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  // All matches are created in round 1 and reused across rounds — currentRound
  // is now the "which match number (1/2/3) we're playing", not a DB round group.
  const allMatches = [...game.matches].sort((a, b) => a.id.localeCompare(b.id))
  // Round 1 matchup-reveal: show all three pairings at once. Round 2/3: the
  // pairings are already known, so matchup-reveal only highlights the upcoming
  // match so it feels like a "next up" announcement instead of a re-pairing.
  const isFirstMatchReveal = allMatches.length > 0 && allMatches.every((m) => !m.completed)
  const currentRoundMatches = isFirstMatchReveal
    ? allMatches
    : allMatches.filter((m) => m.id === game.currentMatchId)

  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      setGameUrl(`${window.location.origin}?session=${sessionId}`)
    }
  }, [sessionId])

  // Look up the latest session so host can resume on accidental tab close
  useEffect(() => {
    if (sessionId) return
    findLatestSessionId().then((id) => setLatestSessionId(id))
  }, [sessionId])

  useEffect(() => {
    if (game.phase !== 'lobby') {
      setShowPhaseTransition(true)
      const timer = setTimeout(() => setShowPhaseTransition(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [game.phase])

  const handleCreateSession = async () => {
    const id = await game.createSession()
    setSessionId(id)
    window.history.pushState({}, '', `/admin?session=${id}`)
  }

  const handleTopicReveal = async (topic: Topic) => {
    await game.setCurrentTopic(topic.id)
    setUsedTopicIds((prev) => [...prev, topic.id])

    // If matches exist (rounds 2/3), stamp the fresh topic onto the next
    // un-played match so it shows the right question during prep/debate.
    if (game.matches.length > 0) {
      const nextMatch = allMatches.find((m) => !m.completed && m.id !== game.currentMatchId)
        || allMatches.find((m) => !m.completed)
      if (nextMatch) {
        await game.updateMatchTopic(nextMatch.id, topic.id)
        await game.setCurrentMatch(nextMatch.id)
      }
    }
  }

  // Unified flow for all 3 matches (no per-match voting, no re-pairing):
  //   lobby → topic-reveal → matchup-reveal → prep → debate → audience-vote →
  //   scoring → result → (back to topic-reveal if more matches, else leaderboard)
  const handleNextPhase = async () => {
    const transitions: Record<string, GamePhase> = {
      'lobby': 'topic-reveal',
      'topic-reveal': 'matchup-reveal',
      'matchup-reveal': 'preparation',
      'preparation': 'debate',
      'debate': 'audience-vote',
      'audience-vote': 'scoring',
      'scoring': 'result',
      'result': 'leaderboard',
      'leaderboard': 'final-awards',
    }

    const nextPhase = transitions[game.phase]
    if (!nextPhase) return

    // Lock in the 3 matchups on first transition out of lobby — no class vote,
    // just random pairing with random stance assignment so both sides feel fair.
    if (game.phase === 'lobby' && game.matches.length === 0) {
      await autoCreateMatches()
    }

    await game.updatePhase(nextPhase)
  }

  // Auto-pair all 6 groups into 3 matches. Randomize team order and which side
  // defends "agree" vs "disagree" so no one can argue the assignment was biased.
  const autoCreateMatches = async () => {
    if (game.matches.length > 0) return
    const teamIds = Object.values(game.teams).map((t) => t.id)
    if (teamIds.length < 2) return

    // Fisher-Yates shuffle
    const shuffled = [...teamIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const now = Date.now()
    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      const firstTeam = shuffled[i * 2]
      const secondTeam = shuffled[i * 2 + 1]
      // Flip a coin for who gets "agree"
      const firstIsAgree = Math.random() < 0.5
      const teamAId = firstIsAgree ? firstTeam : secondTeam
      const teamBId = firstIsAgree ? secondTeam : firstTeam

      const matchNum = String(i + 1).padStart(2, '0')
      const match: Omit<Match, 'judgeScores' | 'audienceVotes'> = {
        id: `match-${matchNum}-${now}`,
        round: 1,
        topicId: '', // stamped on by handleTopicReveal when each match begins
        teamA: teamAId,
        teamB: teamBId,
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
    const matchIndex = allMatches.findIndex((m) => m.id === game.currentMatchId)
    if (matchIndex < allMatches.length - 1) {
      // Go draw a fresh topic for the next match — admin then sets it via handleTopicReveal
      await game.updatePhase('topic-reveal')
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
    const handleResume = () => {
      if (!latestSessionId) return
      setSessionId(latestSessionId)
      window.history.pushState({}, '', `/admin?session=${latestSessionId}`)
    }

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

              <div className="flex flex-col gap-3 items-center">
                <motion.button
                  className="pixel-btn pixel-btn-green"
                  onClick={handleCreateSession}
                  whileTap={{ scale: 0.95 }}
                >
                  ► START NEW GAME ◄
                </motion.button>

                {latestSessionId && (
                  <motion.button
                    className="pixel-btn pixel-btn-ghost"
                    onClick={handleResume}
                    whileTap={{ scale: 0.95 }}
                  >
                    » RESUME LAST GAME
                  </motion.button>
                )}
              </div>
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

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      {showPhaseTransition && <PhaseTransition phase={game.phase} round={Math.max(1, allMatches.findIndex((m) => m.id === game.currentMatchId) + 1)} />}

      <div className="relative z-10 min-h-screen">
        <header className="p-4 flex items-center justify-between border-b-2 border-panel-border">
          <div className="font-pixel text-pixel-base neon-glow-yellow">
            ♚ HOST MODE
          </div>
          <div className="flex items-center gap-3">
            <span className="pixel-tag pixel-tag-cyan">
              MATCH {Math.max(1, allMatches.findIndex((m) => m.id === game.currentMatchId) + 1)}/3
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

            {game.phase === 'preparation' && currentMatch && (() => {
              const teamASubmitted = currentMatch.teamAArguments.length > 0
              const teamBSubmitted = currentMatch.teamBArguments.length > 0
              const bothSubmitted = teamASubmitted && teamBSubmitted
              const teamAName = game.teams[currentMatch.teamA]?.name || 'Team A'
              const teamBName = game.teams[currentMatch.teamB]?.name || 'Team B'

              const handleForceSkip = () => {
                if (!bothSubmitted) {
                  const missing = [
                    !teamASubmitted && teamAName,
                    !teamBSubmitted && teamBName,
                  ].filter(Boolean).join(' and ')
                  const ok = window.confirm(
                    `${missing} hasn't submitted arguments yet.\n\n` +
                    `If you skip now, AI judges won't have commentary for them.\n\n` +
                    `Skip anyway?`
                  )
                  if (!ok) return
                }
                handleNextPhase()
              }

              return (
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
                    onComplete={bothSubmitted ? handleNextPhase : undefined}
                  />

                  {/* Submission status */}
                  <div className="flex justify-center gap-4 flex-wrap">
                    <motion.div
                      className={`pixel-panel-sm pixel-panel ${teamASubmitted ? 'pixel-panel-neon' : ''}`}
                      animate={{ scale: teamASubmitted ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="font-pixel text-pixel-sm text-team-red">
                        {teamASubmitted ? '✓' : '...'} {teamAName.toUpperCase()}
                      </p>
                      <p className="font-terminal text-terminal-sm text-text-dim mt-1">
                        {teamASubmitted ? 'Ready!' : 'Writing attacks...'}
                      </p>
                    </motion.div>
                    <motion.div
                      className={`pixel-panel-sm pixel-panel ${teamBSubmitted ? 'pixel-panel-neon' : ''}`}
                      animate={{ scale: teamBSubmitted ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="font-pixel text-pixel-sm text-team-blue">
                        {teamBSubmitted ? '✓' : '...'} {teamBName.toUpperCase()}
                      </p>
                      <p className="font-terminal text-terminal-sm text-text-dim mt-1">
                        {teamBSubmitted ? 'Ready!' : 'Writing attacks...'}
                      </p>
                    </motion.div>
                  </div>

                  {!bothSubmitted && (
                    <p className="font-terminal text-terminal-base text-neon-pink">
                      &gt; Waiting for both teams to submit before starting debate.
                    </p>
                  )}

                  <div className="flex justify-center gap-3 flex-wrap">
                    <SkipButton onClick={handleForceSkip} label={bothSubmitted ? 'Skip Prep' : 'Force Skip'} variant="skip" />
                    {bothSubmitted && (
                      <motion.button
                        className="pixel-btn pixel-btn-red"
                        onClick={handleNextPhase}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ► BATTLE START! ◄
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })()}

            {game.phase === 'debate' && currentMatch && currentTopic && (
              <motion.div
                key="debate-content"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-pink text-center animate-glitch"
                >
                  ♪ FREE DEBATE ♪
                </motion.p>

                <div className="flex justify-center items-center gap-4 flex-wrap">
                  <motion.div
                    className="battle-card battle-card-red"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <p className="font-pixel text-pixel-sm text-team-red mb-1">◆ A ◆</p>
                    <p className="font-pixel text-pixel-base text-text-white">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </p>
                    <p className="font-pixel text-pixel-sm text-neon-green mt-1">AGREE</p>
                  </motion.div>

                  <div className="vs-pixel text-pixel-2xl">VS</div>

                  <motion.div
                    className="battle-card battle-card-blue"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
                  >
                    <p className="font-pixel text-pixel-sm text-team-blue mb-1">◆ B ◆</p>
                    <p className="font-pixel text-pixel-base text-text-white">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </p>
                    <p className="font-pixel text-pixel-sm text-neon-red mt-1">DISAGREE</p>
                  </motion.div>
                </div>

                <SyncedCountdown
                  duration={120}
                  startedAt={game.phaseStartedAt}
                  label="BATTLE TIME"
                  size="lg"
                  onComplete={handleNextPhase}
                />

                <div className="flex justify-center gap-3 flex-wrap">
                  <SkipButton onClick={handleNextPhase} label="End Debate" variant="next" />
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
                    ► {allMatches.findIndex((m) => m.id === game.currentMatchId) < allMatches.length - 1 ? 'NEXT MATCH' : 'HI-SCORE'} ◄
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
                <div className="text-center">
                  <motion.button
                    className="pixel-btn pixel-btn-pink"
                    onClick={() => game.updatePhase('final-awards')}
                    whileTap={{ scale: 0.95 }}
                  >
                    ► CROWN CHAMPION ◄
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
