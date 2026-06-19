import { createContext, useContext, useEffect, useState } from 'react'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'site-language'

function loadFromStorage() {
  return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(loadFromStorage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function toggleLanguage() {
    setLanguage(prev => {
      const next = prev === 'en' ? 'ar' : 'en'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
