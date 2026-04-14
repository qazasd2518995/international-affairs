'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StageBackground,
  Logo,
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
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { findLatestSessionId } from '@/lib/supabase'
import { TOPICS } from '@/lib/types'

function DisplayContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)
  const [lookupFailed, setLookupFailed] = useState(false)
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  // Auto-discover latest session when none provided in URL
  useEffect(() => {
    if (sessionIdParam) return
    let cancelled = false
    findLatestSessionId().then((id) => {
      if (cancelled) return
      if (id) setSessionId(id)
      else setLookupFailed(true)
    })
    return () => { cancelled = true }
  }, [sessionIdParam])

  const game = useRealtimeGame(sessionId || undefined)

  // If the host starts a fresh game while we were showing the previous one's
  // final-awards, pick up the new session automatically.
  useEffect(() => {
    if (sessionIdParam) return // URL-pinned session shouldn't auto-swap
    if (game.phase !== 'final-awards') return
    if (!sessionId) return

    const checkForNewer = async () => {
      const latest = await findLatestSessionId()
      if (latest && latest !== sessionId) {
        setSessionId(latest)
      }
    }

    const interval = setInterval(checkForNewer, 5000)
    return () => clearInterval(interval)
  }, [game.phase, sessionId, sessionIdParam])

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const allMatches = [...game.matches].sort((a, b) => a.id.localeCompare(b.id))
  // In round 1 we show all 3 matchups at once. In rounds 2/3 only the current
  // matchup is shown (since it was already revealed at its round-1 pairing).
  const isFirstMatchReveal = allMatches.length > 0 && allMatches.every((m) => !m.completed)
  const currentRoundMatches = isFirstMatchReveal
    ? allMatches
    : allMatches.filter((m) => m.id === game.currentMatchId)

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
          {lookupFailed ? (
            <div className="pixel-panel pixel-panel-pink mt-8 text-center max-w-md">
              <p className="font-pixel text-pixel-base text-neon-pink mb-3">
                ※ NO ACTIVE GAME ※
              </p>
              <p className="font-terminal text-terminal-base text-text-dim">
                &gt; Ask the host to create a game first.
              </p>
            </div>
          ) : (
            <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
              FINDING GAME<span className="loading-dots"></span>
            </p>
          )}
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

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6 flex items-center justify-between border-b-2 border-panel-border">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-4">
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

        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {game.phase === 'lobby' && (
              <motion.div
                key="lobby"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="pixel-panel pixel-panel-yellow">
                  <p className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow mb-6">
                    ★ SCAN TO JOIN ★
                  </p>

                  {typeof window !== 'undefined' && (
                    <div className="flex justify-center mb-6">
                      <QRCodeDisplay
                        url={`${window.location.origin}?session=${sessionId}`}
                        size={typeof window !== 'undefined' && window.innerWidth < 640 ? 200 : 320}
                      />
                    </div>
                  )}

                  <motion.p
                    className="font-pixel text-pixel-2xl neon-glow-pink"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    {Object.keys(game.players).length} HEROES JOINED
                  </motion.p>

                  <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg mx-auto">
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
                        <p className="font-pixel text-pixel-sm">{team.name.toUpperCase()}</p>
                        <motion.p
                          key={team.members.length}
                          className="font-pixel text-pixel-xl neon-glow-green"
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                        >
                          {team.members.length}
                        </motion.p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {game.phase === 'topic-reveal' && currentTopic && (
              <motion.div
                key="topic"
                className="w-full max-w-5xl crt-on"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'linear' }}
              >
                <div className="pixel-panel pixel-panel-neon">
                  <div className="text-center mb-6">
                    <p className="font-pixel text-pixel-base text-neon-yellow">
                      ★ NEW QUEST ★
                    </p>
                  </div>

                  <motion.div
                    className="flex justify-center items-center gap-4 mb-6 flex-wrap"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CategoryTag category={currentTopic.category} size="lg" />
                    <span className="font-pixel text-neon-yellow">|</span>
                    <DifficultyStars difficulty={currentTopic.difficulty} size="lg" />
                  </motion.div>

                  <div className="dialogue-box">
                    <motion.p
                      className="font-terminal text-terminal-xl md:text-terminal-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {currentTopic.question}
                    </motion.p>
                  </div>

                  {currentTopic.difficulty === 3 && (
                    <motion.div
                      className="text-center mt-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, ease: 'linear' }}
                    >
                      <motion.div
                        className="pixel-tag pixel-tag-yellow inline-flex"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ★ BOSS LEVEL · BONUS XP ★
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

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

            {game.phase === 'preparation' && currentMatch && (() => {
              const allLive = game.liveArguments[currentMatch.id] || []
              const teamAArgs = allLive.filter((a) => a.teamId === currentMatch.teamA)
              const teamBArgs = allLive.filter((a) => a.teamId === currentMatch.teamB)
              const teamAName = game.teams[currentMatch.teamA]?.name || 'Team A'
              const teamBName = game.teams[currentMatch.teamB]?.name || 'Team B'

              return (
                <motion.div
                  key="prep"
                  className="w-full max-w-5xl space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.p
                    className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow text-center animate-glitch"
                  >
                    ♪ TEAMS WRITING ATTACKS ♪
                  </motion.p>

                  <SyncedCountdown
                    duration={90}
                    startedAt={game.phaseStartedAt}
                    label="PREP TIME"
                    size="md"
                  />

                  {/* Live feed — both teams side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="battle-card battle-card-red p-4">
                      <div className="text-center mb-3">
                        <p className="font-pixel text-pixel-sm text-team-red">◆ {teamAName.toUpperCase()} ◆</p>
                        <p className="font-pixel text-pixel-sm text-neon-green mt-1">AGREE · {teamAArgs.length} attacks</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {teamAArgs.length === 0 ? (
                          <p className="font-terminal text-terminal-base text-text-muted text-center italic">
                            &gt; Writing...
                          </p>
                        ) : (
                          <AnimatePresence initial={false}>
                            {teamAArgs.map((arg) => (
                              <motion.div
                                key={arg.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-terminal text-terminal-base"
                              >
                                <span className="text-neon-cyan">{arg.playerName || '...'}:</span>{' '}
                                <span className="text-text-white">{arg.content}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>

                    <div className="battle-card battle-card-blue p-4">
                      <div className="text-center mb-3">
                        <p className="font-pixel text-pixel-sm text-team-blue">◆ {teamBName.toUpperCase()} ◆</p>
                        <p className="font-pixel text-pixel-sm text-neon-red mt-1">DISAGREE · {teamBArgs.length} attacks</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {teamBArgs.length === 0 ? (
                          <p className="font-terminal text-terminal-base text-text-muted text-center italic">
                            &gt; Writing...
                          </p>
                        ) : (
                          <AnimatePresence initial={false}>
                            {teamBArgs.map((arg) => (
                              <motion.div
                                key={arg.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-terminal text-terminal-base"
                              >
                                <span className="text-neon-cyan">{arg.playerName || '...'}:</span>{' '}
                                <span className="text-text-white">{arg.content}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })()}

            {game.phase === 'debate' && currentMatch && (
              <motion.div
                key="debate"
                className="w-full text-center space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-pink animate-glitch"
                >
                  ♪ FREE DEBATE ♪
                </motion.p>

                <div className="flex justify-center items-center gap-6 flex-wrap">
                  <motion.div
                    className="battle-card battle-card-red p-6"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="text-center">
                      <p className="font-pixel text-pixel-sm text-team-red">◆ A ◆</p>
                      <p className="font-pixel text-pixel-xl text-text-white mt-2">
                        {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                      </p>
                      <p className="font-pixel text-pixel-sm text-neon-green mt-2">AGREE</p>
                    </div>
                  </motion.div>

                  <div className="vs-pixel text-pixel-4xl">VS</div>

                  <motion.div
                    className="battle-card battle-card-blue p-6"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
                  >
                    <div className="text-center">
                      <p className="font-pixel text-pixel-sm text-team-blue">◆ B ◆</p>
                      <p className="font-pixel text-pixel-xl text-text-white mt-2">
                        {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                      </p>
                      <p className="font-pixel text-pixel-sm text-neon-red mt-2">DISAGREE</p>
                    </div>
                  </motion.div>
                </div>

                <SyncedCountdown
                  duration={120}
                  startedAt={game.phaseStartedAt}
                  label="BATTLE TIME"
                  size="lg"
                />
              </motion.div>
            )}

            {game.phase === 'audience-vote' && currentMatch && (
              <motion.div
                key="audience-vote"
                className="w-full max-w-4xl space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-3xl md:text-pixel-4xl text-center neon-glow-yellow animate-glitch"
                >
                  ♪ CHEER! ♪
                </motion.p>

                <SyncedCountdown
                  duration={20}
                  startedAt={game.phaseStartedAt}
                  label="VOTING"
                  size="md"
                />

                <AudienceVoteResults
                  teamA={game.teams[currentMatch.teamA]}
                  teamB={game.teams[currentMatch.teamB]}
                  votes={currentMatch.audienceVotes}
                />
              </motion.div>
            )}

            {game.phase === 'scoring' && (
              <motion.div
                key="scoring"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="pixel-panel pixel-panel-yellow">
                  <motion.div
                    className="font-pixel text-[120px] md:text-[180px] neon-glow-yellow leading-none mb-6"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    ♦
                  </motion.div>
                  <p className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow animate-glitch">
                    JUDGES
                  </p>
                  <p className="font-terminal text-terminal-xl text-text-dim mt-4">
                    &gt; Calculating damage<span className="loading-dots"></span>
                  </p>
                </div>
              </motion.div>
            )}

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

            {game.phase === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Leaderboard teams={Object.values(game.teams)} />
              </motion.div>
            )}

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
          <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
            LOADING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    }>
      <DisplayContent />
    </Suspense>
  )
}
