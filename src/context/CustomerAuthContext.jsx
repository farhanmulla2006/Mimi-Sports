// src/context/CustomerAuthContext.jsx
// React Context for managing Customer account authentication and session state

import { createContext, useContext, useState, useEffect } from 'react'
import {
  getCurrentCustomer,
  loginCustomer,
  registerCustomer as apiRegisterCustomer,
  logoutCustomer,
  updateCustomerProfile,
} from '../services/api.js'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkCustomerAuth = async () => {
    setLoading(true)
    try {
      const currentCustomer = await getCurrentCustomer()
      setCustomer(currentCustomer)
      setError(null)
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCustomerAuth()
  }, [])

  const register = async (name, email, password, phone = '') => {
    setError(null)
    try {
      const registeredCustomer = await apiRegisterCustomer(name, email, password, phone)
      setCustomer(registeredCustomer)
      return registeredCustomer
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    }
  }

  const login = async (email, password) => {
    setError(null)
    try {
      const loggedInCustomer = await loginCustomer(email, password)
      setCustomer(loggedInCustomer)
      return loggedInCustomer
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await logoutCustomer()
    } catch (err) {
      console.error('Customer logout error:', err)
    } finally {
      setCustomer(null)
    }
  }

  const updateProfile = async (profileData) => {
    setError(null)
    try {
      const updated = await updateCustomerProfile(profileData)
      setCustomer(updated)
      return updated
    } catch (err) {
      setError(err.message || 'Profile update failed')
      throw err
    }
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        checkCustomerAuth,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}
