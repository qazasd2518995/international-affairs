'use client'

import { motion } from 'framer-motion'
import type { Team } from '@/lib/types'

interface LeaderboardProps {
  teams: Team[]
  title?: string
}

export function Leaderboard({ teams, title = 'HI-SCORE' }: LeaderboardProps) {
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore)

  const getRankSymbol = (rank: number) => {
    if (rank === 1) return '1ST'
    if (rank === 2) return '2ND'
    if (rank === 3) return '3RD'
    return `${rank}TH`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-neon-yellow'
    if (rank === 2) return 'text-neon-cyan'
    if (rank === 3) return 'text-neon-pink'
    return 'text-text-dim'
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="pixel-panel pixel-panel-yellow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-2xl md:text-pixel-3xl neon-glow-yellow">
            ★ {title} ★
          </p>
        </div>

        <div className="space-y-2">
          {sortedTeams.map((team, index) => {
            const rank = index + 1
            return (
              <motion.div
                key={team.id}
                className="pixel-panel-sm pixel-panel flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, ease: 'linear' }}
              >
                <div className={`font-pixel text-pixel-lg w-20 ${getRankColor(rank)}`}>
                  {getRankSymbol(rank)}
                </div>

                <div className="flex-1 px-4">
                  <p className="font-pixel text-pixel-base text-text-white">
                    {team.name.toUpperCase()}
                  </p>
                  <p className="font-terminal text-terminal-base text-text-dim">
                    {team.matchesPlayed} {team.matchesPlayed === 1 ? 'battle' : 'battles'}
                  </p>
                </div>

                <div className="text-right">
                  <motion.p
                    className="font-pixel text-pixel-2xl neon-glow-yellow"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, ease: 'linear' }}
                  >
                    {team.totalScore.toFixed(1)}
                  </motion.p>
                  <p className="font-pixel text-pixel-sm text-text-muted">
                    XP
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export function MiniLeaderboard({ teams }: { teams: Team[] }) {
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3)

  return (
    <div className="pixel-panel pixel-panel-sm">
      <p className="font-pixel text-pixel-sm text-neon-yellow mb-3">
        ► HI-SCORE
      </p>
      {sortedTeams.map((team, index) => (
        <div key={team.id} className="flex items-center justify-between py-1 font-pixel text-pixel-sm">
          <div className="flex items-center gap-2">
            <span className={index === 0 ? 'text-neon-yellow' : index === 1 ? 'text-neon-cyan' : 'text-neon-pink'}>
              {index + 1}ST
            </span>
            <span className="text-text-white">{team.name.toUpperCase()}</span>
          </div>
          <span className="text-neon-yellow">
            {team.totalScore.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}
