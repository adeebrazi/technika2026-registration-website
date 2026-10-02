import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'main' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('technika_theme');
      if (saved === 'main') {
        return 'main';
      }
      if (saved === 'light') {
        return 'light';
      }
    }
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('technika_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'main' ? 'light' : 'main');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-main', 'theme-light');
    
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('theme-main');
    }
    
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Synchronize theme changes from other windows/tabs (e.g. main website)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'technika_theme' && e.newValue) {
        if (e.newValue === 'main' || e.newValue === 'light') {
          setThemeState(e.newValue as Theme);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
