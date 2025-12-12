/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        base: '16px', // ปรับ default text-base
      },
      colors: {
        'border': 'var(--border-color)',
        'card': 'var(--card-bg)',
        'foreground': 'var(--foreground)',
        'muted-foreground': 'var(--muted-foreground)',
      },
    },
  },
  plugins: [],
};
