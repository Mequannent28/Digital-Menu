import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { FiDownload, FiPrinter, FiGlobe, FiWifi } from 'react-icons/fi'
import { tables } from '../../data/mockData'

export default function QRCodes() {
  const defaultHost = window.location.origin
  const [baseUrl, setBaseUrl] = useState(defaultHost)
  const [networkIp, setNetworkIp] = useState('')

  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.localIp && data.localIp !== 'localhost') {
          setNetworkIp(data.localIp)
          const portStr = window.location.port ? `:${window.location.port}` : ''
          const netUrl = `${window.location.protocol}//${data.localIp}${portStr}`
          setBaseUrl(netUrl)
        }
      })
      .catch(() => {})
  }, [])

  const handleDownload = (tableNumber, svgRef) => {
    const svg = svgRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `table-${tableNumber}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintAll = () => window.print()

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Codes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Unique QR codes for each table. Customers scan on local Wi-Fi to auto-open the digital menu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow"
          >
            <FiPrinter size={18} />
            Print All
          </button>
        </div>
      </div>

      {/* Network Configuration Card */}
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold">
            <FiWifi size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Network Target URL</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              QR codes use this address so customer phones on Wi-Fi auto-open Table menus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white w-full sm:w-64 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          {networkIp && baseUrl !== `${window.location.protocol}//${networkIp}:${window.location.port}` && (
            <button
              onClick={() => setBaseUrl(`${window.location.protocol}//${networkIp}:${window.location.port}`)}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold whitespace-nowrap"
            >
              Reset to IP
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {tables.map((table, idx) => {
          const qrUrl = `${baseUrl}/menu/${table.number}`
          const svgRef = { current: null }
          return (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
                Table {table.number}
              </h3>

              <div
                ref={(el) => { svgRef.current = el }}
                className="flex justify-center mb-4 p-3 bg-white rounded-xl"
              >
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: '/favicon.svg',
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 break-all">
                {qrUrl}
              </p>

              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {table.capacity} seats
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  table.status === 'available'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : table.status === 'occupied'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {table.status}
                </span>
              </div>

              <button
                onClick={() => handleDownload(table.number, svgRef)}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <FiDownload size={15} />
                Download
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
