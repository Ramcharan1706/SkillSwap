import React, { useState } from 'react'

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
  feedbacks: any[]
}

interface SkillRegistrationFormProps {
  onRegister: (newSkill: Skill) => void
  loading: boolean
  userAddress: string
}

const SKILL_CATEGORIES = [
  'Programming', 'Music', 'Languages', 'Art', 'Sports', 'Cooking',
  'Photography', 'Writing', 'Business', 'Science', 'Design', 'Other', 'Coding'
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const SkillRegistrationForm: React.FC<SkillRegistrationFormProps> = ({ onRegister, loading, userAddress }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
      rate: '',
      category: '',
      level: 'Beginner',
      availability: []
    })
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Register New Skill</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Skill Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            rows={3}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">Select Category</option>
            {SKILL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          >
            {SKILL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rate ($)</label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Availability</label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(day)}
                  onChange={() => handleAvailabilityChange(day)}
                  className="mr-1"
                />
                {day}
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register Skill'}
        </button>
      </form>
    </div>
  )
}

export default SkillRegistrationForm
