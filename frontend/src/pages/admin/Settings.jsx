import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useRestaurantStore } from '../../store/useRestaurantStore'

export default function Settings() {
  const { info, fetchRestaurant, saveRestaurant } = useRestaurantStore()
  const token = localStorage.getItem('token')

  const [form, setForm] = useState({
    name: info.name || 'ABC Restaurant',
    nameAm: info.nameAm || 'ኤቢሲ ምግብ ቤት',
    tagline: info.tagline || 'Fine Dining & Fast Delivery',
    address: info.address || 'Bole Road, Addis Ababa, Ethiopia',
    phone: info.phone || '+251 91 859 2028',
    wifi: info.wifi || 'ABCRest@2024',
    hours: info.hours || 'Mon–Sun: 7:00 AM – 11:00 PM',
    vatRate: Math.round((info.vatRate ?? 0.15) * 100),
    serviceCharge: Math.round((info.serviceChargeRate ?? 0.10) * 100),
    currency: info.currency || 'ETB',
  })
  const [saving, setSaving] = useState(false)

  // Sync form when store info loads from API
  useEffect(() => {
    setForm({
      name: info.name || '',
      nameAm: info.nameAm || '',
      tagline: info.tagline || '',
      address: info.address || '',
      phone: info.phone || '',
      wifi: info.wifi || '',
      hours: info.hours || '',
      // Store keeps decimals (0.15), form shows percentages (15)
      vatRate: Math.round((info.vatRate ?? 0.15) * 100),
      serviceCharge: Math.round((info.serviceChargeRate ?? 0.10) * 100),
      currency: info.currency || 'ETB',
    })
  }, [info])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Restaurant name is required'); return }
    setSaving(true)
    const ok = await saveRestaurant(form, token)
    setSaving(false)
    if (ok) {
      toast.success('✅ Settings saved & applied everywhere!')
    } else {
      toast.success('✅ Settings saved locally')
    }
  }

  const handleRefresh = async () => {
    await fetchRestaurant()
    toast.success('Refreshed from server')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Restaurant configuration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw size={16} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              : <FiSave size={18} />
            }
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Info */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">🏪 Restaurant Info</h2>
          <div><label className="label">Name (English)</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="label">Name (Amharic)</label><input value={form.nameAm} onChange={e => setForm({ ...form, nameAm: e.target.value })} className="input-field" /></div>
          <div><label className="label">Tagline</label><input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className="input-field" /></div>
          <div><label className="label">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
          <div><label className="label">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
          <div><label className="label">WiFi Password</label><input value={form.wifi} onChange={e => setForm({ ...form, wifi: e.target.value })} className="input-field" /></div>
          <div><label className="label">Working Hours</label><input value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className="input-field" /></div>
        </div>

        {/* Billing */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">💰 Billing Settings</h2>
          <div><label className="label">VAT Rate (%)</label><input type="number" min="0" max="100" value={form.vatRate} onChange={e => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })} className="input-field" /><p className="text-xs text-gray-400 mt-1">Applied to all orders automatically</p></div>
          <div><label className="label">Service Charge (%)</label><input type="number" min="0" max="100" value={form.serviceCharge} onChange={e => setForm({ ...form, serviceCharge: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
          <div><label className="label">Currency</label><select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input-field"><option value="ETB">🇪🇹 ETB – Ethiopian Birr</option><option value="USD">🇺🇸 USD – US Dollar</option><option value="EUR">🇪🇺 EUR – Euro</option></select></div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Preview</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>1,000.00 {form.currency}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>VAT ({form.vatRate}%)</span><span>{(1000 * form.vatRate / 100).toFixed(2)} {form.currency}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Service ({form.serviceCharge}%)</span><span>{(1000 * form.serviceCharge / 100).toFixed(2)} {form.currency}</span></div>
              <div className="flex justify-between font-black text-orange-500 border-t border-gray-200 dark:border-gray-700 pt-2"><span>Total</span><span>{(1000 + 1000 * form.vatRate / 100 + 1000 * form.serviceCharge / 100).toFixed(2)} {form.currency}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
