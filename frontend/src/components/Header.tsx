import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { token, user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">Taskly</Link>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button onClick={() => { logout(); nav('/login') }} className="px-3 py-1 border rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1">Login</Link>
              <Link to="/register" className="px-3 py-1 border rounded">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
