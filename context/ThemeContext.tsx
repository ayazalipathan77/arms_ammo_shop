import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
    void: string;
    charcoal: string;
    tangerine: string;
    amber: string;
    pearl: string;
    warmGray: string;
}

export interface ThemeFonts {
    display: string;
    body: string;
}

export interface ThemeConfig {
    name: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
    'MURAQQA_DEFAULT': {
        name: 'MuraqQa Default',
        colors: {
            void: '#0A0A0A',
            charcoal: '#1A1A1A',
            tangerine: '#FF6B35',
            amber: '#F7931E',
            pearl: '#F5F5F5',
            warmGray: '#9A9A9A'
        },
        fonts: {
            display: "'Monument Extended', 'Syne', sans-serif",
            body: "'Inter', 'Satoshi', sans-serif"
        }
    },
    'DEEP_BURGUNDY': {
        name: 'Deep Burgundy + Golden Sand',
        colors: {
            void: '#2D0000',
            charcoal: '#4A0404',
            tangerine: '#D4AF37',
            amber: '#C5A028',
            pearl: '#FAF0E6',
            warmGray: '#B8860B'
        },
        fonts: {
            display: "'Playfair Display', serif",
            body: "'Lora', serif"
        }
    },
    'PEACH_AQUA': {
        name: 'Peach Ice + Aqua Mist',
        colors: {
            void: '#1A1A2E',
            charcoal: '#16213E',
            tangerine: '#FFCCB0',
            amber: '#E0FFFF',
            pearl: '#F0F8FF',
            warmGray: '#87CEEB'
        },
        fonts: {
            display: "'Outfit', sans-serif",
            body: "'Quicksand', sans-serif"
        }
    },
    'LEMON_VIOLET': {
        name: 'Lemon Chiffon + Ultra Violet',
        colors: {
            void: '#100020',
            charcoal: '#240046',
            tangerine: '#FFFACD',
            amber: '#E0B0FF',
            pearl: '#FFFFFF',
            warmGray: '#D8BFD8'
        },
        fonts: {
            display: "'Space Grotesk', sans-serif",
            body: "'DM Sans', sans-serif"
        }
    },
    'PUMPKIN_CHARCOAL': {
        name: 'Pumpkin + Charcoal',
        colors: {
            void: '#1C1C1C',
            charcoal: '#2F2F2F',
            tangerine: '#FF7518',
            amber: '#E65100',
            pearl: '#EEEEEE',
            warmGray: '#A9A9A9'
        },
        fonts: {
            display: "'Anton', sans-serif",
            body: "'Roboto', sans-serif"
        }
    },
    'CLOUDY_OCEAN': {
        name: 'Cloudy Sky + Ocean Blue',
        colors: {
            void: '#102030',
            charcoal: '#1C3550',
            tangerine: '#87CEEB',
            amber: '#4682B4',
            pearl: '#E0F2F7',
            warmGray: '#B0C4DE'
        },
        fonts: {
            display: "'Montserrat', sans-serif",
            body: "'Open Sans', sans-serif"
        }
    },
    'SAGE_OLIVE': {
        name: 'Soft Sage + Deep Olive',
        colors: {
            void: '#1A241A',
            charcoal: '#2A3B2A',
            tangerine: '#9CAF88',
            amber: '#556B2F',
            pearl: '#F5FFFA',
            warmGray: '#8FBC8F'
        },
        fonts: {
            display: "'Cinzel', serif",
            body: "'Cormorant Garamond', serif"
        }
    }
};

interface ThemeContextType {
    currentTheme: ThemeConfig;
    applyTheme: (theme: ThemeConfig) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(PRESET_THEMES['MURAQQA_DEFAULT']);

    // Load theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('muraqqa_theme');
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                applyTheme(parsed, false); // Don't save again on load
            } catch (e) {
                console.error("Failed to parse saved theme", e);
            }
        }
    }, []);

    const applyTheme = (theme: ThemeConfig, save = true) => {
        setCurrentTheme(theme);

        // Update CSS Variables
        const root = document.documentElement;
        root.style.setProperty('--color-void', theme.colors.void);
        root.style.setProperty('--color-charcoal', theme.colors.charcoal);
        root.style.setProperty('--color-tangerine', theme.colors.tangerine);
        root.style.setProperty('--color-amber', theme.colors.amber);
        root.style.setProperty('--color-pearl', theme.colors.pearl);
        root.style.setProperty('--color-warm-gray', theme.colors.warmGray);

        root.style.setProperty('--font-display', theme.fonts.display);
        root.style.setProperty('--font-body', theme.fonts.body);

        if (save) {
            localStorage.setItem('muraqqa_theme', JSON.stringify(theme));
        }
    };

    const resetTheme = () => {
        applyTheme(PRESET_THEMES['MURAQQA_DEFAULT']);
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, applyTheme, resetTheme }}>
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
