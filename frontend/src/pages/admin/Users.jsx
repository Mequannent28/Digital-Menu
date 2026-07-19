import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'

const USERS_KEY = 'admin-users'

const defaultUsers = [
  { id: '1', name: 'Admin User', email: 'admin@abc.com', role: 'admin', isActive: true, createdAt: '2024-01-01' },
  { id: '2', name: 'Kitchen Staff', email: 'kitchen@abc.com', role: 'kitchen', isActive: true, createdAt: '2024-02-01' },
  { id: '3', name: 'Waiter 1', email: 'waiter1@abc.com', role: 'waiter', isActive: true, createdAt: '2024-03-01' },
]

function loadUsers() {
  const s = localStorage.getItem(USERS_KEY)
  return s ? JSON.parse(s) : defaultUsers
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  kitchen: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  waiter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const emptyForm = { name: '', email: '', password: '', role: 'waiter', isActive: true }

export default function Users() {
  const [users, setUsers] = useState(loadUsers)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPass, setShowPass] = useState(false)

  const save = (list) => {
    setUsers(list)
    localStorage.setItem(USERS_KEY, JSON.stringify(list))
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.email.trim()) { toast.error('Email is required'); return }
    if (!editing && !form.password) { toast.error('Password is required'); return }

    if (editing) {
      save(users.map(u => u.id === editing.id ? { ...u, name: form.name, email: form.email, role: form.role, isActive: form.isActive } : u))
      toast.success('✅ User updated')
    } else {
      save([...users, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] }])
      toast.success('✅ User created')
    }
    setShowModal(false)
  }

  const handleDelete = (user) => {
    if (user.email === 'admin@abc.com') { toast.error('Cannot delete main admin'); return }
    if (!confirm(`Delete user "${user.name}"?`)) return
    save(users.filter(u => u.id !== user.id))
    toast.success('🗑️ User deleted')
  }

  const toggleActive = (id) => {
    save(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))
    toast.success('Status updated')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {users.length} users · {users.filter(u => u.isActive).length} active
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <FiPlus size={18} /> Add User
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`card ${!user.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-orange-200 dark:shadow-none">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(user)} className="icon-btn"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(user)} className="icon-btn text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 size={14} /></button>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5">{user.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{user.email}</p>

            <div className="flex items-center justify-between">
              <span className={`badge ${roleColors[user.role] || roleColors.waiter} capitalize px-2.5 py-1 rounded-full text-xs font-semibold`}>
                {user.role}
              </span>
              <button
                onClick={() => toggleActive(user.id)}
                className={`toggle-btn ${user.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`toggle-dot ${user.isActive ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-backdrop" onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()} className="modal"
            >
              <div className="modal-header">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editing ? `Edit: ${editing.name}` : 'Add User'}
                </h2>
                <button onClick={() => setShowModal(false)} className="icon-btn"><FiX size={20} /></button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" className="input-field" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="user@abc.com" className="input-field" />
                </div>
                <div>
                  <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="••••••••"
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field">
                    <option value="admin">👑 Admin</option>
                    <option value="manager">💼 Manager</option>
                    <option value="kitchen">👨‍🍳 Kitchen Staff</option>
                    <option value="waiter">🛎️ Waiter</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active (can login)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary"><FiSave size={18} /> Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
