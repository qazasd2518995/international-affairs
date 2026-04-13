'use client'

import { motion } from 'framer-motion'
import type { TopicCategory } from '@/lib/types'
import { CATEGORY_INFO } from '@/lib/types'

const CATEGORY_COLORS: Record<TopicCategory, string> = {
  'global-politics': 'pixel-tag-pink',
  'everyday-life': 'pixel-tag-yellow',
  'history-heritage': 'pixel-tag-cyan',
  'tech-future': 'pixel-tag-green',
  'travel-etiquette': 'pixel-tag-blue',
}

const CATEGORY_SYMBOLS: Record<TopicCategory, string> = {
  'global-politics': '◆',
  'everyday-life': '♥',
  'history-heritage': '♠',
  'tech-future': '▲',
  'travel-etiquette': '►',
}

interface CategoryTagProps {
  category: TopicCategory
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryTag({ category, size = 'md' }: CategoryTagProps) {
  const info = CATEGORY_INFO[category]
  const colorClass = CATEGORY_COLORS[category]
  const symbol = CATEGORY_SYMBOLS[category]

  return (
    <motion.span
      className={`pixel-tag ${colorClass}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'linear' }}
    >
      <span>{symbol}</span>
      <span>{info.label.toUpperCase()}</span>
    </motion.span>
  )
}
