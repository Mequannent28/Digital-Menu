import { useRef } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { FiDownload, FiPrinter } from 'react-icons/fi'
import { tables } from '../../data/mockData'

const BASE_URL = window.location.origin

export default function QRCodes() {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Codes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Unique QR codes for each table. Customers scan to access the digital menu.
          </p>
        </div>
        <button
          onClick={handlePrintAll}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <FiPrinter size={18} />
          Print All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {tables.map((table, idx) => {
          const qrUrl = `${BASE_URL}/menu/${table.number}`
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
