import React from 'react'

interface BadgeProps {
  text: string
}
const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <span className="inline-block bg-blue-800/10 text-white text-xs font-semibold px-2 py-1 rounded-full border border-blue-800/30" style={{ background: '#1e40af' }}>
      {text}
    </span>
  )
}

export default Badge
