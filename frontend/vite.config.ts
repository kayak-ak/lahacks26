import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
	server: {
		proxy: {
					'/agent': 'http://localhost:5000',
					'/sms': 'http://localhost:5000',
					'/rooms': 'http://localhost:5000',
					'/shifts': 'http://localhost:5000',
					'/events': 'http://localhost:5000',
					'/handoff': 'http://localhost:5000',
				}
	},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Analytics: Mark this project as created via create-cloudinary-react CLI
    'process.env.CLOUDINARY_SOURCE': '"cli"',
    'process.env.CLD_CLI': '"true"',
  },
})
