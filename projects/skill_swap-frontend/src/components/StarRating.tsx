import React from 'react'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  interactive?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = React.useState(0)

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1)
    }
  }

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  return (
    <div className="flex">
      {Array(5).fill(0).map((_, i) => (
        <span
          key={i}
          className={`${interactive ? 'cursor-pointer' : ''} ${i < (hoverRating || rating) ? 'text-yellow-500' : 'text-gray-300'} transition-colors duration-150`}
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          style={{ userSelect: 'none' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating
