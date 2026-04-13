'use client'

import { motion } from 'framer-motion'
import type { Match, Team, Topic } from '@/lib/types'
import { Timer } from './Timer'
import { DifficultyStars } from './DifficultyStars'
import { CategoryTag } from './CategoryTag'

interface DebateStageProps {
  match: Match
  teamA: Team
  teamB: Team
  topic: Topic
  phase: 'team-a-opening' | 'team-b-opening' | 'host-challenge' | 'team-a-response' | 'team-b-response'
  onTimerComplete?: () => void
}

export function DebateStage({ match, teamA, teamB, topic, phase, onTimerComplete }: DebateStageProps) {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'team-a-opening':
        return { label: 'OPENING', team: teamA.name, color: 'var(--team-red)', symbol: '►' }
      case 'team-b-opening':
        return { label: 'OPENING', team: teamB.name, color: 'var(--team-blue)', symbol: '►' }
      case 'host-challenge':
        return { label: 'CHALLENGE', team: 'HOST', color: 'var(--neon-yellow)', symbol: '!' }
      case 'team-a-response':
        return { label: 'RESPONSE', team: teamA.name, color: 'var(--team-red)', symbol: '◀' }
      case 'team-b-response':
        return { label: 'RESPONSE', team: teamB.name, color: 'var(--team-blue)', symbol: '◀' }
    }
  }

  const phaseInfo = getPhaseInfo()

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center gap-3 mb-3 flex-wrap">
          <CategoryTag category={topic.category} />
          <DifficultyStars difficulty={topic.difficulty} />
        </div>
        <p className="font-terminal text-terminal-base md:text-terminal-lg text-text-dim">
          &gt; {topic.question}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className={`battle-card battle-card-red ${phase.includes('team-a') ? '' : 'opacity-40'}`}
          animate={{
            scale: phase.includes('team-a') ? 1.02 : 0.95,
          }}
          transition={{ duration: 0.2, ease: 'linear' }}
        >
          <div className="text-center">
            <div className="font-pixel text-pixel-sm text-team-red mb-2">◆ PARTY A ◆</div>
            <div className="font-pixel text-pixel-lg text-text-white mb-2">
              {teamA.name.toUpperCase()}
            </div>
            <div className="pixel-tag pixel-tag-green">AGREE</div>

            {match.teamAArguments.length > 0 && (
              <div className="mt-3 text-left font-terminal text-terminal-base text-text-dim">
                {match.teamAArguments.map((arg, i) => (
                  <p key={i} className="truncate">&gt; {arg}</p>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center">
          <motion.div
            key={phase}
            className="text-center mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'linear' }}
          >
            <div
              className="font-pixel text-pixel-4xl mb-2"
              style={{ color: phaseInfo.color, textShadow: `0 0 10px ${phaseInfo.color}` }}
            >
              {phaseInfo.symbol}
            </div>
            <p className="font-pixel text-pixel-sm" style={{ color: phaseInfo.color }}>
              {phaseInfo.team.toUpperCase()}
            </p>
            <p className="font-pixel text-pixel-sm text-text-muted">
              {phaseInfo.label}
            </p>
          </motion.div>

          <Timer onComplete={onTimerComplete} />
        </div>

        <motion.div
          className={`battle-card battle-card-blue ${phase.includes('team-b') ? '' : 'opacity-40'}`}
          animate={{
            scale: phase.includes('team-b') ? 1.02 : 0.95,
          }}
          transition={{ duration: 0.2, ease: 'linear' }}
        >
          <div className="text-center">
            <div className="font-pixel text-pixel-sm text-team-blue mb-2">◆ PARTY B ◆</div>
            <div className="font-pixel text-pixel-lg text-text-white mb-2">
              {teamB.name.toUpperCase()}
            </div>
            <div className="pixel-tag pixel-tag-red">DISAGREE</div>

            {match.teamBArguments.length > 0 && (
              <div className="mt-3 text-left font-terminal text-terminal-base text-text-dim">
                {match.teamBArguments.map((arg, i) => (
                  <p key={i} className="truncate">&gt; {arg}</p>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
