'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { Topic } from '@/lib/types'

interface ArgumentInputProps {
  topic: Topic
  stance: 'agree' | 'disagree'
  teamName: string
  onSubmit: (args: string[]) => void
}

export function ArgumentInput({ topic, stance, teamName, onSubmit }: ArgumentInputProps) {
  const [arg1, setArg1] = useState('')
  const [arg2, setArg2] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    const args = [arg1, arg2].filter(Boolean)
    if (args.length > 0) {
      setSubmitted(true)
      onSubmit(args)
    }
  }

  const stanceColor = stance === 'agree' ? 'var(--agree-green)' : 'var(--disagree-red)'
  const stanceLabel = stance === 'agree' ? 'AGREE' : 'DISAGREE'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="glass-card-strong p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderColor: stanceColor, borderWidth: 2 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="title-display text-2xl" style={{ color: stanceColor }}>
            {teamName}
          </h3>
          <span
            className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold"
            style={{ backgroundColor: `${stanceColor}20`, color: stanceColor }}
          >
            {stanceLabel}
          </span>
        </div>

        {/* Topic reminder */}
        <div className="glass-card p-4 mb-6">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            {topic.question}
          </p>
        </div>

        {/* Argument inputs */}
        {!submitted ? (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Argument 1 (Required)
                </label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Enter your main argument..."
                  value={arg1}
                  onChange={(e) => setArg1(e.target.value)}
                  maxLength={300}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                  {arg1.length}/300
                </p>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Argument 2 (Optional)
                </label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Add a supporting argument..."
                  value={arg2}
                  onChange={(e) => setArg2(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                  {arg2.length}/200
                </p>
              </div>
            </div>

            <motion.button
              className="btn-primary w-full"
              onClick={handleSubmit}
              disabled={!arg1.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SUBMIT ARGUMENTS
            </motion.button>
          </>
        ) : (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={56} className="text-[var(--agree-green)]" strokeWidth={2} />
            </div>
            <h4 className="text-xl font-bold text-[var(--spotlight-gold)]">
              Arguments Submitted!
            </h4>
            <p className="text-[var(--text-secondary)] mt-2">
              Practice your delivery while waiting...
            </p>

            {/* Show submitted arguments */}
            <div className="mt-6 text-left glass-card p-4">
              <p className="text-sm text-[var(--text-muted)] mb-2">Your arguments:</p>
              <ul className="space-y-2">
                <li className="text-sm">1. {arg1}</li>
                {arg2 && <li className="text-sm">2. {arg2}</li>}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
