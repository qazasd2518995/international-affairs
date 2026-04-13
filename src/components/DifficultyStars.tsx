'use client'

import { motion } from 'framer-motion'
import type { TopicDifficulty } from '@/lib/types'

interface DifficultyStarsProps {
  difficulty: TopicDifficulty
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function DifficultyStars({ difficulty, size = 'md', animate = true }: DifficultyStarsProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className="difficulty-stars">
      {[1, 2, 3].map((star) => (
        <motion.svg
          key={star}
          className={`${sizeClasses[size]} ${star <= difficulty ? 'star' : 'star star-empty'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          initial={animate ? { scale: 0, rotate: -180 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            delay: star * 0.1,
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </motion.svg>
      ))}
    </div>
  )
}
