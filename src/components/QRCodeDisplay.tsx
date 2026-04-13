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
      className="inline-block p-4 bg-white rounded-2xl"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        marginSize={2}
        fgColor="#0a0c14"
        bgColor="#ffffff"
      />
    </motion.div>
  )
}
