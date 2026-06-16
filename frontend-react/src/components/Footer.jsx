import { Link } from 'react-router-dom'

const footerSocialLinks = [
  {
    href: 'https://www.facebook.com/Nisrine.kitchen/',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/nisrine_catering/',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    href: 'https://www.tiktok.com/@nisrine_catering',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
  {
    href: 'https://api.whatsapp.com/send/?phone=96171226934&text&type=phone_number&app_absent=0',
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
]

const footerNavLinks = [
  { to: '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/menu', label: 'Menu', icon: <MenuIcon /> },
  { to: '/catering', label: 'Catering', icon: <CateringIcon /> },
  { to: '/subscription', label: 'Subscriptions', icon: <SubscriptionIcon /> },
  { to: '/favorite', label: 'Favorites', icon: <FavoriteIcon /> },
  { to: '/order', label: 'Order Basket', icon: <BasketIcon /> },
]

function HomeIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M23.121,9.069,15.536,1.483a5.008,5.008,0,0,0-7.072,0L.879,9.069A2.978,2.978,0,0,0,0,11.19v9.817a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V11.19A2.978,2.978,0,0,0,23.121,9.069ZM15,22.007H9V18.073a3,3,0,0,1,6,0Zm7-1a1,1,0,0,1-1,1H17V18.073a5,5,0,0,0-10,0v3.934H3a1,1,0,0,1-1-1V11.19a1.008,1.008,0,0,1,.293-.707L9.878,2.9a3.008,3.008,0,0,1,4.244,0l7.585,7.586A1.008,1.008,0,0,1,22,11.19Z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M1.333,7.238C.484,5.522-1.2,1.269,1.2.15A1.949,1.949,0,0,1,3.329.573l4.96,5.3A1,1,0,1,1,6.887,7.3L2,2.08c.119,3.777,2.343,6.6,4.841,9.439a1,1,0,0,1-1.39,1.446A24.522,24.522,0,0,1,1.333,7.238ZM18.005,16.2a1.259,1.259,0,0,0-1.09-.4,8.055,8.055,0,0,1-3.458-.29.985.985,0,0,0-.981.254c-1.494,2.256,3.274,2.113,4.312,2.08l5.483,5.839a1,1,0,0,0,1.458-1.371ZM15,14a4.99,4.99,0,0,0,3.536-1.462l5.171-5.172A1,1,0,1,0,22.293,5.95l-5.171,5.172a3,3,0,0,1-3.406.576l6.991-6.991a1,1,0,1,0-1.414-1.414L12.3,10.284a3,3,0,0,1,.576-3.406L18.05,1.707A1,1,0,0,0,16.636.293L11.464,5.464a5.01,5.01,0,0,0-.635,6.293L.293,22.293a1,1,0,0,0,1.414,1.414L12.243,13.171A5,5,0,0,0,15,14Z" />
    </svg>
  )
}

function CateringIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="68 96 887 800">
      <path d="M384.064 274.56l.064-50.688A128 128 0 01512.128 96c70.528 0 127.68 57.152 127.68 127.68v50.752A448.192 448.192 0 01955.392 768H68.544A448.192 448.192 0 01384 274.56zM96 832h832a32 32 0 110 64H96a32 32 0 110-64zm32-128h768a384 384 0 10-768 0zm447.808-448v-32.32a63.68 63.68 0 00-63.68-63.68 64 64 0 00-64 63.936V256h127.68z" />
    </svg>
  )
}

function SubscriptionIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="5 4 14 14">
      <path fillRule="evenodd" clipRule="evenodd" d="M10.5 5C10.5 4.72386 10.2761 4.5 10 4.5C9.72386 4.5 9.5 4.72386 9.5 5V5.5H7C6.17157 5.5 5.5 6.17157 5.5 7V16C5.5 16.8284 6.17157 17.5 7 17.5H17C17.8284 17.5 18.5 16.8284 18.5 16V7C18.5 6.17157 17.8284 5.5 17 5.5H14.5V5C14.5 4.72386 14.2761 4.5 14 4.5C13.7239 4.5 13.5 4.72386 13.5 5V5.5H10.5V5ZM9.5 6.5C9.5 6.77614 9.72386 7 10 7C10.2761 7 10.5 6.77614 10.5 6.5H13.5C13.5 6.77614 13.7239 7 14 7C14.2761 7 14.5 6.77614 14.5 6.5H17C17.2761 6.5 17.5 6.72386 17.5 7V8.5H6.5V7C6.5 6.72386 6.72386 6.5 7 6.5H9.5ZM6.5 9.5V16C6.5 16.2761 6.72386 16.5 7 16.5H17C17.2761 16.5 17.5 16.2761 17.5 16V9.5H6.5Z" />
    </svg>
  )
}

function FavoriteIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5l0 3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2l0-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2l-.1 .1-.1 .1-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z" />
    </svg>
  )
}

function BasketIcon() {
  return (
    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M23.297,9.034c-.57-.657-1.396-1.034-2.267-1.034h-.086C20.445,3.506,16.625,0,12,0S3.555,3.506,3.056,8h-.056c-.87,0-1.695,.377-2.266,1.034S-.093,10.562,.03,11.425l1.061,7.424c.42,2.937,2.974,5.151,5.94,5.151h9.969c2.966,0,5.52-2.215,5.94-5.151l1.061-7.424c.123-.862-.134-1.733-.704-2.391ZM12,2c3.52,0,6.441,2.613,6.928,6H5.072c.487-3.387,3.408-6,6.928-6Zm10.021,9.142l-1.061,7.424c-.28,1.958-1.982,3.435-3.96,3.435H7.031c-1.979,0-3.681-1.477-3.96-3.435l-1.061-7.424c-.042-.291,.042-.574,.234-.797,.193-.223,.461-.345,.755-.345H21.03c.294,0,.562,.122,.756,.345,.192,.223,.276,.506,.234,.797Zm-9.021,1.858v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm5,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm-10,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Z" />
    </svg>
  )
}

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
              {footerNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-secondary transition-colors duration-300 flex items-center gap-2">
                  {link.icon}
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
            {footerSocialLinks.map((social) => (
              <a key={social.href} href={social.href} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-surface/15 hover:bg-secondary transition-all duration-300 hover:scale-110">
                {social.icon}
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
