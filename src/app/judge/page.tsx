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
import { useRealtimeGame, type DebateSubPhase } from '@/lib/useRealtimeGame'
import { TOPICS, type JudgeScore } from '@/lib/types'

const DEBATE_SUB_INFO: Record<DebateSubPhase, { label: string; duration: number; team: 'A' | 'B' | 'HOST' }> = {
  'team-a-opening': { label: 'OPENING', duration: 20, team: 'A' },
  'team-b-opening': { label: 'OPENING', duration: 20, team: 'B' },
  'host-challenge': { label: 'CHALLENGE', duration: 15, team: 'HOST' },
  'team-a-response': { label: 'RESPONSE', duration: 15, team: 'A' },
  'team-b-response': { label: 'RESPONSE', duration: 15, team: 'B' },
  'done': { label: 'DONE', duration: 0, team: 'A' },
}

function JudgeContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [judgeId, setJudgeId] = useState<'judge1' | 'judge2' | null>(null)
  const [submittedScore, setSubmittedScore] = useState<JudgeScore | null>(null)
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)

  const game = useRealtimeGame(sessionId || undefined)

  const currentMatch = game.currentMatchId ? game.matches.find((m) => m.id === game.currentMatchId) : null
  const currentTopic = game.currentTopicId ? TOPICS.find((t) => t.id === game.currentTopicId) : null
  const currentRoundMatches = game.matches.filter((m) => m.round === game.currentRound)

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

      {showPhaseTransition && <PhaseTransition phase={game.phase} round={game.currentRound} />}

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

          {game.phase === 'topic-reveal' && currentTopic && (
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
          )}

          {game.phase === 'voting' && currentTopic && (
            <motion.div
              key="voting"
              className="max-w-2xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="dialogue-box">
                <p className="font-terminal text-terminal-base">
                  {currentTopic.question}
                </p>
              </div>

              <SyncedCountdown
                duration={30}
                startedAt={game.phaseStartedAt}
                label="VOTING"
                size="sm"
              />

              <p className="text-center font-pixel text-pixel-sm text-neon-cyan">
                {game.votes.length} / {Object.keys(game.players).length} VOTED
              </p>
            </motion.div>
          )}

          {game.phase === 'matchup-reveal' && (
            <motion.div
              key="matchup"
              className="max-w-2xl mx-auto space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-pixel text-pixel-xl text-center neon-glow-pink">
                × MATCHUPS ×
              </p>
              {currentRoundMatches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  className="pixel-panel-sm pixel-panel flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2, ease: 'linear' }}
                >
                  <span className="font-pixel text-pixel-base text-team-red">
                    {game.teams[match.teamA]?.name.toUpperCase()}
                  </span>
                  <span className="vs-pixel text-pixel-lg">VS</span>
                  <span className="font-pixel text-pixel-base text-team-blue">
                    {game.teams[match.teamB]?.name.toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {game.phase === 'preparation' && currentMatch && currentTopic && (
            <motion.div
              key="prep"
              className="max-w-2xl mx-auto space-y-4"
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

              <div className="flex justify-center gap-3 flex-wrap">
                <div className="battle-card battle-card-red">
                  <p className="font-pixel text-pixel-sm text-team-red">◆ A ◆</p>
                  <p className="font-pixel text-pixel-base text-text-white">
                    {game.teams[currentMatch.teamA]?.name.toUpperCase()}
                  </p>
                </div>
                <div className="battle-card battle-card-blue">
                  <p className="font-pixel text-pixel-sm text-team-blue">◆ B ◆</p>
                  <p className="font-pixel text-pixel-base text-text-white">
                    {game.teams[currentMatch.teamB]?.name.toUpperCase()}
                  </p>
                </div>
              </div>

              <SyncedCountdown
                duration={90}
                startedAt={game.phaseStartedAt}
                label="PREP"
                size="sm"
              />

              <p className="text-center font-terminal text-terminal-base text-text-dim">
                &gt; AI will suggest scores soon...
              </p>
            </motion.div>
          )}

          {game.phase === 'debate' && currentMatch && currentTopic && (() => {
            const subInfo = DEBATE_SUB_INFO[game.debateSubPhase]
            const activeTeam = subInfo.team
            const color = activeTeam === 'A' ? 'var(--team-red)' : activeTeam === 'B' ? 'var(--team-blue)' : 'var(--neon-yellow)'

            return (
              <motion.div
                key="debate"
                className="max-w-2xl mx-auto space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  key={game.debateSubPhase}
                  className="text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="font-pixel text-pixel-sm text-text-muted mb-2">
                    &gt; NOW SPEAKING
                  </p>
                  <p
                    className="font-pixel text-pixel-2xl md:text-pixel-3xl"
                    style={{ color, textShadow: `0 0 15px ${color}, 2px 2px 0 var(--arcade-void)` }}
                  >
                    {activeTeam === 'HOST'
                      ? 'HOST!'
                      : game.teams[activeTeam === 'A' ? currentMatch.teamA : currentMatch.teamB]?.name.toUpperCase()}
                  </p>
                  <p className="font-pixel text-pixel-base text-neon-yellow mt-2">
                    [{subInfo.label}]
                  </p>
                </motion.div>

                {game.debateSubPhase !== 'done' && (
                  <SyncedCountdown
                    key={game.debateSubPhase}
                    duration={subInfo.duration}
                    startedAt={game.debateSubPhaseStartedAt}
                    label={subInfo.label}
                    size="sm"
                  />
                )}

                <p className="text-center font-terminal text-terminal-base text-text-dim">
                  &gt; Listen carefully — scoring soon!
                </p>
              </motion.div>
            )
          })()}

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
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ★
                </motion.div>
                <p className="font-pixel text-pixel-xl neon-glow-yellow mb-4">
                  AWARDS
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
