import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'

import StarRating from './StarRating'
import Badge from './Badge'
import ReviewsModal from './ReviewsModal'

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
  const [reviewsModal, setReviewsModal] = useState<{ skillId: number; isOpen: boolean; skill?: Skill }>({ skillId: 0, isOpen: false })

  const [form, setForm] = useState({
    name: '',
    description: '',
    rate: '',
    category: '',
    level: 'Beginner' as const,
    availability: [] as { slot: string; link: string }[]
  })

  const [filters, setFilters] = useState({ category: '', level: '', minRate: '', maxRate: '' })
  const { transactionSigner } = useWallet()
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
    if (!userAddress) {
      enqueueSnackbar('Connect your wallet.', { variant: 'warning' })
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
      setForm({ name: '', description: '', rate: '', category: '', level: 'Beginner', availability: [] })
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

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill =>
      (!filters.category || skill.category === filters.category) &&
      (!filters.level || skill.level === filters.level) &&
      (!filters.minRate || skill.rate >= Number(filters.minRate)) &&
      (!filters.maxRate || skill.rate <= Number(filters.maxRate))
    )
  }, [skills, filters])

  return (
    <div className="w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh]">
      {/* Filters */}
      <div className="mb-8 w-full flex flex-wrap gap-4 justify-center">
        <select value={filters.category} onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))} className="border px-3 py-1 rounded">
          <option value="">All Categories</option>
          {SKILL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filters.level} onChange={e => setFilters(prev => ({ ...prev, level: e.target.value }))} className="border px-3 py-1 rounded">
          <option value="">All Levels</option>
          {SKILL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
        </select>
      </div>

      {/* Skill Cards */}
      <div className="w-full flex flex-col gap-6 mb-10">
        {loading ? (
          <p>Loading skills...</p>
        ) : filteredSkills.length === 0 ? (
          <p>No skills found.</p>
        ) : filteredSkills.map(skill => (
          <div key={skill.id} className="p-5 bg-white rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-xl font-bold mb-1">{skill.name}</h3>
            <p className="text-gray-700 text-sm mb-2">{skill.description}</p>
            <Badge text={skill.category} />
            <p className="text-sm">Level: {skill.level}</p>
            <p className="text-sm">Rate: ${skill.rate}</p>
            <p className="text-sm">Rating: <StarRating rating={skill.rating} /> ({skill.feedbacks.length})</p>

            <div className="mt-2 text-sm">
              <p className="font-semibold">Availability:</p>
              <ul className="list-disc pl-5">
                {skill.availability.map((a, idx) => {
                  const isBooked = bookedSlots.some(bs => bs.skillId === skill.id && bs.slot === a.slot)
                  return (
                    <li key={idx}>
                      {a.slot} {isBooked && '— Meeting Link: '} {isBooked && <a href={a.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Join</a>}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex gap-2 mt-4">
              {skill.availability.filter(slot => !bookedSlots.some(bs => bs.skillId === skill.id && bs.slot === slot.slot)).map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => onBookSkill(skill.id, skill.rate, slot)}
                  className="text-white py-1 px-3 rounded text-sm bg-green-600 hover:bg-green-700"
                >
                  Book {slot.slot}
                </button>
              ))}
              <button onClick={() => onOpenReviewModal(skill.id)} className="bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 text-sm">Leave Review</button>
            </div>
          </div>
        ))}
      </div>

      {/* Register New Skill */}
      <div className="w-full max-w-xl p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">Register New Skill</h2>
        <div className="flex flex-col gap-3">
          <input type="text" placeholder="Skill Name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="border px-3 py-2 rounded" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="border px-3 py-2 rounded" />
          <input type="number" placeholder="Rate (Algo token)" value={form.rate} onChange={e => setForm(prev => ({ ...prev, rate: e.target.value }))} className="border px-3 py-2 rounded" />
          <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="border px-3 py-2 rounded">
            <option value="">Select Category</option>
            {SKILL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value as any }))} className="border px-3 py-2 rounded">
            {SKILL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
          </select>

          {/* Dynamic Slots */}
          <div className="mt-4">
            <label className="font-semibold mb-2 block">⏰ Time Slots and Meeting Links</label>
            {form.availability.map((a, idx) => (
              <div key={idx} className="flex flex-col gap-2 mb-4 p-2 border rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Monday 10 AM"
                    value={a.slot}
                    onChange={e => handleSlotChange(idx, e.target.value, a.link)}
                    className="border px-2 py-1 rounded flex-1"
                  />
                  <input
                    type="url"
                    placeholder="Meeting link"
                    value={a.link}
                    onChange={e => handleSlotChange(idx, a.slot, e.target.value)}
                    className="border px-2 py-1 rounded flex-1"
                  />
                  <button onClick={() => handleRemoveSlot(idx)} className="text-red-500 font-bold">×</button>
                </div>
              </div>
            ))}
            <button onClick={handleAddSlot} className="mt-2 bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-sm">Add Slot</button>
          </div>

          <button onClick={handleRegisterSkill} disabled={registerLoading} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            {registerLoading ? 'Registering...' : 'Register Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkillList
