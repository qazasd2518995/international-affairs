'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface LoginFormProps {
  teamCount: number
  onLogin: (name: string, teamId: string) => void
}

export function LoginForm({ teamCount, onLogin }: LoginFormProps) {
  const [name, setName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!selectedTeam) {
      setError('Please select your group')
      return
    }
    onLogin(name.trim(), selectedTeam)
  }

  const teams = Array.from({ length: teamCount }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Group ${i + 1}`,
  }))

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card-strong p-8">
        <h2 className="title-display text-2xl text-center text-[var(--spotlight-gold)] mb-6">
          JOIN THE ARENA
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Your Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              maxLength={30}
            />
          </div>

          {/* Team selection */}
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Select Your Group
            </label>
            <div className="grid grid-cols-2 gap-3">
              {teams.map((team) => (
                <motion.button
                  key={team.id}
                  type="button"
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedTeam === team.id
                      ? 'bg-[var(--spotlight-gold)] text-[var(--stage-dark)] font-bold'
                      : 'glass-card hover:bg-[var(--glass-white)]'
                  }`}
                  onClick={() => {
                    setSelectedTeam(team.id)
                    setError('')
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {team.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              className="text-[var(--disagree-red)] text-sm text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            className="btn-primary w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ENTER ARENA
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
