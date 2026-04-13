'use client'

import { motion } from 'framer-motion'

interface SkipButtonProps {
  onClick: () => void
  label?: string
  variant?: 'skip' | 'next'
  size?: 'sm' | 'md' | 'lg'
}

export function SkipButton({ onClick, label, variant = 'next' }: SkipButtonProps) {
  const defaultLabel = variant === 'skip' ? 'SKIP' : 'NEXT'

  return (
    <motion.button
      className={`pixel-btn ${variant === 'skip' ? 'pixel-btn-ghost' : 'pixel-btn-cyan'}`}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      <span>{variant === 'skip' ? '»' : '►'}</span>
      <span>{label || defaultLabel}</span>
    </motion.button>
  )
}
