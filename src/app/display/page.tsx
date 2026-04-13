'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  'team-a-opening': { label: 'OPENING', duration: 20, team: 'A' },
  'team-b-opening': { label: 'OPENING', duration: 20, team: 'B' },
  'host-challenge': { label: 'CHALLENGE', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'RESPONSE', duration: 15, team: 'A' },
  'team-b-response': { label: 'RESPONSE', duration: 15, team: 'B' },
  'done': { label: 'DONE', duration: 0, team: 'A' },
}

function DisplayContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)

  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

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
          <p className="font-pixel text-pixel-base text-neon-red mt-8">
            ※ NO SESSION ※
          </p>
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

      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6 flex items-center justify-between border-b-2 border-panel-border">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-4">
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
                        size={320}
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

            {game.phase === 'voting' && (
              <motion.div
                key="voting"
                className="w-full max-w-4xl space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {currentTopic && (
                  <motion.div
                    className="dialogue-box max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="font-terminal text-terminal-xl md:text-terminal-2xl text-center">
                      {currentTopic.question}
                    </p>
                  </motion.div>
                )}

                <SyncedCountdown
                  duration={30}
                  startedAt={game.phaseStartedAt}
                  label="VOTING"
                  size="md"
                />

                <VoteResults votes={game.votes} totalVoters={Object.keys(game.players).length} />
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

            {game.phase === 'preparation' && (
              <motion.div
                key="prep"
                className="text-center space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-yellow animate-glitch"
                >
                  ♪ CHARGING MP ♪
                </motion.p>

                <SyncedCountdown
                  duration={90}
                  startedAt={game.phaseStartedAt}
                  label="TEAMS PREPARING"
                  size="lg"
                />

                <motion.p
                  className="font-terminal text-terminal-xl text-text-dim"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  &gt; Heroes are writing their attacks...
                </motion.p>

                {currentMatch && (
                  <div className="flex justify-center gap-6 mt-8 flex-wrap">
                    <div className="battle-card battle-card-red">
                      <div className="text-center">
                        <p className="font-pixel text-pixel-sm text-team-red mb-1">◆ A ◆</p>
                        <p className="font-pixel text-pixel-lg text-text-white">
                          {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                        </p>
                        <p className="font-pixel text-pixel-sm text-neon-green mt-2">AGREE</p>
                      </div>
                    </div>
                    <div className="vs-pixel">VS</div>
                    <div className="battle-card battle-card-blue">
                      <div className="text-center">
                        <p className="font-pixel text-pixel-sm text-team-blue mb-1">◆ B ◆</p>
                        <p className="font-pixel text-pixel-lg text-text-white">
                          {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                        </p>
                        <p className="font-pixel text-pixel-sm text-neon-red mt-2">DISAGREE</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {game.phase === 'debate' && currentMatch && (() => {
              const subInfo = DEBATE_SUB_INFO[game.debateSubPhase]
              const activeTeam = subInfo.team
              const color = activeTeam === 'A' ? 'var(--team-red)' : activeTeam === 'B' ? 'var(--team-blue)' : 'var(--neon-yellow)'

              return (
                <motion.div
                  key="debate"
                  className="w-full text-center space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    key={game.debateSubPhase}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="font-pixel text-pixel-sm text-text-muted mb-2 uppercase">
                      &gt; NOW SPEAKING
                    </p>
                    <motion.p
                      className="font-pixel text-pixel-3xl md:text-pixel-4xl animate-glitch"
                      style={{ color, textShadow: `0 0 20px ${color}, 4px 4px 0 var(--arcade-void)` }}
                    >
                      {activeTeam === 'HOST'
                        ? 'HOST CHALLENGE'
                        : game.teams[activeTeam === 'A' ? currentMatch.teamA : currentMatch.teamB]?.name.toUpperCase()}
                    </motion.p>
                    <p className="font-pixel text-pixel-lg text-neon-yellow mt-2">
                      [ {subInfo.label} ]
                    </p>
                  </motion.div>

                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    <motion.div
                      className="battle-card battle-card-red"
                      animate={{
                        scale: activeTeam === 'A' ? [1, 1.05, 1] : 0.9,
                        opacity: activeTeam === 'A' ? 1 : 0.4,
                      }}
                      transition={{ duration: 1, repeat: activeTeam === 'A' ? Infinity : 0, ease: 'linear' }}
                    >
                      <div className="text-center">
                        <p className="font-pixel text-pixel-sm text-team-red">◆ A ◆</p>
                        <p className="font-pixel text-pixel-xl text-text-white mt-2">
                          {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                        </p>
                      </div>
                    </motion.div>

                    <div className="vs-pixel">VS</div>

                    <motion.div
                      className="battle-card battle-card-blue"
                      animate={{
                        scale: activeTeam === 'B' ? [1, 1.05, 1] : 0.9,
                        opacity: activeTeam === 'B' ? 1 : 0.4,
                      }}
                      transition={{ duration: 1, repeat: activeTeam === 'B' ? Infinity : 0, ease: 'linear' }}
                    >
                      <div className="text-center">
                        <p className="font-pixel text-pixel-sm text-team-blue">◆ B ◆</p>
                        <p className="font-pixel text-pixel-xl text-text-white mt-2">
                          {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                        </p>
                      </div>
                    </motion.div>
                  </div>

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
