import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Apply dark class immediately — called from both toggle and rehydration
function applyDark(isDark) {
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

const useAppStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      language: 'en',
      favorites: [],
      profilePhoto: null, // Can be a data URL or emoji/avatar

      toggleDarkMode: () => {
        const next = !get().darkMode
        applyDark(next)
        set({ darkMode: next })
      },

      setLanguage: (lang) => {
        localStorage.setItem('language', lang)
        set({ language: lang })
      },

      toggleFavorite: (itemId) =>
        set((s) => ({
          favorites: s.favorites.includes(itemId)
            ? s.favorites.filter((id) => id !== itemId)
            : [...s.favorites, itemId],
        })),

      setProfilePhoto: (photo) => set({ profilePhoto: photo }),
    }),
    {
      name: 'app-store',
      // On page load, apply saved dark mode immediately before first paint
      onRehydrateStorage: () => (state) => {
        if (state) applyDark(state.darkMode)
      },
    }
  )
)

export default useAppStore
