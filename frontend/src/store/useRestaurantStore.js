import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { restaurantInfo as defaultInfo } from '../data/mockData'

export const useRestaurantStore = create(
  persist(
    (set, get) => ({
      info: { ...defaultInfo },

      // ── Fetch from API (called on app load) ──────────────
      fetchRestaurant: async () => {
        try {
          const res = await fetch('/api/restaurant')
          if (!res.ok) return
          const data = await res.json()
          if (!data?.name) return

          set(s => ({
            info: {
              ...s.info,
              name:             data.name          || s.info.name,
              nameAm:           data.name_am       || s.info.nameAm,
              tagline:          data.tagline       || s.info.tagline,
              address:          data.address       || s.info.address,
              phone:            data.phone         || s.info.phone,
              wifi:             data.wifi_password || s.info.wifi,
              hours:            data.working_hours || s.info.hours,
              // DB stores as decimals (0.15), keep as decimals in store
              vatRate:          data.vat_rate          ?? s.info.vatRate,
              serviceChargeRate: data.service_charge_rate ?? s.info.serviceChargeRate,
              currency:         data.currency      || s.info.currency,
              coverImage:       data.cover_url     || s.info.coverImage,
              logo:             data.logo_url      || s.info.logo,
            }
          }))
        } catch (_) {}
      },

      // ── Save (called from admin Settings) ───────────────
      // Settings form passes vatRate/serviceCharge as PERCENTAGES (15, 10)
      saveRestaurant: async (formData, token) => {
        const vatDecimal  = parseFloat(formData.vatRate) / 100
        const svcDecimal  = parseFloat(formData.serviceCharge) / 100

        // Update store immediately so UI reflects everywhere at once
        set(s => ({
          info: {
            ...s.info,
            name:             formData.name,
            nameAm:           formData.nameAm,
            tagline:          formData.tagline,
            address:          formData.address,
            phone:            formData.phone,
            wifi:             formData.wifi,
            hours:            formData.hours,
            vatRate:          vatDecimal,
            serviceChargeRate: svcDecimal,
            currency:         formData.currency,
          }
        }))

        // Persist to DB
        try {
          const res = await fetch('/api/restaurant', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name:                formData.name,
              name_am:             formData.nameAm,
              tagline:             formData.tagline,
              address:             formData.address,
              phone:               formData.phone,
              wifi_password:       formData.wifi,
              working_hours:       formData.hours,
              vat_rate:            vatDecimal,
              service_charge_rate: svcDecimal,
              currency:            formData.currency,
            }),
          })
          return res.ok
        } catch (_) {
          return false
        }
      },
    }),
    {
      name: 'restaurant-store',
      version: 2,
      partialize: s => ({ info: s.info }),
    }
  )
)
