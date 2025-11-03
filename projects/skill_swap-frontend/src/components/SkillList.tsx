import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'

import StarRating from './StarRating'
import Badge from './Badge'
import ReviewModal from './ReviewModal'

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
  receiver: string
  rate: number
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  sessionsCompleted: number
  rating: number
  availability: { slot: string; link: string }[]
  feedbacks: Feedback[]
}

interface SkillListProps {
  onBookSkill: (skillId: number, skillRate: number, selectedSlot: { slot: string; link: string }) => void
  onOpenReviewModal: (skillId: number) => void
  algorandClient: AlgorandClient
  userAddress: string
  bookedSlots?: { skillId: number; slot: string }[]
}

const PAYMENT_AMOUNT_ALGO = 0.1
const PAYMENT_RECEIVER_ADDRESS = '2ZTFJNDXPWDETGJQQN33HAATRHXZMBWESKO2AUFZUHERH2H3TG4XTNPL4Y'

const SKILL_CATEGORIES = [
  'Programming', 'Music', 'Languages', 'Art', 'Sports', 'Cooking',
  'Photography', 'Writing', 'Business', 'Science', 'Design', 'Other'
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const calculateNewRating = (currentRating: number, feedbackCount: number, newRating: number) =>
  Math.round(((currentRating * feedbackCount + newRating) / (feedbackCount + 1)) * 10) / 10



const SkillList: React.FC<SkillListProps> = ({ onBookSkill, onOpenReviewModal, algorandClient, userAddress, bookedSlots = [] }) => {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [reviewModal, setReviewModal] = useState<{ skillId: number; isOpen: boolean; skill?: Skill; mode: 'submit' | 'view' }>({ skillId: 0, isOpen: false, mode: 'submit' })

  const [form, setForm] = useState({
    name: '',
    description: '',
    receiver: '',
    rate: '',
    category: '',
    level: 'Beginner' as const,
    availability: [] as { slot: string; link: string }[]
  })

  const [filters, setFilters] = useState({ category: '', level: '', minRate: '', maxRate: '' })
  const { transactionSigner, activeAccount } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch skills (mock)
  const fetchSkills = async () => {
    setLoading(true)
    try {
      const mockSkills: Skill[] = [
        {
          id: 1,
          name: 'React Development Workshop',
          description: 'Learn React with hooks and modern practices.',
          teacher: 'ALICE1234567890123456789012345678901234567890',
          receiver: 'ALICE1234567890123456789012345678901234567890',
          rate: 25,
          category: 'Programming',
          level: 'Intermediate',
          sessionsCompleted: 12,
          rating: 4.3,
          availability: [
            { slot: 'Monday 10 AM', link: 'https://meet.google.com/abc-defg-hij' },
            { slot: 'Wednesday 2 PM', link: 'https://meet.google.com/klm-nopq-rst' }
          ],
          feedbacks: [
            { id: 1, student: 'BOB123...', rating: 5, comment: 'Excellent session!', date: '2024-01-10' }
          ]
        }
      ]
      setSkills(mockSkills)
    } catch {
      enqueueSnackbar('Failed to fetch skills.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  // Validation
  const validateForm = () => {
    if (!form.name || !form.description || !form.rate || !form.category) {
      enqueueSnackbar('All fields are required.', { variant: 'warning' })
      return false
    }
    if (isNaN(Number(form.rate)) || Number(form.rate) <= 0) {
      enqueueSnackbar('Rate must be a positive number.', { variant: 'warning' })
      return false
    }
    if (!form.availability.length) {
      enqueueSnackbar('Add at least one time slot.', { variant: 'warning' })
      return false
    }
    if (!userAddress || !transactionSigner) {
      enqueueSnackbar('Please connect your wallet and ensure it is active.', { variant: 'warning' })
      return false
    }
    for (const a of form.availability) {
      if (!a.slot) {
        enqueueSnackbar('Each slot must have a valid time.', { variant: 'warning' })
        return false
      }
    }
    return true
  }

  // Payment
  const sendPayment = async () => {
    if (!transactionSigner || !userAddress) throw new Error('Wallet not connected')

    enqueueSnackbar(`Sending payment of ${PAYMENT_AMOUNT_ALGO} ALGO...`, { variant: 'info' })
    try {
      const result = await algorandClient.send.payment({
        sender: userAddress,
        receiver: PAYMENT_RECEIVER_ADDRESS,
        amount: algo(PAYMENT_AMOUNT_ALGO),
        signer: transactionSigner,
      })
      enqueueSnackbar(`Payment successful! TxID: ${result.txIds[0]}`, { variant: 'success' })
      return result.txIds[0]
    } catch (error: any) {
      enqueueSnackbar(`Payment failed: ${error?.message || error}`, { variant: 'error' })
      throw error
    }
  }

  // Register skill
  const registerSkillOnChain = async (): Promise<Skill> => {
    const mockSkillId = Math.floor(Math.random() * 1000) + 1
    return {
      id: mockSkillId,
      name: form.name,
      description: form.description,
      teacher: userAddress,
      receiver: form.receiver,
      rate: Number(form.rate),
      category: form.category,
      level: form.level,
      sessionsCompleted: 0,
      rating: 0,
      availability: form.availability,
      feedbacks: [],
    }
  }

  const handleRegisterSkill = async () => {
    if (!validateForm()) return
    setRegisterLoading(true)
    try {
      await sendPayment()
      const newSkill = await registerSkillOnChain()
      setSkills(prev => [...prev, newSkill])
      setForm({ name: '', description: '', receiver: '', rate: '', category: '', level: 'Beginner', availability: [] })
      enqueueSnackbar('Skill registered successfully!', { variant: 'success' })
    } finally {
      setRegisterLoading(false)
    }
  }

  // Add/remove slot inputs
  const handleAddSlot = () => {
    setForm(prev => ({ ...prev, availability: [...prev.availability, { slot: '', link: '' }] }))
  }

  const handleRemoveSlot = (index: number) => {
    setForm(prev => ({ ...prev, availability: prev.availability.filter((_, i) => i !== index) }))
  }

  const handleSlotChange = (index: number, slot: string, link: string) => {
    setForm(prev => ({
      ...prev,
      availability: prev.availability.map((a, i) =>
        i === index ? { slot, link } : a
      ),
    }))
  }

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = skills.filter(skill =>
      (!filters.category || skill.category === filters.category) &&
      (!filters.level || skill.level === filters.level) &&
      (!filters.minRate || skill.rate >= Number(filters.minRate)) &&
      (!filters.maxRate || skill.rate <= Number(filters.maxRate))
    )

    // Sort by rating (highest first), then by sessions completed
    filtered.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }
      return b.sessionsCompleted - a.sessionsCompleted
    })

    return filtered
  }, [skills, filters])

  return (
    <div className="w-full mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh] " style={{ background: '#1e40af' }}>
      {/* Filters */}
      <div className="mb-8 w-full flex flex-wrap gap-4 justify-center">
        <select value={filters.category} onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))} className="border border-white/30 bg-white/10 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm">
          <option value="" className="bg-gray-800">All Categories</option>
          {SKILL_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
        </select>
        <select value={filters.level} onChange={e => setFilters(prev => ({ ...prev, level: e.target.value }))} className="border border-white/30 bg-white/10 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm">
          <option value="" className="bg-gray-800">All Levels</option>
          {SKILL_LEVELS.map(level => <option key={level} value={level} className="bg-gray-800">{level}</option>)}
        </select>
      </div>

      {/* Skill Cards */}
      <div className="w-full flex flex-col gap-6 mb-10">
        {loading ? (
          <p className="center-content text-lg">Loading skills...</p>
        ) : filteredSkills.length === 0 ? (
          <p className="center-content text-lg">No skills found.</p>
        ) : filteredSkills.map(skill => (
          <div key={skill.id} className="card card-centered transform hover:scale-105 transition-all duration-300 w-full">
            <h3 className="text-2xl font-bold mb-3 text-center text-white">{skill.name}</h3>
            <p className="text-gray-700 text-lg mb-4 text-center font-medium">{skill.description}</p>
            <div className="center-content mb-3">
              <Badge text={skill.category} />
            </div>
            <div className="grid grid-cols-2 gap-6 mb-4 text-lg">
              <p className="text-center font-semibold"><strong>Level:</strong> <span className="text-white">{skill.level}</span></p>
              <p className="text-center font-semibold"><strong>Rate:</strong> <span className="text-white">${skill.rate}</span></p>
            </div>
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold"><strong>Receiver Address:</strong></p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{skill.receiver}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(skill.receiver)}
                  className="text-blue-500 hover:text-blue-700 font-bold"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="center-content mb-4">
              <p className="text-lg font-medium">Rating: <StarRating rating={skill.rating} /> ({skill.feedbacks.length})</p>
            </div>

            <div className="mt-4 text-lg">
              <p className="font-bold text-center mb-3 text-xl">Availability:</p>
              <ul className="space-y-2">
                {skill.availability.map((a, idx) => {
                  const isBooked = bookedSlots.some(bs => bs.skillId === skill.id && bs.slot === a.slot)
                  return (
                    <li key={idx} className="text-center bg-gray-50 p-3 rounded-2xl border-2 border-gray-200">
                      <span className="font-semibold text-lg">{a.slot}</span>
                      {isBooked && (
                        <>
                          {' — '}
                          <a href={a.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold text-lg">
                            Join Meeting
                          </a>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="btn-group mt-6">
              {skill.availability.filter(slot => !bookedSlots.some(bs => bs.skillId === skill.id && bs.slot === slot.slot)).map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => onBookSkill(skill.id, skill.rate, slot)}
                  className="btn btn-primary btn-large"
                >
                  Book {slot.slot}
                </button>
              ))}
              <button onClick={() => setReviewModal({ skillId: skill.id, isOpen: true, skill, mode: 'view' })} className="btn btn-info btn-large">View Reviews</button>
              <button onClick={() => setReviewModal({ skillId: skill.id, isOpen: true, skill, mode: 'submit' })} className="btn btn-warning btn-large">Leave Review</button>
            </div>

            {/* Reviews Section */}
            {skill.feedbacks.length > 0 && (
              <div className="mt-8 border-t-2 border-gray-200 pt-6">
                <h4 className="text-2xl font-bold mb-4 text-center text-white">Recent Reviews</h4>
                <div className="space-y-4 max-h-48 overflow-y-auto">
                  {skill.feedbacks.slice(-2).map(feedback => (
                    <div key={feedback.id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border-2 border-gray-100 shadow-md">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg text-gray-800">{feedback.student}</span>
                        <span className="text-sm text-gray-500 font-medium">{feedback.date}</span>
                      </div>
                      <div className="mb-3">
                        <StarRating rating={feedback.rating} />
                      </div>
                      <p className="text-lg text-gray-700 font-medium">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
                {skill.feedbacks.length > 2 && (
                  <button
                    onClick={() => setReviewModal({ skillId: skill.id, isOpen: true, skill, mode: 'view' })}
                    className="text-blue-600 hover:underline text-lg font-bold mt-4 block text-center hover:text-blue-800 transition-colors"
                  >
                    View all {skill.feedbacks.length} reviews
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Register New Skill */}
      <div className="card card-centered w-full bg-blue-800 text-white border border-blue-800/30">
        <h2 className="text-4xl font-bold mb-8 text-center text-white">Register New Skill</h2>
        <div className="flex flex-col gap-6">
          <input type="text" placeholder="Skill Name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium" rows={4} />
          <input type="text" placeholder="Receiver Wallet Address" value={form.receiver} onChange={e => setForm(prev => ({ ...prev, receiver: e.target.value }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium" />
          <input type="number" placeholder="Rate (Algo token)" value={form.rate} onChange={e => setForm(prev => ({ ...prev, rate: e.target.value }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium" />
          <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm text-lg font-medium">
            <option value="" className="bg-gray-800">Select Category</option>
            {SKILL_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value as any }))} className="border-2 border-white/30 bg-white/10 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all backdrop-blur-sm text-lg font-medium">
            {SKILL_LEVELS.map(level => <option key={level} value={level} className="bg-gray-800">{level}</option>)}
          </select>

          {/* Dynamic Slots */}
          <div className="mt-6">
            <label className="font-bold mb-4 block text-center text-2xl">⏰ Time Slots and Meeting Links</label>
            {form.availability.map((a, idx) => (
              <div key={idx} className="flex flex-col gap-4 mb-6 p-6 border-2 border-white/20 rounded-2xl shadow-lg bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="e.g. Monday 10 AM"
                    value={a.slot}
                    onChange={e => handleSlotChange(idx, e.target.value, a.link)}
                    className="border-2 border-white/30 bg-white/10 text-white px-4 py-3 rounded-xl flex-1 shadow-md hover:shadow-lg transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium"
                  />
                  <input
                    type="url"
                    placeholder="Meeting link"
                    value={a.link}
                    onChange={e => handleSlotChange(idx, a.slot, e.target.value)}
                    className="border-2 border-white/30 bg-white/10 text-white px-4 py-3 rounded-xl flex-1 shadow-md hover:shadow-lg transition-all backdrop-blur-sm placeholder-white/50 text-lg font-medium"
                  />
                  <button onClick={() => handleRemoveSlot(idx)} className="text-red-500 font-bold hover:text-red-700 transition-colors text-2xl px-3 py-1 rounded-lg hover:bg-red-500/20">×</button>
                </div>
              </div>
            ))}
            <div className="center-content mt-6">
              <button onClick={handleAddSlot} className="btn btn-primary btn-large">Add Slot</button>
            </div>
          </div>

          <div className="center-content mt-8">
            <button onClick={handleRegisterSkill} disabled={registerLoading} className="btn btn-large text-2xl px-12 py-6">
              {registerLoading ? 'Registering...' : 'Register Skill'}
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <ReviewModal
          skillId={reviewModal.skillId}
          skill={reviewModal.skill}
          mode={reviewModal.mode}
          onClose={() => setReviewModal({ skillId: 0, isOpen: false, mode: 'submit' })}
          onSubmit={(skillId: number, review: { rating: number; comment: string }) => {
            // Handle review submission - add to skill's feedbacks
            const newFeedback: Feedback = {
              id: Date.now(), // Simple ID generation
              student: userAddress.slice(0, 10) + '...',
              rating: review.rating,
              comment: review.comment,
              date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
            }

            setSkills(prevSkills =>
              prevSkills.map(skill =>
                skill.id === skillId
                  ? {
                      ...skill,
                      feedbacks: [...skill.feedbacks, newFeedback],
                      rating: calculateNewRating(skill.rating, skill.feedbacks.length, review.rating)
                    }
                  : skill
              )
            )

            enqueueSnackbar('Review submitted successfully!', { variant: 'success' })
            setReviewModal({ skillId: 0, isOpen: false, mode: 'submit' })
          }}
        />
      )}
    </div>
  )
}

export default SkillList
