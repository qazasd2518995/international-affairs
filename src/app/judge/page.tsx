'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { findLatestSessionId } from '@/lib/supabase'
import { TOPICS, type JudgeScore } from '@/lib/types'

function JudgeContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')

  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)
  const [lookupFailed, setLookupFailed] = useState(false)
  const [judgeId, setJudgeId] = useState<'judge1' | 'judge2' | null>(null)
  const [submittedScore, setSubmittedScore] = useState<JudgeScore | null>(null)
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
    if (sessionIdParam) return
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

  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const allMatches = [...game.matches].sort((a, b) => a.id.localeCompare(b.id))
  const isFirstMatchReveal = allMatches.length > 0 && allMatches.every((m) => !m.completed)
  const currentRoundMatches = isFirstMatchReveal
    ? allMatches
    : allMatches.filter((m) => m.id === game.currentMatchId)

  const hasScored = currentMatch?.judgeScores.some((s) => s.judgeId === judgeId)

  useEffect(() => {
    setSubmittedScore(null)
  }, [game.currentMatchId])

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
      finalScoreA: judgeScoreA * 0.7 + ((votesForA / totalAudienceVotes) * 10) * 0.3,
      finalScoreB: judgeScoreB * 0.7 + ((votesForB / totalAudienceVotes) * 10) * 0.3,
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />
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
          <Logo size="md" />
          <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
            LOADING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    )
  }

  if (!judgeId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="md" />

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pixel-panel pixel-panel-yellow">
              <p className="font-pixel text-pixel-lg neon-glow-yellow text-center mb-6">
                ★ SELECT JUDGE ★
              </p>

              <div className="flex gap-3">
                <motion.button
                  className="pokemon-option flex-1"
                  onClick={() => setJudgeId('judge1')}
                  whileTap={{ scale: 0.95 }}
                >
                  JUDGE 1
                </motion.button>

                <motion.button
                  className="pokemon-option flex-1"
                  onClick={() => setJudgeId('judge2')}
                  whileTap={{ scale: 0.95 }}
                >
                  JUDGE 2
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      {showPhaseTransition && <PhaseTransition phase={game.phase} round={Math.max(1, allMatches.findIndex((m) => m.id === game.currentMatchId) + 1)} />}

      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <header className="flex items-center justify-between mb-6 border-b-2 border-panel-border pb-4">
          <div className="font-pixel text-pixel-base neon-glow-yellow">
            ♦ {judgeId === 'judge1' ? 'JUDGE 1' : 'JUDGE 2'}
          </div>
          <motion.span
            key={game.phase}
            className="pixel-tag pixel-tag-cyan"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {game.phase.replace(/-/g, ' ')}
          </motion.span>
        </header>

        <AnimatePresence mode="wait">
          {game.phase === 'lobby' && (
            <motion.div
              key="lobby"
              className="max-w-md mx-auto pixel-panel text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-base text-neon-yellow mb-3">
                ♦ STANDBY ♦
              </p>
              <p className="font-terminal text-terminal-base text-text-dim">
                &gt; {Object.keys(game.players).length} heroes joined<br/>
                &gt; Waiting for battle...
              </p>
            </motion.div>
          )}

          {game.phase === 'topic-reveal' && (
            currentTopic ? (
              <motion.div
                key="topic"
                className="max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="pixel-panel pixel-panel-neon text-center">
                  <p className="font-pixel text-pixel-base text-neon-green mb-4">
                    ★ NEW QUEST ★
                  </p>
                  <div className="flex justify-center gap-3 mb-4 flex-wrap">
                    <CategoryTag category={currentTopic.category} />
                    <DifficultyStars difficulty={currentTopic.difficulty} />
                  </div>
                  <div className="dialogue-box">
                    <p className="font-terminal text-terminal-base md:text-terminal-lg">
                      {currentTopic.question}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="topic-drawing"
                className="max-w-md mx-auto pixel-panel text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="font-pixel text-pixel-4xl neon-glow-yellow mb-3"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  ?
                </motion.div>
                <p className="font-pixel text-pixel-base text-neon-yellow mb-2">
                  HOST IS DRAWING
                </p>
                <p className="font-terminal text-terminal-base text-text-dim">
                  &gt; Watch the big screen!
                </p>
              </motion.div>
            )
          )}

          {game.phase === 'matchup-reveal' && (() => {
            const isUpcomingOnly = currentRoundMatches.length === 1 && allMatches.length > 1
            const headerLabel = isUpcomingOnly ? 'NEXT BATTLE' : 'MATCHUPS'

            return (
              <motion.div
                key="matchup"
                className="max-w-2xl mx-auto space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-pixel text-pixel-xl text-center neon-glow-pink">
                  × {headerLabel} ×
                </p>
                {currentRoundMatches.map((match, idx) => {
                  const realNum = allMatches.findIndex((m) => m.id === match.id) + 1
                  return (
                    <motion.div
                      key={match.id}
                      className="pixel-panel-sm pixel-panel"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2, ease: 'linear' }}
                    >
                      <p className="font-pixel text-pixel-sm text-neon-yellow text-center mb-2">
                        {isUpcomingOnly ? '★ NOW PLAYING ★' : `★ STAGE ${realNum} ★`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-pixel-base text-team-red">
                          {game.teams[match.teamA]?.name.toUpperCase()}
                        </span>
                        <span className="vs-pixel text-pixel-lg">VS</span>
                        <span className="font-pixel text-pixel-base text-team-blue">
                          {game.teams[match.teamB]?.name.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )
          })()}

          {game.phase === 'preparation' && currentMatch && currentTopic && (() => {
            const allLive = game.liveArguments[currentMatch.id] || []
            const teamAArgs = allLive.filter((a) => a.teamId === currentMatch.teamA)
            const teamBArgs = allLive.filter((a) => a.teamId === currentMatch.teamB)
            const teamAName = game.teams[currentMatch.teamA]?.name || 'Team A'
            const teamBName = game.teams[currentMatch.teamB]?.name || 'Team B'

            return (
              <motion.div
                key="prep"
                className="max-w-3xl mx-auto space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-pixel text-pixel-xl text-center neon-glow-yellow">
                  ♪ PREP TIME ♪
                </p>

                <div className="dialogue-box">
                  <p className="font-terminal text-terminal-base">
                    {currentTopic.question}
                  </p>
                </div>

                <SyncedCountdown
                  duration={90}
                  startedAt={game.phaseStartedAt}
                  label="PREP"
                  size="sm"
                />

                {/* Live attack feed so judges can start forming opinions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="pixel-panel-sm pixel-panel">
                    <p className="font-pixel text-pixel-sm text-team-red mb-2">
                      ◆ {teamAName.toUpperCase()} · {teamAArgs.length}
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {teamAArgs.length === 0 ? (
                        <p className="font-terminal text-terminal-sm text-text-muted italic">
                          &gt; Writing...
                        </p>
                      ) : teamAArgs.map((arg) => (
                        <p key={arg.id} className="font-terminal text-terminal-sm">
                          <span className="text-neon-cyan">{arg.playerName || '...'}:</span>{' '}
                          <span className="text-text-white">{arg.content}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="pixel-panel-sm pixel-panel">
                    <p className="font-pixel text-pixel-sm text-team-blue mb-2">
                      ◆ {teamBName.toUpperCase()} · {teamBArgs.length}
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {teamBArgs.length === 0 ? (
                        <p className="font-terminal text-terminal-sm text-text-muted italic">
                          &gt; Writing...
                        </p>
                      ) : teamBArgs.map((arg) => (
                        <p key={arg.id} className="font-terminal text-terminal-sm">
                          <span className="text-neon-cyan">{arg.playerName || '...'}:</span>{' '}
                          <span className="text-text-white">{arg.content}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-center font-terminal text-terminal-base text-text-dim">
                  &gt; AI will analyze both teams when prep ends. Get ready to score!
                </p>
              </motion.div>
            )
          })()}

          {game.phase === 'debate' && currentMatch && currentTopic && (
            <motion.div
              key="debate"
              className="max-w-3xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-xl text-center neon-glow-pink">
                ♪ FREE DEBATE ♪
              </p>

              <SyncedCountdown
                duration={120}
                startedAt={game.phaseStartedAt}
                label="BATTLE TIME"
                size="sm"
              />

              {/* Show the prepared attacks so judges can reference them while listening */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="pixel-panel-sm pixel-panel">
                  <p className="font-pixel text-pixel-sm text-team-red mb-2">
                    ◆ {game.teams[currentMatch.teamA]?.name.toUpperCase()} · AGREE
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {currentMatch.teamAArguments.length === 0 ? (
                      <p className="font-terminal text-terminal-sm text-text-muted italic">
                        &gt; No prepared attacks
                      </p>
                    ) : currentMatch.teamAArguments.map((arg, i) => (
                      <p key={i} className="font-terminal text-terminal-sm text-text-white">
                        &gt; {arg}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="pixel-panel-sm pixel-panel">
                  <p className="font-pixel text-pixel-sm text-team-blue mb-2">
                    ◆ {game.teams[currentMatch.teamB]?.name.toUpperCase()} · DISAGREE
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {currentMatch.teamBArguments.length === 0 ? (
                      <p className="font-terminal text-terminal-sm text-text-muted italic">
                        &gt; No prepared attacks
                      </p>
                    ) : currentMatch.teamBArguments.map((arg, i) => (
                      <p key={i} className="font-terminal text-terminal-sm text-text-white">
                        &gt; {arg}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-center font-terminal text-terminal-base text-text-dim">
                &gt; Listen carefully — scoring soon!
              </p>
            </motion.div>
          )}

          {game.phase === 'audience-vote' && currentMatch && (
            <motion.div
              key="audience-vote"
              className="max-w-2xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-xl text-center neon-glow-yellow">
                ♪ CHEERING ♪
              </p>

              <p className="text-center font-pixel text-pixel-base text-neon-cyan">
                {currentMatch.audienceVotes.length} CHEERS CAST
              </p>

              <SyncedCountdown
                duration={20}
                startedAt={game.phaseStartedAt}
                label="CHEER"
                size="sm"
              />

              <p className="text-center font-terminal text-terminal-base text-text-dim">
                &gt; Prepare your judgment...
              </p>
            </motion.div>
          )}

          {game.phase === 'scoring' && currentMatch && (
            <motion.div
              key="scoring"
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentTopic && (
                <div className="dialogue-box mb-4">
                  <p className="font-terminal text-terminal-base">
                    {currentTopic.question}
                  </p>
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
                  className="pixel-panel pixel-panel-neon text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="font-pixel text-pixel-lg neon-glow-green mb-6">
                    ★ JUDGED ★
                  </p>

                  {submittedScore && (
                    <div className="grid grid-cols-2 gap-3">
                      <JudgeCard
                        teamName={game.teams[currentMatch.teamA]?.name || ''}
                        score={submittedScore.teamAScore}
                        color="var(--team-red)"
                      />
                      <JudgeCard
                        teamName={game.teams[currentMatch.teamB]?.name || ''}
                        score={submittedScore.teamBScore}
                        color="var(--team-blue)"
                      />
                    </div>
                  )}

                  <p className="font-terminal text-terminal-base text-text-dim mt-4">
                    &gt; Waiting for reveal...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {game.phase === 'result' && currentMatch && (() => {
            const scores = getMatchScores()
            if (!scores) return null
            const winner = scores.finalScoreA > scores.finalScoreB ? game.teams[currentMatch.teamA] : game.teams[currentMatch.teamB]
            const winnerIsA = scores.finalScoreA > scores.finalScoreB

            return (
              <motion.div
                key="result"
                className="max-w-2xl mx-auto space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="pixel-panel pixel-panel-yellow text-center">
                  <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">
                    ★ STAGE {currentMatch.round} CLEAR ★
                  </p>
                  <p className="font-pixel text-pixel-lg text-text-white mb-1">
                    WINNER:
                  </p>
                  <p
                    className="font-pixel text-pixel-2xl md:text-pixel-3xl"
                    style={{
                      color: winnerIsA ? 'var(--team-red)' : 'var(--team-blue)',
                      textShadow: `0 0 20px currentColor, 4px 4px 0 var(--arcade-void)`,
                    }}
                  >
                    {winner?.name.toUpperCase()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="battle-card battle-card-red">
                    <p className="font-pixel text-pixel-sm text-team-red">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </p>
                    <p className="font-pixel text-pixel-3xl neon-glow-yellow mt-2">
                      {scores.finalScoreA.toFixed(1)}
                    </p>
                  </div>
                  <div className="battle-card battle-card-blue">
                    <p className="font-pixel text-pixel-sm text-team-blue">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </p>
                    <p className="font-pixel text-pixel-3xl neon-glow-yellow mt-2">
                      {scores.finalScoreB.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* AI commentary recap — only show the lens THIS judge used */}
                {(() => {
                  const analysisA = judgeId === 'judge1' ? currentMatch.aiAnalysisA : currentMatch.aiAnalysisAJudge2
                  const analysisB = judgeId === 'judge1' ? currentMatch.aiAnalysisB : currentMatch.aiAnalysisBJudge2
                  const lensLabel = judgeId === 'judge1' ? 'LOGIC LENS' : 'DELIVERY LENS'
                  if (!analysisA && !analysisB) return null
                  return (
                    <div className="pixel-panel-sm pixel-panel">
                      <p className="font-pixel text-pixel-sm text-neon-cyan mb-2">
                        ► AI RECAP · {lensLabel}
                      </p>
                      {analysisA && (
                        <div className="mb-3">
                          <p className="font-pixel text-pixel-sm text-team-red mb-1">
                            {game.teams[currentMatch.teamA]?.name} ({analysisA.score}/10)
                          </p>
                          <p className="font-terminal text-terminal-sm text-text-dim">
                            &gt; {analysisA.commentary}
                          </p>
                        </div>
                      )}
                      {analysisB && (
                        <div>
                          <p className="font-pixel text-pixel-sm text-team-blue mb-1">
                            {game.teams[currentMatch.teamB]?.name} ({analysisB.score}/10)
                          </p>
                          <p className="font-terminal text-terminal-sm text-text-dim">
                            &gt; {analysisB.commentary}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </motion.div>
            )
          })()}

          {game.phase === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              className="max-w-2xl mx-auto space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-2xl text-center neon-glow-yellow">
                ▲ HI-SCORE ▲
              </p>
              {[...Object.values(game.teams)]
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((team, idx) => (
                  <motion.div
                    key={team.id}
                    className="pixel-panel-sm pixel-panel flex items-center justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, ease: 'linear' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-pixel-lg neon-glow-yellow">
                        #{idx + 1}
                      </span>
                      <span className="font-pixel text-pixel-sm text-text-white">
                        {team.name.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-pixel text-pixel-xl neon-glow-yellow">
                      {team.totalScore.toFixed(1)}
                    </span>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {game.phase === 'final-awards' && (
            <motion.div
              key="awards"
              className="max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="pixel-panel pixel-panel-yellow text-center">
                <motion.div
                  className="font-pixel text-[80px] neon-glow-yellow leading-none mb-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ♛
                </motion.div>
                <p className="font-pixel text-pixel-xl neon-glow-yellow mb-4">
                  CROWNING CHAMPION
                </p>
                <p className="font-terminal text-terminal-base text-text-dim">
                  &gt; Watch the big screen!
                </p>
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
          <p className="font-pixel text-pixel-base text-neon-cyan mt-8">
            LOADING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    }>
      <JudgeContent />
    </Suspense>
  )
}
