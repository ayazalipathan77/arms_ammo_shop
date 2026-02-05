import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'default' | 'high-contrast';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('default');

    const toggleTheme = () => {
        setTheme(prev => prev === 'default' ? 'high-contrast' : 'default');
    };

    useEffect(() => {
        if (theme === 'high-contrast') {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [theme]);

    // Accessibility: Listen for system preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(forced-colors: active)');
        const handleChange = () => {
            if (mediaQuery.matches) {
                setTheme('high-contrast');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
