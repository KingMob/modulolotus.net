/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/typography"),require("daisyui")],
	daisyui: {
		themes: [
			{
				"light": {
					"primary": "#8A2BE2",          // Bright purple for primary actions
					"primary-content": "#ffffff",  // White text on primary
					"secondary": "#6a0dad",        // Darker purple for secondary elements
					"secondary-content": "#ffffff", // White text on secondary
					"accent": "#9370DB",           // Medium purple for accents
					"accent-content": "#ffffff",    // White text on accent
					"neutral": "#4B0082",          // Indigo for neutral elements
					"neutral-content": "#ffffff",   // White text on neutral
					"base-100": "#ffffff",         // White background
					"base-200": "#f8f9fa",         // Light gray for alternate backgrounds
					"base-300": "#e9ecef",         // Slightly darker gray for borders, etc.
					"base-content": "#1f2937",     // Dark gray for text on light backgrounds
					"info": "#3abff8",             // Default info color
					"success": "#36d399",          // Default success color
					"warning": "#fbbd23",          // Default warning color
					"error": "#f87272",            // Default error color
				}, 
			},
			{
				"dark": {
					"primary": "#9D4EDD",          // Bright purple for primary actions (slightly lighter for dark mode)
					"primary-content": "#ffffff",  // White text on primary
					"secondary": "#7B2CBF",        // Darker purple for secondary elements
					"secondary-content": "#ffffff", // White text on secondary
					"accent": "#C77DFF",           // Lighter purple for accents in dark mode
					"accent-content": "#ffffff",    // White text on accent
					"neutral": "#5A189A",          // Indigo for neutral elements
					"neutral-content": "#ffffff",   // White text on neutral
					"base-100": "#1A1625",         // Very dark gray with hint of purple
					"base-200": "#522158",         // Specified purple for sidebar
					"base-300": "#3B1942",         // Slightly darker purple for borders, etc.
					"base-content": "#E2E8F0",     // Light gray for text on dark backgrounds
					"info": "#3abff8",             // Default info color
					"success": "#36d399",          // Default success color
					"warning": "#fbbd23",          // Default warning color
					"error": "#f87272",            // Default error color
				},
			},
		],
		darkTheme: "dark", 
		darkMode: ['selector', '[data-theme="dark"]'],
		logs: false,
	}
}
