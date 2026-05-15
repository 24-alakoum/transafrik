import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setCompany: (company: Company | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCompany: (company) => set({ company }),
      logout: () => set({ user: null, company: null, isAuthenticated: false }),
    }),
    {
      name: 'transafrik-auth-storage',
      // On ne persiste pas tout, juste de quoi afficher le layout le temps du fetch
      partialize: (state) => ({ user: state.user, company: state.company }),
    }
  )
)
