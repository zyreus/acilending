import { createContext, useContext, useEffect, useMemo } from 'react'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'

const AdminMuiThemeContext = createContext(null)

function clearDarkClass() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('dark')
}

/**
 * App-wide theme: light only. MUI palette + Tailwind `dark:` (inactive — `.dark` is never set on `html`).
 */
export function AdminMuiProvider({ children }) {
  useEffect(() => {
    clearDarkClass()
    try {
      localStorage.removeItem('ali_admin_theme')
      localStorage.removeItem('ali_admin_dark')
    } catch {
      /* ignore */
    }
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: { main: '#DC2626', dark: '#b91c1c', light: '#ef4444' },
          error: { main: '#DC2626' },
          background: { default: '#f3f4f6', paper: '#ffffff' },
          text: { primary: '#111827', secondary: '#6b7280' },
          divider: '#e5e7eb',
        },
        shape: { borderRadius: 12 },
        transitions: { duration: { shortest: 200 } },
      }),
    [],
  )

  const value = useMemo(
    () => ({
      mode: 'light',
      toggleMode: () => {},
      setMode: () => {},
    }),
    [],
  )

  return (
    <AdminMuiThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme={false} />
        <div className="min-h-screen transition-colors duration-300">{children}</div>
      </ThemeProvider>
    </AdminMuiThemeContext.Provider>
  )
}

export function useAdminMuiTheme() {
  const ctx = useContext(AdminMuiThemeContext)
  if (!ctx) throw new Error('useAdminMuiTheme must be used within AdminMuiProvider')
  return ctx
}

/** Alias for consumers that prefer “theme” naming */
export function useAdminTheme() {
  return useAdminMuiTheme()
}
