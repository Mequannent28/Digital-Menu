import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAppStore from './store/useAppStore'

// Customer Pages
import SplashScreen from './pages/customer/SplashScreen'
import HomePage from './pages/customer/HomePage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderConfirmation from './pages/customer/OrderConfirmation'
import ProfilePage from './pages/customer/ProfilePage'
import CategoriesPage from './pages/customer/CategoriesPage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Categories from './pages/admin/Categories'
import MenuItems from './pages/admin/MenuItems'
import ModifierGroups from './pages/admin/ModifierGroups'
import Tables from './pages/admin/Tables'
import QRCodes from './pages/admin/QRCodes'
import Orders from './pages/admin/Orders'
import KitchenDisplay from './pages/admin/KitchenDisplay'
import Reports from './pages/admin/Reports'
import Users from './pages/admin/Users'
import Settings from './pages/admin/Settings'
import AdminGuard from './components/auth/AdminGuard'
import OrderStatusMonitor from './components/customer/OrderStatusMonitor'

export default function App() {
  const { darkMode } = useAppStore()

  // Apply on every render so it's always in sync
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      {/* Global order status monitor for customer notifications */}
      <OrderStatusMonitor />
      
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/menu" element={<HomePage />} />
        <Route path="/menu/:tableId" element={<SplashScreen />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
        <Route path="/categories" element={<CategoriesPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menu-items" element={<MenuItems />} />
          <Route path="modifiers" element={<ModifierGroups />} />
          <Route path="tables" element={<Tables />} />
          <Route path="qr-codes" element={<QRCodes />} />
          <Route path="orders" element={<Orders />} />
          <Route path="kitchen" element={<KitchenDisplay />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
