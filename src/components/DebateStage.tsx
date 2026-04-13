'use client'

import { motion } from 'framer-motion'
import { Flame, Zap, Mic } from 'lucide-react'
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
        return {
          label: 'OPENING STATEMENT',
          team: teamA.name,
          color: 'var(--team-a)',
          Icon: Flame,
          seconds: 20,
        }
      case 'team-b-opening':
        return {
          label: 'OPENING STATEMENT',
          team: teamB.name,
          color: 'var(--team-b)',
          Icon: Zap,
          seconds: 20,
        }
      case 'host-challenge':
        return {
          label: 'HOST CHALLENGE',
          team: 'HOST',
          color: 'var(--spotlight-gold)',
          Icon: Mic,
          seconds: 15,
        }
      case 'team-a-response':
        return {
          label: 'RESPONSE',
          team: teamA.name,
          color: 'var(--team-a)',
          Icon: Flame,
          seconds: 15,
        }
      case 'team-b-response':
        return {
          label: 'RESPONSE',
          team: teamB.name,
          color: 'var(--team-b)',
          Icon: Zap,
          seconds: 15,
        }
    }
  }

  const phaseInfo = getPhaseInfo()
  const PhaseIcon = phaseInfo.Icon

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Topic header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center gap-4 mb-4">
          <CategoryTag category={topic.category} />
          <DifficultyStars difficulty={topic.difficulty} />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-secondary)]">
          {topic.question}
        </h2>
      </motion.div>

      {/* Main stage area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team A side */}
        <motion.div
          className={`team-card team-card-a ${phase.includes('team-a') ? 'ring-4 ring-[var(--team-a)]' : 'opacity-50'}`}
          animate={{
            scale: phase.includes('team-a') ? 1.02 : 1,
            opacity: phase.includes('team-a') ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Flame size={40} className="text-[var(--team-a)]" fill="currentColor" />
            </div>
            <h3 className="title-display text-2xl text-[var(--team-a)]">{teamA.name}</h3>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-[var(--agree-green)] bg-opacity-20 text-[var(--agree-green)] font-semibold">
              AGREE
            </span>

            {match.teamAArguments.length > 0 && (
              <div className="mt-4 text-left text-sm text-[var(--text-secondary)]">
                {match.teamAArguments.map((arg, i) => (
                  <p key={i} className="mb-1 truncate">• {arg}</p>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Center - Timer & Phase */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            key={phase}
            className="text-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="flex justify-center mb-2">
              <PhaseIcon size={40} style={{ color: phaseInfo.color }} fill="currentColor" />
            </div>
            <h3
              className="title-display text-xl"
              style={{ color: phaseInfo.color }}
            >
              {phaseInfo.team}
            </h3>
            <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
              {phaseInfo.label}
            </span>
          </motion.div>

          <Timer onComplete={onTimerComplete} />
        </div>

        {/* Team B side */}
        <motion.div
          className={`team-card team-card-b ${phase.includes('team-b') ? 'ring-4 ring-[var(--team-b)]' : 'opacity-50'}`}
          animate={{
            scale: phase.includes('team-b') ? 1.02 : 1,
            opacity: phase.includes('team-b') ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Zap size={40} className="text-[var(--team-b)]" fill="currentColor" />
            </div>
            <h3 className="title-display text-2xl text-[var(--team-b)]">{teamB.name}</h3>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-[var(--disagree-red)] bg-opacity-20 text-[var(--disagree-red)] font-semibold">
              DISAGREE
            </span>

            {match.teamBArguments.length > 0 && (
              <div className="mt-4 text-left text-sm text-[var(--text-secondary)]">
                {match.teamBArguments.map((arg, i) => (
                  <p key={i} className="mb-1 truncate">• {arg}</p>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
