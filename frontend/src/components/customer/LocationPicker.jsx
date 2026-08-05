import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiSearch, FiX, FiEdit3, FiCheck, FiNavigation, FiWifi } from 'react-icons/fi'

// ── Ethiopia-biased Nominatim search ────────────────────────────────────────
async function searchAddress(q) {
  try {
    const base = 'https://nominatim.openstreetmap.org/search'
    const params = new URLSearchParams({
      q, countrycodes: 'et', viewbox: '33,3,48,15', bounded: '0',
      format: 'json', limit: '6', addressdetails: '1', 'accept-language': 'en',
    })
    const res = await fetch(`${base}?${params}`, { headers: { 'User-Agent': 'DigitalMenuApp/1.0' } })
    const data = await res.json()
    if (!data.length) {
      const p2 = new URLSearchParams({ q: `${q} Ethiopia`, format: 'json', limit: '6', addressdetails: '1', 'accept-language': 'en' })
      const r2 = await fetch(`${base}?${p2}`, { headers: { 'User-Agent': 'DigitalMenuApp/1.0' } })
      return await r2.json()
    }
    return data
  } catch { return [] }
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'DigitalMenuApp/1.0' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const parts = [a.road || a.pedestrian, a.suburb || a.neighbourhood, a.city || a.town || a.village].filter(Boolean)
    return parts.length >= 2 ? parts.join(', ') + ', Ethiopia' : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}` }
}

function formatPlace(place) {
  const a = place.address || {}
  const name = a.road || a.pedestrian || a.suburb || a.neighbourhood || place.display_name?.split(',')[0]
  const sub  = [a.suburb || a.neighbourhood, a.city || a.town || a.village || a.county].filter(Boolean).join(', ')
  return { name, sub: sub || place.display_name, fullAddress: place.display_name }
}

// ── Popular Ethiopian locations ──────────────────────────────────────────────
const POPULAR = [
  { label: 'Bole',      sub: 'Addis Ababa', lat: 8.9936,  lng: 38.7897 },
  { label: 'Kazanchis', sub: 'Addis Ababa', lat: 9.0139,  lng: 38.7613 },
  { label: 'Piassa',    sub: 'Addis Ababa', lat: 9.0338,  lng: 38.7523 },
  { label: 'Megenagna', sub: 'Addis Ababa', lat: 9.0208,  lng: 38.8042 },
  { label: 'CMC',       sub: 'Addis Ababa', lat: 9.0442,  lng: 38.8180 },
  { label: 'Sarbet',    sub: 'Addis Ababa', lat: 9.0000,  lng: 38.7500 },
  { label: 'Ayat',      sub: 'Addis Ababa', lat: 9.0623,  lng: 38.8431 },
  { label: 'Lebu',      sub: 'Addis Ababa', lat: 8.9596,  lng: 38.7200 },
  { label: 'Gotera',    sub: 'Addis Ababa', lat: 9.0040,  lng: 38.7350 },
  { label: 'Summit',    sub: 'Addis Ababa', lat: 9.0283,  lng: 38.7964 },
  { label: 'Kaliti',    sub: 'Addis Ababa', lat: 8.9330,  lng: 38.7930 },
  { label: '4 Kilo',    sub: 'Addis Ababa', lat: 9.0370,  lng: 38.7623 },
  { label: '6 Kilo',    sub: 'Addis Ababa', lat: 9.0434,  lng: 38.7634 },
  { label: 'Gerji',     sub: 'Addis Ababa', lat: 9.0102,  lng: 38.8186 },
  { label: 'Lideta',    sub: 'Addis Ababa', lat: 9.0141,  lng: 38.7444 },
  { label: 'Kolfe',     sub: 'Addis Ababa', lat: 9.0230,  lng: 38.7191 },
  { label: 'Bahir Dar', sub: 'Amhara',      lat: 11.5936, lng: 37.3906 },
  { label: 'Hawassa',   sub: 'Sidama',      lat: 7.0504,  lng: 38.4955 },
  { label: 'Dire Dawa', sub: 'Dire Dawa',   lat: 9.5931,  lng: 41.8661 },
  { label: 'Adama',     sub: 'Oromia',      lat: 8.5400,  lng: 39.2700 },
  { label: 'Mekelle',   sub: 'Tigray',      lat: 13.4967, lng: 39.4753 },
  { label: 'Jimma',     sub: 'Oromia',      lat: 7.6667,  lng: 36.8333 },
  { label: 'Gondar',    sub: 'Amhara',      lat: 12.6030, lng: 37.4521 },
]

// Build a shareable Google Maps link that shows a pin for fixed location
// or opens navigation for live location
function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LocationPicker({ value, onChange, language = 'en' }) {
  const lang = language === 'am' ? 'am' : 'en'

  // tabs: 'manual' | 'search' | 'live'
  const [tab, setTab]                 = useState('manual')
  const [manualText, setManualText]   = useState(value?.address || '')
  const [searchQuery, setSearch]      = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const [mapErr, setMapErr]           = useState(false)

  // Live location state
  const [liveStatus, setLiveStatus]   = useState('idle') // idle | requesting | active | error | denied
  const [liveCoords, setLiveCoords]   = useState(null)   // { lat, lng, accuracy }
  const [liveAddress, setLiveAddress] = useState('')
  const [liveError, setLiveError]     = useState('')
  const watchIdRef                    = useRef(null)
  const searchTimer                   = useRef(null)

  const isConfirmed = !!value

  // Stop watching when unmounted or tab changes away from live
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  // ── Manual confirm ───────────────────────────────────
  const confirmManual = () => {
    const text = manualText.trim()
    if (!text) return
    onChange({ address: text, lat: value?.lat || null, lng: value?.lng || null, isLive: false })
  }

  // ── Search ───────────────────────────────────────────
  const handleSearchInput = (e) => {
    const q = e.target.value
    setSearch(q)
    clearTimeout(searchTimer.current)
    setSuggestions([])
    if (q.length < 2) return
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      setSuggestions(await searchAddress(q))
      setSearching(false)
    }, 500)
  }

  const selectSuggestion = (place) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    const { name, sub, fullAddress } = formatPlace(place)
    const address = [name, sub].filter(Boolean).join(', ')
    onChange({ address: address || fullAddress, lat, lng, isLive: false })
    setManualText(address || fullAddress)
    setSearch(''); setSuggestions([]); setTab('manual')
  }

  const selectPopular = (p) => {
    const address = `${p.label}, ${p.sub}, Ethiopia`
    onChange({ address, lat: p.lat, lng: p.lng, isLive: false })
    setManualText(address)
    setShowPopular(false); setTab('manual')
  }

  // ── Live location ────────────────────────────────────
  const doWatch = useCallback(() => {
    // Clear any existing watch first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        setLiveCoords({ lat, lng, accuracy })
        setLiveStatus('active')
        setLiveError('')
        const addr = await reverseGeocode(lat, lng)
        if (addr) setLiveAddress(addr)
        onChange({ address: addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng, isLive: true, liveLink: mapsLink(lat, lng) })
      },
      (err) => {
        if (err.code === 1) {
          setLiveStatus('denied')
          setLiveError(lang === 'am'
            ? 'ቦታ ፈቃድ ተከልክሏል።'
            : 'Location permission denied.')
        } else if (err.code === 2) {
          setLiveStatus('error')
          setLiveError(lang === 'am' ? 'ቦታ ምልክት አልተገኘም።' : 'Location signal unavailable. Make sure GPS is on.')
        } else {
          setLiveStatus('error')
          setLiveError(lang === 'am' ? 'ጊዜ አለፈ፤ እንደገና ሞክሩ።' : 'Timed out. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }, [lang, onChange])

  const startLive = useCallback(async () => {
    setLiveError('')

    if (!navigator.geolocation) {
      setLiveStatus('error')
      setLiveError(lang === 'am' ? 'GPS አይደገፍም' : 'Geolocation is not supported by this browser.')
      return
    }

    // Check current permission state before calling watchPosition
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        if (result.state === 'denied') {
          // Already hard-denied — cannot prompt again, must guide user to settings
          setLiveStatus('denied')
          setLiveError(lang === 'am'
            ? 'ቦታ ፈቃድ ቀደም ሲል ተከልክሏል። ከዚህ በታች ያሉ ደረጃዎችን ይከተሉ።'
            : 'Location was previously denied. Follow the steps below to re-enable it.')
          return
        }
        // state is 'granted' or 'prompt' — safe to call watchPosition
        setLiveStatus('requesting')
        doWatch()
        return
      } catch (_) {
        // Permissions API not fully supported — fall through to direct call
      }
    }

    // Fallback: just try directly
    setLiveStatus('requesting')
    doWatch()
  }, [lang, doWatch])

  const stopLive = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setLiveStatus('idle')
    setLiveCoords(null)
    setLiveAddress('')
  }, [])

  const clearLocation = () => {
    stopLive()
    onChange(null)
    setManualText(''); setSearch(''); setSuggestions([]); setMapErr(false)
  }

  const TABS = [
    { id: 'manual', icon: FiEdit3,     label: lang === 'am' ? 'ጽፍ'    : 'Type'   },
    { id: 'search', icon: FiSearch,    label: lang === 'am' ? 'ፈልግ'   : 'Search' },
    { id: 'live',   icon: FiNavigation,label: lang === 'am' ? 'ቀጥታ'   : 'Live'   },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <FiMapPin className="text-blue-500 flex-shrink-0" size={17} />
            {lang === 'am' ? 'የደረሻ አድራሻ' : 'Destination Location'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
            {lang === 'am' ? 'ምግቡን ወዴት ማምጣት ይፈልጋሉ? (አስፈላጊ አይደለም)' : 'Where should we bring your order? (optional)'}
          </p>
        </div>
        {isConfirmed && (
          <button type="button" onClick={clearLocation}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors flex-shrink-0">
            <FiX size={13} />
          </button>
        )}
      </div>

      {/* Confirmed address card */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            {/* Map thumbnail */}
            {value.lat && value.lng && !mapErr && (
              <div className="rounded-xl overflow-hidden mb-3 border border-gray-200 dark:border-gray-600 h-32 bg-gray-100 dark:bg-gray-700">
                <img
                  src={`https://staticmap.openstreetmap.de/staticmap.php?center=${value.lat},${value.lng}&zoom=15&size=600x200&markers=${value.lat},${value.lng},red`}
                  alt="map" className="w-full h-full object-cover"
                  onError={() => setMapErr(true)}
                />
              </div>
            )}
            {/* Address row */}
            <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow ${value.isLive ? 'bg-green-500' : 'bg-blue-500'}`}>
                {value.isLive
                  ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      <FiWifi size={14} className="text-white" />
                    </motion.div>
                  : <FiMapPin size={14} className="text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    ✅ {lang === 'am' ? 'አድራሻ ተመርጧል' : 'Location set'}
                  </p>
                  {value.isLive && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-white bg-green-500 px-1.5 py-0.5 rounded-full">
                      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>●</motion.span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{value.address}</p>
                {value.lat && value.lng && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 font-mono">{Number(value.lat).toFixed(4)}, {Number(value.lng).toFixed(4)}</span>
                    <a href={mapsLink(value.lat, value.lng)} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline font-semibold">🗺️ Maps ↗</a>
                  </div>
                )}
                {value.isLive && (
                  <p className="text-[11px] text-green-600 dark:text-green-400 mt-1 font-semibold">
                    📡 {lang === 'am' ? 'ቀጥታ ቦታ እየተካፈሉ ነው' : 'Sharing live location with restaurant'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
        {TABS.map(t => (
          <button key={t.id} type="button"
            onClick={() => { setTab(t.id); if (t.id !== 'live' && liveStatus === 'active') stopLive() }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 shadow ' + (t.id === 'live' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400')
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <t.icon size={13} />
            {t.label}
            {t.id === 'live' && liveStatus === 'active' && (
              <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.8, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TYPE tab ── */}
        {tab === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="space-y-3">
            <div className="relative">
              <textarea rows={3} value={manualText} onChange={e => setManualText(e.target.value)}
                placeholder={lang === 'am'
                  ? 'ለምሳሌ: ቦሌ፣ ሮዝ ሆቴል አቅራቢያ፣ 2ኛ ፎቅ...'
                  : 'e.g. Bole, near Rose Hotel, 2nd floor blue building...'}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors leading-relaxed"
              />
              {manualText.length > 0 && (
                <button type="button" onClick={() => setManualText('')}
                  className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                  <FiX size={10} />
                </button>
              )}
            </div>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={confirmManual}
              disabled={!manualText.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none">
              <FiCheck size={15} />
              {lang === 'am' ? 'አድራሻ አረጋግጥ' : 'Confirm Location'}
            </motion.button>
          </motion.div>
        )}

        {/* ── SEARCH tab ── */}
        {tab === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }} className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input type="text" value={searchQuery} onChange={handleSearchInput} autoFocus
                placeholder={lang === 'am' ? 'ቦሌ፣ ካዛንቺስ፣ ፒያሳ...' : 'Bole, Kazanchis, Piassa, Megenagna...'}
                className="w-full pl-10 pr-9 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              />
              {searching ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
              ) : searchQuery ? (
                <button type="button" onClick={() => { setSearch(''); setSuggestions([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FiX size={13} />
                </button>
              ) : null}
            </div>
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                  {suggestions.map((place, i) => {
                    const { name, sub } = formatPlace(place)
                    return (
                      <button key={i} type="button" onClick={() => selectSuggestion(place)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiMapPin size={12} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">{name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </motion.div>
              )}
              {!searching && searchQuery.length >= 2 && suggestions.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-2">
                  {lang === 'am' ? 'ምንም አልተገኘም' : 'No results — try a different name'}
                </p>
              )}
            </AnimatePresence>
            {/* Popular locations */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <button type="button" onClick={() => setShowPopular(v => !v)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 hover:text-blue-500 transition-colors">
                <span>🇪🇹 {lang === 'am' ? 'ታዋቂ ቦታዎች' : 'Popular Locations'}</span>
                <motion.span animate={{ rotate: showPopular ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
              </button>
              <AnimatePresence>
                {showPopular && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="flex flex-wrap gap-1.5 pb-2">
                      {POPULAR.map((p, i) => (
                        <motion.button key={i} type="button" whileTap={{ scale: 0.93 }} onClick={() => selectPopular(p)}
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 transition-colors">
                          <FiMapPin size={9} className="text-blue-400" />
                          {p.label} <span className="text-gray-400 text-[10px]">{p.sub}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── LIVE tab ── */}
        {tab === 'live' && (
          <motion.div key="live" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">

            {/* Idle state — not yet started */}
            {liveStatus === 'idle' && (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800 text-center">
                  <div className="text-3xl mb-2">📡</div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {lang === 'am' ? 'ቀጥታ ቦታ ያካፍሉ' : 'Share Live Location'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {lang === 'am'
                      ? 'ምግብ ቤቱ ቦታዎን ቀጥታ ያያል። ትዕዛዙ ሲቀርብ ቦታዎን ያሳያሉ።'
                      : 'The restaurant sees your real-time location while your order is being delivered. Tap the button and allow location access.'}
                  </p>
                </div>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={startLive}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 dark:shadow-none transition-all">
                  <FiNavigation size={18} />
                  {lang === 'am' ? '📍 ቀጥታ ቦታ ጀምር' : '📍 Start Sharing Live Location'}
                </motion.button>
              </div>
            )}

            {/* Requesting — waiting for permission */}
            {liveStatus === 'requesting' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FiNavigation size={28} className="text-green-500" />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {lang === 'am' ? 'ቦታ ፈቃድ እየጠበቅን...' : 'Waiting for location permission...'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === 'am' ? '"Allow" ወይም "አዎ" ይጫኑ' : 'Tap "Allow" when your browser asks'}
                  </p>
                </div>
              </div>
            )}

            {/* Active — tracking */}
            {liveStatus === 'active' && liveCoords && (
              <div className="space-y-3">
                {/* Pulsing live indicator */}
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                  <div className="relative flex-shrink-0">
                    <motion.div animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-green-400 rounded-full" />
                    <div className="relative w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <FiNavigation size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-green-700 dark:text-green-400 text-sm">
                        {lang === 'am' ? '📡 ቀጥታ ቦታ ንቁ ነው' : '📡 Live Location Active'}
                      </p>
                      <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.8, repeat: Infinity }}
                        className="text-[10px] font-black text-white bg-green-500 px-1.5 py-0.5 rounded-full">LIVE</motion.span>
                    </div>
                    {liveAddress && <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{liveAddress}</p>}
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {liveCoords.lat.toFixed(5)}, {liveCoords.lng.toFixed(5)}
                      {liveCoords.accuracy && ` ±${Math.round(liveCoords.accuracy)}m`}
                    </p>
                  </div>
                </div>
                {/* Map thumbnail */}
                <div className="rounded-xl overflow-hidden border border-green-200 dark:border-green-800 h-28 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${liveCoords.lat},${liveCoords.lng}&zoom=15&size=600x180&markers=${liveCoords.lat},${liveCoords.lng},red`}
                    alt="live map" className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none' }}
                  />
                </div>
                {/* Open in Google Maps */}
                <a href={mapsLink(liveCoords.lat, liveCoords.lng)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  🗺️ {lang === 'am' ? 'Google Maps ላይ ክፈት' : 'Open in Google Maps'}
                </a>
                {/* Stop button */}
                <button type="button" onClick={stopLive}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 text-sm font-bold border-2 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <FiX size={14} />
                  {lang === 'am' ? 'ቀጥታ ቦታ አቁም' : 'Stop Live Sharing'}
                </button>
              </div>
            )}

            {/* Denied or Error */}
            {(liveStatus === 'denied' || liveStatus === 'error') && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <span className="text-2xl flex-shrink-0">{liveStatus === 'denied' ? '🔒' : '⚠️'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                      {liveStatus === 'denied'
                        ? (lang === 'am' ? 'ቦታ ፈቃድ ተከልክሏል' : 'Location Permission Denied')
                        : (lang === 'am' ? 'ቦታ ማግኘት አልተቻለም' : 'Could Not Get Location')}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">{liveError}</p>

                    {liveStatus === 'denied' && (
                      <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-200 dark:border-amber-700 space-y-2">
                        <p className="text-xs font-black text-gray-800 dark:text-white">
                          {lang === 'am' ? '🔧 እንዴት ማስተካከል እንደሚቻል:' : '🔧 How to fix — Chrome on Android:'}
                        </p>
                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">1</span>
                            <span>{lang === 'am' ? 'አድራሻ ቦታ ላይ 🔒 ወይም ⚠️ ይጫኑ' : 'Tap the 🔒 or ⚠️ icon in the address bar'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">2</span>
                            <span>{lang === 'am' ? '"Permissions" ወይም "Site Settings" ይምረጡ' : 'Tap "Permissions" or "Site Settings"'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">3</span>
                            <span>{lang === 'am' ? '"Location" → "Allow" ይምረጡ' : 'Set "Location" to "Allow"'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">4</span>
                            <span className="font-semibold text-green-700 dark:text-green-400">
                              {lang === 'am' ? 'ገጹን ሪፍሬሽ አድርጉ → "ቀጥታ ቦታ ጀምር" ይጫኑ' : 'Reload this page → tap "Start Live Location" again'}
                            </span>
                          </div>
                        </div>
                        {/* Direct link to Chrome site settings */}
                        <a
                          href={`intent://${window.location.host}${window.location.pathname}#Intent;scheme=${window.location.protocol.replace(':','')};package=com.android.chrome;end`}
                          className="hidden"
                          id="chrome-settings-link"
                        />
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="w-full mt-2 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                          🔄 {lang === 'am' ? 'ገጹን ሪፍሬሽ አድርግ' : 'Reload Page After Fixing'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {liveStatus === 'error' && (
                  <button type="button" onClick={() => { setLiveStatus('idle'); setLiveError('') }}
                    className="w-full py-3 rounded-xl border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    🔄 {lang === 'am' ? 'እንደገና ሞክር' : 'Try Again'}
                  </button>
                )}
                <p className="text-center text-xs text-gray-400">
                  {lang === 'am' ? 'ወይም "ጽፍ" ወይም "ፈልግ" ይጠቀሙ' : 'Or use the "Type" or "Search" tab instead'}
                </p>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* Skip note */}
      {!isConfirmed && (
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3">
          {lang === 'am' ? 'አድራሻ ሳይሰጡ ትዕዛዝ ማስቀመጥ ይቻላል' : 'Optional — you can place the order without a location'}
        </p>
      )}
    </div>
  )
}
