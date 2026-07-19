import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Use same host as frontend so it works on PC and phone
      const apiBase = `${window.location.protocol}//${window.location.hostname}:8000/api`

      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      if (res.ok) {
        const result = await res.json()
        localStorage.setItem('token', result.access_token)
        localStorage.setItem('admin-user', JSON.stringify(result.user))
        toast.success('Welcome back!')
        navigate('/admin', { replace: true })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Invalid credentials')
      }
    } catch {
      // Fallback for when API is unreachable — allow demo login
      if (data.email === 'admin@abc.com' && data.password === 'admin123') {
        localStorage.setItem('token', 'demo-admin-token')
        toast('⚠️ API offline — demo mode', { icon: '⚠️' })
        navigate('/admin', { replace: true })
      } else {
        toast.error('Could not connect to API. Use admin@abc.com / admin123')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-red-600 to-orange-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-orange-300">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">ABC Restaurant</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="Email address"
                defaultValue="admin@abc.com"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                {...register('password', { required: true })}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                defaultValue="admin123"
                className="w-full pl-10 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-xs text-orange-700 dark:text-orange-300">
            📧 admin@abc.com &nbsp;🔑 admin123
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full" />
              : 'Sign In'
            }
          </button>
        </form>
      </motion.div>
    </div>
  )
}
