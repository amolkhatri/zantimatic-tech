// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://amolkhatri.github.io',
	base: "/zantimatic-tech",
	integrations: [mdx(), sitemap()],
	vite: {
		plugins: [tailwindcss()],
		define: {
			'import.meta.env.NOTION_API_KEY': JSON.stringify(process.env.NOTION_API_KEY),
			'import.meta.env.NOTION_DATABASE_ID': JSON.stringify(process.env.NOTION_DATABASE_ID),
			'import.meta.env.BASE_URL': JSON.stringify("/zantimatic-tech"),
		},
	},
});
