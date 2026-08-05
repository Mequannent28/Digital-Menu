import { motion } from 'framer-motion'

const OPTIONS = [
  {
    type: 'dine_in',
    icon: '🪑',
    label: 'Dine In',
    labelAm: 'በምግብ ቤት',
    desc: 'Enjoy at your table',
    descAm: 'በጠረጴዛዎ ላይ ያስተናግዱ',
    color: 'from-orange-500 to-red-500',
    activeBg: 'bg-gradient-to-br from-orange-500 to-red-500',
    activeText: 'text-white',
    inactiveBg: 'bg-white dark:bg-gray-800',
    inactiveText: 'text-gray-600 dark:text-gray-300',
    inactiveBorder: 'border-gray-200 dark:border-gray-700',
  },
  {
    type: 'takeaway',
    icon: '🛍️',
    label: 'Takeaway',
    labelAm: 'ለማጓጓዝ',
    desc: 'Pick up when ready',
    descAm: 'ሲዘጋጅ ይውሰዱ',
    color: 'from-blue-500 to-indigo-500',
    activeBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    activeText: 'text-white',
    inactiveBg: 'bg-white dark:bg-gray-800',
    inactiveText: 'text-gray-600 dark:text-gray-300',
    inactiveBorder: 'border-gray-200 dark:border-gray-700',
  },
]

export default function OrderTypePicker({ value, onChange, language = 'en' }) {
  const lang = language === 'am' ? 'am' : 'en'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
      <h2 className="font-bold text-gray-900 dark:text-white mb-4">
        {lang === 'am' ? '🍽️ የትዕዛዝ ዓይነት ይምረጡ' : '🍽️ How would you like to order?'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(opt => {
          const isActive = value === opt.type
          return (
            <motion.button
              key={opt.type}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(opt.type)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                isActive
                  ? `${opt.activeBg} border-transparent shadow-lg`
                  : `${opt.inactiveBg} ${opt.inactiveBorder} hover:border-orange-300 dark:hover:border-orange-700`
              }`}
            >
              {/* Active checkmark */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-black">✓</span>
                </motion.div>
              )}
              <span className="text-4xl">{opt.icon}</span>
              <div className="text-center">
                <p className={`font-black text-sm ${isActive ? opt.activeText : opt.inactiveText}`}>
                  {lang === 'am' ? opt.labelAm : opt.label}
                </p>
                <p className={`text-[11px] mt-0.5 leading-tight ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                  {lang === 'am' ? opt.descAm : opt.desc}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
