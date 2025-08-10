"use client"

import { useState, useEffect } from "react"

interface User {
  uid: string
  email: string
  role: "user" | "admin"
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check - replace with actual Firebase auth
    const checkAuth = () => {
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const signIn = (email: string, password: string) => {
    // Simulate sign in - replace with actual Firebase auth
    const mockUser: User = {
      uid: "user123",
      email,
      role: email === "admin@indishop.com" ? "admin" : "user",
    }
    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}
