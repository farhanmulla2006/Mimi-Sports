// src/context/AuthContext.jsx
// React Auth Context for managing Admin authentication state

import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentAdmin, loginAdmin, logoutAdmin } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = async () => {
    setLoading(true)
    try {
      const currentAdmin = await getCurrentAdmin()
      setAdmin(currentAdmin)
      setError(null)
    } catch (err) {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const loggedInAdmin = await loginAdmin(email, password)
      setAdmin(loggedInAdmin)
      return loggedInAdmin
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await logoutAdmin()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setAdmin(null)
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, error, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
