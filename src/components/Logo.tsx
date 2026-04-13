'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function Logo({ size = 'md', animate = true }: LogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl md:text-5xl',
    lg: 'text-5xl md:text-7xl',
  }

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base md:text-lg',
  }

  return (
    <div className="text-center">
      <motion.h1
        className={`title-display title-glow ${sizeClasses[size]}`}
        initial={animate ? { opacity: 0, y: -20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span className="text-white">MINI</span>{' '}
        <span className="text-shimmer">DEBATE</span>{' '}
        <span className="text-white">ARENA</span>
      </motion.h1>

      <motion.p
        className={`${subtitleSizes[size]} text-[var(--text-secondary)] tracking-[0.3em] uppercase mt-2`}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        Vote • Prepare • Debate • Score
      </motion.p>
    </div>
  )
}
