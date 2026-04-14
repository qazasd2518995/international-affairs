'use client'

// /display is a legacy route. The admin console now contains everything
// display used to show (big QR code in lobby, big topic reveal, debate
// card, countdowns, leaderboard, awards), so the host can just project
// /admin and control the flow at the same time. Keep a redirect here
// in case a bookmark or old link points to /display.
import { useEffect } from 'react'

export default function DisplayPage() {
  useEffect(() => {
    window.location.replace('/admin')
  }, [])
  return null
}
