import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      tableNumber: null,

      setTable: (table) => set({ tableNumber: table }),

      addItem: (item) => {
        const { items } = get()
        // Check if same item with same modifiers already in cart
        const key = `${item.id}-${JSON.stringify(item.selectedModifiers)}-${item.specialInstructions}`
        const existing = items.find((i) => i.cartKey === key)
        if (existing) {
          set({
            items: items.map((i) =>
              i.cartKey === key ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, cartKey: key, cartId: Date.now() }] })
        }
      },

      removeItem: (cartId) => {
        set({ items: get().items.filter((i) => i.cartId !== cartId) })
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.cartId === cartId ? { ...i, quantity } : i
          ),
        })
      },

      updateItem: (cartId, updates) => {
        set({
          items: get().items.map((i) =>
            i.cartId === cartId ? { ...i, ...updates } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get subtotal() {
        return get().items.reduce((sum, i) => {
          const modifierTotal = (i.selectedModifiers || []).reduce(
            (ms, m) => ms + (m.price || 0),
            0
          )
          return sum + (i.price + modifierTotal) * i.quantity
        }, 0)
      },
    }),
    { name: 'cart-store', partialize: (s) => ({ items: s.items, tableNumber: s.tableNumber }) }
  )
)

export default useCartStore
