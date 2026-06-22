import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO.js'

function NotFound() {
  useSEO({
    title: "Page Not Found | Nisrine's Catering",
    description: "The page you're looking for doesn't exist. Explore Nisrine's Catering menu, catering services, and more.",
    path: '/404',
  })

  return (
    <main className="site-main flex flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-32">
      <span className="text-7xl font-bold text-primary sm:text-8xl">404</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-accent sm:text-3xl">Page not found</h1>
        <p className="max-w-md text-base text-muted sm:text-lg">
          The page you're looking for doesn't exist or may have moved. Let's get you back to something delicious.
        </p>
      </div>
      <Link
        to="/"
        className="button-cta group relative inline-flex items-center justify-center px-8 py-3 font-medium rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105"
      >
        <span className="relative">Back to home</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="relative w-5 h-5 ml-2 -mr-1 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </main>
  )
}

export default NotFound
