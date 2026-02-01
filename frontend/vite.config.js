import { defineConfig } from 'vite'
import { resolve } from 'path'

// Redirect root to /home for dev and preview so we only maintain one homepage.
const rootToHome = (target = '/home') => {
  const redirect = (req, res, next) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.statusCode = 302
      res.setHeader('Location', target)
      res.end()
      return
    }
    next()
  }

  return {
    name: 'root-to-home',
    configureServer(server) {
      server.middlewares.use(redirect)
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect)
    }
  }
}

export default defineConfig({
  plugins: [rootToHome()],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'home.html'),
        menu: resolve(__dirname, 'menu.html'),
        favorites: resolve(__dirname, 'favorites.html'),
        order: resolve(__dirname, 'order.html'),
        subscriptions: resolve(__dirname, 'subscriptions.html'),
        // Add more pages as needed...
      }
    }
  }
})
