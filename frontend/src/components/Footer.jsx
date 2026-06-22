import { Link } from 'react-router-dom'
import { navLinks, socialLinks } from './siteLinks.jsx'

function Footer() {
  return (
    <footer className="relative bg-accent text-white">
      <div className="absolute top-0 left-0 right-0 text-background">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-20">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-current"></path>
        </svg>
      </div>
      <div className="container mx-auto px-6 pt-28 md:flex flex-col justify-center items-center pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-20 gap-12">
          <div className="flex flex-col gap-6 transform transition-all duration-300">
            <h3 className="text-xl font-semibold border-b border-secondary pb-2 self-start">Reach us</h3>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-secondary">Address:</p>
              <a href="https://maps.app.goo.gl/fJw93KRPAKCYMnNW7" className="hover:text-secondary transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Afif El Taybi Bchamoun street, Beirut</span>
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-secondary">Call:</p>
              <a href="tel:+96171226934" className="hover:text-secondary transition-colors duration-300 flex items-center gap-2">
                <svg className="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+961 71 226 934</span>
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-secondary">E-mail:</p>
              <a href="mailto:nisrinescatering@gmail.com" className="hover:text-secondary transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>nisrinescatering@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-6 transform transition-all duration-300">
            <h3 className="text-xl font-semibold border-b border-secondary pb-2 self-start">Navigate</h3>
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-secondary transition-colors duration-300 flex items-center gap-2">
                  <link.Icon />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-6 col-span-1 md:col-span-2 transform transition-all duration-300">
            <h3 className="text-xl font-semibold border-b border-secondary pb-2 self-start">Visit us:</h3>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <iframe
                title="Nisrine's Catering location"
                className="w-full h-[300px] transition-transform duration-300 hover:scale-105"
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d6624.913014555408!2d35.497924!3d33.877895!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f17001715bb91%3A0x58240a47f5c8fa35!2sNisrine%E2%80%99s%20Catering!5e0!3m2!1sen!2sus!4v1769359913753!5m2!1sen!2sus"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h4 className="text-center mb-6 text-xl font-semibold">Connect With Us</h4>
          <div className="flex justify-center gap-6">
            {socialLinks.map((social) => (
              <a key={social.id} href={social.href} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-surface/15 hover:bg-secondary transition-all duration-300 hover:scale-110">
                <social.Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </div>
        <p className="text-center mt-12 text-sm">
          &copy; {new Date().getFullYear()} Nisrine's Catering. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
