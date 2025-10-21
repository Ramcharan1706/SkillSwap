// src/pages/RegisterPage.tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useAuth } from '../context/AuthContext'
import { SkillSwapFactory } from '../src/contracts/SkillSwap'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../src/utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { role, setUserName } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()
  const navigate = useNavigate()

  // Redirect if role is not set
  useEffect(() => {
    if (!role) {
      enqueueSnackbar('Please select a role first', { variant: 'warning' })
      navigate('/') // Or wherever your role selection page is
    }
  }, [role, enqueueSnackbar, navigate])

  const handleRegister = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!name.trim()) {
        enqueueSnackbar('Please enter your name', { variant: 'warning' })
        return
      }
      if (!activeAddress || !transactionSigner) {
        enqueueSnackbar('Wallet not connected', { variant: 'warning' })
        return
      }
      if (!role) {
        enqueueSnackbar('User role not defined', { variant: 'error' })
        return
      }

      setLoading(true)
      try {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)

        const factory = new SkillSwapFactory({ defaultSender: activeAddress, algorand })
        const { appClient } = await factory.deploy()

        await appClient.send.register_user({
          name: name.trim(),
          role,
        })

        setUserName(name.trim())
        enqueueSnackbar(`Welcome ${name.trim()}, registered as ${role}`, { variant: 'success' })
        navigate('/home')
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unknown error occurred'
        enqueueSnackbar(`Registration failed: ${message}`, { variant: 'error' })
      } finally {
        setLoading(false)
      }
    },
    [activeAddress, enqueueSnackbar, navigate, role, setUserName, transactionSigner, name]
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Register as a {role ? role.toUpperCase() : ''}
      </h2>

      <form onSubmit={handleRegister} className="w-full max-w-md">
        <label htmlFor="name" className="block mb-2 text-gray-700 font-medium">
          Your Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Enter your name"
          className="border px-4 py-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
          aria-required="true"
        />

        <button
          type="submit"
          disabled={loading || !name.trim() || !activeAddress || !transactionSigner}
          className={`w-full px-6 py-2 rounded text-white transition ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400'
          }`}
          aria-busy={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </main>
  )
}

export default RegisterPage
