import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'main' | 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('technika_theme') as Theme) || 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('technika_theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-main', 'theme-light');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'main') {
      root.classList.add('theme-main');
    } else {
      root.classList.add('theme-light');
    }
    
    root.setAttribute('data-theme', theme);
  }, [theme]);

  // Synchronize theme changes from other windows/tabs (e.g. main website)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'technika_theme' && e.newValue) {
        setThemeState(e.newValue as Theme);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
