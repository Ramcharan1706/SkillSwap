import React, { useState } from 'react'
import StarRating from './StarRating'

interface ReviewModalProps {
  skillId: number
  onClose: () => void
  onSubmit: (skillId: number, review: { rating: number; comment: string }) => void
}

const ReviewModal: React.FC<ReviewModalProps> = ({ skillId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating > 0 && comment.trim()) {
      onSubmit(skillId, { rating, comment })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Submit Review</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <StarRating rating={rating} onChange={setRating} interactive />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Submit
            </button>
            <button type="button" onClick={onClose} className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewModal
