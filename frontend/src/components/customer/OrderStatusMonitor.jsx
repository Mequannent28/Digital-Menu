import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrderStore } from '../../store/useOrderStore'
import useCartStore from '../../store/useCartStore'
import toast from 'react-hot-toast'

const statusConfig = {
  preparing: { label: 'Preparing', labelAm: 'በማዘጋጀት ላይ', icon: '👨‍🍳' },
  ready: { label: 'Ready!', labelAm: 'ዝግጁ ነው!', icon: '✅' },
  served: { label: 'Served', labelAm: 'ተመግቧል', icon: '🍽️' },
}

/**
 * OrderStatusMonitor - Background component that polls for order status changes
 * Shows notifications when customer's orders change status (preparing → ready)
 * Works globally across all customer pages
 */
export default function OrderStatusMonitor() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const tableNumber = useCartStore(s => s.tableNumber)
  const { orders } = useOrderStore()
  const prevStatusesRef = useRef({})
  const hasShownNotificationRef = useRef({})

  // Filter to customer's orders
  const lastOrder = orders?.filter(o => o.phone)?.at(0)
  const customerPhone = lastOrder?.phone || null
  const myOrders = (orders || []).filter(o =>
    customerPhone ? o.phone === customerPhone : o.tableNumber === tableNumber
  )

  useEffect(() => {
    const checkOrderStatuses = async () => {
      for (const order of myOrders.filter(o => !['served', 'cancelled'].includes(o.status))) {
        try {
          const res = await fetch(`/api/orders/${order.id}`)
          if (!res.ok) continue

          const updated = await res.json()
          const newStatus = updated.status
          const prevStatus = prevStatusesRef.current[order.id]

          // If status changed and we haven't shown this notification yet
          if (prevStatus && prevStatus !== newStatus && !hasShownNotificationRef.current[`${order.id}-${newStatus}`]) {
            const cfg = statusConfig[newStatus]
            
            if (newStatus === 'ready') {
              // Big notification for ready status
              toast.success(
                `${cfg.icon} ${t('orderReady')} #${order.id.slice(-4)}!`,
                {
                  duration: 10000,
                  style: {
                    fontWeight: 'bold',
                    border: '3px solid #10b981',
                    borderRadius: '16px',
                    padding: '20px',
                    fontSize: '16px',
                  },
                }
              )

              // Play alert sound
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                
                // Double beep
                osc.frequency.value = 880
                osc.type = 'sine'
                gain.gain.setValueAtTime(0.6, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
                osc.start()
                osc.stop(ctx.currentTime + 0.3)
                
                setTimeout(() => {
                  const osc2 = ctx.createOscillator()
                  const gain2 = ctx.createGain()
                  osc2.connect(gain2)
                  gain2.connect(ctx.destination)
                  osc2.frequency.value = 1100
                  osc2.type = 'sine'
                  gain2.gain.setValueAtTime(0.6, ctx.currentTime)
                  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
                  osc2.start()
                  osc2.stop(ctx.currentTime + 0.3)
                }, 200)
              } catch (_) {}
              
            } else if (newStatus === 'preparing') {
              toast(
                `${cfg.icon} ${language === 'am' ? cfg.labelAm : cfg.label}`,
                {
                  icon: '👨‍🍳',
                  duration: 5000,
                  style: {
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                  },
                }
              )
            }

            // Mark this notification as shown
            hasShownNotificationRef.current[`${order.id}-${newStatus}`] = true
          }

          // Update tracked status
          prevStatusesRef.current[order.id] = newStatus
        } catch (_) {
          // Silently fail for network errors
        }
      }
    }

    // Initialize previous statuses on mount
    myOrders.forEach(o => {
      if (!prevStatusesRef.current[o.id]) {
        prevStatusesRef.current[o.id] = o.status
      }
    })

    // Check immediately on mount
    checkOrderStatuses()

    // Poll every 15 seconds (more frequent than order history page)
    const interval = setInterval(checkOrderStatuses, 15000)

    return () => clearInterval(interval)
  }, [myOrders, t, language])

  // This component doesn't render anything
  return null
}
