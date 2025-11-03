import React, { useState } from 'react'

interface Skill {
  id: number
  name: string
  description: string
  teacher: string
  receiver: string
  rate: number
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  sessionsCompleted: number
  rating: number
  availability: string[]
  feedbacks: any[]
}

interface SkillRegistrationFormProps {
  onRegister: (newSkill: Skill) => void
  loading: boolean
  userAddress: string
}

const SKILL_CATEGORIES = [
  'Programming', 'Music', 'Coding', 'Languages', 'Art', 'Sports', 'Cooking',
  'Photography', 'Writing', 'Business', 'Science', 'Design', 'Other'
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const SkillRegistrationForm: React.FC<SkillRegistrationFormProps> = ({ onRegister, loading, userAddress }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    receiver: '',
    rate: '',
    category: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    availability: [] as string[]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvailabilityChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSkill: Skill = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      teacher: userAddress,
      receiver: formData.receiver,
      rate: Number(formData.rate),
      category: formData.category,
      level: formData.level,
      sessionsCompleted: 0,
      rating: 0,
      availability: formData.availability,
      feedbacks: []
    }
    onRegister(newSkill)
    setFormData({
      name: '',
      description: '',
      receiver: '',
      rate: '',
      category: '',
      level: 'Beginner',
      availability: []
    })
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div
      className="card card-centered w-full text-white border border-white/20"
      style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3)' }}
    >
      <h2 className="text-2xl font-bold mb-8 text-center">Register New Skill</h2>

      <form onSubmit={handleSubmit} className="form-container">
        {/* Skill Name */}
        <div>
          <label className="form-label">Skill Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter skill name"
            required
          />
        </div>

        {/* Receiver Wallet Address */}
        <div>
          <label className="form-label">Receiver Wallet Address</label>
          <input
            type="text"
            name="receiver"
            value={formData.receiver}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter receiver wallet address"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Describe your skill"
            rows={3}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select Category</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label className="form-label">Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="form-select"
            required
          >
            {SKILL_LEVELS.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Rate */}
        <div>
          <label className="form-label">Rate ($)</label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            className="form-input"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>

        {/* Availability */}
        <div>
          <label className="form-label">Availability</label>
          <div className="availability-group">
            {daysOfWeek.map(day => (
              <label key={day} className="availability-day">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(day)}
                  onChange={() => handleAvailabilityChange(day)}
                  className="accent-purple-500"
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-submit">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-large glowing disabled:opacity-50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            {loading ? 'Registering...' : 'Register Skill'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SkillRegistrationForm
