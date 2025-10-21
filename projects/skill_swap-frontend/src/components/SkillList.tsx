import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'

interface Skill {
  id: number
  name: string
  description: string
  teacher: string
  rate: number
}

interface SkillListProps {
  onBookSkill: (skillId: number) => void
}

const PAYMENT_AMOUNT_ALGO = 0.1
const PAYMENT_RECEIVER_ADDRESS = '2ZTFJNDXPWDETGJQQN33HAATRHXZMBWESKO2AUFZUHERH2H3TG4XTNPL4Y' // <-- Replace this with your real address

const SkillList: React.FC<SkillListProps> = ({ onBookSkill }) => {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [form, setForm] = useState<{ name: string; description: string; rate: string }>({
    name: '',
    description: '',
    rate: '',
  })

  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    setLoading(true)
    try {
      // Replace with actual smart contract fetch
      const mockSkills: Skill[] = [
        {
          id: 1,
          name: 'Python Programming',
          description: 'Learn Python basics from scratch.',
          teacher: 'Ram Charan Teja',
          rate: 10,
        },
        {
          id: 2,
          name: 'Guitar Lessons',
          description: 'Play your first song within 2 sessions!',
          teacher: 'Purnesh',
          rate: 15,
        },
      ]
      setSkills(mockSkills)
    } catch {
      enqueueSnackbar('Failed to fetch skills.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const validateForm = () => {
    if (!form.name.trim() || !form.description.trim() || !form.rate.trim()) {
      enqueueSnackbar('All fields are required.', { variant: 'warning' })
      return false
    }

    if (isNaN(Number(form.rate)) || Number(form.rate) <= 0) {
      enqueueSnackbar('Rate must be a positive number.', { variant: 'warning' })
      return false
    }

    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet.', { variant: 'warning' })
      return false
    }

    return true
  }

  const sendPayment = async (): Promise<string> => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet to proceed.', { variant: 'warning' })
      throw new Error('Wallet not connected')
    }

    try {
      enqueueSnackbar(`Sending payment of ${PAYMENT_AMOUNT_ALGO} ALGO...`, { variant: 'info' })

      const result = await algorand.send.payment({
        sender: activeAddress,
        receiver: PAYMENT_RECEIVER_ADDRESS,
        amount: algo(PAYMENT_AMOUNT_ALGO),
        signer: transactionSigner,
      })

      enqueueSnackbar(`Payment successful! TxID: ${result.txId}`, { variant: 'success' })

      return result.txId
    } catch (error: any) {
      enqueueSnackbar(`Payment failed: ${error?.message || error}`, { variant: 'error' })
      throw error
    }
  }

  const registerSkillOnChain = async (): Promise<Skill> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = skills.length ? Math.max(...skills.map((s) => s.id)) + 1 : 1
        resolve({
          id: newId,
          name: form.name.trim(),
          description: form.description.trim(),
          teacher: activeAddress!,
          rate: Number(form.rate),
        })
      }, 1200)
    })
  }

  const handleRegisterSkill = async () => {
    if (!validateForm()) return

    setRegisterLoading(true)
    try {
      await sendPayment()
      const newSkill = await registerSkillOnChain()
      setSkills((prev) => [...prev, newSkill])
      setForm({ name: '', description: '', rate: '' })
      enqueueSnackbar('Skill registered successfully!', { variant: 'success' })
    } catch {
      // Already handled in sendPayment
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Available Skills</h2>

      {loading ? (
        <p className="text-gray-500">Loading skills...</p>
      ) : skills.length ? (
        <div className="space-y-6 mb-10">
          {skills.map(({ id, name, description, teacher, rate }) => (
            <div
              key={id}
              className="text-left bg-white shadow rounded-lg p-5 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-blue-800">{name}</h3>
              <p className="mb-2 text-gray-700">{description}</p>
              <p className="text-sm text-gray-600">👤 {teacher}</p>
              <p className="text-sm text-gray-600 mb-3">💰 {rate} tokens/hr</p>
              <button
                onClick={() => onBookSkill(id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-transform transform hover:scale-105 font-semibold shadow-md"
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No skills listed yet. Be the first to register!</p>
      )}

      <hr className="my-10" />

      <h2 className="text-2xl font-bold mb-4 text-green-700">Register Your Skill</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleRegisterSkill()
        }}
        className="text-left max-w-md mx-auto space-y-6 bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border border-green-200"
      >
        <div>
          <label className="block font-semibold mb-2 text-gray-800 tracking-wide">Skill Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-green-400 transition duration-300"
            placeholder="E.g., Public Speaking"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-gray-800 tracking-wide">Description</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-3 focus:ring-green-400 transition duration-300"
            placeholder="Briefly describe what you teach"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-gray-800 tracking-wide">Rate (tokens/hr)</label>
          <input
            type="number"
            name="rate"
            value={form.rate}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-green-400 transition duration-300"
            min="1"
            required
          />
        </div>

        <div className="flex justify-between gap-4">
          <button
            type="submit"
            disabled={registerLoading}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            {registerLoading ? 'Processing...' : `Pay ${PAYMENT_AMOUNT_ALGO} ALGO & Register`}
          </button>

          <button
            type="button"
            disabled={registerLoading}
            onClick={() => setForm({ name: '', description: '', rate: '' })}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default SkillList
