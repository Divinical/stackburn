import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border, 214 32% 91%))',
				input: 'hsl(var(--input, 214 32% 91%))',
				ring: 'hsl(var(--ring, 221 83% 53%))',
				background: 'hsl(var(--background, 222 84% 5%))',
				foreground: 'hsl(var(--foreground, 210 40% 98%))',
				primary: {
					DEFAULT: 'hsl(var(--primary, 217 91% 60%))',
					foreground: 'hsl(var(--primary-foreground, 222 84% 5%))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary, 217 33% 18%))',
					foreground: 'hsl(var(--secondary-foreground, 210 40% 98%))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive, 0 63% 31%))',
					foreground: 'hsl(var(--destructive-foreground, 210 40% 98%))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted, 217 33% 18%))',
					foreground: 'hsl(var(--muted-foreground, 215 20% 65%))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent, 217 33% 18%))',
					foreground: 'hsl(var(--accent-foreground, 210 40% 98%))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover, 222 84% 5%))',
					foreground: 'hsl(var(--popover-foreground, 210 40% 98%))'
				},
				card: {
					DEFAULT: 'hsl(var(--card, 222 84% 5%))',
					foreground: 'hsl(var(--card-foreground, 210 40% 98%))'
				},
				// Forge theme colors
				flame: 'hsl(var(--flame, 15 100% 60%))',
				'flame-glow': 'hsl(var(--flame-glow, 25 100% 70%))',
				forge: 'hsl(var(--forge, 0 0% 5%))',
				iron: 'hsl(var(--iron, 0 0% 25%))',
				ember: 'hsl(var(--ember, 10 85% 55%))',
				ash: 'hsl(var(--ash, 0 0% 50%))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background, 222 84% 5%))',
					foreground: 'hsl(var(--sidebar-foreground, 210 40% 98%))',
					primary: 'hsl(var(--sidebar-primary, 217 91% 60%))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground, 222 84% 5%))',
					accent: 'hsl(var(--sidebar-accent, 217 33% 18%))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground, 210 40% 98%))',
					border: 'hsl(var(--sidebar-border, 217 33% 18%))',
					ring: 'hsl(var(--sidebar-ring, 224 76% 94%))'
				}
			},
			borderRadius: {
				lg: 'var(--radius, 0.75rem)',
				md: 'calc(var(--radius, 0.75rem) - 2px)',
				sm: 'calc(var(--radius, 0.75rem) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'flame-flicker': {
					'0%, 100%': { 
						transform: 'scale(1) rotate(0deg)',
						opacity: '0.9'
					},
					'50%': { 
						transform: 'scale(1.05) rotate(1deg)',
						opacity: '1'
					}
				},
				'burn-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(20px) scale(0.95)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'ember-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 10px hsl(var(--ember, 10 85% 55%) / 0.3)'
					},
					'50%': { 
						boxShadow: '0 0 20px hsl(var(--ember, 10 85% 55%) / 0.6)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'flame-flicker': 'flame-flicker 2s ease-in-out infinite',
				'burn-in': 'burn-in 0.5s ease-out',
				'ember-glow': 'ember-glow 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
