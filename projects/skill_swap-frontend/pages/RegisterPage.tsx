
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl p-12 rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full transform hover:scale-105 transition-all duration-500">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-6 animate-bounce">
            <span className="text-6xl">{role === 'teacher' ? '👨‍🏫' : '🎓'}</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Register as {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
          </h2>
          <p className="text-white/90 text-xl md:text-2xl font-medium leading-relaxed">
            {role === 'teacher' ? '🎯 Share Your Expertise' : '🚀 Start Your Learning Journey'}
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="space-y-8"
        >
          <div>
            <label htmlFor="wallet" className="block mb-4 text-white font-bold text-xl flex items-center gap-2">
              <span className="text-2xl">🔐</span> Wallet Address
            </label>

            <div className="relative">
              <input
                id="wallet"
                name="wallet"
                type="text"
                readOnly
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm px-6 py-5 rounded-2xl w-full text-white font-mono text-sm focus:outline-none focus:ring-4 focus:ring-white/30 focus:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                value={walletAddress || 'No wallet connected'}
                aria-readonly="true"
              />
              {walletAddress && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-green-400 text-2xl animate-pulse">✅</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !walletAddress}
            className={`w-full px-8 py-6 rounded-2xl font-bold text-2xl transition-all duration-300 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 transform ${
              loading || !walletAddress
                ? 'bg-gray-500/50 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-3xl hover:scale-105 hover:-translate-y-1'
            }`}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin text-2xl">🔄</span> Registering...
              </span>
            ) : walletAddress ? (
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl">✨</span> Register with Wallet
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl">🔗</span> Connect Wallet to Continue
              </span>
            )}
          </button>

          {!walletAddress && (
            <div className="text-center mt-8 p-4 bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-500/30">
              <p className="text-white text-lg font-semibold flex items-center justify-center gap-2">
                <span className="text-2xl">⚠️</span> Please connect your wallet before registering.
              </p>
            </div>
          )}
        </form>

        <div className="mt-10 text-center">
          <p className="text-white/70 text-sm">
            🔒 Your wallet address will be used as your unique identifier
          </p>
        </div>
      </div>
    </main>
  )
}

export default RegisterPage
