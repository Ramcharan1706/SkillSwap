// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'

export type UserRole = 'teacher' | 'learner'
interface AuthContextType {
  role: UserRole | null
  userName: string
  setRole: (role: UserRole) => void
  setUserName: (name: string) => void
  reset: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string>('')

  // Reset state to initial values
  const reset = () => {
    setRole(null)
    setUserName('')
  }

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo(() => ({
    role,
    userName,
    setRole,
    setUserName,
    reset,
  }), [role, userName])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
