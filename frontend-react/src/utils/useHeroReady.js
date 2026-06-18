import { useEffect, useCallback, useRef } from 'react'

export function useHeroReady() {
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    document.body.classList.add('hero-loading')
    return () => {
      doneRef.current = false
      document.body.classList.remove('hero-loading', 'hero-ready')
    }
  }, [])

  const markReady = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    document.body.classList.add('hero-ready')
  }, [])

  return { markReady }
}
