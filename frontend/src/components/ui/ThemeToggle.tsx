import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/user-theme'
import { Button } from './Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title="Toggle theme"
      className="relative h-9 w-9 rounded-xl border border-gray-200/90 bg-white/90 text-gray-500 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50/80 hover:text-cyan-700 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:border-cyan-900/60 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300"
    >
      <Sun role="img" aria-label="sun" className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon role="img" aria-label="moon" className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
