import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useRestaurantStore } from './store/useRestaurantStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 },
  },
})

// Fetch restaurant info once on startup so name/settings are live everywhere
useRestaurantStore.getState().fetchRestaurant()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#e85d04', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
