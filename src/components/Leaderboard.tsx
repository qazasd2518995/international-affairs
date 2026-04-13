'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'
import type { Team } from '@/lib/types'

interface LeaderboardProps {
  teams: Team[]
  title?: string
}

export function Leaderboard({ teams, title = 'LEADERBOARD' }: LeaderboardProps) {
  // Sort teams by total score
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={32} className="text-[var(--spotlight-gold)]" fill="currentColor" strokeWidth={1.5} />
      case 2:
        return <Medal size={32} className="text-[#c0c0c0]" fill="currentColor" strokeWidth={1.5} />
      case 3:
        return <Award size={32} className="text-[#cd7f32]" fill="currentColor" strokeWidth={1.5} />
      default:
        return null
    }
  }

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'leaderboard-rank-1'
      case 2:
        return 'leaderboard-rank-2'
      case 3:
        return 'leaderboard-rank-3'
      default:
        return 'text-[var(--text-secondary)]'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="glass-card-strong p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="title-display text-3xl text-center text-[var(--spotlight-gold)] mb-8">
          {title}
        </h2>

        <div className="space-y-3">
          {sortedTeams.map((team, index) => {
            const rank = index + 1
            return (
              <motion.div
                key={team.id}
                className="leaderboard-row"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Rank */}
                <div className={`leaderboard-rank ${getRankClass(rank)} flex items-center justify-center`}>
                  {rank <= 3 ? getRankIcon(rank) : `#${rank}`}
                </div>

                {/* Team name */}
                <div className="flex-1 ml-4">
                  <h3 className="font-bold text-lg">{team.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {team.matchesPlayed} match{team.matchesPlayed !== 1 ? 'es' : ''} played
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <motion.p
                    className="score-display text-3xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: index * 0.1 + 0.2 }}
                  >
                    {team.totalScore.toFixed(1)}
                  </motion.p>
                  <p className="text-xs text-[var(--text-muted)]">points</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

// Mini leaderboard for sidebar
export function MiniLeaderboard({ teams }: { teams: Team[] }) {
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3)

  return (
    <div className="glass-card p-4">
      <h4 className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Top Teams
      </h4>
      {sortedTeams.map((team, index) => {
        const rank = index + 1
        const Icon = rank === 1 ? Trophy : rank === 2 ? Medal : Award
        const color = rank === 1 ? 'var(--spotlight-gold)' : rank === 2 ? '#c0c0c0' : '#cd7f32'
        return (
          <div key={team.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Icon size={18} style={{ color }} fill="currentColor" strokeWidth={1.5} />
              <span className="text-sm">{team.name}</span>
            </div>
            <span className="text-[var(--spotlight-gold)] font-bold">
              {team.totalScore.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
