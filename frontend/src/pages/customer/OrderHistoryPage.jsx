import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiClock, FiPackage, FiCheck, FiX } from 'react-icons/fi'
import { useOrderStore } from '../../store/useOrderStore'
import useCartStore from '../../store/useCartStore'
import BottomNav from '../../components/customer/BottomNav'
import toast from 'react-hot-toast'

const statusConfig = {
  new:       { label: 'Received', labelAm: 'ተቀብሏል', icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500', progress: 25 },
  preparing: { label: 'Preparing', labelAm: 'በማዘጋጀት ላይ', icon: '👨‍🍳', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500', progress: 50 },
  ready:     { label: 'Ready!', labelAm: 'ዝግጁ ነው!', icon: '✅', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500', progress: 75 },
  served:    { label: 'Served', labelAm: 'ተመግቧል', icon: '🍽️', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-700', dot: 'bg-gray-400', progress: 100 },
  cancelled: { label: 'Cancelled', labelAm: 'ተሰርዟል', icon: '❌', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500', progress: 0 },
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function OrderHistoryPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const language = i18n.language
  const tableNumber = useCartStore(s => s.tableNumber)
  const { orders } = useOrderStore()
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [prevStatuses, setPrevStatuses] = useState({})

  // Filter to customer's orders (by table or phone)
  const lastOrder = orders?.filter(o => o.phone)?.at(0)
  const customerPhone = lastOrder?.phone || null
  const myOrders = (orders || [])
    .filter(o => customerPhone ? o.phone === customerPhone : o.tableNumber === tableNumber)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Poll for order status updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check each active order for status changes
      for (const order of myOrders.filter(o => !['served', 'cancelled'].includes(o.status))) {
        try {
          const res = await fetch(`/api/orders/${order.id}`)
          if (res.ok) {
            const updated = await res.json()
            const newStatus = updated.status

            // If status changed, show notification
            if (prevStatuses[order.id] && prevStatuses[order.id] !== newStatus) {
              const cfg = statusConfig[newStatus]
              if (newStatus === 'ready') {
                toast.success(`${cfg.icon} Your order #${order.id.slice(-4)} is ready!`, {
                  duration: 8000,
                  style: { fontWeight: 'bold', border: '2px solid #10b981', borderRadius: '12px' },
                })
                // Play alert sound
                try {
                  const ctx = new (window.AudioContext || window.webkitAudioContext)()
                  const osc = ctx.createOscillator()
                  const gain = ctx.createGain()
                  osc.connect(gain); gain.connect(ctx.destination)
                  osc.frequency.value = 880; osc.type = 'sine'
                  gain.gain.setValueAtTime(0.5, ctx.currentTime)
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
                  osc.start(); osc.stop(ctx.currentTime + 1)
                } catch (_) {}
              } else if (newStatus === 'preparing') {
                toast(`${cfg.icon} Your order is now being prepared`, {
                  icon: '👨‍🍳',
                  duration: 5000,
                })
              }
            }

            setPrevStatuses(prev => ({ ...prev, [order.id]: newStatus }))
          }
        } catch (_) {}
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [myOrders, prevStatuses])

  // Initialize previous statuses
  useEffect(() => {
    const init = {}
    myOrders.forEach(o => { init[o.id] = o.status })
    setPrevStatuses(init)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
            {t('orderHistory')}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {myOrders.length} {myOrders.length === 1 ? t('order') : t('orders')}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {myOrders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-8xl mb-5">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('noOrders')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t('noOrdersSub')}</p>
            <button onClick={() => navigate('/menu')} className="bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 dark:shadow-none">
              {t('browseMenu')}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {myOrders.map((order, idx) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  idx={idx}
                  expanded={expandedOrder === order.id}
                  onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  language={language}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function OrderCard({ order, idx, expanded, onToggle, language, t }) {
  const cfg = statusConfig[order.status] || statusConfig.new

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm"
    >
      {/* Order header */}
      <button onClick={onToggle} className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-gray-900 dark:text-white">#{order.id?.slice(-6)}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {language === 'am' ? cfg.labelAm : cfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(order.createdAt)} · 🪑 Table {order.tableNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-orange-500">{order.grandTotal?.toFixed(0)} ETB</p>
            <p className="text-xs text-gray-400">{order.items?.length} {order.items?.length === 1 ? t('item') : t('items')}</p>
          </div>
        </div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cfg.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute left-0 top-0 h-full ${cfg.dot} rounded-full`}
            />
          </div>
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              {/* Status steps */}
              <div className="flex items-center justify-between">
                {['new', 'preparing', 'ready', 'served'].map((s, i) => {
                  const sc = statusConfig[s]
                  const done = cfg.progress >= sc.progress
                  const current = order.status === s
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 transition-all ${
                        current ? `${sc.bg} scale-110` : done ? `${sc.bg}` : 'bg-gray-100 dark:bg-gray-700 opacity-40'
                      }`}>
                        {sc.icon}
                      </div>
                      <span className={`text-[10px] font-medium ${done ? sc.color : 'text-gray-400'}`}>
                        {language === 'am' ? sc.labelAm : sc.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5">
                      <span className="text-gray-900 dark:text-white">
                        <span className="font-bold text-orange-500">×{item.qty}</span> {item.name}
                      </span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{(item.price * item.qty).toFixed(0)} ETB</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('subtotal')}</span><span>{order.subtotal?.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('vat')}</span><span>{order.vat?.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('serviceCharge')}</span><span>{order.serviceCharge?.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between font-bold text-orange-500 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span>{t('grandTotal')}</span><span>{order.grandTotal?.toFixed(0)} ETB</span>
                </div>
              </div>

              {order.notes && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                  <p className="text-xs text-orange-700 dark:text-orange-300">💬 {order.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
