/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                'void': '#0A0A0A',
                'charcoal': '#1A1A1A',
                'tangerine': '#FF6B35',
                'amber': '#F7931E',
                'pearl': '#F5F5F5',
                'warm-gray': '#9A9A9A',
            },
            fontFamily: {
                display: ['Monument Extended', 'Syne', 'sans-serif'],
                body: ['Inter', 'Satoshi', 'sans-serif'],
                accent: ['Mrs Saint Delafield', 'cursive'], // Approximate signature style
            },
            backgroundImage: {
                'paint-stroke': "url('/paint-stroke.svg')", // Placeholder
            },
            transitionTimingFunction: {
                'dry': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            animation: {
                'scramble': 'scramble 0.3s ease-out',
                'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                scramble: {
                    '0%': { opacity: '0', transform: 'translateY(10%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
