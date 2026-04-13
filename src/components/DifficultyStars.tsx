'use client'

import { motion } from 'framer-motion'
import type { TopicDifficulty } from '@/lib/types'

interface DifficultyStarsProps {
  difficulty: TopicDifficulty
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function DifficultyStars({ difficulty, size = 'md', animate = true }: DifficultyStarsProps) {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((star) => (
        <motion.div
          key={star}
          className={`pixel-star ${sizeMap[size]} ${star > difficulty ? 'pixel-star-empty' : ''}`}
          initial={animate ? { scale: 0, rotate: 0 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.2,
            delay: star * 0.1,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
