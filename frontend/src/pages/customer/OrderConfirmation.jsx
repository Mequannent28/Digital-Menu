import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const estimatedTime = Math.floor(Math.random() * 15 + 15)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-5xl">🎉</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('orderPlaced')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            {t('thankYou')}
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-4 py-2 inline-block my-3">
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              {t('orderNumber')}{orderId}
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 my-6"
        >
          <div className="flex justify-center gap-3 mb-3">
            {['🍳', '👨‍🍳', '🍽️'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                className="text-2xl"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('estimatedTime')}
          </p>
          <p className="text-3xl font-bold text-orange-500">
            ~{estimatedTime} <span className="text-lg">{t('minutes')}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {/* Progress steps */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            {[
              { icon: '📋', label: 'Order Received', done: true },
              { icon: '👨‍🍳', label: 'Preparing', done: false },
              { icon: '✅', label: 'Ready', done: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  step.done
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-gray-100 dark:bg-gray-600 opacity-50'
                }`}>
                  {step.icon}
                </div>
                <span className={step.done ? 'text-orange-500 font-medium' : ''}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 dark:shadow-none"
          >
            {t('backToMenu')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
