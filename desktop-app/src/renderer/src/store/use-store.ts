import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface AppStore {
  directory: string | undefined
  apiURl: string
  theme: Theme

  setDirectory: (directory: string | undefined) => void
  setTheme: (theme: Theme) => void
  setApiUrl: (apiUrl: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      directory: undefined,
      theme: 'light',
      apiURl: 'http://localhost:8000',

      setDirectory: (directory) => set({ directory }),

      setTheme: (theme) => {
        document.documentElement.dataset.theme = theme
        set({ theme })
      },
      setApiUrl: (apiURl) => set({ apiURl })
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
