/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/typography"), require("daisyui")],
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
				dark: {
					"primary": "#9d4edd",
					"primary-content": "#ebddfb",
					"secondary": "#7b2cbf",
					"secondary-content": "#e3d7f5",
					"accent": "#c77dff",
					"accent-content": "#f3f4f6",
					"neutral": "#5a189a",
					"neutral-content": "#f3f4f6",
					"base-100": "#1a1625",
					"base-200": "#15121f",
					"base-300": "#100d19",
					"base-content": "#cbcacf",
					"info": "#3abff8",
					"info-content": "#c6dbff",
					"success": "#36d399",
					"success-content": "#001600",
					"warning": "#fbbd23",
					"warning-content": "#001600",
					"error": "#f87272",
					"error-content": "#160000",
				},
			},
			// {
			// 	"dark": {
			// 		"primary": "#9D4EDD",          // Bright purple for primary actions (slightly lighter for dark mode)
			// 		"primary-content": "#ffffff",  // White text on primary
			// 		"secondary": "#7B2CBF",        // Darker purple for secondary elements
			// 		"secondary-content": "#ffffff", // White text on secondary
			// 		"accent": "#C77DFF",           // Lighter purple for accents in dark mode
			// 		"accent-content": "#ffffff",    // White text on accent
			// 		"neutral": "#5A189A",          // Indigo for neutral elements
			// 		"neutral-content": "#ffffff",   // White text on neutral
			// 		"base-100": "#1A1625",         // Very dark gray with hint of purple
			// 		"base-200": "#3B1942",         // Specified purple for sidebar
			// 		"base-300": "#522158",         // Slightly darker purple for borders, etc.
			// 		"base-content": "#E2E8F0",     // Light gray for text on dark backgrounds
			// 		"info": "#3abff8",             // Default info color
			// 		"success": "#36d399",          // Default success color
			// 		"warning": "#fbbd23",          // Default warning color
			// 		"error": "#f87272",            // Default error color
			// 	},
			// },
		],
	darkTheme: "dark",
	darkMode: ['selector', '[data-theme="dark"]'],
	logs: false,
}
}
