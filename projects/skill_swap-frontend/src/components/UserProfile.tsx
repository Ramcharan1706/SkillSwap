import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { SkillSwapClient } from '../contracts/SkillSwap'
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
  const [reputation, setReputation] = useState(5)
  const [balance, setBalance] = useState(150)
  const [loading, setLoading] = useState(false)
  const [isFreshUser, setIsFreshUser] = useState(false)
  const [appClient, setAppClient] = useState<SkillSwapClient | null>(null)

  // Initialize Algorand client and app client
  useEffect(() => {
    const initClient = async () => {
      if (!transactionSigner) return

      try {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)

        // For now, we'll use a placeholder app ID until the contract is deployed
        // In production, this would be retrieved from environment or deployment
        const appId = process.env.VITE_SKILL_SWAP_APP_ID || '123456789' // Placeholder
        const client = new SkillSwapClient({ appId: Number(appId), algorand })
        setAppClient(client)
      } catch (error) {
        console.error('Failed to initialize app client:', error)
      }
    }

    initClient()
  }, [transactionSigner])

  const registerUser = useCallback(async () => {
    if (!name.trim() || !appClient) return

    setLoading(true)
    try {
      await appClient.register_user({ name })
      enqueueSnackbar('Registration successful! Welcome to SkillSwap!', { variant: 'success' })
      onRegister(name)
      setIsFreshUser(true)
    } catch (error: any) {
      console.error('Registration error:', error)
      enqueueSnackbar(`Registration failed: ${error.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [name, appClient, enqueueSnackbar, onRegister])

  const fetchUserData = useCallback(async () => {
    if (!registered || !appClient) return

    try {
      const userReputation = await appClient.get_reputation({ user: address })
      const userBalance = await appClient.get_user_balance({ user: address })

      setReputation(Number(userReputation.return))
      setBalance(Number(userBalance.return))
    } catch (error: any) {
      console.error('Failed to fetch user data:', error)
      // Fallback to simulated data if contract calls fail
      setReputation(0)
      setBalance(0)
      enqueueSnackbar('Using default profile data - contract integration pending', { variant: 'info' })
    }
  }, [registered, appClient, address, enqueueSnackbar])

  useEffect(() => {
    if (registered) {
      fetchUserData()
      // If registered on mount, user is not fresh anymore
      setIsFreshUser(false)
    }
  }, [registered, fetchUserData])

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-8 flex items-center justify-center gap-3">
        🎨 Your Profile
      </h2>

      {!registered ? (
        <div className="space-y-8 w-full max-w-md">
          <p className="text-gray-700 text-xl font-medium text-center">Enter your name to register and start using SkillSwap:</p>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full px-6 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-500 bg-white/90 backdrop-blur-sm text-xl text-center"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={registerUser}
            disabled={loading || !name.trim()}
            className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 shadow-2xl ${
              loading || !name.trim()
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white'
            }`}
          >
            {loading ? '🔄 Registering...' : '✨ Register Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-10 w-full max-w-md">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              {isFreshUser ? (
                <>🎉 Welcome aboard, {name || 'new user'}! Let's get started.</>
              ) : (
                <>Welcome back{name ? `, ${name}` : ''}! 👋</>
              )}
            </h3>
            <p className="text-xl text-gray-600 font-medium">
              {isFreshUser
                ? 'Thank you for joining SkillSwap. We\'re excited to have you!'
                : 'Your SkillSwap summary is below.'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-purple-600 font-bold mb-3 flex items-center justify-center gap-2 text-lg">🏠 Wallet Address</div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl font-mono break-all text-gray-700 border-2 border-purple-200 shadow-lg text-lg text-center">
              {address}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="text-center bg-gradient-to-br from-green-100 to-emerald-200 border-2 border-green-300 rounded-3xl p-8 transform hover:scale-105 transition-all duration-500 shadow-2xl">
              <p className="text-5xl font-bold text-green-700 mb-2">{reputation}</p>
              <p className="text-lg text-green-800 font-bold">⏰ Hours Taught</p>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-100 to-cyan-200 border-2 border-blue-300 rounded-3xl p-8 transform hover:scale-105 transition-all duration-500 shadow-2xl">
              <p className="text-5xl font-bold text-blue-700 mb-2">{balance}</p>
              <p className="text-lg text-blue-800 font-bold">💎 Skill Tokens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
