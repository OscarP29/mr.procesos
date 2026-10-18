import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface AppStore {
  directory: string | undefined
  theme: Theme

  setDirectory: (directory: string | undefined) => void
  setTheme: (theme: Theme) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      directory: undefined,
      theme: 'light',

      setDirectory: (directory) => set({ directory }),

      setTheme: (theme) => {
        document.documentElement.dataset.theme = theme
        set({ theme })
      }
    }),
    {
      name: 'app-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dataset.theme = state.theme
        }
      }
    }
  )
)
