import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home.html'),
        menu: resolve(__dirname, 'menu.html'),
        favorites: resolve(__dirname, 'favorites.html'),
        order: resolve(__dirname, 'order.html'),
        // Add more pages as needed...
      }
    }
  }
})
