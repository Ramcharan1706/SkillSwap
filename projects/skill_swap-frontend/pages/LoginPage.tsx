// src/pages/LoginPage.tsx
import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, UserRole } from '../context/AuthContext'
import ConnectWallet from '../src/components/ConnectWallet'

const LoginPage: React.FC = () => {
  const { setRole, setUserName } = useAuth()
  const navigate = useNavigate()
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  /** ------------------------------------------------
   * 🧾 Handle role selection
   * ------------------------------------------------ */
  const handleRoleSelect = useCallback(
    (role: UserRole) => {
      setRole(role)
      setUserName('') // reset username when role changes
      navigate('/register')
    },
    [setRole, setUserName, navigate]
  )

  /** ------------------------------------------------
   * 🧱 Render
   * ------------------------------------------------ */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3, #000000)' }}>
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-center">Welcome to SkillSwap</h1>
        <p className="mb-8 text-white/90 text-center text-lg">
          Connect your wallet to get started. Select your role to continue. You will register using your connected Algorand wallet on the next page.
        </p>

        <button
          type="button"
          onClick={() => setIsWalletModalOpen(true)}
          aria-label="Connect Wallet"
          className="w-full px-8 py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white rounded-2xl hover:from-cyan-500 hover:via-blue-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300 mb-8 text-lg font-semibold shadow-lg"
        >
          🔗 Connect Wallet
        </button>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => handleRoleSelect('teacher')}
            aria-label="Select Teacher Role"
            className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all duration-300 text-lg font-semibold shadow-lg"
          >
            👨‍🏫 I'm a Teacher
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('learner')}
            aria-label="Select Learner Role"
            className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-400/50 transition-all duration-300 text-lg font-semibold shadow-lg"
          >
            🎓 I'm a Learner
          </button>
        </div>
      </div>

      <ConnectWallet openModal={isWalletModalOpen} closeModal={() => setIsWalletModalOpen(false)} />
    </main>
  )
}

export default LoginPage
