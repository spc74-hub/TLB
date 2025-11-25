/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			crudo: {
  				'50': '#FFFDF7',
  				'100': '#FFF9E8',
  				'200': '#F5EFE0',
  				'300': '#EDE6DB',
  				'400': '#E8DFD0',
  				'500': '#D4C5B0',
  				'600': '#C4B49A',
  				'700': '#A69580',
  				'800': '#8B7A66',
  				'900': '#6B5D4D'
  			},
  			salvia: {
  				'50': '#F4F7F2',
  				'100': '#E8EFE4',
  				'200': '#D1DFC9',
  				'300': '#B5CCA8',
  				'400': '#9CAF88',
  				'500': '#7D9167',
  				'600': '#5F7049',
  				'700': '#4A5739',
  				'800': '#3A442D',
  				'900': '#2D3523'
  			},
  			terracota: {
  				'50': '#FBF7F4',
  				'100': '#F5EDE6',
  				'200': '#EBDACC',
  				'300': '#DCC2A8',
  				'400': '#C4A484',
  				'500': '#A67B5B',
  				'600': '#8B6347',
  				'700': '#6F4E38',
  				'800': '#573D2C',
  				'900': '#422F22'
  			},
  			carbon: {
  				'50': '#F7F7F7',
  				'100': '#E3E3E3',
  				'200': '#C8C8C8',
  				'300': '#A4A4A4',
  				'400': '#818181',
  				'500': '#666666',
  				'600': '#515151',
  				'700': '#434343',
  				'800': '#3D3D3D',
  				'900': '#2C2C2C'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'Playfair Display',
  				'Georgia',
  				'serif'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
