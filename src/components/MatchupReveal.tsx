'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Match, Team } from '@/lib/types'

interface MatchupRevealProps {
  match: Match
  teamA: Team
  teamB: Team
  index: number
  matchNumber?: number  // explicit "this is match X of 3" — falls back to index+1
  upcoming?: boolean    // true → show "NOW PLAYING" badge instead of stage label
}

export function MatchupReveal({ match, teamA, teamB, index, matchNumber, upcoming }: MatchupRevealProps) {
  const stageNum = matchNumber ?? index + 1
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.3,
        ease: 'linear',
      }}
    >
      <div className="pixel-panel">
        <div className="text-center mb-4">
          <p className="font-pixel text-pixel-sm text-neon-yellow">
            {upcoming ? '★ NOW PLAYING ★' : `★ STAGE ${match.round}-${stageNum} ★`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <motion.div
            className="battle-card battle-card-red flex-1"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.3 + 0.2, ease: 'linear' }}
          >
            <div className="text-center">
              <div className="font-pixel text-pixel-sm text-team-red mb-2">
                ◆ PARTY A ◆
              </div>
              <div className="font-pixel text-pixel-lg text-text-white text-shadow-pixel mb-2">
                {teamA.name.toUpperCase()}
              </div>
              <div className="pixel-tag pixel-tag-green">
                AGREE
              </div>
            </div>
          </motion.div>

          <motion.div
            className="vs-pixel"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.3 + 0.4,
              ease: 'linear',
            }}
          >
            VS
          </motion.div>

          <motion.div
            className="battle-card battle-card-blue flex-1"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.3 + 0.2, ease: 'linear' }}
          >
            <div className="text-center">
              <div className="font-pixel text-pixel-sm text-team-blue mb-2">
                ◆ PARTY B ◆
              </div>
              <div className="font-pixel text-pixel-lg text-text-white text-shadow-pixel mb-2">
                {teamB.name.toUpperCase()}
              </div>
              <div className="pixel-tag pixel-tag-red">
                DISAGREE
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

interface AllMatchupsProps {
  matches: Match[]
  teams: Record<string, Team>
  // Full ordered list of all matches — used to compute the real STAGE number
  // when `matches` is filtered down to just the upcoming one for round 2/3.
  allMatchesOrdered?: Match[]
}

export function AllMatchups({ matches, teams, allMatchesOrdered }: AllMatchupsProps) {
  const [showMatches, setShowMatches] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowMatches(true), 600)
    return () => clearTimeout(timer)
  }, [])

  // Round 2/3: only one match is shown; mark it as "NOW PLAYING" instead of
  // "STAGE 1-1" (which would be misleading since this is actually match 2 or 3).
  const isUpcomingOnly = matches.length === 1 && (allMatchesOrdered?.length ?? matches.length) > 1
  const headerLabel = isUpcomingOnly ? 'NEXT BATTLE!' : 'BATTLES!'
  const headerSub = isUpcomingOnly ? '> The next pair takes the stage' : '> Preparing arena...'

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="font-pixel text-pixel-3xl md:text-pixel-4xl neon-glow-pink animate-glitch">
          {headerLabel}
        </div>
        <p className="font-terminal text-terminal-lg text-text-dim mt-2">
          {headerSub}
        </p>
      </motion.div>

      <AnimatePresence>
        {showMatches && matches.map((match, index) => {
          const teamA = teams[match.teamA]
          const teamB = teams[match.teamB]
          if (!teamA || !teamB) return null
          // Real match number = its position in allMatchesOrdered (1..3)
          const realNum = allMatchesOrdered
            ? allMatchesOrdered.findIndex((m) => m.id === match.id) + 1
            : index + 1
          return (
            <MatchupReveal
              key={match.id}
              match={match}
              teamA={teamA}
              teamB={teamB}
              index={index}
              matchNumber={realNum}
              upcoming={isUpcomingOnly}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
