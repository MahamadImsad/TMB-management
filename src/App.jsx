import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Import Pages
import Login from './Login'
import Dashboard from './Dashboard'
import AddStudent from './AddStudent'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-indigo-600 animate-pulse">Loading Application...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/add-student" element={session ? <AddStudent /> : <Navigate to="/" />} />
    </Routes>
  )
}