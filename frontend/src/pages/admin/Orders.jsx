import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiEye, FiX, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { useOrderStore } from '../../store/useOrderStore'
import toast from 'react-hot-toast'

const API = '/api'

const statusConfig = {
  new:       { label: 'New',       bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500' },
  preparing: { label: 'Preparing', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  ready:     { label: 'Ready',     bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    dot: 'bg-green-500' },
  served:    { label: 'Served',    bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',           dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function Orders() {
  const { markAllRead } = useOrderStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const token = localStorage.getItem('token')
  const intervalRef = useRef(null)
  const prevCountRef = useRef(0)

  // ── Fetch all orders from API ─────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      // Map to frontend format
      const mapped = data.map(o => ({
        id: o.order_ref || String(o.id),
        dbId: o.id,
        tableNumber: o.table_number,
        customerName: o.customer_name,
        phone: o.phone,
        notes: o.notes,
        status: o.status,
        subtotal: o.subtotal,
        vat: o.vat,
        serviceCharge: o.service_charge,
        grandTotal: o.grand_total,
        estimatedTime: o.estimated_time,
        createdAt: o.created_at,
        items: (o.items || []).map(i => ({
          name: i.menu_item_name,
          qty: i.quantity,
          price: i.price,
          modifiers: i.modifiers,
          specialInstructions: i.special_instructions,
        })),
      }))

      // Notify if new orders came in
      if (mapped.length > prevCountRef.current && prevCountRef.current > 0) {
        const newCount = mapped.length - prevCountRef.current
        toast(`🛎️ ${newCount} new order${newCount > 1 ? 's' : ''}!`, {
          style: { fontWeight: 'bold', border: '2px solid #f97316', borderRadius: '12px' },
          duration: 5000,
        })
        // Sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator(); const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 880; osc.type = 'sine'
          gain.gain.setValueAtTime(0.4, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
          osc.start(); osc.stop(ctx.currentTime + 0.6)
        } catch (_) {}
      }
      prevCountRef.current = mapped.length
      setOrders(mapped)
      markAllRead()
    } catch (err) {
      if (!silent) toast.error('Could not connect to API server')
    } finally {
      setLoading(false)
    }
  }, [token, markAllRead])

  // Fetch on mount + every 5 seconds
  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(() => fetchOrders(true), 5000)
    return () => clearInterval(intervalRef.current)
  }, [fetchOrders])

  // Also listen for localStorage events (same-device ordering)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'new-order-event') fetchOrders(true)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [fetchOrders])

  // ── Update order status ───────────────────────
  const handleStatus = async (order, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
    if (selectedOrder?.id === order.id) setSelectedOrder(s => ({ ...s, status: newStatus }))

    try {
      await fetch(`${API}/orders/${order.dbId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Order → ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
      fetchOrders(true)
    }
  }

  // ── Delete order ──────────────────────────────
  const handleDelete = async (order) => {
    if (!confirm(`Delete order #${order.id}?`)) return
    setOrders(prev => prev.filter(o => o.id !== order.id))
    try {
      await fetch(`${API}/orders/${order.dbId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Order deleted')
    } catch {
      toast.error('Failed to delete')
      fetchOrders(true)
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !search ||
      (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.tableNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {orders.length} total · {orders.filter(o => ['new','preparing'].includes(o.status)).length} active
            <span className="ml-2 text-xs text-green-500">● Live (auto-refresh 5s)</span>
          </p>
        </div>
        <button onClick={() => fetchOrders()} className="btn-primary">
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'all' ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
          All ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${statusFilter === key ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none' : `${cfg.bg} border border-transparent`}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label} ({orders.filter(o => o.status === key).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID, table, or customer..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading orders from SQL Server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📦</p>
            <p className="font-semibold text-gray-500 dark:text-gray-400">
              {orders.length === 0 ? 'No orders yet — waiting for customers...' : 'No orders match your filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-gray-500 dark:text-gray-400 text-left">
                  <th className="px-5 py-3.5 font-semibold">Order</th>
                  <th className="px-4 py-3.5 font-semibold">Table</th>
                  <th className="px-4 py-3.5 font-semibold">Customer</th>
                  <th className="px-4 py-3.5 font-semibold">Items</th>
                  <th className="px-4 py-3.5 font-semibold">Total</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Time</th>
                  <th className="px-4 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((order, idx) => (
                    <motion.tr key={order.id} initial={{ opacity: 0, backgroundColor: 'rgba(234,88,12,0.1)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 1.5, delay: idx * 0.02 }} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">#{order.id?.slice(-6)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-bold">T{order.tableNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{order.customerName || <span className="text-gray-400">Guest</span>}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px]">
                        <p className="truncate text-xs">{order.items?.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')}</p>
                        <p className="text-[10px] text-gray-400">{order.items?.length} item(s)</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{Number(order.grandTotal || 0).toFixed(0)} ETB</td>
                      <td className="px-4 py-3">
                        <select value={order.status} onChange={e => handleStatus(order, e.target.value)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusConfig[order.status]?.bg}`}>
                          {Object.entries(statusConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedOrder(order)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><FiEye size={14} /></button>
                          <button onClick={() => handleDelete(order)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
              <div className="modal-header">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{selectedOrder.id?.slice(-6)}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Table {selectedOrder.tableNumber} · {timeAgo(selectedOrder.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="icon-btn"><FiX size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Status bar */}
                <div className={`flex items-center gap-3 p-3 rounded-xl ${statusConfig[selectedOrder.status]?.bg}`}>
                  <span className={`w-3 h-3 rounded-full ${statusConfig[selectedOrder.status]?.dot}`} />
                  <span className="font-bold capitalize">{selectedOrder.status}</span>
                  <span className="text-xs ml-auto">Est. {selectedOrder.estimatedTime} min</span>
                </div>
                {/* Customer */}
                {(selectedOrder.customerName || selectedOrder.phone || selectedOrder.notes) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1.5">
                    <p className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">👤 Customer</p>
                    {selectedOrder.customerName && <p className="text-sm text-gray-700 dark:text-gray-300"><b>Name:</b> {selectedOrder.customerName}</p>}
                    {selectedOrder.phone && <p className="text-sm text-gray-700 dark:text-gray-300"><b>Phone:</b> {selectedOrder.phone}</p>}
                    {selectedOrder.notes && <p className="text-sm text-orange-600 dark:text-orange-400 italic"><b>Notes:</b> {selectedOrder.notes}</p>}
                  </div>
                )}
                {/* Items */}
                <div>
                  <p className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">🛒 Items ({selectedOrder.items?.length})</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">×{item.qty} {item.name}</p>
                          {item.modifiers && <p className="text-xs text-gray-500 dark:text-gray-400">{item.modifiers}</p>}
                          {item.specialInstructions && <p className="text-xs text-orange-500 italic">📝 {item.specialInstructions}</p>}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm ml-4">{(item.price * item.qty).toFixed(0)} ETB</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>{selectedOrder.subtotal?.toFixed(0)} ETB</span></div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>VAT</span><span>{selectedOrder.vat?.toFixed(0)} ETB</span></div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Service</span><span>{selectedOrder.serviceCharge?.toFixed(0)} ETB</span></div>
                  <div className="flex justify-between font-black text-orange-500 pt-2 border-t border-gray-200 dark:border-gray-700"><span>Grand Total</span><span>{selectedOrder.grandTotal?.toFixed(0)} ETB</span></div>
                </div>
                {/* Status buttons */}
                <div>
                  <p className="label mb-2">Update Status</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button key={key} onClick={() => handleStatus(selectedOrder, key)} className={`py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === key ? 'bg-orange-500 text-white shadow-md' : cfg.bg}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
