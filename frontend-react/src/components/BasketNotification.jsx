import { useEffect, useState } from 'react'

export default function BasketNotification({ isAdding, onDone }) {
  const [phase, setPhase] = useState('entering') // entering → visible → leaving

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPhase('visible'))
    const leaveTimer = setTimeout(() => setPhase('leaving'), 1500)
    const doneTimer = setTimeout(onDone, 1800)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  const bg = isAdding ? '#E8822A' : '#521C0D'
  const iconColor = isAdding ? '#3E160A' : '#E8822A'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: bg,
        color: iconColor,
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        fontWeight: 500,
        textAlign: 'center',
        opacity: phase === 'visible' ? 1 : 0,
        transform:
          phase === 'entering'
            ? 'translateY(20px)'
            : phase === 'leaving'
            ? 'translateY(-20px)'
            : 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        zIndex: 2,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={iconColor}
        >
          <path d="M23.297,9.034c-.57-.657-1.396-1.034-2.267-1.034h-.086C20.445,3.506,16.625,0,12,0S3.555,3.506,3.056,8h-.056c-.87,0-1.695,.377-2.266,1.034S-.093,10.562,.03,11.425l1.061,7.424c.42,2.937,2.974,5.151,5.94,5.151h9.969c2.966,0,5.52-2.215,5.94-5.151l1.061-7.424c.123-.862-.134-1.733-.704-2.391ZM12,2c3.52,0,6.441,2.613,6.928,6H5.072c.487-3.387,3.408-6,6.928-6Zm10.021,9.142l-1.061,7.424c-.28,1.958-1.982,3.435-3.96,3.435H7.031c-1.979,0-3.681-1.477-3.96-3.435l-1.061-7.424c-.042-.291,.042-.574,.234-.797,.193-.223,.461-.345,.755-.345H21.03c.294,0,.562,.122,.756,.345,.192,.223,.276,.506,.234,.797Zm-9.021,1.858v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm5,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Zm-10,0v6c0,.553-.447,1-1,1s-1-.447-1-1v-6c0-.553,.447-1,1-1s1,.447,1,1Z" />
        </svg>
      </div>
      <div style={{ maxWidth: '90%', wordWrap: 'break-word' }}>
        {isAdding ? 'Added to basket' : 'Removed from basket'}
      </div>
    </div>
  )
}
