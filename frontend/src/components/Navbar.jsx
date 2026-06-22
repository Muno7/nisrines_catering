import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { navLinks, socialLinks } from './siteLinks.jsx'
import { BasketIcon } from './icons.jsx'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, toggleLanguage } = useLanguage()
  const { totalQuantity } = useCart()
  const location = useLocation()
  const headerRef = useRef(null)

  const activePath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')
  const flagSrc = language === 'ar' ? '/assets/icons/ar.png' : '/assets/icons/en.png'

  const activePage = navLinks.find((link) => link.to === activePath)?.id ?? ''

  useEffect(() => {
    document.body.classList.toggle('no-scroll', isOpen)
    return () => document.body.classList.remove('no-scroll')
  }, [isOpen])

  useEffect(() => {
    const updateHeaderOffset = () => {
      if (!headerRef.current) return
      document.documentElement.style.setProperty('--header-height', `${Math.ceil(headerRef.current.getBoundingClientRect().height)}px`)
    }

    updateHeaderOffset()
    window.addEventListener('resize', updateHeaderOffset)
    window.addEventListener('orientationchange', updateHeaderOffset)

    return () => {
      window.removeEventListener('resize', updateHeaderOffset)
      window.removeEventListener('orientationchange', updateHeaderOffset)
    }
  }, [location.pathname])

  function menuHandler() {
    setIsOpen(prev => !prev)
  }

  function closeMenu() {
    setIsOpen(false)
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`} onClick={closeMenu} />

      <div className={`flex navigation fixed bg-surface top-0 w-[75%] sm:w-[50%] lg:w-[33%] h-[100vh] shadow-lg transition-all duration-500 z-30 ${isOpen ? 'left-0' : 'left-[-75%] sm:left-[-50%] lg:left-[-33%]'}`}>
        <nav className="side-bar-js relative flex flex-col top-0 w-full px-4 sm:px-8 lg:px-10 pb-4 pt-[82px] justify-between h-full">
          <button className="nav-close-btn absolute p-4 rounded-full lg:hover:bg-muted/10 transition duration-200" onClick={closeMenu} aria-label="Close navigation">
            <div className={`hamburger flex flex-col justify-around pointer w-[26px] h-[26px] ${isOpen ? 'open' : ''}`}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </button>

          <ul className="sidebar-list flex flex-col w-full mt-4">
            {navLinks.map((link) => (
              <li key={link.id} className="w-full">
                <Link
                  to={link.to}
                  className={`flex items-center w-full sidebar-link ${activePage === link.id ? 'sidebar-link--active' : ''}`}
                  onClick={closeMenu}
                >
                  <link.Icon className="fill-current w-[20px] h-[20px] mr-3" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-footer flex flex-col gap-4 mt-auto pr-4">
            <div className="flex justify-start">
              <div className="lang-switch flex items-center gap-2 sm:gap-3 select-none">
                <span className={`lang-label-left text-[11px] sm:text-xs font-semibold ${language === 'en' ? 'text-primary' : 'text-muted'}`}>EN</span>
                <button
                  type="button"
                  className="relative inline-flex items-center h-8 w-14 rounded-full border border-muted/30 bg-surface/85 backdrop-blur-sm shadow-sm transition-colors duration-200"
                  aria-label="Toggle language"
                  onClick={toggleLanguage}
                >
                  <span className="lang-track absolute inset-0 rounded-full bg-muted/20"></span>
                  <span
                    className="lang-knob absolute h-[25px] w-[25px] rounded-full shadow-md transition-transform duration-200 ease-out"
                    style={{
                      transform: language === 'ar' ? 'translateX(28px)' : 'translateX(2px)',
                      background: `url('${flagSrc}') center/cover no-repeat`,
                    }}
                  ></span>
                </button>
                <span className={`lang-label-right text-[11px] sm:text-xs font-semibold ${language === 'ar' ? 'text-primary' : 'text-muted'}`}>AR</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a key={social.id} href={social.href} target="_blank" rel="noreferrer" className="button-social-media">
                  <social.Icon className="h-5 w-5 text-white" />
                </a>
              ))}
              <span className="sidebar-footer-copy order-2 w-full">&copy; {new Date().getFullYear()} Nisrine's Catering. All rights reserved</span>
            </div>
          </div>
        </nav>
      </div>

      <header ref={headerRef} className="header-js rounded-b-md bg-white shadow-sm fixed top-0 left-0 w-full z-10 transition-transform duration-200 ease-in-out">
        <div className="flex items-center justify-between px-2 sm:px-4 lg:px-8 py-1 sm:py-3">
          <button className="z-30 p-4 lg:hover:bg-muted/10 rounded-full transition duration-200" onClick={menuHandler} aria-label="Open navigation">
            <div className={`hamburger flex flex-col justify-around pointer w-[26px] h-[26px] ${isOpen ? 'open' : ''}`}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </button>

          <Link to="/" className="flex items-center rounded-full">
            <img src="/assets/icons/logo.png" alt="Nisrine's Catering Logo" className="w-[100px] sm:w-[150px]" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/order" className="relative p-4 rounded-full lg:hover:bg-muted/10 active:text-muted transition duration-200">
              <BasketIcon className="fill-current h-[24px] w-[24px]" />
              <span className="js-cart-quantity absolute top-[10px] right-[8px] bg-secondary text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{totalQuantity}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}

export default Navbar
