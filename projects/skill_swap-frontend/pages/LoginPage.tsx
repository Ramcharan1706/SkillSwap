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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full transform hover:scale-105 transition-all duration-500">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-6 animate-bounce">
            <span className="text-6xl">🎨</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Welcome to SkillSwap
          </h1>
          <p className="text-white/90 text-xl md:text-2xl font-medium leading-relaxed">
            🌟 Connect, Learn, and Grow Together 🌟
          </p>
        </div>

        <p className="mb-10 text-white/80 text-center text-lg leading-relaxed">
          Connect your wallet to unlock a world of peer-to-peer learning. Choose your role and start your journey in the decentralized education revolution!
        </p>

        <button
          type="button"
          onClick={() => setIsWalletModalOpen(true)}
          aria-label="Connect Wallet"
          className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 mb-10 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
        >
          🔗 Connect Your Wallet
        </button>

        <div className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => handleRoleSelect('teacher')}
            aria-label="Select Teacher Role"
            className="w-full px-8 py-5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            👨‍🏫 I'm a Teacher
            <span className="text-2xl animate-pulse">📚</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('learner')}
            aria-label="Select Learner Role"
            className="w-full px-8 py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            🎓 I'm a Learner
            <span className="text-2xl animate-pulse">🚀</span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-white/70 text-sm">
            ✨ Powered by Algorand Blockchain ✨
          </p>
        </div>
      </div>

      <ConnectWallet openModal={isWalletModalOpen} closeModal={() => setIsWalletModalOpen(false)} />
    </main>
  )
}

export default LoginPage
