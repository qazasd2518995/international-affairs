'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Pixel {
  left: number
  top: number
  size: number
  color: string
  delay: number
  duration: number
}

export function StageBackground() {
  const [pixels, setPixels] = useState<Pixel[]>([])

  useEffect(() => {
    const colors = ['#39ff14', '#ff00aa', '#ffcc00', '#00fff0', '#ff0040', '#0080ff']
    const newPixels: Pixel[] = Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: [2, 3, 4, 6][Math.floor(Math.random() * 4)],
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }))
    setPixels(newPixels)
  }, [])

  return (
    <>
      {/* Deep arcade background */}
      <div className="arcade-bg" />

      {/* Pixel grid */}
      <div className="arcade-grid" />

      {/* Floating pixel sparkles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {pixels.map((p, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
            animate={{
              opacity: [0, 1, 0],
              y: [0, -20, -40],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* CRT scanlines */}
      <div className="scanlines" />

      {/* CRT vignette */}
      <div className="crt-vignette" />
    </>
  )
}
