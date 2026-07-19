import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FiX, FiMinus, FiPlus, FiClock, FiStar } from 'react-icons/fi'
import { BsFire, BsLeaf } from 'react-icons/bs'
import useCartStore from '../../store/useCartStore'
import toast from 'react-hot-toast'

export default function ItemDetailDrawer({ item, isOpen, onClose }) {
  const { t, i18n } = useTranslation()
  const addItem = useCartStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [itemModifiers, setItemModifiers] = useState([])
  const [loadingMods, setLoadingMods] = useState(false)
  const language = i18n.language

  // Fetch modifier groups from the API whenever the drawer opens
  useEffect(() => {
    if (!isOpen) return
    setLoadingMods(true)
    fetch('/api/modifiers/public')
      .then((r) => r.ok ? r.json() : [])
      .then((groups) => {
        // Normalise DB field names → what the UI expects
        const normalised = groups.map((g) => ({
          ...g,
          multiSelect: !!g.multi_select,
          maxSelect: g.max_select ?? 1,
          required: !!g.required,
          modifiers: (g.modifiers || []).map((m) => ({
            ...m,
            price: m.price ?? 0,
          })),
        }))
        // Only show groups that have at least one modifier option
        setItemModifiers(normalised.filter((g) => g.modifiers.length > 0))
      })
      .catch(() => setItemModifiers([]))
      .finally(() => setLoadingMods(false))
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setQuantity(1)
      setSelectedModifiers([])
      setSpecialInstructions('')
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  const handleModifierToggle = (group, modifier) => {
    const existing = selectedModifiers.filter((m) => m.groupId === group.id)

    if (group.multiSelect) {
      const isSelected = existing.find((m) => m.id === modifier.id)
      if (isSelected) {
        setSelectedModifiers(selectedModifiers.filter((m) => m.id !== modifier.id))
      } else {
        if (existing.length < group.maxSelect) {
          setSelectedModifiers([...selectedModifiers, { ...modifier, groupId: group.id }])
        }
      }
    } else {
      setSelectedModifiers([
        ...selectedModifiers.filter((m) => m.groupId !== group.id),
        { ...modifier, groupId: group.id },
      ])
    }
  }

  const calculateTotal = () => {
    const modTotal = selectedModifiers.reduce((sum, m) => sum + (m.price || 0), 0)
    return (item.price + modTotal) * quantity
  }

  const handleAddToCart = () => {
    const missingRequired = itemModifiers
      .filter((g) => g.required)
      .find((g) => !selectedModifiers.some((m) => m.groupId === g.id))

    if (missingRequired) {
      toast.error(`Please select ${missingRequired.name}`)
      return
    }
    addItem({
      id: item.id,
      name: item.name,
      nameAm: item.nameAm,
      price: item.price,
      image: item.image,
      quantity,
      selectedModifiers,
      specialInstructions,
    })

    toast.success(t('itemAdded'), { icon: '✅' })
    onClose()
  }

  if (!item) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-[101] max-h-[92vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX size={20} />
            </button>

            {/* Image */}
            <div className="relative h-64 bg-gray-100 dark:bg-gray-800">
              {item.image ? (
                <img
                  src={item.image}
                  alt={language === 'am' ? item.nameAm : item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            {/* Content */}
            <div className="px-5 py-6 pb-32">
              {/* Name + Price */}
              <div className="mb-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'am' ? item.nameAm : item.name}
                  </h2>
                  <span className="text-2xl font-bold text-orange-500 whitespace-nowrap">
                    {item.price.toFixed(2)} ETB
                  </span>
                </div>

                {/* Tags + Rating */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {item.isSpicy && (
                    <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                      <BsFire size={12} /> {t('spicy')}
                    </span>
                  )}
                  {item.isVegetarian && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                      <BsLeaf size={12} /> {t('vegetarian')}
                    </span>
                  )}
                  {item.prepTime && (
                    <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                      <FiClock size={12} /> {item.prepTime} {t('prepTime')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <FiStar size={13} className="fill-yellow-400 stroke-yellow-400" />
                    <span className="font-semibold">{item.rating}</span> ({item.reviewCount})
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {language === 'am' ? item.descriptionAm : item.description}
                </p>
              </div>

              {/* Ingredients */}
              {item.ingredients && (
                <div className="mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {t('ingredients')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.ingredients.join(', ')}
                  </p>
                </div>
              )}

              {/* Modifier Groups */}
              {loadingMods && (
                <div className="flex items-center justify-center py-6 mb-4">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading options…</span>
                </div>
              )}
              {!loadingMods && itemModifiers.map((group) => (
                <div key={group.id} className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'am' ? (group.name_am || group.name) : group.name}
                    {group.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {group.multiSelect
                      ? `${t('selectMultiple')} (${t('maxSelection', { max: group.maxSelect })})`
                      : t('selectOne')}
                  </p>
                  <div className="space-y-2">
                    {group.modifiers.map((mod) => {
                      const isSelected = selectedModifiers.some((m) => m.id === mod.id)
                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleModifierToggle(group, mod)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${isSelected
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {language === 'am' ? (mod.name_am || mod.name) : mod.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {mod.price === 0 ? t('free') : `+${mod.price.toFixed(2)} ETB`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {t('specialInstructions')}
                </h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={t('specialInstructionsPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Sticky footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 shadow-2xl">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                {/* Quantity selector */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiMinus size={18} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 dark:shadow-none"
                >
                  {t('addToCart')} • {calculateTotal().toFixed(2)} ETB
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
