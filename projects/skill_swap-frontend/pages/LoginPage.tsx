// src/pages/LoginPage.tsx
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, UserRole } from '../context/AuthContext'

const LoginPage: React.FC = () => {
  const { setRole, setUserName } = useAuth()
  const navigate = useNavigate()

  // Memoize handler to avoid re-creation on each render
  const handleRoleSelect = useCallback((role: UserRole) => {
    setRole(role)
    setUserName('') // reset username when role changes, optional
    navigate('/register')
  }, [setRole, setUserName, navigate])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-4">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Welcome to SkillSwap</h1>
      <p className="mb-6 text-gray-700">Choose your role to continue</p>
      <div className="flex gap-6">
        <button
          type="button"
          onClick={() => handleRoleSelect('teacher')}
          aria-label="Select Teacher Role"
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          I'm a Teacher
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect('learner')}
          aria-label="Select Learner Role"
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        >
          I'm a Learner
        </button>
      </div>
    </main>
  )
}

export default LoginPage
