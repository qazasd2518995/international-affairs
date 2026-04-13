'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Target, CheckCircle2, Dices, Swords, Hourglass, Mic, Scale, Trophy } from 'lucide-react'
import { StageBackground, Logo, LoginForm, VotingPanel, AudienceVoting, ArgumentInput } from '@/components'
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

  // Check if player is in a competing team for current match
  const isCompeting = currentMatch && playerTeamId && (currentMatch.teamA === playerTeamId || currentMatch.teamB === playerTeamId)
  const playerStance = currentMatch && playerTeamId === currentMatch.teamA ? 'agree' : 'disagree'

  const handleLogin = async (name: string, teamId: string) => {
    if (!sessionId) return

    try {
      const id = await game.joinSession(sessionId, name, teamId)
      setPlayerId(id)
      setPlayerTeamId(teamId)
      setIsLoggedIn(true)
      // Store in localStorage for persistence
      localStorage.setItem('mda_player_id', id)
      localStorage.setItem('mda_team_id', teamId)
      localStorage.setItem('mda_session_id', sessionId)
    } catch (err) {
      console.error('Failed to join:', err)
    }
  }

  // Restore session from localStorage
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

  // No session - show landing
  if (!sessionId) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <StageBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <Logo size="lg" />
          <motion.div
            className="glass-card-strong p-8 mt-12 text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <Target size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--spotlight-gold)] mb-4">
              Join a Game
            </h2>
            <p className="text-[var(--text-secondary)]">
              Scan the QR code or ask your host for the game link.
            </p>
          </motion.div>
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
          <Logo size="lg" />
          <div className="mt-8">
            <div className="loading-spinner mx-auto" />
          </div>
          <p className="text-[var(--text-muted)] mt-4">Connecting...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <StageBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Logo size="md" />
        </motion.div>

        {!isLoggedIn ? (
          // Login form
          <LoginForm teamCount={6} onLogin={handleLogin} />
        ) : (
          // Game content based on phase
          <div className="w-full max-w-lg">
            {/* Lobby - waiting */}
            {game.phase === 'lobby' && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <CheckCircle2 size={64} className="text-[var(--agree-green)]" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--spotlight-gold)] mb-2">
                  You&apos;re In!
                </h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  Welcome to {game.teams[playerTeamId!]?.name}
                </p>
                <p className="text-[var(--text-muted)] text-sm">
                  Wait for the host to start...
                </p>
                <div className="mt-6">
                  <div className="loading-spinner mx-auto" />
                </div>
              </motion.div>
            )}

            {/* Topic reveal - just watch */}
            {game.phase === 'topic-reveal' && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <Dices size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                  Topic Being Revealed...
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Watch the big screen!
                </p>
              </motion.div>
            )}

            {/* Voting phase */}
            {game.phase === 'voting' && currentTopic && (
              <VotingPanel
                topic={currentTopic}
                playerId={playerId!}
                teamId={playerTeamId!}
                onVote={handleVote}
                currentVote={game.votes.find((v) => v.playerId === playerId)?.stance}
              />
            )}

            {/* Matchup reveal - just watch */}
            {game.phase === 'matchup-reveal' && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <Swords size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                  Matchups Being Revealed!
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Watch the big screen!
                </p>
              </motion.div>
            )}

            {/* Preparation - input arguments if competing */}
            {game.phase === 'preparation' && currentTopic && (
              isCompeting ? (
                <ArgumentInput
                  topic={currentTopic}
                  stance={playerStance as 'agree' | 'disagree'}
                  teamName={game.teams[playerTeamId!]?.name || ''}
                  onSubmit={handleArgumentSubmit}
                />
              ) : (
                <motion.div
                  className="glass-card-strong p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-center mb-4">
                    <Hourglass size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                    Teams Preparing...
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-2">
                    Watch the debate soon!
                  </p>
                </motion.div>
              )
            )}

            {/* Debate - just watch */}
            {game.phase === 'debate' && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <Mic size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                  Debate in Progress!
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Watch the big screen!
                </p>
              </motion.div>
            )}

            {/* Audience vote */}
            {game.phase === 'audience-vote' && currentMatch && (
              <AudienceVoting
                teamA={game.teams[currentMatch.teamA]}
                teamB={game.teams[currentMatch.teamB]}
                playerId={playerId!}
                playerTeamId={playerTeamId!}
                onVote={handleAudienceVote}
                currentVote={game.audienceVotes[currentMatch.id]?.find((v) => v.playerId === playerId)?.votedFor}
              />
            )}

            {/* Scoring - waiting */}
            {game.phase === 'scoring' && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <Scale size={64} className="text-[var(--spotlight-gold)]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                  Judges Scoring...
                </h2>
                <div className="loading-spinner mx-auto mt-4" />
              </motion.div>
            )}

            {/* Result / Leaderboard / Awards - watch */}
            {(game.phase === 'result' || game.phase === 'leaderboard' || game.phase === 'final-awards') && (
              <motion.div
                className="glass-card-strong p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-center mb-4">
                  <Trophy size={64} className="text-[var(--spotlight-gold)]" fill="currentColor" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-[var(--spotlight-gold)]">
                  {game.phase === 'result' ? 'Results!' : game.phase === 'leaderboard' ? 'Leaderboard' : 'Awards!'}
                </h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Watch the big screen!
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Phase indicator */}
        {isLoggedIn && (
          <motion.div
            className="fixed bottom-4 left-4 glass-card px-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs text-[var(--text-muted)]">
              Phase: <span className="text-[var(--neon-cyan)] uppercase">{game.phase.replace(/-/g, ' ')}</span>
            </p>
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
          <div className="loading-spinner mx-auto mt-8" />
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
