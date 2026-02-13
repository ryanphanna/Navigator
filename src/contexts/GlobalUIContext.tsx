import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface GlobalUIContextType {
    currentView: string;
    showAuth: boolean;
    showSettings: boolean;

    // Actions
    setView: (view: string) => void;
    setShowAuth: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
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
    const [showAuth, setShowAuth] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <GlobalUIContext.Provider value={{
            currentView,
            showAuth,
            showSettings,
            setView,
            setShowAuth,
            setShowSettings
        }}>
            {children}
        </GlobalUIContext.Provider>
    );
};
