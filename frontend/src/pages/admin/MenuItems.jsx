import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiX, FiSave } from 'react-icons/fi'
import { BsFire, BsLeaf } from 'react-icons/bs'
import toast from 'react-hot-toast'
import { useMenuStore } from '../../store/useMenuStore'

const emptyForm = {
  name: '', nameAm: '', description: '', descriptionAm: '', price: '', categoryId: '',
  image: '', prepTime: 15, calories: '', isSpicy: false, isVegetarian: false,
  isAvailable: true, isFeatured: false, isPopular: false, isBestSeller: false,
  chefRecommended: false, discount: 0, allergens: '', rating: 4.5,
}

export default function MenuItems() {
  const { menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailable } = useMenuStore()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = catFilter === 'all' || item.categoryId === catFilter
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.nameAm || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [menuItems, catFilter, search])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name, nameAm: item.nameAm || '', description: item.description || '', descriptionAm: item.descriptionAm || '',
      price: item.price, categoryId: item.categoryId, image: item.image || '', prepTime: item.prepTime || 15,
      calories: item.calories || '', isSpicy: !!item.isSpicy, isVegetarian: !!item.isVegetarian,
      isAvailable: !!item.isAvailable, isFeatured: !!item.isFeatured, isPopular: !!item.isPopular,
      isBestSeller: !!item.isBestSeller, chefRecommended: !!item.chefRecommended, discount: item.discount || 0,
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : '', rating: item.rating || 4.5,
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) { toast.error('Valid price required'); return }
    if (!form.categoryId) { toast.error('Select a category'); return }

    const payload = {
      ...form,
      price: Number(form.price),
      prepTime: Number(form.prepTime) || 15,
      calories: form.calories ? Number(form.calories) : null,
      discount: Number(form.discount) || 0,
      rating: Number(form.rating) || 4.5,
      allergens: form.allergens.split(',').map(s => s.trim()).filter(Boolean),
    }

    if (editing) {
      updateMenuItem(editing.id, payload)
      toast.success('✅ Item updated')
    } else {
      addMenuItem(payload)
      toast.success('✅ Item added')
    }
    setShowModal(false)
  }

  const handleDelete = (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    deleteMenuItem(item.id)
    toast.success('🗑️ Deleted')
  }

  const getCat = (catId) => categories.find(c => c.id === catId || String(c.id) === String(catId))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Items</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {menuItems.length} items · {menuItems.filter(i => i.isAvailable).length} available
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <FiPlus size={18} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">No items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-gray-500 dark:text-gray-400 text-left">
                  <th className="px-5 py-3.5 font-semibold">Item</th>
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Price</th>
                  <th className="px-4 py-3.5 font-semibold">Tags</th>
                  <th className="px-4 py-3.5 font-semibold">Available</th>
                  <th className="px-4 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const cat = getCat(item.categoryId)
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className={`border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!item.isAvailable ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.nameAm}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {cat ? `${cat.icon} ${cat.name}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 dark:text-white">{Number(item.price).toFixed(0)} ETB</span>
                        {item.discount > 0 && <div className="text-xs text-red-500">-{item.discount}%</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {item.isSpicy && <span className="badge badge-red"><BsFire size={9} /> Spicy</span>}
                          {item.isVegetarian && <span className="badge badge-green"><BsLeaf size={9} /> Veg</span>}
                          {item.isFeatured && <span className="badge badge-purple">⭐</span>}
                          {item.isBestSeller && <span className="badge badge-amber">🔥</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleAvailable(item.id)} className={`toggle-btn ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`toggle-dot ${item.isAvailable ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="icon-btn"><FiEdit2 size={14} /></button>
                          <button onClick={() => handleDelete(item)} className="icon-btn text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ItemModal
            title={editing ? `Edit: ${editing.name}` : 'Add Menu Item'}
            form={form}
            setForm={setForm}
            categories={categories}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ItemModal({ title, form, setForm, categories, onClose, onSave }) {
  const [tab, setTab] = useState('basic')
  const tabs = [
    { id: 'basic', label: '📝 Basic', },
    { id: 'details', label: '🔍 Details' },
    { id: 'flags', label: '🏷️ Flags' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="icon-btn"><FiX size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-semibold transition-colors relative ${tab === t.id ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {t.label}
              {tab === t.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {tab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Name (English) *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Margherita Pizza" className="input-field" /></div>
                <div className="col-span-2"><label className="label">Name (Amharic)</label><input value={form.nameAm} onChange={e => setForm({...form, nameAm: e.target.value})} placeholder="e.g. ማርጌሪታ ፒዛ" className="input-field" /></div>
                <div><label className="label">Category *</label><select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="input-field"><option value="">Select</option>{categories.map(c => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}</select></div>
                <div><label className="label">Price (ETB) *</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" className="input-field" /></div>
                <div className="col-span-2"><label className="label">Image URL</label><div className="flex gap-2"><input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." className="input-field flex-1" /><div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">{form.image ? <img src={form.image} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><FiImage size={20} /></div>}</div></div></div>
                <div className="col-span-2"><label className="label">Description (English)</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Brief description..." className="input-field resize-none" /></div>
                <div className="col-span-2"><label className="label">Description (Amharic)</label><textarea value={form.descriptionAm} onChange={e => setForm({...form, descriptionAm: e.target.value})} rows={2} placeholder="Brief description in Amharic..." className="input-field resize-none" /></div>
              </div>
            </>
          )}

          {tab === 'details' && (
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Prep Time (min)</label><input type="number" value={form.prepTime} onChange={e => setForm({...form, prepTime: e.target.value})} className="input-field" /></div>
              <div><label className="label">Calories</label><input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="Optional" className="input-field" /></div>
              <div><label className="label">Discount (%)</label><input type="number" min="0" max="100" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="input-field" /></div>
              <div className="col-span-3"><label className="label">Allergens (comma-separated)</label><input value={form.allergens} onChange={e => setForm({...form, allergens: e.target.value})} placeholder="e.g. Gluten, Dairy, Nuts" className="input-field" /></div>
              <div><label className="label">Rating (1-5)</label><input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="input-field" /></div>
            </div>
          )}

          {tab === 'flags' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'isSpicy', label: 'Spicy', icon: '🌶️', desc: 'Mark as spicy dish' },
                { key: 'isVegetarian', label: 'Vegetarian', icon: '🥬', desc: 'Suitable for vegetarians' },
                { key: 'isAvailable', label: 'Available', icon: '✅', desc: 'Currently available' },
                { key: 'isFeatured', label: 'Featured', icon: '⭐', desc: 'Show in featured section' },
                { key: 'isPopular', label: 'Popular', icon: '🔥', desc: 'Mark as popular dish' },
                { key: 'isBestSeller', label: 'Best Seller', icon: '🏆', desc: 'Best selling item' },
                { key: 'chefRecommended', label: "Chef's Pick", icon: '👨‍🍳', desc: 'Chef recommendation' },
              ].map(f => (
                <label key={f.key} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form[f.key] ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.checked})} className="mt-0.5 w-4 h-4 text-orange-500 rounded focus:ring-orange-400" />
                  <div className="flex-1"><div className="font-semibold text-gray-900 dark:text-white text-sm">{f.icon} {f.label}</div><div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</div></div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave} className="btn-primary"><FiSave size={18} /> Save Item</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
