'use client'

import { motion } from 'framer-motion'
import { FastForward, SkipForward } from 'lucide-react'

interface SkipButtonProps {
  onClick: () => void
  label?: string
  variant?: 'skip' | 'next'
  size?: 'sm' | 'md' | 'lg'
}

export function SkipButton({ onClick, label, variant = 'next', size = 'md' }: SkipButtonProps) {
  const Icon = variant === 'skip' ? FastForward : SkipForward
  const defaultLabel = variant === 'skip' ? 'SKIP TIMER' : 'NEXT'

  const sizeClasses = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  }

  const iconSizes = { sm: 16, md: 20, lg: 24 }

  return (
    <motion.button
      className={`inline-flex items-center gap-2 rounded-lg font-bold uppercase tracking-wider transition-all ${sizeClasses[size]}`}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: variant === 'skip'
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))'
          : 'linear-gradient(135deg, var(--spotlight-gold), var(--spotlight-amber))',
        color: variant === 'skip' ? 'var(--text-primary)' : 'var(--stage-dark)',
        border: variant === 'skip' ? '1px solid var(--glass-border)' : 'none',
        boxShadow: variant === 'skip'
          ? '0 2px 10px rgba(0, 0, 0, 0.2)'
          : '0 4px 20px rgba(255, 215, 0, 0.3)',
      }}
    >
      <Icon size={iconSizes[size]} />
      <span>{label || defaultLabel}</span>
    </motion.button>
  )
}
