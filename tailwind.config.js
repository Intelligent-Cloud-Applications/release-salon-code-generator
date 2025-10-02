/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    theme: {
    	extend: {
    		screens: {
    			xs: '1000px',
    			min536: '536px',
    			min600: '600px',
    			min800: '800px',
    			min1050: '1050px',
    			max406: {
    				max: '406px'
    			},
    			max450: {
    				max: '450px'
    			},
    			max478: {
    				max: '478px'
    			},
    			max500: {
    				max: '500px'
    			},
    			max536: {
    				max: '536px'
    			},
    			max600: {
    				max: '600px'
    			},
    			max767: {
    				max: '767px'
    			},
    			max800: {
    				max: '800px'
    			},
    			max850: {
    				max: '850px'
    			},
    			max900: {
    				max: '900px'
    			},
    			max950: {
    				max: '950px'
    			},
    			max980: {
    				max: '980px'
    			},
    			max1008: {
    				max: '1008px'
    			},
    			max1050: {
    				max: '1050px'
    			},
    			max1078: {
    				max: '1078px'
    			},
    			max1194: {
    				max: '1194px'
    			},
    			max1250: {
    				max: '1250px'
    			},
    			max1350: {
    				max: '1350px'
    			},
    			max1920: {
    				max: '1920px'
    			}
    		},
    		colors: {
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
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
};
