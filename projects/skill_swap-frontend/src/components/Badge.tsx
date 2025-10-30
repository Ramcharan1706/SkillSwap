import React from 'react'

interface BadgeProps {
  text: string
}
const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
      {text}
    </span>
  )
}

export default Badge
