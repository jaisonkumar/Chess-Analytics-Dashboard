import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token')
    try {
        const res = await fetch('/api/user/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
        })
        if (res.ok) {
        const data = await res.json()
        setUser(data)
        } else {
        logout()
        }
    } catch (e) {
        console.error('Fetch user error:', e)
        logout()
    } finally {
        setLoading(false)
    }
    }


  const login = async (username, password) => {
    try {  // Debug log
      const res = await fetch('/api/login/', {  // Changed to relative URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
    
      
      if (res.ok) {
        const data = await res.json()
        
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        setUser(data.user)
        return { success: true }
      } else {
        const error = await res.json()
        console.error('Login failed:', error)  // Debug log
        return { success: false, error: error.error || 'Login failed' }
      }
    } catch (e) {
      console.error('Login network error:', e)  // Debug log
      return { success: false, error: 'Network error. Check console for details.' }
    }
  }

  const register = async (username, email, password, password2, firstName, lastName) => {
    try {
      const res = await fetch('/api/register/', {  // Changed to relative URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          password2,
          first_name: firstName,
          last_name: lastName
        })
      })
      
      
      if (res.ok) {
        return { success: true }
      } else {
        const error = await res.json()
        console.error('Registration failed:', error)  // Debug log
        return { success: false, error }
      }
    } catch (e) {
      console.error('Register network error:', e)  // Debug log
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
