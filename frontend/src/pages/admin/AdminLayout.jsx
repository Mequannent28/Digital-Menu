import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome, FiGrid, FiLayers, FiTag, FiTable, FiMaximize,
  FiShoppingCart, FiTruck, FiBarChart2, FiUsers,
  FiSettings, FiLogOut, FiMenu, FiX, FiChevronRight,
  FiExternalLink
} from 'react-icons/fi'
import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import NotificationBell from '../../components/admin/NotificationBell'
import { useRestaurantStore } from '../../store/useRestaurantStore'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', icon: FiHome, label: 'Dashboard', end: true },
    ]
  },
  {
    label: 'Menu Management',
    items: [
      { to: '/admin/categories', icon: FiGrid, label: 'Categories' },
      { to: '/admin/menu-items', icon: FiLayers, label: 'Menu Items' },
      { to: '/admin/modifiers', icon: FiTag, label: 'Modifiers' },
    ]
  },
  {
    label: 'Restaurant',
    items: [
      { to: '/admin/tables', icon: FiTable, label: 'Tables' },
      { to: '/admin/qr-codes', icon: FiMaximize, label: 'QR Codes' },
    ]
  },
  {
    label: 'Orders',
    items: [
      { to: '/admin/orders', icon: FiShoppingCart, label: 'Orders' },
      { to: '/admin/kitchen', icon: FiTruck, label: 'Kitchen Display' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
      { to: '/admin/users', icon: FiUsers, label: 'Users' },
      { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
    ]
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useAppStore()
  const { info } = useRestaurantStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-64 z-50 flex-shrink-0
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-orange-200 dark:shadow-none flex-shrink-0">
            🍽️
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-gray-900 dark:text-white text-sm leading-tight truncate">
              {info.name || 'ABC Restaurant'}
            </h1>
            <p className="text-xs text-orange-500 font-semibold">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <FiX size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-150 mb-0.5
                    ${isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={17} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <FiChevronRight size={14} className="opacity-70" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <a
            href="/menu"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiExternalLink size={17} />
            View Menu
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <FiLogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-5 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiMenu size={22} />
          </button>

          <div className="flex-1" />

          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-400">admin@abc.com</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-200 dark:shadow-none">
              A
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
