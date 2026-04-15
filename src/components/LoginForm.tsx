'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface LoginFormProps {
  // Real class-group numbers (e.g. [1, 3, 4, 5, 6, 7]). We skip our own
  // presenter group (2), so the list isn't always contiguous.
  teamNumbers: number[]
  onLogin: (name: string, teamId: string) => void
}

export function LoginForm({ teamNumbers, onLogin }: LoginFormProps) {
  const [name, setName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('ENTER YOUR NAME')
      return
    }
    if (!selectedTeam) {
      setError('SELECT YOUR GROUP')
      return
    }
    onLogin(name.trim(), selectedTeam)
  }

  const teams = teamNumbers.map((n) => ({
    id: `team-${n}`,
    name: `GROUP ${n}`,
  }))

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'linear' }}
    >
      <div className="pixel-panel pixel-panel-neon">
        <div className="text-center mb-6">
          <p className="font-pixel text-pixel-base neon-glow-green">
            ★ NEW CHALLENGER ★
          </p>
          <div className="mt-2 h-[2px] bg-neon-green" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label className="block font-pixel text-pixel-sm text-neon-yellow mb-3">
              <span className="rpg-cursor">►</span> NAME?
            </label>
            <input
              type="text"
              className="pixel-input"
              placeholder="ENTER NAME..."
              value={name}
              onChange={(e) => {
                setName(e.target.value.toUpperCase())
                setError('')
              }}
              maxLength={12}
            />
            <p className="font-pixel text-pixel-sm text-text-muted mt-1 text-right">
              {name.length}/12
            </p>
          </div>

          {/* Team selection - pokemon battle menu style */}
          <div>
            <label className="block font-pixel text-pixel-sm text-neon-yellow mb-3">
              <span className="rpg-cursor">►</span> CHOOSE PARTY
            </label>
            <div className="grid grid-cols-2 gap-3">
              {teams.map((team) => (
                <motion.button
                  key={team.id}
                  type="button"
                  className={`pokemon-option ${selectedTeam === team.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTeam(team.id)
                    setError('')
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {team.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              className="font-pixel text-pixel-sm text-neon-red text-center animate-shake"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ※ {error} ※
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            className="pixel-btn pixel-btn-green w-full"
            whileTap={{ scale: 0.97 }}
          >
            ► START BATTLE ◄
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
