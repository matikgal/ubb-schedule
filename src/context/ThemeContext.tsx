import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemeColor {
  name: string;
  hex: string;
  id: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { id: 'white', name: 'Klasyczny', hex: '#ffffff' }, // Works as Black in light mode via CSS var logic usually, but here we keep explicit
  { id: 'orange', name: 'Bursztyn', hex: '#fb923c' },
  { id: 'blue', name: 'Ocean', hex: '#38bdf8' },
  { id: 'green', name: 'Natura', hex: '#4ade80' },
  { id: 'purple', name: 'Neon', hex: '#c084fc' },
  { id: 'yellow', name: 'Słońce', hex: '#facc15' },
];

interface ThemeContextType {
  currentTheme: ThemeColor;
  setTheme: (themeId: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  nickname: string;
  setNickname: (name: string) => void;
  avatarSeed: string;
  setAvatarSeed: (seed: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(THEME_COLORS[0]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nickname, setNickname] = useState('Student');
  const [avatarSeed, setAvatarSeed] = useState('Alexander');

  // Load saved settings
  useEffect(() => {
    const savedThemeId = localStorage.getItem('app-theme');
    const savedMode = localStorage.getItem('app-mode');
    const savedNick = localStorage.getItem('user-nickname');
    const savedAvatar = localStorage.getItem('user-avatar');

    if (savedThemeId) {
      const found = THEME_COLORS.find(t => t.id === savedThemeId);
      if (found) setCurrentTheme(found);
    }

    if (savedMode === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (savedNick) setNickname(savedNick);
    if (savedAvatar) setAvatarSeed(savedAvatar);
  }, []);

  // Sync Theme Color
  useEffect(() => {
    // In light mode, if white is selected, we might want a dark primary. 
    // But for simplicity, we stick to the hex.
    const color = (currentTheme.id === 'white' && !isDarkMode) ? '#0f172a' : currentTheme.hex;
    document.documentElement.style.setProperty('--primary', color);
  }, [currentTheme, isDarkMode]);

  const setTheme = (themeId: string) => {
    const found = THEME_COLORS.find(t => t.id === themeId);
    if (found) {
      setCurrentTheme(found);
      localStorage.setItem('app-theme', themeId);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('app-mode', newMode ? 'dark' : 'light');

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateNickname = (name: string) => {
    setNickname(name);
    localStorage.setItem('user-nickname', name);
  };

  const updateAvatar = (seed: string) => {
    setAvatarSeed(seed);
    localStorage.setItem('user-avatar', seed);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      isDarkMode,
      toggleDarkMode,
      nickname,
      setNickname: updateNickname,
      avatarSeed,
      setAvatarSeed: updateAvatar
    }}>
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