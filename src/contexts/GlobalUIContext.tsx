import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants';

interface GlobalUIContextType {
    currentView: string;
    showSettings: boolean;
    isDark: boolean;

    // Actions
    setView: (view: string) => void;
    setShowSettings: (show: boolean) => void;
    toggleDarkMode: () => void;
}

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(undefined);

export const useGlobalUI = () => {
    const context = useContext(GlobalUIContext);
    if (!context) {
        throw new Error('useGlobalUI must be used within a GlobalUIProvider');
    }
    return context;
};

export const GlobalUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentView, setView] = useState('home');
    const [showSettings, setShowSettings] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.THEME);
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Apply theme to document
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem(STORAGE_KEYS.THEME, 'light');
        }
    }, [isDark]);

    const toggleDarkMode = () => setIsDark(prev => !prev);

    return (
        <GlobalUIContext.Provider value={{
            currentView,
            showSettings,
            isDark,
            setView,
            setShowSettings,
            toggleDarkMode
        }}>
            {children}
        </GlobalUIContext.Provider>
    );
};
