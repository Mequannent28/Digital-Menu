import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiUser, FiPhone, FiMessageSquare, FiChevronDown } from 'react-icons/fi'
import useCartStore from '../../store/useCartStore'
import { useOrderStore } from '../../store/useOrderStore'
import { useMenuStore } from '../../store/useMenuStore'
import { restaurantInfo } from '../../data/mockData'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, tableNumber, setTable, clearCart } = useCartStore()
  const { placeOrder } = useOrderStore()
  const { tables } = useMenuStore()
  const { register, handleSubmit } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [selectedTable, setSelectedTable] = useState(tableNumber || '')

  const subtotal = items.reduce((sum, item) => {
    const modTotal = (item.selectedModifiers || []).reduce((ms, m) => ms + (m.price || 0), 0)
    return sum + (item.price + modTotal) * item.quantity
  }, 0)
  const vat = subtotal * restaurantInfo.vatRate
  const serviceCharge = subtotal * restaurantInfo.serviceChargeRate
  const grandTotal = subtotal + vat + serviceCharge

  const handleSelectTable = (table) => {
    if (table.status === 'occupied') {
      toast.error(`Table ${table.number} is currently occupied`, { icon: '🚫' })
      return
    }
    setSelectedTable(table.number)
    setTable(table.number)
    setShowTablePicker(false)
    toast.success(`Table ${table.number} selected`, { icon: '🪑' })
  }

  const onSubmit = async (data) => {
    if (!selectedTable) {
      toast.error('Please select a table first', { icon: '🪑' })
      setShowTablePicker(true)
      return
    }
    setIsSubmitting(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      const order = await placeOrder({
        tableNumber: selectedTable,
        customerName: data.customerName || '',
        phone: data.phone || '',
        notes: data.notes || '',
        items: items.map(i => ({
          name: i.name,
          qty: i.quantity,
          price: i.price,
          modifiers: (i.selectedModifiers || []).map(m => m.name).join(', '),
          specialInstructions: i.specialInstructions || '',
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        vat: parseFloat(vat.toFixed(2)),
        serviceCharge: parseFloat(serviceCharge.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        estimatedTime: Math.floor(Math.random() * 15 + 15),
      })
      clearCart()
      navigate(`/order-confirmation/${order.id}`, { replace: true })
    } catch {
      toast.error(t('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) { navigate('/menu', { replace: true }); return null }

  const statusColors = {
    available: 'border-green-400 bg-green-50 dark:bg-green-900/20',
    occupied:  'border-red-400 bg-red-50 dark:bg-red-900/20 opacity-60',
    reserved:  'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 opacity-70',
  }
  const statusDot = {
    available: 'bg-green-500',
    occupied: 'bg-red-500',
    reserved: 'bg-yellow-500',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-14">
          <button onClick={() => navigate('/cart')} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('checkout')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-36">

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">📋 Order Summary ({items.length} {items.length === 1 ? t('item') : t('items')})</h2>
          <div className="space-y-2 mb-4">
            {items.map(item => {
              const modTotal = (item.selectedModifiers || []).reduce((ms, m) => ms + (m.price || 0), 0)
              const total = (item.price + modTotal) * item.quantity
              return (
                <div key={item.cartId} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 flex-1">
                    {item.quantity}× {item.name}
                    {item.selectedModifiers?.length > 0 && (
                      <span className="text-gray-400 ml-1 text-xs">({item.selectedModifiers.map(m => m.name).join(', ')})</span>
                    )}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium ml-3">{total.toFixed(0)} ETB</span>
                </div>
              )
            })}
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>{t('subtotal')}</span><span>{subtotal.toFixed(0)} ETB</span></div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>{t('vat')}</span><span>{vat.toFixed(0)} ETB</span></div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>{t('serviceCharge')}</span><span>{serviceCharge.toFixed(0)} ETB</span></div>
            <div className="flex justify-between text-base font-bold text-orange-500 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>{t('grandTotal')}</span><span>{grandTotal.toFixed(0)} ETB</span>
            </div>
          </div>
        </motion.div>

        {/* Table Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">🪑 Select Your Table *</h2>

          {/* Selected table display / trigger */}
          <button
            type="button"
            onClick={() => setShowTablePicker(!showTablePicker)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selectedTable
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-red-300 bg-red-50 dark:bg-red-900/10 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪑</span>
              <div className="text-left">
                {selectedTable ? (
                  <>
                    <p className="font-bold text-gray-900 dark:text-white">Table {selectedTable}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✅ Table selected</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-red-500">No table selected</p>
                    <p className="text-xs text-red-400">Tap to choose your table</p>
                  </>
                )}
              </div>
            </div>
            <motion.div animate={{ rotate: showTablePicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <FiChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
            </motion.div>
          </button>

          {/* Table grid picker */}
          <AnimatePresence>
            {showTablePicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupied</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Reserved</span>
                  </div>

                  {/* Table grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {tables.map(table => {
                      const isSelected = selectedTable === table.number
                      const isOccupied = table.status === 'occupied'
                      const isReserved = table.status === 'reserved'
                      return (
                        <motion.button
                          key={table.id}
                          type="button"
                          whileTap={!isOccupied ? { scale: 0.93 } : {}}
                          onClick={() => handleSelectTable(table)}
                          className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none'
                              : statusColors[table.status]
                          } ${isOccupied || isReserved ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                        >
                          {/* Status dot */}
                          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : statusDot[table.status]}`} />

                          <span className="text-2xl mb-1">🪑</span>
                          <p className={`font-bold text-xs leading-tight text-center ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            Table {table.number}
                          </p>
                          <p className={`text-[10px] mt-0.5 capitalize font-medium ${
                            isSelected ? 'text-orange-100' :
                            isOccupied ? 'text-red-500' :
                            isReserved ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {isOccupied ? '🚫 Occupied' : isReserved ? '⏳ Reserved' : '✅ Free'}
                          </p>
                          <p className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                            {table.capacity} seats
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">👤 Contact Info</h2>
          <div className="space-y-3">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input {...register('customerName')} type="text" placeholder={t('customerName')} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input {...register('phone')} type="tel" placeholder={t('phoneNumber')} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="relative">
              <FiMessageSquare className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <textarea {...register('notes')} placeholder={t('notes')} rows={3} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 z-30">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 dark:shadow-none text-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full" />Processing...</>
            ) : (
              `${t('placeOrder')} · ${grandTotal.toFixed(0)} ETB`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
