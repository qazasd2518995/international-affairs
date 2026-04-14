'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Topic, LiveArgument } from '@/lib/types'

interface ArgumentInputProps {
  topic: Topic
  stance: 'agree' | 'disagree'
  teamName: string
  playerId: string
  teamId: string
  matchId: string
  liveArguments: LiveArgument[]  // only this team's contributions, sorted by time
  onSubmit: (content: string) => void
}

export function ArgumentInput({
  topic,
  stance,
  teamName,
  playerId,
  teamId,
  liveArguments,
  onSubmit,
}: ArgumentInputProps) {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const stanceColor = stance === 'agree' ? 'text-neon-green' : 'text-neon-red'
  const stanceLabel = stance === 'agree' ? 'AGREE' : 'DISAGREE'
  const stanceBorder = stance === 'agree' ? 'pixel-panel-neon' : 'pixel-panel-pink'

  const myArgs = liveArguments.filter((a) => a.playerId === playerId)
  const teamArgs = liveArguments

  // Auto-scroll to newest when a live argument arrives
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [teamArgs.length])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(content)
      setDraft('')
    } finally {
      setSubmitting(false)
    }
  }

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

        <div className="dialogue-box mb-4">
          <p className="font-terminal text-terminal-base">
            {topic.question}
          </p>
        </div>

        {/* Live team argument feed */}
        <div className="mb-4">
          <p className="font-pixel text-pixel-sm text-neon-yellow mb-2">
            ► TEAM ATTACKS ({teamArgs.length})
          </p>
          <div
            ref={listRef}
            className="pixel-panel-sm pixel-panel max-h-48 overflow-y-auto"
            style={{ minHeight: 80 }}
          >
            {teamArgs.length === 0 ? (
              <p className="font-terminal text-terminal-base text-text-muted text-center py-4">
                &gt; No attacks yet. Be the first!
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {teamArgs.map((arg) => {
                  const isMine = arg.playerId === playerId
                  return (
                    <motion.div
                      key={arg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="py-1"
                    >
                      <span className={`font-pixel text-pixel-sm ${isMine ? 'text-neon-green' : 'text-neon-cyan'} mr-2`}>
                        {arg.playerName || '...'}:
                      </span>
                      <span className="font-terminal text-terminal-base text-text-white">
                        {arg.content}
                      </span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Input box — single-line, Enter to send, keeps accepting new ones */}
        <div>
          <label className="block font-pixel text-pixel-sm text-neon-yellow mb-2">
            <span className="rpg-cursor">►</span> ADD AN ATTACK
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="pixel-input flex-1"
              placeholder="Type an argument and press ENTER..."
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <motion.button
              className="pixel-btn pixel-btn-green"
              onClick={handleSend}
              disabled={!draft.trim() || submitting}
              whileTap={{ scale: 0.95 }}
            >
              SEND
            </motion.button>
          </div>
          <p className="font-pixel text-pixel-sm text-text-muted mt-1 text-right">
            You sent {myArgs.length} · {draft.length}/200
          </p>
          <p className="font-terminal text-terminal-base text-text-dim mt-2">
            &gt; Add as many as you want. All your team&apos;s attacks go to the AI judge when prep ends.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
