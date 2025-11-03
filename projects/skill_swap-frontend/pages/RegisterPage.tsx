// src/pages/RegisterPage.tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '@txnlab/use-wallet-react'

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { role, setUserName } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const { activeAccount } = useWallet()

  const walletAddress = activeAccount?.address || ''

  /** ------------------------------------------------
   * 🔁 Redirect if role not selected
   * ------------------------------------------------ */
  useEffect(() => {
    if (!role) {
      enqueueSnackbar('Please select a role first', { variant: 'warning' })
      navigate('/')
    }
  }, [role, enqueueSnackbar, navigate])

  /** ------------------------------------------------
   * 🧾 Register using connected wallet address
   * ------------------------------------------------ */
  const handleRegister = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!walletAddress) {
        enqueueSnackbar('Please connect your Algorand wallet first', { variant: 'warning' })
        return
      }

      if (!role) {
        enqueueSnackbar('User role not defined', { variant: 'error' })
        return
      }

      setLoading(true)
      try {
        // Use wallet address as name
        setUserName(walletAddress)
        enqueueSnackbar(`Welcome! Registered as ${role.toUpperCase()} with wallet ${walletAddress}`, {
          variant: 'success',
        })
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
    [enqueueSnackbar, navigate, role, setUserName, walletAddress]
  )

  /** ------------------------------------------------
   * 🧱 UI Render
   * ------------------------------------------------ */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3, #000000)' }}>
      <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full">
        <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-center">
          Register as a {role ? role.toUpperCase() : ''}
        </h2>

        <form
          onSubmit={handleRegister}
          className="space-y-6"
        >
          <div>
            <label htmlFor="wallet" className="block mb-3 text-cyan-300 font-semibold text-lg">
              Wallet Address
            </label>

            <input
              id="wallet"
              name="wallet"
              type="text"
              readOnly
              className="border border-cyan-500/40 bg-white/5 px-6 py-4 rounded-2xl w-full text-white font-mono text-sm focus:outline-none focus:ring-4 focus:ring-cyan-400/50 transition-all duration-300"
              value={walletAddress || 'No wallet connected'}
              aria-readonly="true"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className={`w-full px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-300 shadow-lg ${
              loading || !walletAddress
                ? 'bg-cyan-500/40 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white hover:shadow-xl hover:scale-105'
            }`}
            aria-busy={loading}
          >
            {loading ? '🔄 Registering...' : walletAddress ? '✨ Register with Wallet' : 'Connect Wallet to Continue'}
          </button>

          {!walletAddress && (
            <p className="text-center text-sm text-red-300 mt-6">
              ⚠️ Please connect your wallet before registering.
            </p>
          )}
        </form>
      </div>
    </main>
  )
}

export default RegisterPage
