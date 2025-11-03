import React from 'react'

interface BadgeProps {
  text: string
}
const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3)' }}>
      {text}
    </span>
  )
}

export default Badge
