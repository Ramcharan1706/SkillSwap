import React from 'react'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  interactive?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, interactive = false }) => {
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1)
    }
  }

  return (
    <div className="flex gap-1" style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3)' }}>
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <span
            key={i}
            className={`${interactive ? 'cursor-pointer' : ''} transition-transform duration-150`}
            onClick={() => handleClick(i)}
            style={{ fontSize: '2rem', userSelect: 'none' }}
            aria-label={`Rate ${i + 1}`}
          >
            {i < rating ? '🌟' : '☆'}
          </span>
        ))}
    </div>
  )
}

export default StarRating
