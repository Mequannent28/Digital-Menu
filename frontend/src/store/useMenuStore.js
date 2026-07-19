import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  menuItems as mockItems,
  categories as mockCats,
  modifierGroups as mockMods,
  tables as mockTables,
} from '../data/mockData'

const initItems  = mockItems.map(i => ({ ...i, id: String(i.id) }))
const initCats   = mockCats.filter(c => c.id !== 'all').map((c, i) => ({ ...c, sortOrder: i, isActive: true }))
const initMods   = mockMods.map(g => ({ ...g, id: String(g.id) }))
const initTables = mockTables.map(t => ({ ...t, id: String(t.id) }))

const seedOrders = [
  {
    id: '4821', tableNumber: '3', customerName: 'John Doe', phone: '+251911111111',
    notes: 'No onions please', status: 'preparing', subtotal: 360, vat: 54, serviceCharge: 36,
    total: 450, grandTotal: 450, estimatedTime: 18, createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { name: 'Margherita Pizza', qty: 1, price: 350, notes: 'Well done', modifiers: [] },
      { name: 'Coke', qty: 1, price: 60, notes: '', modifiers: [] },
    ],
  },
  {
    id: '4820', tableNumber: 'VIP 1', customerName: 'Jane Smith', phone: '',
    notes: '', status: 'ready', subtotal: 890, vat: 133.5, serviceCharge: 89,
    total: 1112.5, grandTotal: 1112.5, estimatedTime: 25, createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { name: 'Grilled Ribeye Steak', qty: 1, price: 890, notes: 'Medium rare', modifiers: [{ name: 'Extra Sauce', price: 20 }] },
      { name: 'Ethiopian Coffee', qty: 1, price: 80, notes: 'No sugar', modifiers: [] },
    ],
  },
  {
    id: '4819', tableNumber: '2', customerName: '', phone: '',
    notes: '', status: 'served', subtotal: 760, vat: 114, serviceCharge: 76,
    total: 950, grandTotal: 950, estimatedTime: 20, createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    items: [
      { name: 'Classic Smash Burger', qty: 2, price: 380, notes: '', modifiers: [{ name: 'Large', price: 150 }] },
    ],
  },
  {
    id: '4818', tableNumber: '5', customerName: 'Ali Ahmed', phone: '+251922222222',
    notes: 'Extra spicy', status: 'new', subtotal: 320, vat: 48, serviceCharge: 32,
    total: 400, grandTotal: 400, estimatedTime: 15, createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    items: [
      { name: 'Spaghetti Carbonara', qty: 1, price: 320, notes: 'Extra cheese', modifiers: [] },
    ],
  },
  {
    id: '4817', tableNumber: '4', customerName: '', phone: '',
    notes: '', status: 'served', subtotal: 560, vat: 84, serviceCharge: 56,
    total: 700, grandTotal: 700, estimatedTime: 22, createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    items: [
      { name: 'Lamb Tibs', qty: 1, price: 560, notes: '', modifiers: [] },
      { name: 'Fresh Mango Juice', qty: 1, price: 120, notes: '', modifiers: [] },
    ],
  },
]

export const useMenuStore = create(
  persist(
    (set) => ({
      categories:     initCats,
      menuItems:      initItems,
      modifierGroups: initMods,
      tables:         initTables,
      orders:         seedOrders,

      // ── Categories ─────────────────────────────────────
      addCategory:    (data) => set(s => ({ categories: [...s.categories, { ...data, id: Date.now().toString(), isActive: true }] })),
      updateCategory: (id, data) => set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c) })),
      deleteCategory: (id) => set(s => ({ categories: s.categories.filter(c => c.id !== id) })),
      toggleCategory: (id) => set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c) })),

      // ── Menu Items ──────────────────────────────────────
      addMenuItem:    (data) => set(s => ({ menuItems: [...s.menuItems, { ...data, id: Date.now().toString(), reviewCount: 0, rating: Number(data.rating) || 4.5 }] })),
      updateMenuItem: (id, data) => set(s => ({ menuItems: s.menuItems.map(i => i.id === id ? { ...i, ...data } : i) })),
      deleteMenuItem: (id) => set(s => ({ menuItems: s.menuItems.filter(i => i.id !== id) })),
      toggleAvailable:(id) => set(s => ({ menuItems: s.menuItems.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i) })),
      toggleFeatured: (id) => set(s => ({ menuItems: s.menuItems.map(i => i.id === id ? { ...i, isFeatured: !i.isFeatured } : i) })),

      // ── Modifier Groups ─────────────────────────────────
      addModifierGroup:    (data) => set(s => ({ modifierGroups: [...s.modifierGroups, { ...data, id: Date.now().toString(), modifiers: [] }] })),
      updateModifierGroup: (id, data) => set(s => ({ modifierGroups: s.modifierGroups.map(g => g.id === id ? { ...g, ...data } : g) })),
      deleteModifierGroup: (id) => set(s => ({ modifierGroups: s.modifierGroups.filter(g => g.id !== id) })),

      addModifier: (groupId, data) => set(s => ({
        modifierGroups: s.modifierGroups.map(g =>
          g.id === groupId
            ? { ...g, modifiers: [...(g.modifiers || []), { ...data, id: Date.now().toString() }] }
            : g
        ),
      })),
      updateModifier: (groupId, modId, data) => set(s => ({
        modifierGroups: s.modifierGroups.map(g =>
          g.id === groupId
            ? { ...g, modifiers: g.modifiers.map(m => m.id === modId ? { ...m, ...data } : m) }
            : g
        ),
      })),
      deleteModifier: (groupId, modId) => set(s => ({
        modifierGroups: s.modifierGroups.map(g =>
          g.id === groupId
            ? { ...g, modifiers: g.modifiers.filter(m => m.id !== modId) }
            : g
        ),
      })),

      // ── Tables ──────────────────────────────────────────
      addTable:    (data) => set(s => ({ tables: [...s.tables, { ...data, id: Date.now().toString(), status: 'available' }] })),
      updateTable: (id, data) => set(s => ({ tables: s.tables.map(t => t.id === id ? { ...t, ...data } : t) })),
      deleteTable: (id) => set(s => ({ tables: s.tables.filter(t => t.id !== id) })),

      // ── Orders ──────────────────────────────────────────
      addOrder: (data) => set(s => ({
        orders: [
          {
            ...data,
            id: String(Date.now()),
            status: 'new',
            createdAt: new Date().toISOString(),
          },
          ...s.orders,
        ],
      })),
      updateOrderStatus: (id, status) => set(s => ({
        orders: s.orders.map(o => o.id === id ? { ...o, status } : o),
      })),
      deleteOrder: (id) => set(s => ({ orders: s.orders.filter(o => o.id !== id) })),
    }),
    { name: 'menu-store', version: 2 }
  )
)
