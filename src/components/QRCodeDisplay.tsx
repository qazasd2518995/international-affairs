'use client'

import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'

interface QRCodeDisplayProps {
  url: string
  size?: number
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  return (
    <motion.div
      className="inline-block"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'linear' }}
    >
      <div
        className="p-6 bg-white"
        style={{
          boxShadow: `
            0 0 0 3px var(--arcade-void),
            0 0 0 6px var(--neon-green),
            0 0 0 9px var(--arcade-void),
            0 0 0 12px var(--neon-green),
            0 0 30px rgba(57, 255, 20, 0.4)
          `,
        }}
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          marginSize={0}
          fgColor="#0a0a2e"
          bgColor="#ffffff"
        />
      </div>
    </motion.div>
  )
}
