import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { SkillSwapFactory } from '../contracts/SkillSwap'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

interface UserProfileProps {
  address: string
  registered: boolean
  onRegister: (name: string) => void
}

const UserProfile: React.FC<UserProfileProps> = ({ address, registered, onRegister }) => {
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner } = useWallet()

  const [name, setName] = useState('')
  const [reputation, setReputation] = useState(0)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isFreshUser, setIsFreshUser] = useState(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
  algorand.setDefaultSigner(transactionSigner)

  const registerUser = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const factory = new SkillSwapFactory({
        defaultSender: address,
        algorand,
      })
      const { appClient } = await factory.deploy()
      await appClient.send.register_user({ args: { name } })

      enqueueSnackbar('Registration successful!', { variant: 'success' })
      onRegister(name)
      setIsFreshUser(true)
    } catch (error: any) {
      enqueueSnackbar(`Registration failed: ${error.message}`, { variant: 'error' })
    }
    setLoading(false)
  }

  const fetchUserData = async () => {
    if (!registered) return
    try {
      setReputation(5) // Simulated data
      setBalance(120)  // Simulated data
    } catch (error) {
      enqueueSnackbar('Failed to load user data', { variant: 'error' })
    }
  }

  useEffect(() => {
    if (registered) {
      fetchUserData()
      // If registered on mount, user is not fresh anymore
      setIsFreshUser(false)
    }
  }, [registered])

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Your Profile</h2>

      {!registered ? (
        <div className="space-y-4">
          <p className="text-gray-700">Enter your name to register and start using SkillSwap:</p>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={registerUser}
            disabled={loading || !name.trim()}
            className={`w-full py-2 rounded-md font-semibold transition ${
              loading || !name.trim()
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {isFreshUser ? (
                <>🎉 Welcome aboard, {name || 'new user'}! Let's get started.</>
              ) : (
                <>Welcome back{name ? `, ${name}` : ''}! 👋</>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {isFreshUser
                ? 'Thank you for joining SkillSwap. We’re excited to have you!'
                : 'Your SkillSwap summary is below.'}
            </p>
          </div>

          <div className="text-sm">
            <div className="text-gray-500 mb-1">Wallet Address</div>
            <div className="bg-gray-100 p-2 rounded-md font-mono break-all text-gray-700">
              {address}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 text-center bg-green-100 border border-green-200 rounded-md p-4">
              <p className="text-2xl font-bold text-green-600">{reputation}</p>
              <p className="text-sm text-green-700">Hours Taught</p>
            </div>
            <div className="flex-1 text-center bg-blue-100 border border-blue-200 rounded-md p-4">
              <p className="text-2xl font-bold text-blue-600">{balance}</p>
              <p className="text-sm text-blue-700">Skill Tokens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
