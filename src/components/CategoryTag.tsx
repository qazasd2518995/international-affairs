'use client'

import { motion } from 'framer-motion'
import { Globe2, UtensilsCrossed, Landmark, Cpu, Plane } from 'lucide-react'
import type { TopicCategory } from '@/lib/types'
import { CATEGORY_INFO } from '@/lib/types'

const CATEGORY_ICONS: Record<TopicCategory, typeof Globe2> = {
  'global-politics': Globe2,
  'everyday-life': UtensilsCrossed,
  'history-heritage': Landmark,
  'tech-future': Cpu,
  'travel-etiquette': Plane,
}

interface CategoryTagProps {
  category: TopicCategory
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryTag({ category, size = 'md' }: CategoryTagProps) {
  const info = CATEGORY_INFO[category]
  const Icon = CATEGORY_ICONS[category]

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  return (
    <motion.span
      className={`category-tag ${sizeClasses[size]}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Icon size={iconSizes[size]} className="text-[var(--spotlight-gold)]" />
      <span>{info.label}</span>
    </motion.span>
  )
}
