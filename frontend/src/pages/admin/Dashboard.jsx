import { motion } from 'framer-motion'
import { FiShoppingCart, FiDollarSign, FiUsers, FiClock, FiTrendingUp, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { menuItems, tables } from '../../data/mockData'

const stats = [
  { label: "Today's Orders", value: '47', change: '+12%', up: true, icon: FiShoppingCart, color: 'bg-blue-500' },
  { label: "Today's Revenue", value: '12,450 ETB', change: '+8.5%', up: true, icon: FiDollarSign, color: 'bg-green-500' },
  { label: 'Active Tables', value: '6/8', change: '', up: true, icon: FiUsers, color: 'bg-purple-500' },
  { label: 'Avg. Prep Time', value: '18 min', change: '-3 min', up: true, icon: FiClock, color: 'bg-orange-500' },
]

const recentOrders = [
  { id: 4821, table: '3', items: 'Margherita Pizza, Coke', total: 410, status: 'preparing', time: '5 min ago' },
  { id: 4820, table: 'VIP 1', items: 'Ribeye Steak, Coffee', total: 970, status: 'ready', time: '12 min ago' },
  { id: 4819, table: '2', items: 'Smash Burger x2', total: 760, status: 'served', time: '20 min ago' },
  { id: 4818, table: '5', items: 'Spaghetti Carbonara', total: 320, status: 'new', time: '2 min ago' },
  { id: 4817, table: '4', items: 'Lamb Tibs, Juice', total: 680, status: 'served', time: '35 min ago' },
]

const statusColors = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  served: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, Admin! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                <stat.icon size={20} />
              </div>
              {stat.change && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.up ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                }`}>
                  {stat.up ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left pb-3 font-semibold">Order</th>
                  <th className="text-left pb-3 font-semibold">Table</th>
                  <th className="text-left pb-3 font-semibold">Items</th>
                  <th className="text-left pb-3 font-semibold">Total</th>
                  <th className="text-left pb-3 font-semibold">Status</th>
                  <th className="text-left pb-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">#{order.id}</td>
                    <td className="py-3 text-gray-700 dark:text-gray-300">T{order.table}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{order.items}</td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{order.total} ETB</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 text-xs">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Table Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Table Status</h2>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    table.status === 'available' ? 'bg-green-500' :
                    table.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Table {table.number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{table.capacity} seats</span>
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
              </div>
            ))}
          </div>

          {/* Popular Items */}
          <h2 className="font-bold text-gray-900 dark:text-white mt-6 mb-4">Top Sellers Today</h2>
          <div className="space-y-3">
            {menuItems.filter(i => i.isBestSeller).slice(0, 4).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-5">#{idx+1}</span>
                <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-orange-500">{item.price} ETB</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
