import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiBell, FiCheckCircle, FiVolume2, FiVolumeX, FiX, FiCheck } from 'react-icons/fi'
// ── Audio & Vibration Generator for Waiter Mobile ──────────────────────────────
function playWaiterBellSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const playBell = (freq, duration, delay) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)
          gain.gain.setValueAtTime(0.8, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + duration)
        } catch (_) { }
      }, delay)
    }

    // Double crisp service bell chime (1200Hz + 1500Hz)
    playBell(1200, 0.4, 0)
    playBell(1500, 0.5, 120)
    playBell(1200, 0.4, 400)
    playBell(1500, 0.6, 520)
  } catch (_) { }

  // Trigger strong waiter mobile phone vibration
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000])
    } catch (_) { }
  }
}

function sendWaiterOSNotification(tableNumber) {
    if (!('Notification' in window)) return
    const title = `🛎️ TABLE #${tableNumber} CALLING WAITER!`
    const body = `Customer at Table ${tableNumber} requires immediate assistance.`

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'waiter-call-' + tableNumber,
          renotify: true,
          requireInteraction: true,
        })
      } catch (_) { }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission()
    }
  }

  export default function WaiterCallsMonitor() {
    const [calls, setCalls] = useState([])
    const [soundMuted, setSoundMuted] = useState(false)
    const [waiters, setWaiters] = useState([])
    const [now, setNow] = useState(Date.now())   // ticks every second for elapsed display
    const soundIntervalRef = useRef(null)

    // Tick every second so elapsed time updates live
    useEffect(() => {
      const tick = setInterval(() => setNow(Date.now()), 1000)
      return () => clearInterval(tick)
    }, [])

    const fetchCalls = async () => {
      try {
        const res = await fetch('/api/waiter-calls')
        if (res.ok) {
          const data = await res.json()
          setCalls(data)
        }
      } catch (_) { }
    }

    const fetchWaiters = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          // Case-insensitive match - UI may save "Waiter" or "waiter"
          const waiterList = data.filter(u => u.role?.toLowerCase() === 'waiter')
          setWaiters(waiterList)
        }
      } catch (_) { }
    }

    const assignWaiter = async (callId, waiterId) => {
      if (!waiterId) return
      const waiter = waiters.find(w => String(w.id) === String(waiterId))
      try {
        await fetch(`/api/waiter-calls/${callId}/assign`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waiterId, waiterName: waiter?.name })
        })
        toast.success(`Assigned to ${waiter?.name}`)
        fetchCalls()
      } catch (_) { }
    }

    const resolveCall = async (id) => {
      try {
        await fetch(`/api/waiter-calls/${id}/resolve`, { method: 'PUT' })
        setCalls(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c))
        toast.success('Waiter call resolved! 👍')
      } catch (_) { }
    }

    const clearAll = async () => {
      try {
        await fetch('/api/waiter-calls', { method: 'DELETE' })
        setCalls([])
        toast.success('All waiter calls cleared')
      } catch (_) { }
    }

    const pendingCalls = calls.filter(c => c.status === 'pending')

    // Real-time socket events & polling
    useEffect(() => {
      const socket = io('/', { transports: ['websocket', 'polling'] })

      socket.on('waiter_call_created', (newCall) => {
        fetchCalls()
        fetchWaiters()  // Refresh waiter list when a new call arrives
        playWaiterBellSound()
        sendWaiterOSNotification(newCall.tableNumber)

        toast.custom((tItem) => (
          <div className={`flex items-center gap-3 bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl border border-red-500 font-bold ${tItem.visible ? 'animate-enter' : 'animate-leave'}`}>
            <span className="text-3xl animate-bounce">🛎️</span>
            <div>
              <p className="text-base">TABLE #{newCall.tableNumber} CALLING WAITER!</p>
              <p className="text-xs text-red-100 font-normal">Customer requested assistance</p>
            </div>
          </div>
        ), { duration: 10000 })
      })

      socket.on('waiter_call_resolved', () => { fetchCalls(); fetchWaiters(); })
      socket.on('waiter_calls_cleared', () => { fetchCalls(); fetchWaiters(); })
      socket.on('waiter_call_assigned', () => { fetchCalls(); fetchWaiters(); })

      fetchCalls()
      fetchWaiters()
      const poll = setInterval(() => {
        fetchCalls()
        fetchWaiters()
      }, 3000)

      return () => {
        socket.disconnect()
        clearInterval(poll)
      }
    }, [])

    // Repeat sound/vibration while there are pending calls unless muted
    useEffect(() => {
      if (pendingCalls.length > 0 && !soundMuted) {
        if (!soundIntervalRef.current) {
          playWaiterBellSound()
          soundIntervalRef.current = setInterval(() => {
            playWaiterBellSound()
          }, 4000)
        }
      } else {
        if (soundIntervalRef.current) {
          clearInterval(soundIntervalRef.current)
          soundIntervalRef.current = null
        }
      }

      return () => {
        if (soundIntervalRef.current) {
          clearInterval(soundIntervalRef.current)
          soundIntervalRef.current = null
        }
      }
    }, [pendingCalls.length, soundMuted])

    return (
      <>
        {/* ── Active Pending Waiter Calls Pop-up Modal / Alert Card ── */}
        <AnimatePresence>
          {pendingCalls.length > 0 && (
            <div className="fixed top-20 right-5 z-50 w-full max-w-sm pointer-events-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-2xl border-2 border-red-500/80 overflow-hidden relative"
              >
                {/* Pulsing Alert Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center text-lg animate-bounce">
                      🛎️
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                        Waiter Calls ({pendingCalls.length})
                      </h3>
                      <p className="text-xs text-red-500 font-semibold animate-pulse">Vibrating & Ringing...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSoundMuted(!soundMuted)}
                      title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {soundMuted ? <FiVolumeX size={18} className="text-red-500" /> : <FiVolume2 size={18} />}
                    </button>
                  </div>
                </div>

                {/* List of Pending Calls */}
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3 pr-1">
                  {pendingCalls.map((call) => (
                    <div
                      key={call.id}
                      className="flex flex-col gap-2 p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="inline-block bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg mr-2">
                            TABLE #{call.tableNumber}
                          </span>
                          <span className="text-xs text-red-800 dark:text-red-300 font-medium">
                            {call.reason}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {/* Elapsed seconds badge */}
                          {call.createdAt && (() => {
                            const secs = Math.floor((now - new Date(call.createdAt)) / 1000)
                            const mins = Math.floor(secs / 60)
                            const elapsed = mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`
                            const isUrgent = secs > 60
                            return (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isUrgent
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              }`}>
                                ⏱ {elapsed}
                              </span>
                            )
                          })()}
                          <button
                            onClick={() => resolveCall(call.id)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-md shadow-emerald-200 dark:shadow-none"
                          >
                            <FiCheck size={14} /> Attended
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap mr-2">Waiter:</span>
                        {call.assignedTo ? (
                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                            {call.waiterName || 'Assigned'}
                          </div>
                        ) : (
                          <select
                            onChange={(e) => assignWaiter(call.id, e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-1.5"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign waiter...</option>
                            {waiters.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer action */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-gray-400">Managed by Admin</span>
                  <button
                    onClick={clearAll}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Clear All Calls
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    )
  }
