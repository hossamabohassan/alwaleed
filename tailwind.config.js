/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out infinite',
        'floatUp': 'floatUp 4s linear forwards',
        'firework': 'explosion 1s ease-out forwards',
        'zoomInUp': 'zoomInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fadeIn': 'fadeIn 0.5s ease-in forwards',
        'shake': 'shake 0.5s ease-in-out',
        'spin-slow': 'spinSlow 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
          '100%': { transform: 'translateY(0px) rotate(0deg)' },
        },
        floatUp: {
          '0%': { bottom: '-150px', transform: 'rotate(0deg)' },
          '100%': { bottom: '120vh', transform: 'rotate(20deg)' },
        },
        explosion: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(50)', opacity: '0' },
        },
        zoomInUp: {
          '0%': { transform: 'scale(0) translateY(100px)', opacity: '0' },
          '60%': { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

