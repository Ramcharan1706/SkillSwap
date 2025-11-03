import React, { useState } from 'react'
import StarRating from './StarRating'

interface Feedback {
  id: number
  student: string
  rating: number
  comment: string
  date: string
}

interface Skill {
  id: number
  name: string
  description: string
  teacher: string
  rate: number
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  sessionsCompleted: number
  rating: number
  availability: { slot: string; link: string }[]
  feedbacks: Feedback[]
}

interface ReviewModalProps {
  skillId: number
  skill?: Skill
  mode?: 'submit' | 'view'
  onClose: () => void
  onSubmit: (skillId: number, review: { rating: number; comment: string }) => void
}

const ReviewModal: React.FC<ReviewModalProps> = ({ skillId, skill, mode = 'submit', onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'submit' | 'view'>(mode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating > 0 && comment.trim()) {
      setLoading(true)
      try {
        await onSubmit(skillId, { rating, comment })
        onClose()
      } catch (error) {
        console.error('Failed to submit review:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const renderSubmitForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 bg-transparent">
        <label className="block text-sm font-medium mb-3 text-center">Rating</label>
        <div className="center-content">
          <StarRating rating={rating} onChange={setRating} interactive />
        </div>
      </div>
      <div className="mb-6 bg-transparent">
        <label className="block text-sm font-medium mb-3 text-center">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-white/30 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white/10 text-white placeholder-white/50"
          rows={4}
          required
        />
      </div>
      <div className="btn-group bg-transparent">
        <button type="submit" disabled={loading} className="btn btn-primary btn-small disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" onClick={onClose} className="btn btn-warning btn-small">
          Cancel
        </button>
      </div>
    </form>
  )

  const renderReviewsView = () => (
    <div>
      <div className="mb-4">
        <p className="text-sm text-white/70 text-center">Overall Rating: <StarRating rating={skill?.rating || 0} /> ({skill?.feedbacks.length || 0} reviews)</p>
      </div>
      {skill?.feedbacks.length === 0 ? (
        <p className="text-white/70 text-center">No reviews yet.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {skill?.feedbacks.map(feedback => (
            <div key={feedback.id} className="border-b border-white/20 pb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">{feedback.student.slice(0, 10)}...</span>
                <span className="text-sm text-white/70">{feedback.date}</span>
              </div>
              <div className="mb-2">
                <StarRating rating={feedback.rating} />
              </div>
              <p className="text-white/90">{feedback.comment}</p>
            </div>
          ))}
        </div>
      )}
      <div className="btn-group mt-6">
        <button onClick={() => setViewMode('submit')} className="btn btn-primary btn-small">
          Leave Review
        </button>
        <button type="button" onClick={onClose} className="btn btn-warning btn-small">
          Close
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 center-both z-50" style={{ background: '#1e40af' }}>
      <div className="card max-w-md w-full bg-blue-800/10 text-white border border-blue-800/30">
        <h2 className="text-xl font-bold mb-6 text-center">
          {viewMode === 'submit' ? 'Submit Review' : `Reviews for ${skill?.name || 'Skill'}`}
        </h2>
        {viewMode === 'submit' ? renderSubmitForm() : renderReviewsView()}
      </div>
    </div>
  )
}

export default ReviewModal
