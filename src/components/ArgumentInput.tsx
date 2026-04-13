'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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

  const stanceColor = stance === 'agree' ? 'text-neon-green' : 'text-neon-red'
  const stanceLabel = stance === 'agree' ? 'AGREE' : 'DISAGREE'
  const stanceBorder = stance === 'agree' ? 'pixel-panel-neon' : 'pixel-panel-pink'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className={`pixel-panel ${stanceBorder}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-4">
          <p className={`font-pixel text-pixel-base ${stanceColor}`}>
            ◆ {teamName.toUpperCase()} ◆
          </p>
          <div className="mt-2">
            <span className={`pixel-tag ${stance === 'agree' ? 'pixel-tag-green' : 'pixel-tag-red'}`}>
              YOUR STANCE: {stanceLabel}
            </span>
          </div>
        </div>

        <div className="dialogue-box mb-6">
          <p className="font-terminal text-terminal-base">
            {topic.question}
          </p>
        </div>

        {!submitted ? (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-pixel text-pixel-sm text-neon-yellow mb-2">
                  <span className="rpg-cursor">►</span> ARGUMENT 1 *REQUIRED
                </label>
                <textarea
                  className="pixel-input min-h-[80px] resize-none"
                  placeholder="TYPE YOUR MAIN ARGUMENT..."
                  value={arg1}
                  onChange={(e) => setArg1(e.target.value)}
                  maxLength={300}
                />
                <p className="font-pixel text-pixel-sm text-text-muted mt-1 text-right">
                  {arg1.length}/300
                </p>
              </div>

              <div>
                <label className="block font-pixel text-pixel-sm text-neon-yellow mb-2">
                  <span className="rpg-cursor">►</span> ARGUMENT 2 *OPTIONAL
                </label>
                <textarea
                  className="pixel-input min-h-[60px] resize-none"
                  placeholder="TYPE YOUR BACKUP ARGUMENT..."
                  value={arg2}
                  onChange={(e) => setArg2(e.target.value)}
                  maxLength={200}
                />
                <p className="font-pixel text-pixel-sm text-text-muted mt-1 text-right">
                  {arg2.length}/200
                </p>
              </div>
            </div>

            <motion.button
              className="pixel-btn pixel-btn-green w-full"
              onClick={handleSubmit}
              disabled={!arg1.trim()}
              whileTap={{ scale: 0.97 }}
            >
              ► SAVE ATTACKS ◄
            </motion.button>
          </>
        ) : (
          <motion.div
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="font-pixel text-pixel-lg neon-glow-green mb-4">
              ★ ATTACKS SAVED ★
            </div>
            <p className="font-terminal text-terminal-base text-text-dim">
              &gt; Practice your battle cry...
            </p>

            <div className="mt-6 text-left pixel-panel-sm pixel-panel">
              <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">YOUR MOVES:</p>
              <ul className="space-y-2 font-terminal text-terminal-base">
                <li>► {arg1}</li>
                {arg2 && <li>► {arg2}</li>}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
