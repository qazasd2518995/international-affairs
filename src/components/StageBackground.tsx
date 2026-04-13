'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  width: number
  height: number
  left: number
  top: number
  opacity: number
  duration: number
  delay: number
}

export function StageBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 20 }, () => ({
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.3 + 0.1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <>
      {/* Main gradient background */}
      <div className="stage-background" />

      {/* Animated grid */}
      <div className="stage-grid" />

      {/* Floating particles - client only to avoid hydration mismatch */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.width,
              height: p.height,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: `rgba(255, 215, 0, ${p.opacity})`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </>
  )
}
