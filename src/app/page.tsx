'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { StageBackground, Logo, LoginForm, AudienceVoting, ArgumentInput, SyncedCountdown } from '@/components'
import { useRealtimeGame } from '@/lib/useRealtimeGame'
import { findLatestSessionId } from '@/lib/supabase'
import { TOPICS } from '@/lib/types'

function HomeContent() {
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get('session')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerTeamId, setPlayerTeamId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam)

  const game = useRealtimeGame(sessionId || undefined)

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null

  const isCompeting = currentMatch && playerTeamId && (currentMatch.teamA === playerTeamId || currentMatch.teamB === playerTeamId)
  const playerStance = currentMatch && playerTeamId === currentMatch.teamA ? 'agree' : 'disagree'

  const handleLogin = async (name: string, teamId: string) => {
    if (!sessionId) return
    try {
      // LoginForm sends "team-N" (1..6). Teams table uses session-prefixed IDs
      // to avoid cross-session PK collisions, so expand to full team ID here.
      const fullTeamId = `${sessionId}:${teamId}`
      const id = await game.joinSession(sessionId, name, fullTeamId)
      setPlayerId(id)
      setPlayerTeamId(fullTeamId)
      setIsLoggedIn(true)
      localStorage.setItem('mda_player_id', id)
      localStorage.setItem('mda_team_id', fullTeamId)
      localStorage.setItem('mda_session_id', sessionId)
    } catch (err) {
      console.error('Failed to join:', err)
    }
  }

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('mda_player_id')
    const storedTeamId = localStorage.getItem('mda_team_id')
    const storedSessionId = localStorage.getItem('mda_session_id')

    // URL session takes precedence: if student scanned a QR for a different
    // game than the one they last joined, honor the QR (new game), not the
    // stale localStorage entry.
    if (sessionIdParam && storedSessionId && sessionIdParam !== storedSessionId) {
      localStorage.removeItem('mda_player_id')
      localStorage.removeItem('mda_team_id')
      localStorage.removeItem('mda_session_id')
      return
    }

    if (storedPlayerId && storedTeamId && storedSessionId) {
      setPlayerId(storedPlayerId)
      setPlayerTeamId(storedTeamId)
      setSessionId(storedSessionId)
      setIsLoggedIn(true)
    }
  }, [sessionIdParam])

  // If the host starts a NEW game while students still have the old session
  // cached in localStorage, we'd be stuck showing "ENDING / Awards" forever.
  // Poll for a newer session and, if one exists, drop the old identity so the
  // student lands back on the LoginForm for the fresh game.
  useEffect(() => {
    if (game.phase !== 'final-awards') return
    if (!sessionId) return

    const checkForNewerSession = async () => {
      const latest = await findLatestSessionId()
      if (latest && latest !== sessionId) {
        localStorage.removeItem('mda_player_id')
        localStorage.removeItem('mda_team_id')
        localStorage.removeItem('mda_session_id')
        window.location.href = `/?session=${latest}`
      }
    }

    checkForNewerSession()
    const interval = setInterval(checkForNewerSession, 5000)
    return () => clearInterval(interval)
  }, [game.phase, sessionId])

  const handleAudienceVote = (votedFor: string) => {
    if (!playerId || !currentMatch) return
    game.submitAudienceVote(currentMatch.id, playerId, votedFor)
  }

  const handleAddLiveArgument = (content: string) => {
    if (!currentMatch || !playerTeamId || !playerId) return
    game.addLiveArgument(currentMatch.id, playerId, playerTeamId, content)
  }

  // No session - landing
  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
          <motion.div
            className="mt-12 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pixel-panel pixel-panel-pink">
              <p className="font-pixel text-pixel-base text-neon-pink text-center mb-3">
                ※ NO GAME FOUND ※
              </p>
              <div className="dialogue-box">
                <p className="font-terminal text-terminal-base">
                  &gt; Scan the QR code from your host to start the adventure!
                </p>
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
            CONNECTING<span className="loading-dots"></span>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 pb-24">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'linear' }}
        >
          <Logo size="sm" />
        </motion.div>

        {!isLoggedIn ? (
          <LoginForm teamCount={6} onLogin={handleLogin} />
        ) : (
          <div className="w-full max-w-md">
            {/* Lobby */}
            {game.phase === 'lobby' && (
              <motion.div
                className="pixel-panel pixel-panel-neon text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="font-pixel text-pixel-lg neon-glow-green mb-4">
                  ★ JOINED ★
                </p>
                <div className="dialogue-box mb-4">
                  <p className="font-terminal text-terminal-base">
                    &gt; Welcome, warrior!<br/>
                    &gt; Your party: {game.teams[playerTeamId!]?.name}
                  </p>
                </div>
                <p className="font-pixel text-pixel-sm text-neon-cyan">
                  WAITING FOR HOST<span className="loading-dots"></span>
                </p>
              </motion.div>
            )}

            {/* Topic reveal — show the topic if drawn, else show drawing animation */}
            {game.phase === 'topic-reveal' && (
              currentTopic ? (
                <motion.div
                  className="pixel-panel pixel-panel-neon"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="font-pixel text-pixel-base text-neon-green text-center mb-3">
                    ★ NEW QUEST ★
                  </p>
                  <div className="dialogue-box">
                    <p className="font-terminal text-terminal-base">
                      {currentTopic.question}
                    </p>
                  </div>
                  {currentTopic.difficulty === 3 && (
                    <p className="font-pixel text-pixel-sm text-neon-yellow text-center mt-3">
                      ★ BOSS LEVEL ★
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  className="pixel-panel pixel-panel-yellow text-center"
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
                  <p className="font-pixel text-pixel-base text-neon-yellow mb-3">
                    DRAWING QUEST
                  </p>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    &gt; Watch the big screen!
                  </p>
                </motion.div>
              )
            )}

            {/* Matchup reveal — show this student's match (or "not your turn" message) */}
            {game.phase === 'matchup-reveal' && (
              isCompeting && currentMatch ? (
                <motion.div
                  className={`pixel-panel ${playerStance === 'agree' ? 'pixel-panel-neon' : 'pixel-panel-pink'} text-center`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="font-pixel text-pixel-base neon-glow-yellow mb-3">
                    ★ YOU&apos;RE UP! ★
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                    <span className="pixel-tag pixel-tag-red">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </span>
                    <span className="font-pixel text-pixel-sm text-neon-yellow">VS</span>
                    <span className="pixel-tag pixel-tag-blue">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-pixel text-pixel-base mb-2" style={{ color: playerStance === 'agree' ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                    YOUR STANCE: {playerStance === 'agree' ? 'AGREE' : 'DISAGREE'}
                  </p>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    &gt; Get ready to write attacks!
                  </p>
                </motion.div>
              ) : currentMatch ? (
                <motion.div
                  className="pixel-panel pixel-panel-pink text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="font-pixel text-pixel-base neon-glow-pink mb-3">
                    × NEXT MATCH ×
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                    <span className="pixel-tag pixel-tag-red">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </span>
                    <span className="font-pixel text-pixel-sm text-neon-yellow">VS</span>
                    <span className="pixel-tag pixel-tag-blue">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    &gt; You&apos;ll get to vote and cheer later!
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="pixel-panel pixel-panel-pink text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="font-pixel text-pixel-4xl neon-glow-pink mb-3"
                    animate={{ x: [-4, 4, -4] }}
                    transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
                  >
                    ×
                  </motion.div>
                  <p className="font-pixel text-pixel-base neon-glow-pink">
                    MATCHUPS!
                  </p>
                </motion.div>
              )
            )}

            {/* Preparation */}
            {game.phase === 'preparation' && currentTopic && (
              <div className="space-y-3">
                <SyncedCountdown
                  duration={90}
                  startedAt={game.phaseStartedAt}
                  label="PREP TIME"
                  size="sm"
                />
                {isCompeting && currentMatch ? (
                  <ArgumentInput
                    topic={currentTopic}
                    stance={playerStance as 'agree' | 'disagree'}
                    teamName={game.teams[playerTeamId!]?.name || ''}
                    playerId={playerId!}
                    teamId={playerTeamId!}
                    matchId={currentMatch.id}
                    liveArguments={(game.liveArguments[currentMatch.id] || []).filter((a) => a.teamId === playerTeamId)}
                    onSubmit={handleAddLiveArgument}
                  />
                ) : (
                  <motion.div
                    className="pixel-panel text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="font-pixel text-pixel-base text-neon-yellow mb-3">
                      ♪ CHARGING MP ♪
                    </p>
                    <div className="dialogue-box">
                      <p className="font-terminal text-terminal-base">
                        &gt; {currentTopic.question}
                      </p>
                    </div>
                    <p className="font-terminal text-terminal-base text-text-dim mt-3">
                      &gt; Teams are preparing moves...
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Debate */}
            {game.phase === 'debate' && currentMatch && (
              <div className="space-y-3">
                <motion.div
                  className="pixel-panel pixel-panel-pink text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="font-pixel text-pixel-lg neon-glow-pink mb-3">
                    ♪ FREE DEBATE ♪
                  </p>
                  <div className="flex justify-center items-center gap-2 flex-wrap">
                    <div className="pixel-tag pixel-tag-red">
                      {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                    </div>
                    <span className="font-pixel text-pixel-sm text-neon-yellow">VS</span>
                    <div className="pixel-tag pixel-tag-blue">
                      {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                    </div>
                  </div>
                </motion.div>

                <SyncedCountdown
                  duration={120}
                  startedAt={game.phaseStartedAt}
                  label="BATTLE TIME"
                  size="sm"
                />
              </div>
            )}

            {/* Audience vote */}
            {game.phase === 'audience-vote' && currentMatch && (
              <div className="space-y-3">
                <SyncedCountdown
                  duration={20}
                  startedAt={game.phaseStartedAt}
                  label="CHEER!"
                  size="sm"
                />
                <AudienceVoting
                  teamA={game.teams[currentMatch.teamA]}
                  teamB={game.teams[currentMatch.teamB]}
                  playerId={playerId!}
                  playerTeamId={playerTeamId!}
                  onVote={handleAudienceVote}
                  currentVote={game.audienceVotes[currentMatch.id]?.find((v) => v.playerId === playerId)?.votedFor}
                />
              </div>
            )}

            {/* Scoring */}
            {game.phase === 'scoring' && (
              <motion.div
                className="pixel-panel pixel-panel-yellow text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="font-pixel text-pixel-4xl neon-glow-yellow mb-3"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ♦
                </motion.div>
                <p className="font-pixel text-pixel-base neon-glow-yellow mb-2">
                  JUDGES DELIBERATING
                </p>
                <p className="font-terminal text-terminal-base text-text-dim">
                  &gt; Calculating damage<span className="loading-dots"></span>
                </p>
              </motion.div>
            )}

            {/* Result — show win/lose for competing teams, neutral for others */}
            {game.phase === 'result' && currentMatch && (() => {
              const isWinner = isCompeting && currentMatch.winner === playerTeamId
              const isLoser = isCompeting && currentMatch.winner && currentMatch.winner !== playerTeamId

              if (isWinner) {
                return (
                  <motion.div
                    className="pixel-panel pixel-panel-yellow text-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="font-pixel text-[80px] neon-glow-yellow leading-none mb-3"
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ♛
                    </motion.div>
                    <p className="font-pixel text-pixel-2xl neon-glow-yellow mb-2">
                      VICTORY!
                    </p>
                    <p className="font-terminal text-terminal-base text-text-white">
                      &gt; Your team won this match!
                    </p>
                  </motion.div>
                )
              }

              if (isLoser) {
                return (
                  <motion.div
                    className="pixel-panel pixel-panel-pink text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="font-pixel text-[60px] neon-glow-pink leading-none mb-3">×</p>
                    <p className="font-pixel text-pixel-2xl neon-glow-pink mb-2">
                      DEFEATED
                    </p>
                    <p className="font-terminal text-terminal-base text-text-dim">
                      &gt; Good fight! Watch the big screen for scores.
                    </p>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  className="pixel-panel pixel-panel-yellow text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="font-pixel text-pixel-4xl neon-glow-yellow mb-3"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  >
                    ♛
                  </motion.div>
                  <p className="font-pixel text-pixel-lg neon-glow-yellow mb-2">
                    RESULT!
                  </p>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    &gt; Watch the big screen!
                  </p>
                </motion.div>
              )
            })()}

            {/* Leaderboard — show student's team rank */}
            {game.phase === 'leaderboard' && (() => {
              const sorted = [...Object.values(game.teams)].sort((a, b) => b.totalScore - a.totalScore)
              const myRank = playerTeamId ? sorted.findIndex((t) => t.id === playerTeamId) + 1 : 0
              const myTeam = playerTeamId ? game.teams[playerTeamId] : null

              return (
                <motion.div
                  className="pixel-panel pixel-panel-yellow text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="font-pixel text-pixel-base neon-glow-yellow mb-3">
                    ▲ HI-SCORE ▲
                  </p>
                  {myTeam && myRank > 0 && (
                    <>
                      <p className="font-pixel text-pixel-3xl neon-glow-yellow mb-2">
                        #{myRank}
                      </p>
                      <p className="font-terminal text-terminal-base text-text-white">
                        {myTeam.name.toUpperCase()} · {myTeam.totalScore.toFixed(1)} XP
                      </p>
                    </>
                  )}
                  <p className="font-terminal text-terminal-base text-text-dim mt-3">
                    &gt; Watch the big screen for full ranks!
                  </p>
                </motion.div>
              )
            })()}

            {/* Final awards — celebrate or commiserate */}
            {game.phase === 'final-awards' && (() => {
              const sorted = [...Object.values(game.teams)].sort((a, b) => b.totalScore - a.totalScore)
              const champion = sorted[0]
              const isChampion = playerTeamId && champion?.id === playerTeamId

              if (isChampion) {
                return (
                  <motion.div
                    className="pixel-panel pixel-panel-yellow text-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="font-pixel text-[100px] neon-glow-yellow leading-none mb-3"
                      animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ♛
                    </motion.div>
                    <p className="font-pixel text-pixel-2xl neon-glow-yellow mb-2">
                      CHAMPIONS!
                    </p>
                    <p className="font-terminal text-terminal-base text-text-white">
                      &gt; Your team won the whole tournament!
                    </p>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  className="pixel-panel pixel-panel-yellow text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="font-pixel text-pixel-4xl neon-glow-yellow mb-3"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  >
                    ★
                  </motion.div>
                  <p className="font-pixel text-pixel-base neon-glow-yellow mb-2">
                    GG!
                  </p>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    &gt; Champion: {champion?.name.toUpperCase() || '...'}
                  </p>
                </motion.div>
              )
            })()}
          </div>
        )}

        {/* Phase status bar */}
        {isLoggedIn && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-arcade-void border-t-2 border-text-white px-4 py-2 z-20"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between font-pixel text-pixel-sm">
              <span className="text-text-dim">
                {playerTeamId?.replace('team-', 'P')}
              </span>
              <span className="text-neon-cyan">
                {game.phase.toUpperCase().replace(/-/g, ' ')}
              </span>
              <span className="text-text-dim">
                M{Math.max(1, [...game.matches].sort((a, b) => a.id.localeCompare(b.id)).findIndex((m) => m.id === game.currentMatchId) + 1)}/3
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default function HomePage() {
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
      <HomeContent />
    </Suspense>
  )
}
