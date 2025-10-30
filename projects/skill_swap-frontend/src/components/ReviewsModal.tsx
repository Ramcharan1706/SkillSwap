import React from 'react'
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
  availability: string[]
  feedbacks: Feedback[]
}

interface ReviewsModalProps {
  skill: Skill
  onClose: () => void
}
const ReviewsModal: React.FC<ReviewsModalProps> = ({ skill, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reviews for {skill.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Overall Rating: <StarRating rating={skill.rating} /> ({skill.feedbacks.length} reviews)</p>
        </div>
        {skill.feedbacks.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {skill.feedbacks.map(feedback => (
              <div key={feedback.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{feedback.student.slice(0, 10)}...</span>
                  <span className="text-sm text-gray-500">{feedback.date}</span>
                </div>
                <div className="mb-2">
                  <StarRating rating={feedback.rating} />
                </div>
                <p className="text-gray-700">{feedback.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewsModal
