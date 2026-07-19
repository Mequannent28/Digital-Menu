import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FiClock, FiStar, FiHeart, FiPlus } from 'react-icons/fi'
import { BsFire, BsLeaf } from 'react-icons/bs'
import useAppStore from '../../store/useAppStore'

/* ─────────────────────────────────────────────
   GRID CARD  (default card view)
───────────────────────────────────────────── */
export default function MenuItemCard({ item, onClick, view = 'grid' }) {
  if (view === 'list') return <MenuItemListCard item={item} onClick={onClick} />
  return <MenuItemGridCard item={item} onClick={onClick} />
}

/* ── Grid Card ── */
function MenuItemGridCard({ item, onClick }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { favorites, toggleFavorite } = useAppStore()
  const isFav = favorites.includes(item.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 relative group flex flex-col"
    >
      {/* Top badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {item.discount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            -{item.discount}% OFF
          </span>
        )}
        {item.isBestSeller && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            🔥 Best Seller
          </span>
        )}
        {item.chefRecommended && (
          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            👨‍🍳 Chef's Pick
          </span>
        )}
      </div>

      {/* Favourite */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition-transform"
      >
        <FiHeart size={15} className={isFav ? 'fill-red-500 stroke-red-500' : 'stroke-gray-500 dark:stroke-gray-300'} />
      </button>

      {/* Image */}
      <div className="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {item.image
          ? <img src={item.image} alt={language === 'am' ? item.nameAm : item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        }
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full">
              {t('unavailable')}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1 mb-1">
          {language === 'am' ? item.nameAm : item.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed mb-2 flex-1">
          {language === 'am' ? item.descriptionAm : item.description}
        </p>

        {/* Chips row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          {item.isSpicy && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
              <BsFire size={9} /> {t('spicy')}
            </span>
          )}
          {item.isVegetarian && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
              <BsLeaf size={9} /> {t('vegetarian')}
            </span>
          )}
          {item.prepTime && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              <FiClock size={9} /> {item.prepTime}m
            </span>
          )}
          {item.calories && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {item.calories} cal
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className={`w-3 h-3 ${s <= Math.round(item.rating) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-[10px] text-gray-400 ml-0.5">({item.reviewCount})</span>
        </div>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-lg font-extrabold text-orange-500 leading-none">
              {item.price.toFixed(0)} ETB
            </span>
            {item.discount > 0 && (
              <div className="text-[10px] text-gray-400 line-through leading-none mt-0.5">
                {(item.price / (1 - item.discount / 100)).toFixed(0)} ETB
              </div>
            )}
          </div>
          {item.isAvailable ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-colors"
            >
              <FiPlus size={19} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <span className="text-[10px] text-red-500 font-semibold">Unavailable</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   LIST CARD  (horizontal row view)
───────────────────────────────────────────── */
function MenuItemListCard({ item, onClick }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { favorites, toggleFavorite } = useAppStore()
  const isFav = favorites.includes(item.id)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-0 overflow-hidden cursor-pointer group relative"
    >
      {/* Left accent bar based on category */}
      <div className="w-1 flex-shrink-0 bg-gradient-to-b from-orange-400 to-red-500 rounded-l-2xl" />

      {/* Image */}
      <div className="relative w-28 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden self-center m-3 rounded-xl">
        {item.image
          ? <img src={item.image} alt={language === 'am' ? item.nameAm : item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        }
        {item.discount > 0 && (
          <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            -{item.discount}%
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
            <span className="text-white text-[9px] font-bold text-center leading-tight px-1">Not<br/>Available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-between">
        <div>
          {/* Badges row */}
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            {item.isBestSeller && (
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">🔥 Best</span>
            )}
            {item.chefRecommended && (
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">👨‍🍳 Chef</span>
            )}
            {item.isFeatured && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">⭐ Featured</span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mb-0.5">
            {language === 'am' ? item.nameAm : item.name}
          </h3>

          <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed mb-1.5">
            {language === 'am' ? item.descriptionAm : item.description}
          </p>

          {/* Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isSpicy && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                <BsFire size={9} /> {t('spicy')}
              </span>
            )}
            {item.isVegetarian && (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                <BsLeaf size={9} /> Veg
              </span>
            )}
            {item.prepTime && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                <FiClock size={9} /> {item.prepTime}m
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: rating + price + add */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <FiStar size={11} className="fill-amber-400 stroke-amber-400" />
              <span className="text-xs font-semibold text-gray-800 dark:text-white">{item.rating}</span>
              {item.calories && (
                <span className="text-[10px] text-gray-400">· {item.calories}cal</span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-extrabold text-orange-500">{item.price.toFixed(0)} ETB</span>
              {item.discount > 0 && (
                <span className="text-[10px] text-gray-400 line-through">
                  {(item.price / (1 - item.discount / 100)).toFixed(0)} ETB
                </span>
              )}
            </div>
          </div>

          {item.isAvailable ? (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-colors"
            >
              <FiPlus size={14} strokeWidth={2.5} />
              Add
            </motion.button>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">Unavailable</span>
          )}
        </div>
      </div>

      {/* Favourite */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition-transform"
      >
        <FiHeart size={13} className={isFav ? 'fill-red-500 stroke-red-500' : 'stroke-gray-500 dark:stroke-gray-300'} />
      </button>
    </motion.div>
  )
}
