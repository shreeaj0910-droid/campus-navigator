import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="bg-white dark:bg-card p-3 rounded-xl shadow-lg border border-gray-100 dark:border-border transition-colors hover:bg-gray-50 dark:hover:bg-muted/80 flex items-center justify-center z-50"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-gray-800 dark:text-gray-200 hidden dark:block" />
      <Moon className="h-5 w-5 text-gray-800 dark:text-gray-200 block dark:hidden" />
    </button>
  );
}
