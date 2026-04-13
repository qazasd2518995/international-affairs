'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { StageBackground, Logo, LoginForm, VotingPanel, AudienceVoting, ArgumentInput, SyncedCountdown } from '@/components'
import { useRealtimeGame } from '@/lib/useRealtimeGame'
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

    if (storedPlayerId && storedTeamId && storedSessionId) {
      setPlayerId(storedPlayerId)
      setPlayerTeamId(storedTeamId)
      setSessionId(storedSessionId)
      setIsLoggedIn(true)
    }
  }, [])

  const handleVote = (stance: 'agree' | 'disagree' | 'not-sure') => {
    if (!playerId || !playerTeamId || !game.currentTopicId) return
    game.submitVote(playerId, playerTeamId, game.currentTopicId, stance)
  }

  const handleAudienceVote = (votedFor: string) => {
    if (!playerId || !currentMatch) return
    game.submitAudienceVote(currentMatch.id, playerId, votedFor)
  }

  const handleArgumentSubmit = (args: string[]) => {
    if (!currentMatch || !playerTeamId) return
    game.submitArguments(currentMatch.id, playerTeamId, args)
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

            {/* Topic reveal */}
            {game.phase === 'topic-reveal' && (
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
                  &gt; Look at the big screen!
                </p>
              </motion.div>
            )}

            {/* Voting */}
            {game.phase === 'voting' && currentTopic && (
              <div className="space-y-3">
                <SyncedCountdown
                  duration={30}
                  startedAt={game.phaseStartedAt}
                  label="VOTING"
                  size="sm"
                />
                <VotingPanel
                  topic={currentTopic}
                  playerId={playerId!}
                  teamId={playerTeamId!}
                  onVote={handleVote}
                  currentVote={game.votes.find((v) => v.playerId === playerId)?.stance}
                />
              </div>
            )}

            {/* Matchup reveal */}
            {game.phase === 'matchup-reveal' && (
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
                <p className="font-pixel text-pixel-base neon-glow-pink mb-3">
                  MATCHUPS!
                </p>
                <p className="font-terminal text-terminal-base text-text-dim">
                  &gt; Check the big screen!
                </p>
              </motion.div>
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
                {isCompeting ? (
                  <ArgumentInput
                    topic={currentTopic}
                    stance={playerStance as 'agree' | 'disagree'}
                    teamName={game.teams[playerTeamId!]?.name || ''}
                    onSubmit={handleArgumentSubmit}
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
            {game.phase === 'debate' && currentMatch && (() => {
              const subLabels: Record<string, { label: string; team: 'A' | 'B' | 'HOST'; duration: number; symbol: string }> = {
                'team-a-opening': { label: 'OPENING', team: 'A', duration: 20, symbol: '►' },
                'team-b-opening': { label: 'OPENING', team: 'B', duration: 20, symbol: '►' },
                'host-challenge': { label: 'CHALLENGE', team: 'HOST', duration: 15, symbol: '!' },
                'team-a-response': { label: 'RESPONSE', team: 'A', duration: 15, symbol: '◀' },
                'team-b-response': { label: 'RESPONSE', team: 'B', duration: 15, symbol: '◀' },
                'done': { label: 'DONE', team: 'A', duration: 0, symbol: '✓' },
              }
              const subInfo = subLabels[game.debateSubPhase]
              const activeTeam = subInfo?.team
              const color = activeTeam === 'A' ? 'var(--team-red)' : activeTeam === 'B' ? 'var(--team-blue)' : 'var(--neon-yellow)'

              return (
                <div className="space-y-3">
                  <motion.div
                    className="pixel-panel text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="font-pixel text-pixel-3xl mb-2"
                      style={{ color, textShadow: `0 0 15px ${color}` }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                    >
                      {subInfo?.symbol}
                    </motion.div>
                    <p className="font-pixel text-pixel-sm text-text-muted mb-1">
                      NOW SPEAKING
                    </p>
                    <motion.p
                      key={game.debateSubPhase}
                      className="font-pixel text-pixel-lg"
                      style={{ color }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {activeTeam === 'HOST'
                        ? 'HOST!'
                        : `${game.teams[activeTeam === 'A' ? currentMatch.teamA : currentMatch.teamB]?.name.toUpperCase()}`}
                    </motion.p>
                    <p className="font-pixel text-pixel-sm text-neon-yellow mt-1">
                      [{subInfo?.label}]
                    </p>
                  </motion.div>

                  {game.debateSubPhase !== 'done' && subInfo && (
                    <SyncedCountdown
                      key={game.debateSubPhase}
                      duration={subInfo.duration}
                      startedAt={game.debateSubPhaseStartedAt}
                      label={subInfo.label}
                      size="sm"
                    />
                  )}
                </div>
              )
            })()}

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

            {/* Result / Leaderboard / Awards */}
            {(game.phase === 'result' || game.phase === 'leaderboard' || game.phase === 'final-awards') && (
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
                  {game.phase === 'result' ? '♛' : game.phase === 'leaderboard' ? '▲' : '★'}
                </motion.div>
                <p className="font-pixel text-pixel-lg neon-glow-yellow mb-2">
                  {game.phase === 'result' ? 'RESULT!' : game.phase === 'leaderboard' ? 'RANKS!' : 'ENDING!'}
                </p>
                <p className="font-terminal text-terminal-base text-text-dim">
                  &gt; Watch the big screen!
                </p>
              </motion.div>
            )}
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
                R{game.currentRound}/3
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
