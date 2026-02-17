import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
    void: string;
    charcoal: string;
    tangerine: string;
    amber: string;
    pearl: string;
    warmGray: string;
    border: string;
}

export interface ThemeFonts {
    display: string;
    body: string;
    urdu: string;
}

export interface GradientOrb {
    enabled: boolean;
    color: string;
    opacity: number;
    size: number;
    blur: number;
    position: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
}

export interface GradientConfig {
    enabled: boolean;
    orbs: GradientOrb[];
}

export interface ThemeConfig {
    name: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
    gradient: GradientConfig;
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
    'ARMS_AMMO_DEFAULT': {
        name: 'Arms & Ammo Default',
        colors: {
            void: '#0A0A0A',
            charcoal: '#1A1A1A',
            tangerine: '#FF6B35',
            amber: '#F7931E',
            pearl: '#F5F5F5',
            warmGray: '#9A9A9A',
            border: 'rgba(245, 245, 245, 0.1)'
        },
        fonts: {
            display: "'Monument Extended', 'Syne', sans-serif",
            body: "'Inter', 'Satoshi', sans-serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#FF6B35', opacity: 0.15, size: 600, blur: 100, position: { top: '10%', right: '10%' } },
                { enabled: true, color: '#F7931E', opacity: 0.1, size: 800, blur: 120, position: { bottom: '10%', left: '10%' } }
            ]
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
            warmGray: '#B8860B',
            border: 'rgba(250, 240, 230, 0.15)'
        },
        fonts: {
            display: "'Playfair Display', serif",
            body: "'Lora', serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#4A0404', opacity: 0.2, size: 600, blur: 100, position: { top: '20%', left: '20%' } }
            ]
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
            warmGray: '#87CEEB',
            border: 'rgba(255, 204, 176, 0.15)'
        },
        fonts: {
            display: "'Outfit', sans-serif",
            body: "'Quicksand', sans-serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#E0FFFF', opacity: 0.1, size: 700, blur: 150, position: { bottom: '0%', right: '0%' } }
            ]
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
            warmGray: '#D8BFD8',
            border: 'rgba(255, 250, 205, 0.2)'
        },
        fonts: {
            display: "'Space Grotesk', sans-serif",
            body: "'DM Sans', sans-serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#240046', opacity: 0.3, size: 800, blur: 100, position: { top: '0%', left: '0%' } }
            ]
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
            warmGray: '#A9A9A9',
            border: 'rgba(238, 238, 238, 0.1)'
        },
        fonts: {
            display: "'Anton', sans-serif",
            body: "'Roboto', sans-serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: false,
            orbs: []
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
            warmGray: '#B0C4DE',
            border: 'rgba(224, 242, 247, 0.15)'
        },
        fonts: {
            display: "'Montserrat', sans-serif",
            body: "'Open Sans', sans-serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#4682B4', opacity: 0.1, size: 1000, blur: 200, position: { top: '30%', right: '0%' } }
            ]
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
            warmGray: '#8FBC8F',
            border: 'rgba(245, 255, 250, 0.12)'
        },
        fonts: {
            display: "'Cinzel', serif",
            body: "'Cormorant Garamond', serif",
            urdu: "'Noto Nastaliq Urdu', serif"
        },
        gradient: {
            enabled: true,
            orbs: [
                { enabled: true, color: '#8FBC8F', opacity: 0.1, size: 500, blur: 80, position: { top: '10%', left: '10%' } }
            ]
        }
    },
};

interface ThemeContextType {
    currentTheme: ThemeConfig;
    applyTheme: (theme: ThemeConfig) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(PRESET_THEMES['ARMS_AMMO_DEFAULT']);

    // Load theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('arms_ammo_theme');
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
        root.style.setProperty('--color-border', theme.colors.border);

        root.style.setProperty('--font-display', theme.fonts.display);
        root.style.setProperty('--font-body', theme.fonts.body);
        root.style.setProperty('--font-urdu', theme.fonts.urdu);

        if (save) {
            try {
                localStorage.setItem('arms_ammo_theme', JSON.stringify(theme));
            } catch (err) {
                console.error('Failed to save theme:', err);
            }
        }
    };

    const resetTheme = () => {
        setCurrentTheme(PRESET_THEMES['ARMS_AMMO_DEFAULT']);
        applyTheme(PRESET_THEMES['ARMS_AMMO_DEFAULT']);
        localStorage.removeItem('arms_ammo_theme');
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
