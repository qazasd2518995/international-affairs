'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function Logo({ size = 'md', animate = true }: LogoProps) {
  const sizeMap = {
    sm: { title: 'text-sm md:text-base', sub: 'text-xs' },
    md: { title: 'text-lg md:text-2xl', sub: 'text-xs md:text-sm' },
    lg: { title: 'text-xl md:text-4xl', sub: 'text-sm md:text-base' },
  }
  const s = sizeMap[size]

  return (
    <div className="text-center">
      <motion.div
        className="inline-block"
        initial={animate ? { opacity: 0, y: -20, scale: 0.8 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'linear' }}
      >
        <div className={`font-pixel ${s.title} leading-tight`}>
          <motion.span
            className="neon-glow-pink inline-block"
            animate={animate ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            MINI
          </motion.span>
          <span className="text-text-white mx-2"> </span>
          <motion.span
            className="neon-glow-yellow inline-block"
            animate={animate ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear', delay: 0.2 }}
          >
            DEBATE
          </motion.span>
          <br />
          <motion.span
            className="neon-glow-green inline-block"
            animate={animate ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear', delay: 0.4 }}
          >
            ARENA
          </motion.span>
        </div>
      </motion.div>

      <motion.p
        className={`font-pixel ${s.sub} text-neon-cyan mt-4 tracking-[0.3em]`}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        &lt; PRESS START &gt;
      </motion.p>
    </div>
  )
}
